"use client";

import { BookOpen, Flame, LayoutDashboard, LogOut, Settings, Terminal, Trophy, X, Library } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";
import { getRankTier } from "@/src/lib/ranks";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
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
    { label: "Overview", icon: LayoutDashboard, href: "/" as Route },
    { label: "Learning paths", icon: BookOpen, href: "/learning-paths" as Route },
    { label: "Practice labs", icon: Terminal, href: "/practice-labs" as Route },
    { label: "Cheats & resources", icon: Library, href: "/resources" as Route },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard" as Route }
  ];
  return <aside aria-label="Primary navigation" aria-expanded={mobileOpen} className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-line bg-[#0b1018] py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-[width] md:relative md:inset-y-auto md:z-auto md:w-[260px] md:overflow-visible md:px-5 md:py-6 ${mobileOpen ? "w-[min(78vw,260px)] px-4" : "w-14 px-2"}`}>
    <div className={`flex items-center ${mobileOpen ? "justify-between" : "justify-center"} md:justify-between`}><div className="flex items-center gap-3"><ByteBreachLogo size={36} className="shrink-0" /><div className={`${mobileOpen ? "" : "hidden"} md:block`}><div className="font-bold tracking-tight">BYTE<span className="text-cyan">BREACH</span></div><div className="text-[9px] uppercase tracking-[.22em] text-muted">Security academy</div></div></div><button onClick={onClose} aria-label="Collapse workspace menu" className={`${mobileOpen ? "" : "hidden"} text-muted md:hidden`}><X size={18}/></button></div>
    <div className={`${mobileOpen ? "" : "hidden"} mt-10 mb-3 px-3 eyebrow md:block`}>Workspace</div>
    <nav className="mt-8 space-y-1 md:mt-0">{links.map(({ label, icon: Icon, href }) => { const active = currentPath === href || (href !== "/" && currentPath.startsWith(href)); const targetHref = !user && !isAdmin && href !== "/" ? (`/login?redirect=${encodeURIComponent(href)}` as Route) : href; return <Link key={label} href={targetHref} onClick={onClose} aria-label={label} title={mobileOpen ? undefined : label} className={`relative flex min-h-11 items-center rounded-xl px-3 py-3 text-sm font-medium transition ${mobileOpen ? "gap-3" : "justify-center"} ${active ? "bg-cyan/10 text-cyan" : "text-muted hover:bg-white/[.04] hover:text-white"}`}><Icon size={18}/><span className={`${mobileOpen ? "" : "hidden"} md:inline`}>{label}</span>{active && <span className={`${mobileOpen ? "ml-auto" : "absolute left-0"} h-1.5 w-1.5 rounded-full bg-cyan`} />}</Link>; })}</nav>
    <div className={`${mobileOpen ? "" : "hidden"} mt-9 mb-3 px-3 eyebrow md:block`}>Your progress</div>
    <div className={`${mobileOpen ? "" : "hidden"} rounded-2xl border border-line bg-panel p-4 md:block`}><div className="flex items-start justify-between"><div><div className="text-xs text-muted">Current rank</div><div className="mt-1"><span className="inline-flex items-center rounded-full border border-cyan-500/40 bg-slate-900/60 px-2.5 py-0.5 text-xs font-medium text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]">{currentTier.name}</span></div><div className="mt-2 text-[11px] text-muted">{currentXp} XP</div></div><Flame className="text-amber" size={20}/></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-amber transition-all duration-300" style={{ width: `${rankPercentage}%` }}/></div><div className="mt-2 text-[11px] text-muted">Keep learning to rank up</div></div>
    <div className={`${mobileOpen ? "" : "hidden"} mt-auto pt-10 md:block`}>{isAdmin && <Link href="/admin" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted hover:bg-white/[.04] hover:text-white"><Settings size={18}/> Admin console</Link>}{user ? <><Link href="/profile" onClick={onClose} className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/[.04] hover:text-white"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-[10px] font-bold text-ink">{initials}</span><span className="min-w-0 truncate">{displayName}</span></Link><button onClick={handleSignOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-muted hover:bg-white/[.04] hover:text-white"><LogOut size={18}/> Sign out</button></> : <Link href="/login" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm text-cyan hover:bg-cyan/10">Sign in</Link>}</div>
    {/* Mini profile avatar for collapsed mobile rail */}
    {!mobileOpen && (
      <div className="mt-auto pb-4 flex justify-center w-full md:hidden">
        <Link
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/40 bg-[#38bdf8] text-[#081225] text-xs font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)] hover:scale-105 transition-all"
          href={user ? "/profile" : "/login"}
          title={user ? "Operative Profile" : "Sign In"}
        >
          {user ? initials : "?"}
        </Link>
      </div>
    )}
  </aside>;
}
