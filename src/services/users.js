// src/services/users.js

import { supabase } from "@/config/supabase";

// ดึงข้อมูลผู้ใช้ทั้งหมดผ่าน Edge Function
export async function getAllUsers() {
  try {
    const { data, error } = await supabase.functions.invoke("get-all-users");

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message };
  }
}

// สร้างผู้ใช้ใหม่ผ่าน Edge Function
export async function createUser(userData) {
  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("username, email")
      .or(`username.eq.${userData.username},email.eq.${userData.email}`);

    if (existingUser && existingUser.length > 0) {
      const duplicateField =
        existingUser[0].username === userData.username ? "Username" : "Email";
      throw new Error(`${duplicateField} นี้มีอยู่ในระบบแล้ว`);
    }

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

// === ส่วนที่แก้ไข ===
// อัปเดตข้อมูลผู้ใช้ (ผ่าน Edge Function เพื่อแก้ไขได้ทั้ง Auth และ Profile)
export async function updateUser(id, userData) {
  try {
    console.log(`[Client Service] Updating user ${id} with data:`, userData);

    // เรียกใช้ Edge Function พร้อมส่งทั้ง ID และข้อมูลที่จะอัปเดต
    const { data, error } = await supabase.functions.invoke("update-user-profile", {
      body: {
        userId: id,
        ...userData // ส่งข้อมูลทั้งหมดที่ได้จากฟอร์ม
      },
    });

    if (error) throw new Error(`Network/Invoke Error: ${error.message}`);
    if (data && data.error) throw new Error(data.error);

    console.log("[Client Service] User updated successfully:", data);
    return { success: true, data };

  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
}

// ลบผู้ใช้ผ่าน Edge Function
export async function deleteUser(id) {
  if (!id) {
    const errorMessage = "ไม่สามารถลบผู้ใช้ได้: ไม่พบ User ID";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  console.log(`[Client Service] กำลังส่งคำขอลบผู้ใช้ ID: ${id}`);

  try {
    const { data, error } = await supabase.functions.invoke("delete-user-profile", {
      body: { userId: id },
    });

    if (error) {
      console.error("[Client Service] เกิดข้อผิดพลาดระหว่างเรียก Edge Function:", error);
      throw new Error(`การเชื่อมต่อล้มเหลว: ${error.message}`);
    }

    if (data && data.error) {
      console.error("[Client Service] Edge Function ตอบกลับพร้อมข้อผิดพลาด:", data.error);
      throw new Error(data.error);
    }

    console.log("[Client Service] Edge Function ตอบกลับว่าลบสำเร็จ:", data?.message || 'Success');
    return { success: true, data: data };

  } catch (error) {
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