
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  
  // 1. Get the Authorization header from the incoming request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No estás autenticado. Falta token de autorización.' }, { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];

  // 2. Create a Supabase client to validate the token
  // This client doesn't need service_role, just the anon key to talk to Supabase auth
  const supabase = createClient(cookieStore);

  // 3. Validate the token to get the user who is making the request
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: 'No estás autenticado. Token inválido.' }, { status: 401 });
  }

  // 4. Create a separate, admin client with service_role to perform privileged operations
  const supabaseAdmin = createClient(cookieStore, true);

  // 5. Check if the authenticated user is an admin by querying their profile with the admin client
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return NextResponse.json({ error: 'Acceso denegado. No tienes permisos de administrador.' }, { status: 403 });
  }

  // 6. If the user is a confirmed admin, proceed to get the new user's data from the request
  const { email, password, full_name, is_admin } = await request.json();

  if (!email || !password || full_name === undefined) {
    return NextResponse.json({ error: 'Faltan campos obligatorios (email, password, full_name).' }, { status: 400 });
  }
  
  // 7. Create the new user in auth.users using the admin client
  const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email since admin is creating it
  });

  if (createError) {
    console.error('Error creating user in auth:', createError);
    return NextResponse.json({ error: `Error al crear el usuario: ${createError.message}` }, { status: 500 });
  }
  
  const newUser = newUserData.user;
  if (!newUser) {
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 });
  }

  // 8. Insert the profile into public.profiles
  const { error: insertProfileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: newUser.id,
      email: email,
      full_name: full_name,
      is_admin: is_admin,
    });

  if (insertProfileError) {
    console.error('Error inserting profile:', insertProfileError);
    // Important: If profile insert fails, delete the auth user to prevent orphaned accounts
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return NextResponse.json({ error: `Error al crear el perfil: ${insertProfileError.message}` }, { status: 500 });
  }
  
  // 9. Return the newly created user's data (without sensitive info)
  const responsePayload = {
    id: newUser.id,
    email: newUser.email,
    full_name: full_name,
    is_admin: is_admin,
    created_at: newUser.created_at,
  };

  return NextResponse.json(responsePayload, { status: 201 });
}
