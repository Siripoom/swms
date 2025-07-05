import { supabase } from "@/config/supabase";

// ดึงข้อมูลผู้ใช้ทั้งหมด
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message };
  }
}

// ดึงข้อมูลผู้ใช้ตาม ID
export async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: error.message };
  }
}

// สร้างผู้ใช้ใหม่
export async function createUser(userData) {
  try {
    // ตรวจสอบว่า username และ email ไม่ซ้ำ
    const { data: existingUser } = await supabase
      .from("users")
      .select("username, email")
      .or(`username.eq.${userData.username},email.eq.${userData.email}`);

    if (existingUser && existingUser.length > 0) {
      const duplicateField =
        existingUser[0].username === userData.username ? "username" : "email";
      throw new Error(`${duplicateField} นี้มีอยู่ในระบบแล้ว`);
    }

    // สร้าง user ใน Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          username: userData.username,
          role: userData.role,
          department: userData.department,
        },
      });

    if (authError) throw authError;

    // เพิ่มข้อมูลใน users table
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          username: userData.username,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
          department: userData.department || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

// อัปเดตข้อมูลผู้ใช้
export async function updateUser(id, userData) {
  try {
    // ตรวจสอบว่า username และ email ไม่ซ้ำ (ยกเว้นของตัวเอง)
    if (userData.username || userData.email) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("username, email")
        .neq("id", id)
        .or(
          `username.eq.${userData.username || ""},email.eq.${
            userData.email || ""
          }`
        );

      if (existingUser && existingUser.length > 0) {
        const duplicateField =
          existingUser[0].username === userData.username ? "username" : "email";
        throw new Error(`${duplicateField} นี้มีอยู่ในระบบแล้ว`);
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        username: userData.username,
        full_name: userData.full_name,
        email: userData.email,
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

// ลบผู้ใช้
export async function deleteUser(id) {
  try {
    // ตรวจสอบว่าผู้ใช้ที่จะลบไม่ใช่ admin คนสุดท้าย
    const { data: adminUsers } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (adminUsers && adminUsers.length === 1 && adminUsers[0].id === id) {
      throw new Error("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้");
    }

    // ลบข้อมูลจาก users table
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;

    // ลบ user จาก Supabase Auth (optional)
    // Note: ต้องมี admin privileges หรือใช้ Supabase Admin API
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (authError) {
      console.warn("Could not delete user from auth:", authError);
      // ไม่ throw error เพราะข้อมูลใน users table ลบแล้ว
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

// ดึงรายการ roles ที่มีอยู่
export function getUserRoles() {
  return [
    { value: "admin", label: "ผู้ดูแลระบบ" },
    { value: "department_head", label: "ผู้บริหารภาควิชา" },
    { value: "teacher", label: "อาจารย์" },
    { value: "student", label: "นักศึกษา" },
  ];
}

// ดึงรายการแผนก/สาขา
export function getDepartments() {
  return [
    { value: "nursing", label: "พยาบาลศาสตร์" },
    { value: "public_health", label: "สาธารณสุขศาสตร์" },
    { value: "medical_technology", label: "เทคนิคการแพทย์" },
    { value: "pharmacy", label: "เภสัชศาสตร์" },
    { value: "other", label: "อื่นๆ" },
  ];
}
