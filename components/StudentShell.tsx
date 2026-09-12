"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileOption } from "@/components/ProfileOption";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SiteFooter } from "@/components/SiteFooter";

export function StudentShell({ children }: { children: React.ReactNode }) {
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
      <Sidebar />
      
      {/* Mobile Top-Right Header Actions: Notification Bell + Profile Option */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2.5 md:hidden">
        <NotificationBell />
        <ProfileOption />
      </div>

      <main className="min-w-0 flex-1 pl-0 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0 flex flex-col justify-between">
        <div>
          {platform.announcementEnabled && platform.announcementText && (
            <div className="border-b border-cyan/30 bg-cyan/10 px-4 py-2 text-center text-xs font-semibold text-cyan">
              {platform.announcementText}
            </div>
          )}
          {children}
        </div>
        <SiteFooter />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

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
