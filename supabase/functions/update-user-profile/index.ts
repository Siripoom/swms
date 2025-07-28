import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // รับข้อมูลจาก Client
    const { userId, ...updateData } = await req.json();

    if (!userId) {
      throw new Error("User ID is required.");
    }

    // 1. อัปเดตข้อมูลใน Auth (email)
    // เราจะอัปเดตเฉพาะสิ่งที่ส่งมา เพื่อความยืดหยุ่น
    const authUpdatePayload: { email?: string; password?: string } = {};
    if (updateData.email) {
      authUpdatePayload.email = updateData.email;
    }
    // หากต้องการให้เปลี่ยนรหัสผ่านได้ด้วย ก็เพิ่มเงื่อนไขตรงนี้
    // if (updateData.password) {
    //   authUpdatePayload.password = updateData.password;
    // }

    if (Object.keys(authUpdatePayload).length > 0) {
      const { data: authUpdateResult, error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, authUpdatePayload);

      if (authError) {
        throw new Error(`Auth Update Error: ${authError.message}`);
      }
    }

    // 2. อัปเดตข้อมูลในตาราง public.users
    const profileUpdatePayload: { [key: string]: any } = {};
    if (updateData.username) profileUpdatePayload.username = updateData.username;
    if (updateData.full_name) profileUpdatePayload.full_name = updateData.full_name;
    if (updateData.email) profileUpdatePayload.email = updateData.email; // อัปเดต email ที่นี่ด้วยเพื่อให้ตรงกัน
    if (updateData.role) profileUpdatePayload.role = updateData.role;
    if (updateData.department) profileUpdatePayload.department = updateData.department;
    profileUpdatePayload.updated_at = new Date().toISOString();


    if (Object.keys(profileUpdatePayload).length > 1) { // >1 because updated_at is always present
      const { data: profileUpdateResult, error: profileError } = await supabaseAdmin
        .from('users')
        .update(profileUpdatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        throw new Error(`Profile Update Error: ${profileError.message}`);
      }
    }

    return new Response(JSON.stringify({ message: "User updated successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});