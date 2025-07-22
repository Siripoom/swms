// src/services/workloads.js
import { supabase } from '@/config/supabase';



// src/services/workloads.js
export async function getMyWorkloadReport(filters) {
  const {
    student_id,
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


// 1. ดึงข้อมูล "ภาระงานอื่นๆ" (ที่นักศึกษาสร้างเอง)
// เราต้องใช้ student_id ไม่ใช่ user_id, ดังนั้นต้องหา student_id มาก่อน
export async function getOtherWorkloadsByStudent(studentId) {
  if (!studentId) return { success: false, error: "Student ID is required" };

  const { data, error } = await supabase
    .from('student_workloads')
    .select('*')
    .eq('student_id', studentId)
    .is('assignment_id', null) // **สำคัญมาก: ดึงเฉพาะงานที่ไม่มี assignment_id**
    .order('work_date', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 2. สร้าง "ภาระงานอื่นๆ" ใหม่
export async function createOtherWorkload(workloadData) {
  // workloadData ควรจะมี student_id, category, activity_name, work_date, hours_spent
  const { data, error } = await supabase.from('student_workloads').insert([workloadData]).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 3. อัปเดต "ภาระงานอื่นๆ"
export async function updateOtherWorkload(id, workloadData) {
  const { data, error } = await supabase.from('student_workloads').update(workloadData).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 4. ลบ "ภาระงานอื่นๆ"
export async function deleteOtherWorkload(id) {
  const { error } = await supabase.from('student_workloads').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 5. ดึงงานที่ได้รับมอบหมาย (Assignments) ตามวิชาที่นักศึกษาลงทะเบียน
export async function getAcademicAssignmentsByStudent(studentId) {
  if (!studentId) return { success: false, error: "Student ID is required" };

  try {
    // ขั้นตอนที่ 1: หาวิชาทั้งหมดที่นักศึกษาคนนี้ลงทะเบียน
    const { data: enrollments, error: enrollError } = await supabase
      .from('subject_enrollments')
      .select('subject_id')
      .eq('student_id', studentId);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) {
      return { success: true, data: [] }; // คืนค่าว่างถ้าไม่ได้ลงทะเบียนวิชาใดๆ
    }

    const subjectIds = enrollments.map(e => e.subject_id);

    // ขั้นตอนที่ 2: ดึงงานทั้งหมดที่อยู่ในวิชาเหล่านั้น
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects ( subject_code, subject_name ),
        teacher:users ( full_name )
      `)
      .in('subject_id', subjectIds)
      .order('due_date', { ascending: true });

    if (assignError) throw assignError;

    return { success: true, data: assignments };

  } catch (error) {
    console.error("Service error in getAcademicAssignmentsByStudent:", error);
    return { success: false, error: error.message };
  }
}


// Helper function เพื่อหา student_id จาก user_id
export async function getStudentProfileByUserId(userId) {
  if (!userId) return { success: false, error: "User ID is required" };
  const { data, error } = await supabase.from('students').select('id').eq('user_id', userId).single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}