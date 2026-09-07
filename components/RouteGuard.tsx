"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";

const PUBLIC_ROUTES = [
  "/",
  "/overview",
  "/login",
  "/about",
  "/contact",
  "/contacts",
  "/faq",
  "/terms",
  "/disclaimer",
  "/privacy",
  "/cookies",
  "/careers"
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.includes(".")) return true; // Static assets like .ico, .svg, .png, .jpg
  return false;
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user, loading } = useAuth();
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalAdmin(window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true");
    }
  }, [user]);

  const isPublic = isPublicRoute(pathname);
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthenticated = Boolean(user || isLocalAdmin);

  useEffect(() => {
    // Whitelisted public routes and admin routes (managed by AdminGuard) pass through
    if (isPublic || isAdminRoute) return;

    if (!loading && !isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl as any);
    }
  }, [loading, isAuthenticated, isPublic, isAdminRoute, pathname, router]);

  // If public or admin route, pass through directly
  if (isPublic || isAdminRoute) {
    return <>{children}</>;
  }

  // If loading authentication state, display cyber verification indicator
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080b12] text-sm text-muted">
        <div className="flex flex-col items-center gap-4">
          <ByteBreachLogo size={56} animated={true} />
          <div className="eyebrow font-mono text-[10px] tracking-widest text-cyan">
            VERIFYING OPERATIVE CLEARANCE...
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated on protected route, show redirect indicator
  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080b12] text-sm text-muted">
        <div className="flex flex-col items-center gap-4">
          <ByteBreachLogo size={56} animated={true} />
          <div className="eyebrow font-mono text-[10px] tracking-widest text-amber-400">
            AUTHENTICATION REQUIRED · REDIRECTING TO SECURE ACCESS...
          </div>
        </div>
      </div>
    );
  }

  // Authenticated operative: grant full workspace access
  return <>{children}</>;
}
