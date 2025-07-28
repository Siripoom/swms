// src/services/adminDashboard.js
import { supabase } from '@/config/supabase';

// สำหรับ Summary Cards
export async function getAdminDashboardSummary(academicYear, semester) {
  const { data, error } = await supabase.rpc('get_admin_dashboard_summary', { p_academic_year: academicYear, p_semester: semester || 0 });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// สำหรับกราหชุดที่ 1: ภาพรวมตามชั้นปี
export async function getDashboardWorkloadByYearLevel(academicYear, semester) {
  console.log('Calling getDashboardWorkloadByYearLevel with:', { academicYear, semester });

  const { data, error } = await supabase.rpc('get_dashboard_workload_by_year_level', {
    p_academic_year: academicYear,
    p_semester: semester || 0
  });

  console.log('RPC response:', { data, error });

  if (error) {
    console.error('RPC error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// เพิ่ม error handling ให้ service functions อื่นๆ ด้วย
export async function getDashboardWorkloadBySubject(academicYear, semester) {
  console.log('Calling getDashboardWorkloadBySubject with:', { academicYear, semester });

  const { data, error } = await supabase.rpc('get_dashboard_workload_by_subject', {
    p_academic_year: academicYear,
    p_semester: semester || 0
  });

  console.log('Subject RPC response:', { data, error });

  if (error) {
    console.error('Subject RPC error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}


// สำหรับกราฟชุดที่ 4: หน่วยกิต vs ภาระงาน
export async function getDashboardCreditVsWorkload(academicYear, semester) {
  const { data, error } = await supabase.rpc('get_dashboard_credit_vs_workload', { p_academic_year: academicYear, p_semester: semester || 0 });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// สำหรับกราฟชุดที่ 6: เปรียบเทียบแผน vs จริง
export async function getDashboardProportionComparison(academicYear, semester, yearLevel) {
  const { data, error } = await supabase.rpc('get_dashboard_proportion_comparison', { p_academic_year: academicYear, p_semester: semester || 0, p_year_level: yearLevel || 0 });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getDashboardWorkloadDistribution(academicYear, semester) {
  const { data, error } = await supabase.rpc('get_dashboard_workload_distribution', { p_academic_year: academicYear, p_semester: semester || 0 });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getDashboardAssignmentVsWorkload(academicYear, semester) {
  const { data, error } = await supabase.rpc('get_dashboard_assignment_vs_workload', { p_academic_year: academicYear, p_semester: semester || 0 });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getDashboardWorkloadBoxplot(academicYear, semester) {
  const { data, error } = await supabase.rpc('get_dashboard_workload_boxplot', { p_academic_year: academicYear, p_semester: semester || 0 });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

