"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/config/supabase"; // **ตรวจสอบให้แน่ใจว่า path นี้ถูกต้อง**

const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังก์ชันนี้จะดึง session และ profile user เมื่อโหลดเว็บครั้งแรก
    const getInitialSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // ถ้ามี session, ให้ดึงข้อมูล profile (role) จากตาราง users
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setUser(session.user);
        setRole(profile?.role || null);
      }
      setLoading(false);
    };

    getInitialSession();

    // ตั้งค่า listener เพื่อคอยตรวจจับการเปลี่ยนแปลงสถานะ (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // เมื่อมีการ login/logout เกิดขึ้น, อัปเดต state ใหม่
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          setUser(session.user);
          setRole(profile?.role || null);
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Cleanup subscription เมื่อ component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    role,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// สร้าง custom hook เพื่อให้เรียกใช้ข้อมูลจาก Context ได้ง่ายๆ
export const useAuth = () => {
  return useContext(AuthContext);
};