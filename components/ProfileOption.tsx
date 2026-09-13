"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";

export function ProfileOption({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { name, isAdmin } = useUserProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLocalAdmin =
    mounted &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true";

  const isAuthenticated = mounted && Boolean(user || isAdmin || isLocalAdmin);
  const displayName = isAuthenticated
    ? (name || user?.displayName || (isLocalAdmin ? "Admin" : "Operative"))
    : "Operative";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={isAuthenticated ? "/profile" : "/login"}
      aria-label={isAuthenticated ? `Open profile for ${displayName}` : "Sign in to ByteBreach"}
      title={isAuthenticated ? `${displayName} · Profile` : "Sign In"}
      suppressHydrationWarning
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-violet to-cyan text-xs font-bold text-ink shadow-[0_0_14px_rgba(56,189,248,0.35)] transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
    >
      {isAuthenticated ? initials : "?"}
    </Link>
  );
}

