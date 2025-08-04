// Sidebar.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Archive,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  UserCircle,
  ClipboardList,
  Building2,
} from "lucide-react";

// Component ย่อยสำหรับแสดงข้อมูลผู้ใช้ (เพื่อความสะอาดของโค้ด)
const UserProfile = ({ role, name, identifier }) => {
  if (role === 'student') {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-lg">
          {name.charAt(0) === 'น' ? 'น' : name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{name}</p>
          <p className="text-blue-200 text-xs">รหัส {identifier}</p>
        </div>
      </div>
    );
  }

  if (role === 'teacher') {
    return (
      <div className="flex items-center space-x-3 p-4">
        <UserCircle size={40} className="text-gray-400" />
        <div>
          <p className="font-semibold text-gray-800 text-sm">{name}</p>
          <p className="text-gray-500 text-xs">{identifier}</p>
        </div>
      </div>
    );
  }

  // สำหรับ admin หรือ role อื่นๆ ที่ไม่ต้องการแสดงข้อมูลละเอียด
  return null;
};


export default function Sidebar({ userRole, userName = "ผู้ใช้งาน", userIdentifier = "บทบาท" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return [
          { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
          { name: "จัดการนักศึกษา", href: "/admin/students", icon: GraduationCap },
          { name: "จัดการรายวิชา", href: "/admin/subjects", icon: BookOpen },
          { name: "คลังภาระงาน", href: "/admin/workload-templates", icon: Archive },
          { name: "กำหนดสัดส่วนภาระงาน", href: "/admin/proportions", icon: Settings },
          { name: "รายงาน", href: "/admin/reports", icon: FileText },
        ];
      case "department_head":
        return [
          { name: "Dashboard", href: "/department/dashboard", icon: LayoutDashboard },
          { name: "รายงานภาระงาน", href: "/department/reports", icon: FileText },
        ];
      case "teacher":
        return [
          { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
          { name: "จัดการภาระงาน", href: "/teacher/assignments", icon: ClipboardList },
          { name: "นักศึกษาในที่ปรึกษา", href: "/teacher/advisor-report", icon: Users },
          { name: "รายงาน", href: "/teacher/reports", icon: FileText },
        ];
      case "student":
        return [
          { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
          { name: "ภาระงานวิชาการ", href: "/student/academic-workload", icon: BookOpen },
          { name: "ภาระงานอื่นๆ", href: "/student/other-workload", icon: Archive },
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
        router.push("/");
      }
    } catch (error) {
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const mobileMenuControls = (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-md bg-indigo-600 text-white shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );

  // 1. Teacher Sidebar (Light Theme - ไม่มีการเปลี่ยนแปลง)
  if (userRole === "teacher") {
    return (
      <>
        {mobileMenuControls}
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 bg-white text-gray-800 flex flex-col shadow-lg
            transform transition-transform duration-300 ease-in-out z-50
            ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          `}
        >
          {/* Header */}
          <div className="flex items-center space-x-3 p-4 border-b">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <div>
              <h1 className="font-bold text-indigo-800">วพบ.ชัยนาท</h1>
              <p className="text-gray-500 text-xs">ระบบจัดการภาระงาน</p>
            </div>
          </div>

          {/* User Info */}
          <UserProfile role={userRole} name={userName} identifier={userIdentifier} />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium
                    ${isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 mt-auto border-t">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-md bg-gray-50 hover:bg-red-50 text-red-600 transition-colors duration-200 disabled:opacity-50"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">
                {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
              </span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // 2. Admin, Student, etc. Sidebar (Dark Theme - แก้ไขแล้ว)
  return (
    <>
      {mobileMenuControls}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-blue-800 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out z-50
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-5">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white rounded-md flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-800" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">ระบบจัดการภาระงาน</h1>
              <p className="text-blue-200 text-sm leading-tight">วพบ.ชัยนาท</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors duration-200 relative
                  ${isActive
                    ? "bg-blue-700 !text-white" // <-- เพิ่ม !text-white เพื่อความแน่นอน
                    : "!text-blue-100 hover:bg-blue-700/60" // <-- เพิ่ม ! เพื่อ override สี antd
                  }
                `}
              >
                {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full"></div>}
                <Icon size={22} className="!text-inherit" /> {/* <-- ทำให้ icon รับสีจาก parent */}
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-blue-700/50">
          {userRole === 'student' && (
            <div className="mb-4">
              <UserProfile role={userRole} name={userName} identifier={userIdentifier} />
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg !text-blue-100 hover:bg-blue-700/60 transition-colors duration-200 disabled:opacity-50" // <-- เพิ่ม !
          >
            <LogOut size={22} />
            <span className="font-medium text-sm">
              {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}