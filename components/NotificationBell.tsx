"use client";

import { Bell, Check, X } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, requestNotificationPermission, markRead, dismiss, error, setError } = useNotifications();
  const enable = async () => {
    try {
      setError("");
      await requestNotificationPermission();
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Push alerts could not be enabled.");
    }
  };
  return <div className="relative">
    <button aria-label="Open notifications" onClick={() => setOpen((value) => !value)} className="relative grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-white/[.05] hover:text-white"><Bell size={18}/>{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-cyan px-1 text-[9px] font-bold text-ink">{unreadCount > 9 ? "9+" : unreadCount}</span>}</button>
    {open && <div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-[#0d141e] shadow-2xl">
      <div className="flex items-center justify-between border-b border-line p-4"><div><div className="text-sm font-semibold">Notifications</div><div className="text-[11px] text-muted">{unreadCount ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}` : "All caught up"}</div></div><button onClick={() => setOpen(false)} aria-label="Close notifications"><X size={16}/></button></div>
      <div className="max-h-72 overflow-y-auto">{notifications.length ? notifications.slice(0, 10).map((notification) => <div key={notification.id} className={`flex gap-3 border-b border-line p-4 hover:bg-white/[.03] ${notification.readBy?.length ? "opacity-60" : ""}`}><button onClick={() => void markRead(notification)} className="flex min-w-0 flex-1 gap-3 text-left"><Bell size={15} className="mt-0.5 shrink-0 text-cyan"/><span className="min-w-0"><span className="block text-xs font-semibold">{notification.title || "ByteBreach alert"}</span><span className="mt-1 block text-xs leading-5 text-muted">{notification.body}</span></span>{notification.readBy?.length ? <Check size={14} className="shrink-0 text-cyan"/> : null}</button><button onClick={() => void dismiss(notification)} aria-label={`Remove ${notification.title || "notification"}`} className="shrink-0 self-start rounded p-1 text-muted hover:bg-white/[.08] hover:text-white"><X size={14}/></button></div>) : <div className="p-6 text-center text-xs text-muted">No notifications yet.</div>}</div>
      <div className="border-t border-line p-3"><button onClick={() => void enable()} className="w-full rounded-xl bg-cyan px-3 py-2.5 text-xs font-bold text-ink">Enable Push Alerts</button>{error && <div className="mt-2 text-[11px] text-red-300">{error}</div>}</div>
    </div>}
  </div>;
}
