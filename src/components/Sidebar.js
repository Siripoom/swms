"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth";
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Archive,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar({ userRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // เมนูตาม Role
  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return [
          { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
          { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
          {
            name: "จัดการนักศึกษา",
            href: "/admin/students",
            icon: GraduationCap,
          },
          { name: "จัดการรายวิชา", href: "/admin/subjects", icon: BookOpen },
          {
            name: "คลังภาระงาน",
            href: "/admin/workload-templates",
            icon: Archive,
          },
          {
            name: "กำหนดสัดส่วนภาระงาน",
            href: "/admin/proportions",
            icon: Settings,
          },
          { name: "รายงาน", href: "/admin/reports", icon: FileText },
        ];

      case "department_head":
        return [
          { name: "Dashboard", href: "/department/dashboard", icon: BarChart3 },
          {
            name: "รายงานภาระงาน",
            href: "/department/reports",
            icon: FileText,
          },
        ];

      case "teacher":
        return [
          { name: "Dashboard", href: "/teacher/dashboard", icon: BarChart3 },
          {
            name: "จัดการภาระงาน (การบ้าน)",
            href: "/teacher/assignments",
            icon: BookOpen,
          },
          { name: "รายงาน", href: "/teacher/reports", icon: FileText },
        ];

      case "student":
        return [
          { name: "Dashboard", href: "/student/dashboard", icon: BarChart3 },
          {
            name: "ภาระงานวิชาการ",
            href: "/student/academic-workload",
            icon: BookOpen,
          },
          {
            name: "ภาระงานอื่นๆ",
            href: "/student/other-workload",
            icon: Archive,
          },
          { name: "รายงานของฉัน", href: "/student/my-reports", icon: FileText },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const result = await logout();

      if (result.success) {
        router.push("/");
      } else {
        console.error("Logout error:", result.error);
        // แม้จะ error ก็ redirect ไป login อยู่ดี
        router.push("/");
      }
    } catch (error) {
      console.error("Unexpected logout error:", error);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case "admin":
        return "ผู้ดูแลระบบ";
      case "department_head":
        return "ผู้บริหารภาควิชา";
      case "teacher":
        return "อาจารย์";
      case "student":
        return "นักศึกษา";
      default:
        return "ผู้ใช้งาน";
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay สำหรับ Mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-64 bg-blue-600 text-white transform transition-transform duration-300 ease-in-out z-50
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ระบบ SWMS</h1>
              <p className="text-blue-200 text-sm">วิทยาลัยพยาบาลฯ</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                  ${isActive
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-blue-500">
          <div className="mb-4">
            <p className="text-blue-200 text-sm">เข้าสู่ระบบในฐานะ</p>
            <p className="font-medium">{getRoleDisplayName()}</p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors duration-200
              ${isLoggingOut
                ? "bg-blue-500 text-blue-200 cursor-not-allowed"
                : "text-blue-100 hover:bg-blue-500 hover:text-white"
              }
            `}
          >
            <LogOut size={20} />
            <span className="font-medium">
              {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
