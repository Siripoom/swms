"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/config/supabase";

const AuthContext = createContext({
  session: null,
  userProfile: null,
  loading: true,
  user: null,
  role: null,
  studentId: null, // เพิ่ม key นี้เพื่อให้ Component อื่นรู้ว่ามีค่านี้อยู่
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

        if (baseProfile.role === 'student') {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, student_id')
            .eq('user_id', user.id)
            .single();

          if (studentError) {
            console.warn("AuthContext: Could not find student details for user:", user.id, studentError.message);
            return baseProfile;
          }

          return {
            ...baseProfile,
            student_profile_id: studentData?.id,
            student_identifier: studentData?.student_id
          };
        }

        return baseProfile;

      } catch (e) {
        console.error("AuthContext: Exception in getUserProfile. Signing out...", e);
        await supabase.auth.signOut();
        return null;
      }
    };

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
    // --- จุดที่แก้ไข ---
    // เพิ่มบรรทัดนี้เพื่อส่ง student's Primary Key (uuid) ออกไป
    studentId: userProfile?.student_profile_id || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};