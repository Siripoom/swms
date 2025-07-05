"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAuth, onAuthStateChange } from "@/services/auth";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children, title, requiredRole }) {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    authorized: false,
    user: null,
  });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuthentication = async () => {
      try {
        const authResult = await requireAuth(requiredRole);

        if (!mounted) return;

        if (!authResult.authenticated) {
          router.push(authResult.redirect);
          return;
        }

        if (!authResult.authorized) {
          router.push(authResult.redirect);
          return;
        }

        setAuthState({
          loading: false,
          authenticated: true,
          authorized: true,
          user: authResult.user,
        });

        // เก็บ role ใน localStorage
        if (authResult.user?.role) {
          localStorage.setItem("userRole", authResult.user.role);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) {
          router.push("/login");
        }
      }
    };

    checkAuthentication();

    // ฟัง auth state changes
    const {
      data: { subscription },
    } = onAuthStateChange(async ({ event, session, authData }) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      } else if (event === "SIGNED_IN" && authData) {
        // ตรวจสอบสิทธิ์อีกครั้งเมื่อมีการ sign in
        const authResult = await requireAuth(requiredRole);

        if (!authResult.authenticated || !authResult.authorized) {
          router.push(authResult.redirect);
          return;
        }

        setAuthState({
          loading: false,
          authenticated: true,
          authorized: true,
          user: authResult.user,
        });
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router, requiredRole]);

  // // แสดง loading state
  // if (authState.loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // ถ้ายังไม่ authenticated หรือ authorized ให้แสดง loading
  if (!authState.authenticated || !authState.authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังเปลี่ยนเส้นทาง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar userRole={authState.user?.role} />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header
          title={title}
          userRole={authState.user?.role}
          userEmail={authState.user?.email}
        />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
