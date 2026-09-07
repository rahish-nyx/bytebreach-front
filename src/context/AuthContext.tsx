"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut,
  type User
} from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { updateUserActivity } from "@/lib/activity";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence);
    const isLocalAdmin =
      typeof window !== "undefined" &&
      window.localStorage.getItem("bytebreach-local-admin") === "true";

    if (isLocalAdmin) {
      document.cookie = "bb_session=1; path=/; max-age=2592000; SameSite=Lax";
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        document.cookie = "bb_session=1; path=/; max-age=2592000; SameSite=Lax";
        void updateUserActivity(nextUser.uid);
      } else if (!isLocalAdmin) {
        document.cookie = "bb_session=; path=/; max-age=0; SameSite=Lax";
      }
    });
  }, []);

  const logout = async () => {
    if (typeof window !== "undefined") {
      document.cookie = "bb_session=; path=/; max-age=0; SameSite=Lax";
      window.localStorage.removeItem("bytebreach-local-admin");
    }
    await signOut(auth);
  };

  const value = useMemo(
    () => ({ user, loading, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
