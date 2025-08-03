// src/components/DashboardLayout.js

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PageLoadingSkeleton } from "./LoadingSkeleton";

export default function DashboardLayout({ children, title, requiredRole }) {
  // 1. ดึงข้อมูลทั้งหมดจาก AuthContext เดิมของคุณ
  // เรามี user, role, และ userProfile อยู่ในนี้แล้ว
  const { user, role, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // รอให้ Context โหลดเสร็จก่อน
    if (!user) {
      router.push("/");
      return;
    }
    // เช็คสิทธิ์หลังจากที่ user และ role มีค่าแล้ว
    if (requiredRole && !requiredRole.includes(role)) {
      router.push("/unauthorized");
      return;
    }
  }, [user, role, loading, router, requiredRole]);

  // แสดงหน้า Loading ขณะรอข้อมูลจาก Context
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageLoadingSkeleton />
      </div>
    );
  }

  // ป้องกันการ render เนื้อหา ถ้ายังไม่มีสิทธิ์ (ป้องกันการกระพริบ)
  if (requiredRole && !requiredRole.includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageLoadingSkeleton />
      </div>
    );
  }

  // --- โค้ดที่แก้ไข (หัวใจอยู่ตรงนี้) ---
  // 2. เตรียม props สำหรับส่งให้ Sidebar จาก `userProfile` ที่ได้มา
  const userName = userProfile?.full_name || "ผู้ใช้งาน";
  let identifier = "บทบาท"; // ค่าเริ่มต้น

  if (userProfile) {
    // เช็คให้แน่ใจว่า userProfile ไม่ใช่ null
    switch (role) {
      case "student":
        // *** ดึงรหัสนักศึกษาจาก `userProfile.student_identifier` ***
        // ซึ่งเป็น property ที่ AuthContext ของคุณสร้างไว้ให้แล้ว
        identifier = userProfile.student_identifier || "ไม่มีรหัส";
        break;
      case "teacher":
        identifier = "อาจารย์";
        break;
      case "department_head":
        identifier = "ผู้บริหารภาควิชา";
        break;
      case "admin":
        identifier = "ผู้ดูแลระบบ";
        break;
    }
  }
  // --- สิ้นสุดโค้ดที่แก้ไข ---

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userRole={role}
        userName={userName}
        userIdentifier={identifier} // <-- ส่งค่าที่ถูกต้องเข้าไปแล้ว
      />

      <div className="lg:ml-64">
        {/* Header ของคุณ (ถ้ามี) */}
        {/* <Header title={title} user={user} /> */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
