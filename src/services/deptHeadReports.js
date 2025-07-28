// src/services/deptHeadReports.js (สร้างไฟล์ใหม่)
import { supabase } from '@/config/supabase';

export async function getDeptHeadReport(filters) {
  const {
    department, // Required
    academic_year = null,
    subject_id = null,
    teacher_id = null,
    student_id = null // **พารามิเตอร์ใหม่**
  } = filters;

  if (!department) return { success: false, error: "Department is required." };

  const { data, error } = await supabase.rpc('get_dept_head_report', {
    p_department: department,
    p_academic_year: academic_year,
    p_subject_id: subject_id,
    p_teacher_id: teacher_id,
    p_student_id: student_id // **ส่งพารามิเตอร์ใหม่**
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}