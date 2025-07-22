// src/services/teacherReports.js
import { supabase } from '@/config/supabase';

export async function getTeacherWorkloadSummary(filters) {
  const {
    teacher_id, // Required
    subject_id = null,
    year_level = null,
    student_id = null
  } = filters;

  if (!teacher_id) return { success: false, error: "Teacher ID is required." };

  const { data, error } = await supabase.rpc('get_teacher_workload_summary', {
    p_teacher_id: teacher_id,
    p_subject_id: subject_id,
    p_year_level: year_level,
    p_student_id: student_id
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}