import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // รีเฟรช session ถ้าหมดอายุ
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // กำหนดเส้นทางที่ต้องการป้องกัน
  const protectedRoutes = ["/admin", "/department", "/teacher", "/student"];

  // กำหนดเส้นทางสาธารณะที่ไม่ต้องตรวจสอบ auth
  const publicRoutes = ["/", "/unauthorized"];

  const { pathname } = req.nextUrl;

  // ตรวจสอบว่าเส้นทางปัจจุบันเป็น protected route หรือไม่
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // ถ้าไม่มี session และพยายามเข้า protected route
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL("/", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ถ้ามี session และอยู่หน้า login ให้ redirect ไป dashboard
  if (session && pathname === "/") {
    try {
      // ดึงข้อมูล role จากฐานข้อมูล
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userData?.role) {
        let redirectPath = "/";

        switch (userData.role) {
          case "admin":
            redirectPath = "/admin/dashboard";
            break;
          case "department_head":
            redirectPath = "/department/dashboard";
            break;
          case "teacher":
            redirectPath = "/teacher/dashboard";
            break;
          case "student":
            redirectPath = "/student/dashboard";
            break;
        }

        const redirectUrl = new URL(redirectPath, req.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("Error fetching user role in middleware:", error);
    }
  }

  // ตรวจสอบสิทธิ์การเข้าถึงเส้นทางต่างๆ
  if (session && isProtectedRoute) {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userData?.role) {
        const userRole = userData.role;

        // กำหนดสิทธิ์การเข้าถึงแต่ละเส้นทาง
        const rolePermissions = {
          "/admin": ["admin"],
          "/department": ["department_head"],
          "/teacher": ["teacher"],
          "/student": ["student"],
        };

        // ตรวจสอบว่า role ปัจจุบันมีสิทธิ์เข้าถึงเส้นทางนี้หรือไม่
        const hasPermission = Object.entries(rolePermissions).some(
          ([route, allowedRoles]) => {
            return (
              pathname.startsWith(route) && allowedRoles.includes(userRole)
            );
          }
        );

        // ถ้าไม่มีสิทธิ์ ให้ redirect ไป unauthorized
        if (!hasPermission) {
          const redirectUrl = new URL("/unauthorized", req.url);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      console.error("Error checking permissions in middleware:", error);
      // ถ้ามีข้อผิดพลาดในการตรวจสอบสิทธิ์ ให้ redirect ไป login
      const redirectUrl = new URL("/", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
