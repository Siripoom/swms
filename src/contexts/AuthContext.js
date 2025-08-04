"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/config/supabase";
import { validateSession } from "@/services/auth";

const AuthContext = createContext({
  session: null,
  userProfile: null,
  loading: true,
  user: null,
  role: null,
  studentId: null,
  refreshUserProfile: null,
  clearAuthData: null,
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialLoadComplete = useRef(false);
  const userProfileCache = useRef(new Map());

  // ฟังก์ชันเคลียร์ข้อมูล auth ทั้งหมด
  const clearAuthData = useCallback(() => {
    setSession(null);
    setUserProfile(null);
    userProfileCache.current.clear();

    // เคลียร์ localStorage และ sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);

  // ตรวจสอบ session validity
  useEffect(() => {
    const handleFocus = async () => {
      const isValid = await validateSession();
      if (!isValid && session) {
        console.log("Session invalid, clearing auth data");
        clearAuthData();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [session, clearAuthData]);

  // ฟังก์ชันดึงข้อมูลโปรไฟล์ผู้ใช้จาก Cache
  const getUserProfile = useCallback(async (user) => {
    if (!user) return null;

    const cacheKey = user.id;
    if (userProfileCache.current.has(cacheKey)) {
      return userProfileCache.current.get(cacheKey);
    }

    try {
      const { data: baseProfile, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      if (!baseProfile) return null;

      let enrichedProfile = baseProfile;

      if (baseProfile.role === "student") {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, student_id")
          .eq("user_id", user.id)
          .single();

        if (studentError) {
          console.warn("Could not find student details:", studentError.message);
        } else {
          enrichedProfile = {
            ...baseProfile,
            student_profile_id: studentData?.id,
            student_identifier: studentData?.student_id,
          };
        }
      }

      userProfileCache.current.set(cacheKey, enrichedProfile);
      return enrichedProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      clearAuthData();
      await supabase.auth.signOut();
      return null;
    }
  }, [clearAuthData]);

  // การจัดการการเปลี่ยนแปลงของ Auth State
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setLoading(true);

      if (event === 'SIGNED_OUT') {
        clearAuthData();
        setLoading(false);
        return;
      }

      if (currentSession?.user) {
        const profile = await getUserProfile(currentSession.user);
        setSession(currentSession);
        setUserProfile(profile);
      } else {
        clearAuthData();
      }

      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [getUserProfile, clearAuthData]);

  const value = {
    session,
    userProfile,
    loading,
    user: session?.user,
    role: userProfile?.role,
    studentId: userProfile?.student_profile_id || null,
    refreshUserProfile: clearAuthData,
    clearAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
