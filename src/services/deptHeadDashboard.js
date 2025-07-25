// src/services/deptHeadDashboard.js
import { supabase } from '@/config/supabase';

// สำหรับ Dashboard หลักของผู้บริหาร
export async function getDeptHeadDashboard(department) {
  if (!department) {
    return { success: false, error: "Department is required." };
  }
  const { data, error } = await supabase.rpc('get_dept_head_dashboard', {
    p_department: department
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// สำหรับ Dashboard ย่อยรายวิชา (มุมมองผู้บริหาร)
export async function getDeptSubjectDashboard(subjectId) {
  if (!subjectId) return { success: false, error: "Subject ID is required." };
  // เรียกใช้ฟังก์ชันที่ดึงข้อมูลสรุปของวิชา (ตัวเดียวกับที่ Teacher ใช้ได้)
  const { data, error } = await supabase.rpc('get_subject_dashboard_details', {
    p_subject_id: subjectId
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}