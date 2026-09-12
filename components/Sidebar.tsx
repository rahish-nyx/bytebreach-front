"use client";

import { BookOpen, Flame, LayoutDashboard, LogOut, Settings, Terminal, Trophy, Library } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";
import { getRankTier } from "@/src/lib/ranks";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { name, profile, isAdmin } = useUserProfile();
  const displayName = name || user?.displayName || "Operative";
  const initials = displayName.slice(0, 2).toUpperCase();

  const currentXp = profile?.xp ?? (user as any)?.xp ?? 0;
  const currentTier = getRankTier(currentXp);

  let rankPercentage = 0;
  if (currentXp <= 0) {
    rankPercentage = 0;
  } else if (currentTier.maxXp === null) {
    rankPercentage = 100;
  } else {
    const tierSpan = currentTier.maxXp - currentTier.minXp + 1;
    const progressInTier = currentXp - currentTier.minXp;
    rankPercentage = Math.min(100, Math.max(0, Math.round((progressInTier / tierSpan) * 100)));
  }

  const handleSignOut = async () => {
    window.localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
    if (user) await logout();
    router.replace("/login");
  };

  const currentPath = pathname || "";
  const links = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" as Route },
    { label: "Learning paths", icon: BookOpen, href: "/learning-paths" as Route },
    { label: "Practice labs", icon: Terminal, href: "/practice-labs" as Route },
    { label: "Cheats & resources", icon: Library, href: "/resources" as Route },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard" as Route }
  ];

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden md:flex md:w-[260px] md:shrink-0 md:flex-col md:border-r md:border-line md:bg-[#0b1018] md:px-5 md:py-6 md:overflow-visible md:relative md:min-h-screen"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ByteBreachLogo size={36} className="shrink-0" />
          <div>
            <div className="font-bold tracking-tight">
              BYTE<span className="text-cyan">BREACH</span>
            </div>
            <div className="text-[9px] uppercase tracking-[.22em] text-muted">
              Security academy
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 mb-3 px-3 eyebrow">Workspace</div>
      <nav className="space-y-1">
        {links.map(({ label, icon: Icon, href }) => {
          const active = currentPath === href || (href !== "/" && currentPath.startsWith(href));
          const targetHref = !user && !isAdmin && href !== "/"
            ? (`/login?redirect=${encodeURIComponent(href)}` as Route)
            : href;

          return (
            <Link
              key={label}
              href={targetHref}
              aria-label={label}
              className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active ? "bg-cyan/10 text-cyan" : "text-muted hover:bg-white/[.04] hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_#22d3ee]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-9 mb-3 px-3 eyebrow">Your progress</div>
      <div className="rounded-2xl border border-line bg-panel p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted">Current rank</div>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full border border-cyan-500/40 bg-slate-900/60 px-2.5 py-0.5 text-xs font-medium text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                {currentTier.name}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-muted">{currentXp} XP</div>
          </div>
          <Flame className="text-amber" size={20} />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-amber transition-all duration-300"
            style={{ width: `${rankPercentage}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-muted">Keep learning to rank up</div>
      </div>

      <div className="mt-auto pt-10">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted hover:bg-white/[.04] hover:text-white"
          >
            <Settings size={18} /> Admin console
          </Link>
        )}
        {user ? (
          <>
            <Link
              href="/profile"
              className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/[.04] hover:text-white"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-[10px] font-bold text-ink">
                {initials}
              </span>
              <span className="min-w-0 truncate">{displayName}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-muted hover:bg-white/[.04] hover:text-white"
            >
              <LogOut size={18} /> Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm text-cyan hover:bg-cyan/10"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
