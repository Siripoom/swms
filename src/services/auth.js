import { supabase } from "@/config/supabase";

// ฟังก์ชันตรวจสอบการเข้าสู่ระบบ
export async function checkAuth() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null; // ไม่ได้ล็อกอิน
    }

    // ตรวจสอบว่า token ยังใช้ได้หรือไม่
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      console.log("Token invalid, clearing session");
      await supabase.auth.signOut();
      return null;
    }

    return {
      user: session.user,
      role: user.role,
      email: user.email,
      userId: user.id,
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return null; // หากมีข้อผิดพลาดในการตรวจสอบ
  }
}

// ฟังก์ชันออกจากระบบ
export async function logout() {
  try {
    console.log("Starting logout process...");

    // 1. ล็อกเอาท์จาก Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // 2. เคลียร์ข้อมูลใน localStorage และ sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear(); // เคลียร์ทั้งหมดใน localStorage
      sessionStorage.clear(); // เคลียร์ทั้งหมดใน sessionStorage
    }

    // 3. รีเฟรชหน้า
    window.location.href = '/'; // เปลี่ยนหน้าไปที่หน้าแรก

    console.log("Logout completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
}

// ฟังก์ชันตรวจสอบ session
export async function validateSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // ตรวจสอบ token validity
    const { data: user, error } = await supabase.auth.getUser();
    if (error || !user.user) {
      console.log("Session invalid, signing out");
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    await supabase.auth.signOut();
    return false;
  }
}

// ฟังก์ชันเข้าสู่ระบบ
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: error.message };
  }
}

// ฟังก์ชันตรวจสอบสิทธิ์
export function hasPermission(userRole, requiredRoles) {
  if (!userRole || !requiredRoles) return false;

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }

  return userRole === requiredRoles;
}

// ได้รับ URL ที่เหมาะสมตาม role
export function getDefaultRouteByRole(role) {
  const routes = {
    admin: "/admin/dashboard",
    department_head: "/department/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/dashboard",
  };

  return routes[role] || "/";
}

// ตรวจสอบ session และ redirect ถ้าจำเป็น
export async function requireAuth(requiredRoles = null) {
  const authData = await checkAuth();

  if (!authData) {
    return {
      authenticated: false,
      redirect: "/",
    };
  }

  if (requiredRoles && !hasPermission(authData.role, requiredRoles)) {
    return {
      authenticated: true,
      authorized: false,
      redirect: "/unauthorized",
    };
  }

  return {
    authenticated: true,
    authorized: true,
    user: authData,
  };
}
