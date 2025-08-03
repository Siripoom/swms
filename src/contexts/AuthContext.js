"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { supabase } from "@/config/supabase";

const AuthContext = createContext({
  session: null,
  userProfile: null,
  loading: true,
  user: null,
  role: null,
  studentId: null,
  refreshUserProfile: null,
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialLoadComplete = useRef(false);
  const userProfileCache = useRef(new Map());

  // Memoized profile fetcher
  const getUserProfile = useCallback(async (user) => {
    if (!user) return null;

    // Check cache first
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

      if (userError) {
        console.error(
          "AuthContext: Error fetching user profile:",
          userError.message
        );
        throw userError;
      }

      if (!baseProfile) return null;

      let enrichedProfile = baseProfile;

      if (baseProfile.role === "student") {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, student_id")
          .eq("user_id", user.id)
          .single();

        if (studentError) {
          console.warn(
            "AuthContext: Could not find student details for user:",
            user.id,
            studentError.message
          );
        } else {
          enrichedProfile = {
            ...baseProfile,
            student_profile_id: studentData?.id,
            student_identifier: studentData?.student_id,
          };
        }
      }

      // Cache the result
      userProfileCache.current.set(cacheKey, enrichedProfile);

      return enrichedProfile;
    } catch (e) {
      console.error(
        "AuthContext: Exception in getUserProfile. Signing out...",
        e
      );
      await supabase.auth.signOut();
      return null;
    }
  }, []);

  // Refresh function to clear cache and refetch
  const refreshUserProfile = useCallback(async () => {
    if (session?.user) {
      userProfileCache.current.delete(session.user.id);
      const profile = await getUserProfile(session.user);
      setUserProfile(profile);
    }
  }, [session?.user, getUserProfile]);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      const hasUserChanged = currentSession?.user?.id !== session?.user?.id;
      if (!hasUserChanged && initialLoadComplete.current) {
        return;
      }

      setLoading(true);

      if (currentSession?.user) {
        const profile = await getUserProfile(currentSession.user);
        if (mounted) {
          setSession(currentSession);
          setUserProfile(profile);
        }
      } else {
        if (mounted) {
          setSession(null);
          setUserProfile(null);
          userProfileCache.current.clear();
        }
      }

      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [session?.user?.id, getUserProfile]);

  const value = {
    session,
    userProfile,
    loading,
    user: session?.user,
    role: userProfile?.role,
    studentId: userProfile?.student_profile_id || null,
    refreshUserProfile,
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
