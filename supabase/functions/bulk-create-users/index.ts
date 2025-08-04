import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // รับ Array ของผู้ใช้จาก request body
    const usersToCreate = await req.json();

    if (!Array.isArray(usersToCreate) || usersToCreate.length === 0) {
      throw new Error("Invalid input: Expected an array of users.");
    }

    const results = {
      success: [],
      failed: []
    };

    // วนลูปสร้างผู้ใช้ทีละคน
    for (const user of usersToCreate) {
      try {
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!user.email || !user.password || !user.username || !user.full_name || !user.role) {
          throw new Error("Missing required fields for a user.");
        }

        // 1. สร้างใน Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });
        if (authError) throw authError;

        // 2. สร้างในตาราง public.users
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department || null,
          });
        if (profileError) {
          // Cleanup: ถ้าสร้าง profile ไม่สำเร็จ ให้ลบ auth user ทิ้ง
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }

        results.success.push({ email: user.email, status: 'Created' });

      } catch (error) {
        results.failed.push({ email: user.email, error: error.message });
      }
    }

    return new Response(JSON.stringify(results), {
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