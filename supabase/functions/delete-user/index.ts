import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Main function to handle user deletion
async function deleteUser(supabaseAdmin: any, userId: string) {
  // First, delete the user from the auth schema
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) {
    // If the user does not exist in auth, it might be an orphaned profile.
    // We can proceed to delete the profile, but we should log this.
    console.warn(`Auth user deletion failed for ${userId}:`, authError.message);
    if (authError.message !== 'User not found') {
       throw new Error(`Failed to delete auth user: ${authError.message}`);
    }
  }

  // Next, delete the user's profile from the public table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    // If profile deletion fails, this is a more critical issue.
    throw new Error(`Failed to delete profile: ${profileError.message}`);
  }
}

Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 2. Verify the JWT from the request to ensure the user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    
    if (!user) {
        throw new Error('Invalid token. User not found.');
    }

    const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
    
    if (adminError || !adminProfile?.is_admin) {
        throw new Error('Access denied. User is not an admin.');
    }

    // 3. Get the user ID to delete from the request body
    const { userId } = await req.json();
    if (!userId) {
      throw new Error('User ID is required in the request body.');
    }
    
    if(userId === user.id) {
        throw new Error('Admin cannot delete their own account.');
    }

    // 4. Perform the deletion
    await deleteUser(supabaseAdmin, userId);

    // 5. Return a success response
    return new Response(JSON.stringify({ message: 'User deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    // 6. Return an error response
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
