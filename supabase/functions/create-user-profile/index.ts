import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { username, email, password, full_name, role, department } = await req.json();

    if (!email || !password || !username || !full_name || !role) {
      throw new Error("Missing required fields: email, password, username, full_name, role are required.");
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    // 2. Add profile to public.users table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        username: username,
        full_name: full_name,
        email: email,
        role: role,
        department: department
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup: If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Profile Error: ${profileError.message}`);
    }

    return new Response(JSON.stringify(profileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})