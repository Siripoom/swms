"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/config/supabase";

// สร้าง Context
const AuthContext = createContext({
  session: null,
  userProfile: null,
  loading: true,
  user: null,
  role: null,
});

// สร้าง Provider
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ใช้ ref เพื่อเก็บสถานะการโหลดครั้งแรก
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    // ฟังก์ชันดึง Profile (เหมือนเดิม)
    const getUserProfile = async (user) => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) {
          console.error("AuthContext: Error fetching user profile. Signing out.", error.message);
          await supabase.auth.signOut();
          return null;
        }
        return data;
      } catch (e) {
        console.error("AuthContext: Exception in getUserProfile.", e);
        return null;
      }
    };

    // onAuthStateChange listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // ตรวจสอบว่าสถานะผู้ใช้เปลี่ยนแปลงจริงหรือไม่ (Login, Logout)
        const hasUserChanged = currentSession?.user?.id !== session?.user?.id;

        // ถ้าสถานะไม่เปลี่ยนแปลง และไม่ใช่การโหลดครั้งแรก -> ไม่ต้องทำอะไรเลย
        if (!hasUserChanged && initialLoadComplete.current) {
          return;
        }

        // ถ้ามีการเปลี่ยนแปลง หรือเป็นการโหลดครั้งแรก -> แสดง Loading
        setLoading(true);

        if (currentSession?.user) {
          const profile = await getUserProfile(currentSession.user);
          setSession(currentSession);
          setUserProfile(profile);
        } else {
          setSession(null);
          setUserProfile(null);
        }

        // ตั้งค่าว่าการโหลดครั้งแรกเสร็จสิ้นแล้ว
        if (!initialLoadComplete.current) {
          initialLoadComplete.current = true;
        }

        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, [session]); // เพิ่ม 'session' ใน dependency array

  const value = {
    session,
    userProfile,
    loading,
    user: session?.user,
    role: userProfile?.role,
  };

  // *** บรรทัดที่แก้ไขแล้ว ***
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook (เหมือนเดิม)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};