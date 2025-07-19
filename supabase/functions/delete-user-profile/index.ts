import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { userId } = await req.json();

    if (!userId) {
      throw new Error("User ID is required.");
    }

    // ไม่ต้องเช็ค last admin แล้ว เพื่อให้โค้ดง่ายขึ้น (สามารถเพิ่มกลับมาทีหลังได้ถ้าต้องการ)

    // *** ส่วนที่แก้ไข ***
    // ขั้นตอนที่ 1: ลบข้อมูลจากตาราง public.users ก่อน
    console.log(`Step 1: Deleting profile from public.users for ID: ${userId}`);
    const { error: profileDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      // ถ้าลบ profile ไม่ได้ ก็ไม่ต้องไปต่อ
      console.error("Profile Deletion Error:", profileDeleteError.message);
      throw new Error(`Profile Deletion Error: ${profileDeleteError.message}`);
    }
    console.log("Profile deleted successfully.");


    // ขั้นตอนที่ 2: ลบผู้ใช้จาก Supabase Auth
    console.log(`Step 2: Deleting user from Supabase Auth for ID: ${userId}`);
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    // ถ้าเจอ Error 'User not found' ก็ไม่เป็นไร
    if (authDeleteError && authDeleteError.message !== 'User not found') {
      console.error("Auth Deletion Error:", authDeleteError.message);
      // ถึงแม้จะลบ Auth ไม่ได้ แต่ Profile ก็ถูกลบไปแล้ว ถือว่ายังจัดการได้ระดับหนึ่ง
      // อาจจะส่งคำเตือนกลับไปแทนที่จะเป็น Error
      throw new Error(`Auth Deletion Error: ${authDeleteError.message}`);
    }
    console.log("Auth user deleted successfully.");

    return new Response(JSON.stringify({ message: 'User and profile deleted successfully' }), {
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