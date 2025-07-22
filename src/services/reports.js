// src/services/reports.js
import { supabase } from '@/config/supabase';

export async function getWorkloadReport(filters = {}) {
  const {
    student_id = null,
    academic_year = null,
    subject_id = null
  } = filters;

  console.log("Generating report with filters:", { student_id, academic_year, subject_id });

  const { data, error } = await supabase.rpc('get_workload_report', {
    p_student_id: student_id,
    p_academic_year: academic_year,
    p_subject_id: subject_id
  });

  if (error) {
    console.error("Error fetching workload report:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}