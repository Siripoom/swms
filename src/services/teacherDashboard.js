import { supabase } from '@/config/supabase';

// สำหรับ Dashboard หลักของอาจารย์
export async function getTeacherDashboardStats(teacherId) {
  if (!teacherId) {
    return { success: false, error: "Teacher ID is required." };
  }
  // ส่งแค่ p_teacher_id
  const { data, error } = await supabase.rpc('get_teacher_dashboard_stats', {
    p_teacher_id: teacherId
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// สำหรับ Dashboard ย่อยรายวิชา (มุมมองอาจารย์)
export async function getSubjectDashboardDetails(subjectId) {
  if (!subjectId) {
    return { success: false, error: "Subject ID is required." };
  }
  // ไม่ต้องส่ง teacherId แล้ว
  const { data, error } = await supabase.rpc('get_subject_dashboard_details', {
    p_subject_id: subjectId
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}