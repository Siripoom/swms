// src/services/assignments.js
import { supabase } from '@/config/supabase';

// 1. ดึงงานทั้งหมดที่สร้างโดยอาจารย์คนนั้น
export async function getAssignmentsByTeacher(teacherId) {
  if (!teacherId) return { success: false, error: "Teacher ID is required" };
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subjects ( subject_code, subject_name ),
      template:workload_templates ( name )
    `)
    .eq('teacher_id', teacherId)
    .order('assigned_date', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 2. ดึงรายวิชาทั้งหมดมาให้เลือก (เวอร์ชันง่าย)
// ในอนาคตควรกรองเฉพาะวิชาที่อาจารย์สอน
export async function getSubjectsForTeacher() {
  const { data, error } = await supabase.from('subjects').select('id, subject_code, subject_name').order('subject_code');
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 3. สร้างงานใหม่
export async function createAssignmentAndDistribute(assignmentData) {
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .insert([assignmentData])
    .select()
    .single();

  if (assignmentError) return { success: false, error: assignmentError.message };

  // ✅ STEP 2: หา student ที่ลงทะเบียนในวิชานี้
  const { data: enrollments, error: enrollError } = await supabase
    .from('subject_enrollments')
    .select('student_id')
    .eq('subject_id', assignment.subject_id);

  if (enrollError) return { success: false, error: enrollError.message };

  const workloads = enrollments.map(e => ({
    student_id: e.student_id,
    assignment_id: assignment.id,
    category: 'academic',
    activity_name: assignment.assignment_name,
    work_date: assignment.due_date,
    hours_spent: 0  // ตั้งเป็น 0 ไว้ก่อน ให้นักศึกษาเติมภายหลัง (หรือไม่ต้องใส่เลย)
  }));

  // ✅ STEP 3: insert ลง student_workloads
  const { error: insertWorkloadError } = await supabase
    .from('student_workloads')
    .insert(workloads);

  if (insertWorkloadError) return { success: false, error: insertWorkloadError.message };

  return { success: true, data: assignment };
}


// 4. อัปเดตงาน
export async function updateAssignment(id, assignmentData) {
  const { data, error } = await supabase.from('assignments').update(assignmentData).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 5. ลบงาน
export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}