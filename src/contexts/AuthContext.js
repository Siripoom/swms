"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/config/supabase"; // ตรวจสอบ path ของ supabase client ให้ถูกต้อง

const AuthContext = createContext({
  session: null,
  userProfile: null,
  loading: true,
  user: null,
  role: null,
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    // ฟังก์ชันดึงโปรไฟล์ที่สมบูรณ์
    const getUserProfile = async (user) => {
      if (!user) return null;
      try {
        // 1. ดึงข้อมูลพื้นฐานจากตาราง 'users'
        const { data: baseProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error("AuthContext: Error fetching user profile:", userError.message);
          throw userError;
        }

        if (!baseProfile) return null;

        // 2. ถ้าเป็นนักเรียน (student) ให้ดึงข้อมูลจากตาราง students เพิ่ม
        if (baseProfile.role === 'student') {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, student_id') // ดึงทั้ง id (PK) และ student_id (รหัสประจำตัว)
            .eq('user_id', user.id) // เชื่อมด้วย user_id
            .single();

          if (studentError) {
            console.error("AuthContext: Could not find student details for user:", user.id, studentError.message);
            // ถ้าหาโปรไฟล์นักเรียนไม่เจอ ก็ยังคืนโปรไฟล์พื้นฐานไปก่อน
            return baseProfile;
          }

          // 3. รวมข้อมูลโปรไฟล์ โดยตั้งชื่อ property ใหม่ให้ชัดเจน
          return {
            ...baseProfile,
            student_profile_id: studentData?.id,   // นี่คือ students.id (PK) ที่ service ต้องการ
            student_id: studentData?.student_id    // นี่คือรหัสประจำตัวนักศึกษาสำหรับแสดงผล
          };
        }

        // 4. ถ้าไม่ใช่ student ก็คืนค่าโปรไฟล์พื้นฐานไปเลย
        return baseProfile;

      } catch (e) {
        console.error("AuthContext: Exception in getUserProfile. Signing out...", e);
        // ในกรณีเกิด Error ร้ายแรง ให้ signOut เพื่อป้องกันปัญหา
        await supabase.auth.signOut();
        return null;
      }
    };

    // Listener สำหรับการเปลี่ยนแปลงสถานะการล็อกอิน
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        const hasUserChanged = currentSession?.user?.id !== session?.user?.id;
        if (!hasUserChanged && initialLoadComplete.current) {
          return;
        }

        setLoading(true);

        if (currentSession?.user) {
          const profile = await getUserProfile(currentSession.user);
          setSession(currentSession);
          setUserProfile(profile);
        } else {
          setSession(null);
          setUserProfile(null);
        }

        if (!initialLoadComplete.current) {
          initialLoadComplete.current = true;
        }

        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [session]);

  const value = {
    session,
    userProfile,
    loading,
    user: session?.user,
    role: userProfile?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook สำหรับเรียกใช้ Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};