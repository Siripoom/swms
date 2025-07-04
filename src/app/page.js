"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuth, getDefaultRouteByRole } from "@/services/auth";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectUser = async () => {
      try {
        const authData = await checkAuth();

        if (authData) {
          // ถ้ามี session อยู่แล้ว redirect ตาม role
          const defaultRoute = getDefaultRouteByRole(authData.role);
          router.replace(defaultRoute);
        } else {
          // ถ้าไม่มี session ไป login
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/login");
      }
    };

    redirectUser();
  }, [router]);

  // แสดง loading ขณะกำลัง redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    </div>
  );
}
