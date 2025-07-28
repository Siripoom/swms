"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth, getDefaultRouteByRole } from "@/services/auth";
import { ShieldX, Home, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      const authData = await checkAuth();
      if (authData) {
        setUserRole(authData.role);
      }
      setLoading(false);
    };

    getUserRole();
  }, []);

  const handleGoToDashboard = () => {
    if (userRole) {
      const defaultRoute = getDefaultRouteByRole(userRole);
      router.push(defaultRoute);
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    const { logout } = await import("@/services/auth");
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ไม่มีสิทธิ์เข้าถึง
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่าเป็นข้อผิดพลาด
        </p>

        {/* User Role Info */}
        {userRole && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">บทบาทปัจจุบันของคุณ</p>
            <p className="font-medium text-gray-900">
              {userRole === "admin" && "ผู้ดูแลระบบ"}
              {userRole === "department_head" && "ผู้บริหารภาควิชา"}
              {userRole === "teacher" && "อาจารย์"}
              {userRole === "student" && "นักศึกษา"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home size={20} />
            <span>กลับไปหน้าหลัก</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            หากต้องการความช่วยเหลือ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
}
