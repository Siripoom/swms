// src/services/proportions.js
import { supabase } from '@/config/supabase';

// 1. ดึงข้อมูลสัดส่วนตามปีการศึกษา
export async function getProportionsByYear(academicYear) {
  if (!academicYear) return { success: false, error: "Academic year is required" };

  const { data, error } = await supabase
    .from('workload_proportions')
    .select('*')
    .eq('academic_year', academicYear)
    .maybeSingle(); // ใช้ .maybeSingle() เพราะอาจจะยังไม่มีข้อมูลของปีนั้นๆ

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 2. สร้างหรืออัปเดตข้อมูลสัดส่วน (Upsert)
// Upsert เป็นวิธีที่สะดวกมากสำหรับหน้านี้
export async function upsertProportions(proportionData) {
  // ตรวจสอบว่ามี academic_year มาด้วย
  if (!proportionData.academic_year) {
    return { success: false, error: "Academic year is required to upsert." };
  }

  const { data, error } = await supabase
    .from('workload_proportions')
    .upsert(proportionData, { onConflict: 'academic_year' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 3. ตรวจสอบว่ามีข้อมูลของปีการศึกษานั้นอยู่แล้วหรือไม่
export async function checkIfYearExists(academicYear) {
  const { data, error, count } = await supabase
    .from('workload_proportions')
    .select('*', { count: 'exact', head: true })
    .eq('academic_year', academicYear);

  if (error) return { success: false, error: error.message };
  return { success: true, exists: (count || 0) > 0 };
}

// (เราอาจจะไม่ต้องใช้ delete ในหน้านี้ แต่สร้างเผื่อไว้ได้)
export async function deleteProportionsByYear(academicYear) {
  const { error } = await supabase
    .from('workload_proportions')
    .delete()
    .eq('academic_year', academicYear);

  if (error) return { success: false, error: error.message };
  return { success: true };
}