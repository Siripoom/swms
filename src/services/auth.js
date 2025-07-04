import { supabase } from "@/config/supabase";

// ตรวจสอบ authentication และ role
export async function checkAuth() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null; // Not authenticated
    }

    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from("users")
      .select("role, email, id")
      .eq("id", session.user.id)
      .single();

    if (error || !userData) {
      console.error("Error fetching user role:", error);
      return null; // Error fetching role
    }

    return {
      user: session.user,
      role: userData.role,
      email: userData.email,
      userId: userData.id,
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return null; // Error during auth check
  }
}

// ล็อกเอาท์
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    localStorage.removeItem("userRole");
    localStorage.removeItem("rememberLogin");

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
}

// เข้าสู่ระบบ
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // ดึงข้อมูล role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (userError) {
        throw new Error("ไม่สามารถดึงข้อมูลบทบาทผู้ใช้ได้");
      }

      return {
        success: true,
        user: data.user,
        role: userData.role,
        session: data.session,
      };
    }

    return { success: false, error: "ข้อมูลผู้ใช้ไม่ถูกต้อง" };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: error.message };
  }
}

// ตรวจสอบสิทธิ์การเข้าถึงหน้า
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

  return routes[role] || "/login";
}

// ตรวจสอบ session และ redirect ถ้าจำเป็น
export async function requireAuth(requiredRoles = null) {
  const authData = await checkAuth();

  if (!authData) {
    return {
      authenticated: false,
      redirect: "/login",
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

// ตั้งค่าการฟัง auth state changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      const authData = await checkAuth();
      callback({ event, session, authData });
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem("userRole");
      localStorage.removeItem("rememberLogin");
      callback({ event, session: null, authData: null });
    }
  });
}
