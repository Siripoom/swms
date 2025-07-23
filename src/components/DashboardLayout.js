"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar"; // ตรวจสอบว่า Sidebar.js อยู่ใน path นี้
import Header from "./Header";   // ตรวจสอบว่า Header.js อยู่ใน path นี้

export default function DashboardLayout({ children, title, requiredRole }) {
  // ดึงข้อมูลทั้งหมดจาก Context รวมถึง "userProfile"
  const { user, role, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    if (requiredRole && !requiredRole.includes(role)) {
      router.push("/unauthorized");
      return;
    }
  }, [user, role, loading, router, requiredRole]);

  // แสดงหน้า Loading ขณะรอข้อมูล หรือยังไม่มีสิทธิ์
  if (loading || !user || !userProfile || (requiredRole && !requiredRole.includes(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // เตรียม props สำหรับส่งให้ Sidebar จาก `userProfile` โดยตรง
  const userName = userProfile.full_name || "ผู้ใช้งาน";
  let userIdentifier = "บทบาท";

  if (role === 'teacher') {
    userIdentifier = "อาจารย์";
  } else if (role === 'student') {
    // ดึงรหัสประจำตัวนักศึกษาจาก userProfile (ไม่ใช่ PK)
    userIdentifier = userProfile.student_id || "รหัสนักศึกษา";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userRole={role}
        userName={userName}
        userIdentifier={userIdentifier}
      />

      <div className="lg:ml-64">
        <Header title={title} user={user} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}