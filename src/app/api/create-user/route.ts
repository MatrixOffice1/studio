
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();

  // 1. Check if the user making the request is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });
  }

  // 2. Create a separate, admin client with service_role to perform privileged operations
  // Note: We are creating a new client here because the one from createClient() is a user-level client.
  const supabaseAdmin = createClient(true);

  // 3. Check if the authenticated user is an admin by querying their profile with the admin client
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return NextResponse.json({ error: 'Acceso denegado. No tienes permisos de administrador.' }, { status: 403 });
  }

  // 4. If the user is a confirmed admin, proceed to get the new user's data from the request
  const { email, password, full_name, is_admin } = await request.json();

  if (!email || !password || full_name === undefined) {
    return NextResponse.json({ error: 'Faltan campos obligatorios (email, password, full_name).' }, { status: 400 });
  }
  
  // 5. Create the new user in auth.users using the admin client
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

  // 6. Insert the profile into public.profiles
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
  
  // 7. Return the newly created user's data (without sensitive info)
  const responsePayload = {
    id: newUser.id,
    email: newUser.email,
    full_name: full_name,
    is_admin: is_admin,
    created_at: newUser.created_at,
  };

  return NextResponse.json(responsePayload, { status: 201 });
}

  