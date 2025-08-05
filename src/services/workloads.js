import { supabase } from '@/config/supabase';

export async function getMyWorkloadReport(filters) {
  const {
    student_id, // Required
    academic_year = null,
    semester = null,
  } = filters;
  if (!student_id) return { success: false, error: "Student ID is required." };

  const { data, error } = await supabase.rpc('get_my_workload_report', {
    p_student_id: student_id,
    p_academic_year: academic_year,
    p_semester: semester,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ดึงข้อมูล "ภาระงานอื่นๆ" (ที่ไม่มี assignment_id)
export async function getOtherWorkloadsByStudent(studentId) {
  if (!studentId) return { success: false, error: "Student ID is required" };

  const { data, error } = await supabase
    .from('student_workloads')
    .select('*')
    .eq('student_id', studentId)
    .is('assignment_id', null)
    .order('work_date', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// **แก้ไข: สร้าง "ภาระงาน" ใหม่ (รองรับทุกประเภท)**
export async function createOtherWorkload(workloadData) {
  console.log("📤 [createWorkload] sending data:", workloadData);

  const { data, error } = await supabase
    .from('student_workloads')
    .insert([workloadData])
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase insert error:", error);
    return { success: false, error: error.message };
  }

  console.log("✅ Inserted workload:", data);
  return { success: true, data };
}

// **แก้ไข: อัปเดต "ภาระงาน" (รองรับทุกประเภท)**
export async function updateOtherWorkload(id, workloadData) {
  console.log(`📤 [updateWorkload] sending data for id ${id}:`, workloadData);
  const { data, error } = await supabase
    .from('student_workloads')
    .update(workloadData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase update error:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ลบ "ภาระงาน"
export async function deleteOtherWorkload(id) {
  const { error } = await supabase.from('student_workloads').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ดึงงานที่ได้รับมอบหมาย
export async function getAcademicAssignmentsByStudent(studentId) {
  if (!studentId) return { success: false, error: "Student ID is required" };
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from('subject_enrollments')
      .select('subject_id')
      .eq('student_id', studentId);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) return { success: true, data: [] };

    const subjectIds = enrollments.map(e => e.subject_id);

    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select(`id, assignment_name, subject:subjects ( subject_code )`)
      .in('subject_id', subjectIds)
      .order('due_date', { ascending: true });

    if (assignError) throw assignError;
    return { success: true, data: assignments };
  } catch (error) {
    console.error("Service error in getAcademicAssignmentsByStudent:", error);
    return { success: false, error: error.message };
  }
}

// หา student_id จาก user_id
export async function getStudentProfileByUserId(userId) {
  if (!userId) return { success: false, error: "User ID is required" };
  const { data, error } = await supabase.from('students').select('id').eq('user_id', userId).single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}