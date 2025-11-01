
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function deleteUserInDatabase(supabaseAdmin: any, userId: string) {
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to delete profile: ${profileError.message}`);
  }
}

async function deleteUserInAuth(supabaseAdmin: any, userId: string) {
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) {
    if (authError.message === 'User not found') {
      console.warn(`Auth user not found for ID ${userId}, but attempting to delete profile anyway.`);
    } else {
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  
  // 1. Get the Authorization header from the incoming request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No estás autenticado. Falta token de autorización.' }, { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];

  // 2. Create a Supabase client to validate the token
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

  // 6. Get the user ID to delete from the request body
  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario a eliminar.' }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'Un administrador no puede eliminarse a sí mismo.' }, { status: 400 });
  }
  
  try {
    // Perform deletions. The order might matter depending on your constraints.
    // Deleting from the database first can be safer.
    await deleteUserInDatabase(supabaseAdmin, userId);
    await deleteUserInAuth(supabaseAdmin, userId);

    return NextResponse.json({ message: 'Usuario eliminado correctamente.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error during user deletion process:', error);
    return NextResponse.json({ error: `Error al eliminar el usuario: ${error.message}` }, { status: 500 });
  }
}
