
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
  const supabase = createClient(cookieStore);

  // 3. Validate the token to get the user who is making the request (the admin)
  const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !adminUser) {
    return NextResponse.json({ error: 'No estás autenticado. Token inválido.' }, { status: 401 });
  }

  // 4. Create a separate, admin client with service_role to perform privileged operations
  const supabaseAdmin = createClient(cookieStore, true);

  // 5. Check if the authenticated user is an admin
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', adminUser.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return NextResponse.json({ error: 'Acceso denegado. No tienes permisos de administrador.' }, { status: 403 });
  }

  // 6. Get the ID of the user to be deleted from the request body
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario a eliminar.' }, { status: 400 });
  }

  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de administrador.' }, { status: 400 });
  }

  // 7. Delete the user's profile from the public.profiles table
  const { error: deleteProfileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (deleteProfileError) {
    console.error('Error deleting profile:', deleteProfileError);
    return NextResponse.json({ error: `Error al eliminar el perfil del usuario: ${deleteProfileError.message}` }, { status: 500 });
  }

  // 8. Delete the user from auth.users using the admin client
  const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteAuthUserError) {
    console.error('Error deleting auth user:', deleteAuthUserError);
    // Note: At this point, the profile is deleted but the auth user is not.
    // This can lead to an orphaned auth user. For this app, we accept this risk.
    // In a production system, you might want to handle this more gracefully.
    return NextResponse.json({ error: `Error al eliminar la autenticación del usuario: ${deleteAuthUserError.message}` }, { status: 500 });
  }

  // 9. Return a success response
  return NextResponse.json({ message: 'Usuario eliminado con éxito.' }, { status: 200 });
}
