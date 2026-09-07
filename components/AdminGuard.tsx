"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { getUserProfile } from "@/lib/firestore";
import { LOCAL_ADMIN_SESSION_KEY, PRIMARY_ADMIN_EMAIL } from "@/lib/demoAuth";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      router.replace("/login?error=unauthorized");
      return;
    }
    if (window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true") {
      setAllowed(true);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login?error=unauthorized");
        return;
      }
      if (process.env.NODE_ENV !== "production" && user.email === PRIMARY_ADMIN_EMAIL) {
        setAllowed(true);
        return;
      }
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role !== "admin") {
          router.replace("/login?error=unauthorized");
          return;
        }
        setAllowed(true);
      } catch {
        router.replace("/login?error=unauthorized");
      }
    });
  }, [router]);

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080b12] text-sm text-muted">
        <div className="flex flex-col items-center gap-4">
          <ByteBreachLogo size={64} animated={true} />
          <div className="eyebrow text-cyan font-mono text-[10px] tracking-widest">
            AUTHENTICATING ADMINISTRATIVE ACCESS
          </div>
        </div>
      </div>
    );
  }
  return children;
}
