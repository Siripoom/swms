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

    // ดึง query params จาก URL ที่ Client ส่งมา
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('searchTerm') || '';
    const roleFilter = url.searchParams.get('roleFilter') || '';

    // เริ่มต้นสร้าง query
    let query = supabaseAdmin
      .from("users")
      .select("*");

    // 1. เพิ่มเงื่อนไขการกรองด้วย searchTerm (ค้นหาแบบไม่สนตัวพิมพ์ใหญ่/เล็ก ในหลายคอลัมน์)
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    // 2. เพิ่มเงื่อนไขการกรองด้วย role
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    // สั่ง query และเรียงลำดับผลลัพธ์
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})