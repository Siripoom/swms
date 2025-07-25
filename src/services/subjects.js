// src/services/subjects.js
import { supabase } from '@/config/supabase';

// 1. ดึงข้อมูลรายวิชาทั้งหมด
export async function getAllSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      enrollments:subject_enrollments(count),
      subject_teachers(teacher:users(id, full_name))
    `)
    .order('academic_year', { ascending: false })
    .order('subject_code');

  if (error) {
    console.error("Error fetching subjects:", error);
    return { success: false, error: error.message };
  }

  // แปลงโครงสร้างข้อมูล teachers ที่ซ้อนกันอยู่ให้อยู่ในรูปแบบที่ใช้ง่าย
  const formattedData = data.map(subject => ({
    ...subject,
    enrollment_count: subject.enrollments[0]?.count || 0,
    teachers: subject.subject_teachers.map(t => t.teacher)
  }));
  return { success: true, data: formattedData };
}


// 2. สร้างรายวิชาใหม่
export async function createSubject(subjectData) {
  // ไม่จำเป็นต้องใช้ try...catch ที่นี่ เพราะเราจะ return ผลลัพธ์ให้ UI จัดการ

  // ไม่ต้องสร้าง dataToInsert ใหม่ เพราะ handleSubmit ใน UI ทำให้แล้ว
  // แต่ถ้าจะทำที่นี่เพื่อความปลอดภัยก็ดีครับ
  const { data, error } = await supabase
    .from('subjects')
    .insert([subjectData]) // insert ต้องการ Array
    .select(); // .select() จะคืนค่าเป็น Array

  if (error) {
    console.error("Supabase createSubject error:", error);
    return { success: false, error: error.message };
  }

  // data ที่ได้คือ [{...}]
  return { success: true, data };
}

// 3. อัปเดตรายวิชา
export async function updateSubject(id, subjectData) {
  const { data, error } = await supabase
    .from('subjects')
    .update(subjectData)
    .eq('id', id)
    .select(); // .select() จะคืนค่าเป็น Array

  if (error) {
    console.error("Supabase updateSubject error:", error);
    return { success: false, error: error.message };
  }

  // data ที่ได้คือ [{...}]
  return { success: true, data };
}

// 4. ลบรายวิชา (ควรมี check ก่อนลบในอนาคต)
export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 5. ดึงข้อมูลนักศึกษาทั้งหมดสำหรับ Modal ลงทะเบียน (เวอร์ชันแก้ไข)
export async function getStudentsForEnrollment() {
  try {
    const { data, error } = await supabase
      .from('students')
      // *** จุดที่แก้ไข ***
      // ระบุชัดเจนว่าให้ Join ตาราง users ผ่าน Foreign Key `user_id`
      .select(`id, student_id, user:user_id(full_name)`)
      .order('student_id');

    if (error) throw error;

    return { success: true, data };

  } catch (error) {
    console.error("Service error in getStudentsForEnrollment:", error);
    return { success: false, error: error.message };
  }
}

// 6. ดึงข้อมูลนักศึกษาที่ลงทะเบียนในวิชานั้นๆ แล้ว
export async function getEnrolledStudents(subjectId) {
  try {
    const { data, error } = await supabase
      .from('subject_enrollments')
      .select('student_id') // เลือกคอลัมน์ที่เก็บ ID ของนักศึกษา
      .eq('subject_id', subjectId);

    if (error) throw error;

    // **สำคัญ:** เราต้องการแค่ Array ของ ID ไม่ใช่ Array ของ Object
    const studentIds = data.map(enrollment => enrollment.student_id);

    return { success: true, data: studentIds };
  } catch (error) {
    console.error("Service error in getEnrolledStudents:", error);
    return { success: false, error: error.message };
  }
}

// 7. บันทึกการลงทะเบียน
export async function enrollStudents(subjectId, studentIds) {
  // studentIds คือ array ของ id นักศึกษาที่ต้องการลงทะเบียน
  const recordsToInsert = studentIds.map(studentId => ({
    subject_id: subjectId,
    student_id: studentId
  }));

  // ลบของเก่าออกก่อนทั้งหมดเพื่อความง่าย (Upsert)
  await supabase.from('subject_enrollments').delete().eq('subject_id', subjectId);

  // เพิ่มข้อมูลใหม่
  const { error } = await supabase.from('subject_enrollments').insert(recordsToInsert);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// **ฟังก์ชันใหม่สำหรับอัปเดตผู้สอน**
export async function updateSubjectTeachers(subjectId, teacherIds = []) {
  // 1. ลบของเก่า
  const { error: deleteError } = await supabase
    .from('subject_teachers')
    .delete()
    .eq('subject_id', subjectId);
  if (deleteError) return { success: false, error: deleteError.message };

  // ถ้าไม่มี teacherIds ใหม่ให้ใส่ ก็จบการทำงาน
  if (teacherIds.length === 0) return { success: true };

  // 2. เพิ่มของใหม่
  const records = teacherIds.map(id => ({ subject_id: subjectId, teacher_id: id }));
  const { error: insertError } = await supabase.from('subject_teachers').insert(records);
  if (insertError) return { success: false, error: insertError.message };
  return { success: true };
}