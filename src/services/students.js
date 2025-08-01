// src/services/students.js
import { supabase } from '@/config/supabase';

// 1. ดึงข้อมูลนักศึกษาทั้งหมดมาแสดงในตาราง
// **แก้ไข getAllStudents ให้ JOIN ตารางใหม่**
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, student_id, year_level, academic_year,
      user:user_id ( full_name ),
      advisors:student_advisors ( advisor:users ( id, full_name ) )
    `);

  if (error) {
    console.error("Error fetching students:", error.message);
    return { success: false, error: error.message };
  }

  // แปลงข้อมูล advisors ที่ซ้อนกันอยู่ให้อยู่ในรูปแบบที่ใช้ง่าย
  const formattedData = data.map(student => ({
    ...student,
    advisor_list: student.advisors.map(a => a.advisor)
  }));
  return { success: true, data: formattedData };
}

// **เพิ่ม Service ใหม่สำหรับอัปเดตอาจารย์ที่ปรึกษา**
export async function updateStudentAdvisors(studentId, advisorIds = []) {
  // 1. ลบของเก่าทั้งหมดของนักศึกษาคนนี้
  const { error: deleteError } = await supabase
    .from('student_advisors')
    .delete()
    .eq('student_id', studentId);

  if (deleteError) return { success: false, error: deleteError.message };

  // ถ้าไม่มี advisorIds ใหม่ให้ใส่ ก็จบการทำงาน
  if (advisorIds.length === 0) return { success: true };

  // 2. เพิ่มของใหม่ทั้งหมด
  const recordsToInsert = advisorIds.map(id => ({ student_id: studentId, advisor_id: id }));
  const { data, error: insertError } = await supabase
    .from('student_advisors')
    .insert(recordsToInsert)
    .select();

  if (insertError) return { success: false, error: insertError.message };
  return { success: true, data };
}

export async function getInstructors() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role, department')
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