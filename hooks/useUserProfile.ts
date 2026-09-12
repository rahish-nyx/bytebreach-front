"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { LOCAL_ADMIN_SESSION_KEY, PRIMARY_ADMIN_EMAIL } from "@/lib/demoAuth";

export type ProfileData = {
  handle?: string;
  displayName?: string;
  role?: "admin" | "student" | string;
  rank?: string;
  xp?: number;
  streak?: number;
  streakCount?: number;
  learningTimeMinutes?: number;
  totalLearningSeconds?: number;
  completedLabs?: number | string[];
  completedModules?: string[];
  trackXp?: Record<string, number>;
  lastActiveDate?: string;
  emergencyCode?: string;
  emergencyCodeHash?: string;
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    const checkLocalAdmin = () => {
      if (typeof window !== "undefined") {
        setIsLocalAdmin(process.env.NODE_ENV !== "production" && window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true");
      }
    };
    checkLocalAdmin();
    window.addEventListener("storage", checkLocalAdmin);
    return () => window.removeEventListener("storage", checkLocalAdmin);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as ProfileData) : null);
    });
  }, [user]);

  const isPrimaryAdmin =
    process.env.NODE_ENV !== "production" &&
    Boolean(user?.email && user.email === PRIMARY_ADMIN_EMAIL);

  const isAdmin = Boolean(profile?.role === "admin" || isLocalAdmin || isPrimaryAdmin);

  return {
    profile,
    name: profile?.handle || profile?.displayName || user?.displayName || null,
    isAdmin,
    role: profile?.role || (isAdmin ? "admin" : user ? "student" : "guest")
  };
}

