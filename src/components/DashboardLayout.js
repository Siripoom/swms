"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // 1. Import hook ใหม่
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children, title, requiredRole }) {
  // 2. ดึงข้อมูลสถานะผู้ใช้จาก Context ที่โหลดไว้แล้ว
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // 3. useEffect จะทำงานเพื่อ "ตรวจสอบสิทธิ์" จากข้อมูลที่มีอยู่แล้ว ไม่ต้องรอ Network
  useEffect(() => {
    // รอให้ Context โหลดข้อมูลครั้งแรกให้เสร็จก่อน
    if (loading) {
      return; // ยังไม่ต้องทำอะไร
    }

    // เมื่อโหลดเสร็จแล้ว
    // กรณีที่ 1: ไม่มี user (ยังไม่ login) -> เด้งไปหน้า login
    if (!user) {
      router.push("/");
      return;
    }

    // กรณีที่ 2: หน้านี้ต้องการ role เฉพาะ แต่ role ของผู้ใช้ไม่ตรงกับที่กำหนด
    if (requiredRole && !requiredRole.includes(role)) {
      console.warn(`Access Denied: Required role '${requiredRole.join()}', but user has role '${role}'. Redirecting...`);
      // คุณสามารถสร้างหน้า /unauthorized หรือ redirect ไปที่อื่น
      router.push("/unauthorized");
      return;
    }

  }, [user, role, loading, router, requiredRole]);

  // 4. แสดงหน้า Loading ขณะที่ Context กำลังโหลดข้อมูล หรือขณะที่กำลังจะ redirect
  // เงื่อนไขนี้จะครอบคลุมทุกกรณีที่ยังไม่พร้อมแสดงผลหน้าจริง
  if (loading || !user || (requiredRole && !requiredRole.includes(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // 5. ถ้าทุกอย่างผ่าน (โหลดเสร็จ, login แล้ว, มีสิทธิ์) ก็แสดง Layout และเนื้อหาของหน้า
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar จะได้รับ role จาก context โดยตรง */}
      <Sidebar userRole={role} />

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Header ก็จะได้รับข้อมูลที่จำเป็น */}
        <Header
          title={title}
          userRole={role}
        />

        {/* เนื้อหาของแต่ละหน้า (เช่น ตารางจัดการผู้ใช้) */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}