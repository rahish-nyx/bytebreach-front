"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platform, setPlatform] = useState<{ maintenanceMode?: boolean; announcementEnabled?: boolean; announcementText?: string }>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(typeof window !== "undefined" && window.localStorage.getItem("bytebreach-local-admin") === "true");
    void fetch("/api/settings/public", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then(setPlatform)
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && (
        <button
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
      <div className="fixed right-4 top-4 z-20 flex items-center gap-2 md:hidden">
        <NotificationBell />
        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="flex md:hidden items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition border border-line bg-panel/90 shadow-lg backdrop-blur"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <main className="min-w-0 flex-1 pl-14 md:pl-0">
        {platform.announcementEnabled && platform.announcementText && (
          <div className="border-b border-cyan/30 bg-cyan/10 px-4 py-2 text-center text-xs font-semibold text-cyan">
            {platform.announcementText}
          </div>
        )}
        {children}
      </main>
      {platform.maintenanceMode && !isAdmin && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#050911]/95 p-6 text-center backdrop-blur-md">
          <div className="max-w-lg rounded-2xl border border-cyan/40 bg-panel p-8 shadow-2xl">
            <div className="eyebrow text-cyan">ByteBreach operations</div>
            <h1 className="mt-3 text-3xl font-bold">Platform Under Scheduled Maintenance</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              The academy is temporarily offline while our operators deploy updates. Please return shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
