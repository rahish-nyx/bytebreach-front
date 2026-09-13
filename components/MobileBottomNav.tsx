"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, Library, Terminal, Trophy } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    setIsLocalAdmin(
      typeof window !== "undefined" &&
      window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true"
    );
  }, []);

  const isAuthenticated = Boolean(user || isAdmin || isLocalAdmin);


  const navItems = [
    { label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard, href: "/" as Route, matchExact: true },
    { label: "Learning paths", shortLabel: "Learning", icon: BookOpen, href: "/learning-paths" as Route, matchExact: false },
    { label: "Practice labs", shortLabel: "Labs", icon: Terminal, href: "/practice-labs" as Route, matchExact: false },
    { label: "Cheats & resources", shortLabel: "Resources", icon: Library, href: "/resources" as Route, matchExact: false },
    { label: "Leaderboard", shortLabel: "Ranks", icon: Trophy, href: "/leaderboard" as Route, matchExact: false },
  ];

  const handleProtectedNavigation = (href: Route, e: React.MouseEvent) => {
    if (!isAuthenticated && href !== "/") {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(href)}` as Route);
    }
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-line/80 bg-[#070b13]/95 px-2 pt-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))] backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.7)] md:hidden"
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-5 items-center gap-1">
        {navItems.map(({ label, shortLabel, icon: Icon, href, matchExact }) => {
          const active = matchExact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          const targetHref = !isAuthenticated && href !== "/"
            ? (`/login?redirect=${encodeURIComponent(href)}` as Route)
            : href;

          return (
            <Link
              key={href}
              href={targetHref}
              onClick={(e) => handleProtectedNavigation(href, e)}
              aria-label={label}
              className={`group relative flex flex-col items-center justify-center rounded-xl py-1 px-0.5 text-center transition-all duration-200 active:scale-90 ${
                active ? "text-cyan" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 h-[2.5px] w-7 rounded-full bg-cyan shadow-[0_0_10px_#22d3ee]"
                />
              )}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                  active ? "bg-cyan/15 shadow-[0_0_12px_rgba(34,211,238,0.25)]" : "group-hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-transform duration-200 ${
                    active ? "text-cyan drop-shadow-[0_0_6px_rgba(34,211,238,0.6)] scale-105" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
              </div>
              <span
                className={`mt-0.5 max-w-[64px] truncate text-[10px] tracking-tight ${
                  active ? "font-semibold text-cyan drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]" : "font-medium text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
