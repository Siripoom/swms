// src/services/subjects.js
import { supabase } from '@/config/supabase';

// 1. ดึงข้อมูลรายวิชาทั้งหมด
export async function getAllSubjects() {
  // เราจะดึงจำนวนนักศึกษาที่ลงทะเบียนมาด้วย
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      enrollments:subject_enrollments(count)
    `)
    .order('academic_year', { ascending: false })
    .order('subject_code');

  if (error) return { success: false, error: error.message };
  // แปลงข้อมูลเล็กน้อยเพื่อให้ใช้ง่าย
  const formattedData = data.map(subject => ({
    ...subject,
    enrollment_count: subject.enrollments[0]?.count || 0
  }));
  return { success: true, data: formattedData };
}

// 2. สร้างรายวิชาใหม่
export async function createSubject(subjectData) {
  try {
    // --- จุดที่แก้ไข: เตรียมข้อมูลก่อนส่ง ---
    const dataToInsert = {
      academic_year: String(subjectData.academic_year), // แปลงเป็น String เสมอ
      semester: Number(subjectData.semester), // แปลงเป็น Number เสมอ
      subject_code: subjectData.subject_code,
      subject_name: subjectData.subject_name,
      weeks: Number(subjectData.weeks || 16), // ถ้าไม่มีค่ามา ให้ใช้ 16
      theory_credits: Number(subjectData.theory_credits || 0), // ถ้าไม่มีค่ามา ให้ใช้ 0
      lab_credits: Number(subjectData.lab_credits || 0),
      self_study_credits: Number(subjectData.self_study_credits || 0),
      // คำนวณ total_credits ที่นี่อีกครั้งเพื่อความแน่นอน
      total_credits: Number(subjectData.theory_credits || 0) + Number(subjectData.lab_credits || 0),
    };

    console.log("Data being inserted:", dataToInsert); // เพิ่ม log เพื่อดูข้อมูลสุดท้ายที่จะส่ง

    const { data, error } = await supabase
      .from('subjects')
      .insert([dataToInsert]) // ส่งข้อมูลที่เตรียมไว้แล้ว
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };

  } catch (error) {
    console.error("Service Error in createSubject:", error);
    return { success: false, error: error.message };
  }
}

// 3. อัปเดตรายวิชา
export async function updateSubject(id, subjectData) {
  const { data, error } = await supabase.from('subjects').update(subjectData).eq('id', id).select();
  if (error) return { success: false, error: error.message };
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