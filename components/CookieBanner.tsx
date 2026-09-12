"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a cookie choice
    const consent = localStorage.getItem("bytebreach_cookie_consent");
    if (!consent) {
      // Small timeout for smooth entrance animation
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("bytebreach_cookie_consent", "accepted");
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("bytebreach_cookie_consent", "dismissed");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie Consent Banner"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-40 rounded-2xl border border-cyan/40 bg-[#070d17]/95 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan">
          <Cookie size={18} />
        </div>
        <div className="flex-1 text-xs leading-5 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-cyan" /> Cookie & Advertising Transparency
            </span>
            <button
              onClick={handleDismiss}
              aria-label="Close cookie banner"
              className="text-muted hover:text-white p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            ByteBreach uses essential session tokens and partners with Google AdSense to serve relevant advertisements. Review our{" "}
            <Link href="/privacy" className="text-cyan underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/cookies" className="text-cyan underline">
              Cookie Policy
            </Link>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-bold text-ink shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:opacity-95 transition"
            >
              Accept All
            </button>
            <Link
              href="/cookies"
              onClick={handleDismiss}
              className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white transition"
            >
              Manage Preferences
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
