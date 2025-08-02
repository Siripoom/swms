// src/services/reports.js
import { supabase } from '@/config/supabase';

// สำหรับ Tab "รายงานละเอียด"
export async function getWorkloadReport(filters = {}) {
  const {
    student_id = null,
    academic_year = null,
    subject_id = null,
    semester = null // **เพิ่ม semester**
  } = filters;

  console.log("Generating detail report with filters:", { student_id, academic_year, subject_id, semester });

  const { data, error } = await supabase.rpc('get_workload_report', {
    p_student_id: student_id,
    p_academic_year: academic_year,
    p_subject_id: subject_id,
    p_semester: semester // **ส่ง semester**
  });

  if (error) {
    console.error("Error fetching detail report:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// สำหรับ Tab "รายงานสรุป (FTES)"
export async function getFtesSummaryReport(filters) {
  const {
    academic_year,
    student_id = null
  } = filters;
  if (!academic_year) return { success: false, error: "Academic year is required." };

  const { data, error } = await supabase.rpc('get_ftes_summary_report', {
    p_academic_year: academic_year,
    p_student_id: student_id
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}