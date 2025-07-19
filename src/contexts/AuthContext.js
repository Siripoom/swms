// src/contexts/AuthContext.js

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/config/supabase";

// สร้าง Context ที่จะเก็บข้อมูลผู้ใช้และสถานะการโหลด
const AuthContext = createContext({
  session: null,
  userProfile: null,
  loading: true,
  user: null, // เพื่อความสะดวกในการใช้งาน
  role: null, // เพื่อความสะดวกในการใช้งาน
});

// สร้าง Provider ที่จะครอบ App ของคุณ
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังก์ชันสำหรับดึง Profile จากตาราง users
    const getUserProfile = async (user) => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*') // ดึงมาทั้งหมดเลย หรือเลือกฟิลด์ที่จำเป็น: 'role, full_name, username'
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("AuthContext: Error fetching user profile. Signing out.", error.message);
          // ถ้าหา profile ไม่เจอ ควร sign out เพื่อป้องกัน state ที่ไม่สมบูรณ์
          await supabase.auth.signOut();
          return null;
        }
        return data;
      } catch (e) {
        console.error("AuthContext: Exception in getUserProfile.", e);
        return null;
      }
    };

    // onAuthStateChange จะทำงานเพียงครั้งเดียวตอนโหลดหน้าเว็บเพื่อดึง session เริ่มต้น
    // และจะทำงานอีกครั้งเมื่อมีการ SIGN_IN หรือ SIGN_OUT
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (session && session.user) {
          console.log("AuthContext: User signed in. Fetching profile...");
          const profile = await getUserProfile(session.user);
          setSession(session);
          setUserProfile(profile);
        } else {
          console.log("AuthContext: User signed out or no session found.");
          setSession(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Cleanup subscription เมื่อ component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ค่าที่จะส่งผ่าน Context
  const value = {
    session,
    userProfile,
    loading,
    // ค่าลัดเพื่อความสะดวก
    user: session?.user,
    role: userProfile?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// สร้าง custom hook เพื่อให้เรียกใช้ข้อมูลจาก Context ได้ง่ายๆ
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};