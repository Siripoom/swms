// src/services/teacherReports.js
import { supabase } from '@/config/supabase';

export async function getTeacherWorkloadSummary(filters) {
  const {
    teacher_id, // Required
    subject_id = null,
    year_level = null
  } = filters;

  if (!teacher_id) return { success: false, error: "Teacher ID is required." };

  const { data, error } = await supabase.rpc('get_teacher_workload_summary', {
    p_teacher_id: teacher_id,
    p_subject_id: subject_id,
    p_year_level: year_level
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}


export async function getSubjectsByTeacher(teacherId) {
  if (!teacherId) return { success: false, error: "Teacher ID is required" };
  const { data, error } = await supabase
    .from('subject_teachers')
    .select(`
      subject:subjects (id, subject_code, subject_name)
    `)
    .eq('teacher_id', teacherId);

  if (error) return { success: false, error: error.message };
  // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้ง่าย
  const subjects = data.map(item => item.subject);
  return { success: true, data: subjects };
}