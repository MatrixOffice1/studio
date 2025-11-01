
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This is the secure, server-side Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key) => {
            return cookieStore.get(key.split('.').pop()!)?.value ?? null;
          },
          setItem: () => {},
          removeItem: () => {},
        },
      },
    }
  );

  // 1. Check if the user making the request is an admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Acceso denegado. No tienes permisos de administrador.' }, { status: 403 });
  }

  // 2. If the user is an admin, proceed to create the new user
  const { email, password, full_name, is_admin } = await request.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Faltan campos obligatorios (email, password, full_name).' }, { status: 400 });
  }
  
  // 3. Create the user in auth.users
  const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email since admin is creating the account
  });

  if (createError) {
    console.error('Error creating user in auth:', createError);
    return NextResponse.json({ error: `Error al crear el usuario: ${createError.message}` }, { status: 500 });
  }
  
  const newUser = newUserData.user;
  if (!newUser) {
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 });
  }

  // 4. Insert the profile into public.profiles
  const { data: newProfile, error: insertProfileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: newUser.id,
      email: email,
      full_name: full_name,
      is_admin: is_admin,
    })
    .select()
    .single();

  if (insertProfileError) {
    console.error('Error inserting profile:', insertProfileError);
    // If profile insert fails, we should probably delete the auth user to avoid orphaned accounts
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return NextResponse.json({ error: `Error al crear el perfil: ${insertProfileError.message}` }, { status: 500 });
  }
  
  // 5. Return the newly created profile
  return NextResponse.json(newProfile, { status: 201 });
}
