
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  
  // 1. Create a client with a custom storage adapter to correctly read the session
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
    storage: {
      getItem: (key) => {
        // The key from Supabase might be "sb-...", but the cookie name is just "...".
        // This logic correctly extracts the cookie name.
        return cookieStore.get(key.split('.').pop()!)?.value ?? null;
      },
      setItem: () => {}, // setItem/removeItem are not needed for server-side auth checks
      removeItem: () => {},
    },
  });

  // 2. Check if the user making the request is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });
  }

  // 3. Create a separate, admin client with service_role to perform privileged operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4. Check if the authenticated user is an admin by querying their profile with the admin client
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return NextResponse.json({ error: 'Acceso denegado. No tienes permisos de administrador.' }, { status: 403 });
  }

  // 5. If the user is a confirmed admin, proceed to get the new user's data from the request
  const { email, password, full_name, is_admin } = await request.json();

  if (!email || !password || full_name === undefined) {
    return NextResponse.json({ error: 'Faltan campos obligatorios (email, password, full_name).' }, { status: 400 });
  }
  
  // 6. Create the new user in auth.users using the admin client
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

  // 7. Insert the profile into public.profiles
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
  
  // 8. Return the newly created user's data (without sensitive info)
  const responsePayload = {
    id: newUser.id,
    email: newUser.email,
    full_name: full_name,
    is_admin: is_admin,
    created_at: newUser.created_at,
  };

  return NextResponse.json(responsePayload, { status: 201 });
}
