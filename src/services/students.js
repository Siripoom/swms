// src/services/students.js
import { supabase } from '@/config/supabase';

// 1. ดึงข้อมูลนักศึกษาทั้งหมดมาแสดงในตาราง
export async function getAllStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        year_level,
        academic_year,
        user:user_id ( id, full_name ),
        advisor:advisor_id ( id, full_name )
      `)
      .order('student_id');

    if (error) {
      throw error;
    }

    return { success: true, data };

  } catch (error) {
    console.error("Service Error in getAllStudents:", error);
    return { success: false, error: error.message };
  }
}

export async function getInstructors() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role')
    .in('role', ['teacher', 'department_head']) // **เงื่อนไขใหม่: เลือกทั้งสอง role**
    .order('full_name');

  if (error) {
    console.error("Error fetching instructors:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// 2. ดึงรายชื่ออาจารย์สำหรับ Dropdown
export async function getTeachers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'teacher')
    .order('full_name');

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 3. ดึงรายชื่อ User นักศึกษาที่ยังว่าง (เรียกใช้ Function ที่เราสร้าง)
export async function getUnlinkedStudentUsers() {
  const { data, error } = await supabase.rpc('get_unlinked_student_users');
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 4. สร้างโปรไฟล์นักศึกษาใหม่
export async function createStudent(studentData) {
  const { data, error } = await supabase.from('students').insert([studentData]).select();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 5. อัปเดตโปรไฟล์นักศึกษา
export async function updateStudent(id, studentData) {
  const { data, error } = await supabase.from('students').update(studentData).eq('id', id).select();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 6. ลบโปรไฟล์นักศึกษา
export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}