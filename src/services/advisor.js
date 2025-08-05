// src/services/advisor.js
import { supabase } from '@/config/supabase';

// *** เพิ่มฟังก์ชันนี้กลับเข้าไป ***
// ดึงรายชื่อนักศึกษาในที่ปรึกษาทั้งหมด
export async function getMyAdvisees(advisorId) {
  if (!advisorId) {
    return { success: false, error: "Advisor ID is required." };
  }
  const { data, error } = await supabase.rpc('get_my_advisees', {
    p_advisor_id: advisorId
  });

  if (error) {
    console.error("Error fetching advisees:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}


// ดึงรายงานละเอียดของนักศึกษาในที่ปรึกษา
export async function getAdvisorDetailReport(filters) {
  const {
    advisor_id, // Required
    student_id = null,
    academic_year = null,
    subject_id = null,
    semester = null
  } = filters;

  if (!advisor_id) return { success: false, error: "Advisor ID is required." };

  const { data, error } = await supabase.rpc('get_advisor_detail_report', {
    p_advisor_id: advisor_id,
    p_student_id: student_id,
    p_academic_year: academic_year,
    p_subject_id: subject_id,
    p_semester: semester
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}