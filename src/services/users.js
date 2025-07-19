// src/services/users.js

import { supabase } from "@/config/supabase";

// ดึงข้อมูลผู้ใช้ทั้งหมดผ่าน Edge Function
export async function getAllUsers() {
  try {
    const { data, error } = await supabase.functions.invoke("get-all-users");

    if (error) throw error;
    if (data.error) throw new Error(data.error); // Handle errors from within the function

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message };
  }
}

// สร้างผู้ใช้ใหม่ผ่าน Edge Function
export async function createUser(userData) {
  try {
    // Client-side validation for duplicates can still be useful for instant feedback
    const { data: existingUser } = await supabase
      .from("users")
      .select("username, email")
      .or(`username.eq.${userData.username},email.eq.${userData.email}`);

    if (existingUser && existingUser.length > 0) {
      const duplicateField =
        existingUser[0].username === userData.username ? "Username" : "Email";
      throw new Error(`${duplicateField} นี้มีอยู่ในระบบแล้ว`);
    }

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke("create-user-profile", {
      body: userData,
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { success: true, data };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

// อัปเดตข้อมูลผู้ใช้ (ยังคงทำผ่าน Client API แต่ต้องมี RLS ที่ถูกต้อง)
export async function updateUser(id, userData) {
  try {
    // It's safer to only allow updating non-critical fields on the client
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
}

// ลบผู้ใช้ผ่าน Edge Function
export async function deleteUser(id) {
  // 1. ตรวจสอบ Input ก่อนส่ง: ตรวจสอบว่า `id` ที่ได้รับมาไม่ใช่ค่าว่าง
  if (!id) {
    const errorMessage = "ไม่สามารถลบผู้ใช้ได้: ไม่พบ User ID";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  console.log(`[Client Service] กำลังส่งคำขอลบผู้ใช้ ID: ${id}`);

  try {
    // 2. เรียกใช้ Edge Function: ส่ง body ในรูปแบบที่ถูกต้อง
    const { data, error } = await supabase.functions.invoke("delete-user-profile", {
      body: { userId: id },
    });

    // 3. จัดการ Error จากการเรียกใช้ Function (Network/Permission Error)
    if (error) {
      console.error("[Client Service] เกิดข้อผิดพลาดระหว่างเรียก Edge Function:", error);
      // ข้อผิดพลาดที่พบบ่อย:
      // - Network error: ไม่สามารถเชื่อมต่อกับ server ได้
      // - 401 Unauthorized: ผู้ใช้ไม่ได้ login หรือ JWT token ไม่ถูกต้อง
      // - 5xx Server error: Edge function อาจจะ deploy ไม่สำเร็จ
      throw new Error(`การเชื่อมต่อล้มเหลว: ${error.message}`);
    }

    // 4. จัดการ Error ที่ถูกส่งกลับมาจากภายใน Logic ของ Edge Function
    // Edge function ของเราจะส่งกลับ { error: '...' } หากมีปัญหา
    if (data && data.error) {
      console.error("[Client Service] Edge Function ตอบกลับพร้อมข้อผิดพลาด:", data.error);
      // ตัวอย่างข้อผิดพลาด: "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้"
      throw new Error(data.error);
    }

    // 5. กรณีสำเร็จ: Edge function ทำงานสำเร็จ
    console.log("[Client Service] Edge Function ตอบกลับว่าลบสำเร็จ:", data?.message || 'Success');
    return { success: true, data: data };

  } catch (error) {
    // 6. Catch-all: ดักจับข้อผิดพลาดทั้งหมดที่เกิดขึ้นใน try block
    // และจัดรูปแบบเพื่อส่งกลับไปให้ UI แสดงผล
    console.error("[Client Service] ข้อผิดพลาดสุดท้ายในการลบผู้ใช้:", error.message);
    return { success: false, error: error.message };
  }
}

// ฟังก์ชันเหล่านี้ไม่มีการเปลี่ยนแปลง
export function getUserRoles() {
  return [
    { value: "admin", label: "ผู้ดูแลระบบ" },
    { value: "department_head", label: "ผู้บริหารภาควิชา" },
    { value: "teacher", label: "อาจารย์" },
    { value: "student", label: "นักศึกษา" },
  ];
}

export function getDepartments() {
  return [
    { value: "nursing", label: "พยาบาลศาสตร์" },
    { value: "public_health", label: "สาธารณสุขศาสตร์" },
    { value: "medical_technology", label: "เทคนิคการแพทย์" },
    { value: "pharmacy", label: "เภสัชศาสตร์" },
    { value: "other", label: "อื่นๆ" },
  ];
}