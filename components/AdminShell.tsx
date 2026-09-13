"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Crosshair, FileUp, LayoutDashboard, Settings, Sparkles, Users, MessageSquare, Search } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { NotificationBell } from "@/components/NotificationBell";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";

const links = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/modules", "Tracks & modules", BookOpen],
  ["/admin/learners", "Learners", Users],
  ["/admin/media", "Media library", FileUp],
  ["/admin/notifications", "Notifications", Bell],
  ["/admin/challenge", "Daily challenge", Sparkles],
  ["/admin/practice-labs", "Practice Labs", Crosshair],
  ["/admin/settings", "Settings", Settings],
  ["/admin/contacts", "Contacts & Support", MessageSquare],
  ["/admin/seo", "SEO & Agentic Search", Search]
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = pathname || "";
  return <AdminGuard><div className="grid-bg min-h-screen"><header className="flex min-h-[68px] items-center justify-between border-b border-line px-4 sm:px-6 md:h-[72px] md:px-10"><Link href="/" className="flex min-w-0 items-center gap-3"><ByteBreachLogo size={36} className="shrink-0" /><span className="truncate font-bold">BYTE<span className="text-cyan">BREACH</span> <span className="ml-2 text-xs font-normal text-muted">/ ADMIN</span></span></Link><div className="flex items-center gap-3"><NotificationBell/><Link href="/profile" aria-label="Open profile" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-[10px] font-bold text-ink">AD</Link></div></header><div className="mx-auto flex max-w-[1500px]"><aside className="hidden w-64 shrink-0 border-r border-line p-6 md:block"><div className="eyebrow">Command center</div><nav className="mt-5 space-y-1">{links.map(([href, label, Icon]) => { const active = currentPath === href || (href !== "/admin" && currentPath.startsWith(href)); return <Link href={href} key={href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm ${active ? "bg-cyan/10 text-cyan" : "text-muted hover:text-white"}`}><Icon size={17}/>{label}</Link>; })}</nav></aside><div className="w-full min-w-0"><nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3 md:hidden">{links.map(([href, label]) => <Link href={href} key={href} className={`shrink-0 rounded-lg px-3 py-2 text-xs ${currentPath === href || (href !== "/admin" && currentPath.startsWith(href)) ? "bg-cyan text-ink font-bold" : "bg-panel text-muted"}`}>{label}</Link>)}</nav><main className="min-w-0 p-4 sm:p-6 md:p-10">{children}</main></div></div></div></AdminGuard>;
}
