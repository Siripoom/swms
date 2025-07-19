// src/services/workloadTemplates.js
import { supabase } from '@/config/supabase';

// 1. ดึงข้อมูล Template ทั้งหมด
export async function getAllTemplates() {
  const { data, error } = await supabase
    .from('workload_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 2. สร้าง Template ใหม่
export async function createTemplate(templateData) {
  const dataToInsert = {
    ...templateData,
    hours: Number(templateData.hours || 0),
  };
  const { data, error } = await supabase.from('workload_templates').insert([dataToInsert]).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 3. อัปเดต Template
export async function updateTemplate(id, templateData) {
  const dataToUpdate = {
    ...templateData,
    hours: Number(templateData.hours || 0),
  };
  const { data, error } = await supabase.from('workload_templates').update(dataToUpdate).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// 4. ลบ Template
export async function deleteTemplate(id) {
  const { error } = await supabase.from('workload_templates').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}