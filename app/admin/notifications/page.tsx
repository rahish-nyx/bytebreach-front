"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Send,
  Pencil,
  Trash2,
  Ban,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Radio,
  Search,
  CheckCircle2
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { createRecord } from "@/lib/firestore";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  status: "active" | "aborted" | "delivered";
  target?: string;
  createdAt: string;
  updatedAt?: string;
};

export default function NotificationsPage() {
  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  // Alerts List State
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "aborted" | "delivered">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "abort" | "delete";
    alertId: string;
    alertTitle: string;
  }>({
    open: false,
    type: "abort",
    alertId: "",
    alertTitle: ""
  });
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoadingAlerts(true);
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.notifications || [];
        setAlerts(items);
      } else {
        console.error("Failed to load notifications list");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  // Auto-dismiss notification feedback toast
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  // Broadcast Submission
  const handleSend = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) return;

    setIsSending(true);
    setSentMessage("");
    setWarningMessage("");

    const notification = {
      title: cleanTitle,
      body: cleanBody,
      target: "all",
      status: "active",
      createdAt: new Date()
    };

    try {
      await createRecord("notifications", notification);

      try {
        const response = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notification)
        });

        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setWarningMessage(result.error || "Push delivery service is offline.");
        }
      } catch {
        setWarningMessage("Broadcast saved, but push delivery is currently unavailable.");
      }

      setSentMessage("Broadcast successfully created and published.");
      setTitle("");
      setBody("");
      await fetchAlerts();
    } catch (err) {
      setWarningMessage(err instanceof Error ? err.message : "Failed to record broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  // Start Inline Edit
  const startEdit = (alert: NotificationItem) => {
    setEditingId(alert.id);
    setEditTitle(alert.title);
    setEditBody(alert.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };

  // Save Inline Edit
  const saveEdit = async (alertId: string) => {
    if (!editTitle.trim() || !editBody.trim()) {
      setActionFeedback({ type: "error", text: "Title and body cannot be empty." });
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/admin/notifications/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          title: editTitle.trim(),
          body: editBody.trim()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update alert");
      }

      setActionFeedback({ type: "success", text: "Alert content updated successfully." });
      cancelEdit();
      await fetchAlerts();
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update alert."
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Execute Abort
  const executeAbort = async (alertId: string) => {
    try {
      setIsActionPending(true);
      const res = await fetch(`/api/admin/notifications/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abort" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to abort alert");
      }

      setActionFeedback({ type: "success", text: "Alert marked as aborted." });
      setConfirmModal({ open: false, type: "abort", alertId: "", alertTitle: "" });
      await fetchAlerts();
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to abort alert."
      });
    } finally {
      setIsActionPending(false);
    }
  };

  // Execute Delete
  const executeDelete = async (alertId: string) => {
    try {
      setIsActionPending(true);
      const res = await fetch(`/api/admin/notifications/${alertId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete alert");
      }

      setActionFeedback({ type: "success", text: "Alert deleted permanently." });
      setConfirmModal({ open: false, type: "delete", alertId: "", alertTitle: "" });
      await fetchAlerts();
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete alert."
      });
    } finally {
      setIsActionPending(false);
    }
  };

  // Filtered Alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesFilter = filter === "all" || alert.status === filter;
    const matchesSearch =
      !searchQuery.trim() ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const abortedCount = alerts.filter((a) => a.status === "aborted").length;
  const deliveredCount = alerts.filter((a) => a.status === "delivered").length;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="eyebrow text-cyan">Command center / broadcasts</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Notifications & Broadcasts
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Transmit real-time system alerts to operatives and control active platform broadcasts.
          </p>
        </div>
        <button
          onClick={() => void fetchAlerts()}
          disabled={isLoadingAlerts}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoadingAlerts ? "animate-spin text-cyan" : ""} />
          Sync live alerts
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {actionFeedback && (
        <div
          className={`mt-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-semibold backdrop-blur ${
            actionFeedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
              : "border-red-500/40 bg-red-950/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={16} className="text-red-400" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#0a0f19] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Alerts
            </span>
            <Radio size={16} className="text-cyan" />
          </div>
          <div className="mt-3 text-2xl font-black text-white">{alerts.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Stored in system registry</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#0a0f19] p-5 shadow-[0_0_15px_rgba(16,185,129,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Active Alerts
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-300">{activeCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Currently live on operative devices</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#0a0f19] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Aborted
            </span>
            <Ban size={16} className="text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-300">{abortedCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Cancelled from dispatch queue</div>
        </div>
      </div>

      {/* Create Broadcast Form */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-[#090e17] p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Transmit New Broadcast</h2>
            <p className="text-xs text-slate-400">
              Create a persistent notification record and trigger immediate FCM multicast delivery.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Broadcast Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Critical Security Briefing: Zero-Day Protocol"
              className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Payload Message Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter instructions, incident summary, or announcement details..."
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Target: <span className="font-mono text-cyan">all operatives & registered tokens</span>
            </span>
            <button
              onClick={handleSend}
              disabled={isSending || !title.trim() || !body.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition hover:from-violet-500 hover:to-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {isSending ? "Broadcasting..." : "Dispatch Broadcast"}
            </button>
          </div>

          {sentMessage && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3.5 py-2 text-xs font-semibold text-cyan">
              ✓ {sentMessage}
            </div>
          )}
          {warningMessage && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-2 text-xs font-semibold text-amber-300">
              ⚠ {warningMessage}
            </div>
          )}
        </div>
      </div>

      {/* Active Platform Alerts Table Card */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-[#090e17] shadow-xl">
        {/* Table Header Controls */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800/80 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white">Active Platform Alerts</h2>
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan">
                {alerts.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Live alert registry. Manage status, inline edit payload content, or terminate active deliveries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts..."
                className="w-44 rounded-xl border border-slate-700 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400 sm:w-56"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-950/90 p-1">
              {(["all", "active", "aborted", "delivered"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                    filter === tab
                      ? "bg-slate-800 text-cyan shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Title & Payload</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoadingAlerts ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <RefreshCw size={18} className="mx-auto animate-spin text-cyan mb-2" />
                    Loading alert registry...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    No platform alerts found matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isEditing = editingId === alert.id;

                  return (
                    <tr
                      key={alert.id}
                      className={`transition hover:bg-white/[0.02] ${
                        isEditing ? "bg-cyan-950/10 border-l-2 border-l-cyan-400" : ""
                      }`}
                    >
                      {/* Title & Payload Column */}
                      <td className="max-w-md px-5 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Alert title"
                              className="w-full rounded-lg border border-cyan-500/50 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              placeholder="Payload body"
                              rows={2}
                              className="w-full rounded-lg border border-cyan-500/50 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100">{alert.title}</span>
                              <span className="rounded border border-slate-700/60 bg-slate-800/40 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                                {alert.target || "all"}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-slate-400 leading-relaxed">
                              {alert.body}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {alert.status === "active" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                            active
                          </span>
                        )}
                        {alert.status === "aborted" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                            <Ban size={10} />
                            aborted
                          </span>
                        )}
                        {alert.status === "delivered" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            delivered
                          </span>
                        )}
                      </td>

                      {/* Timestamp Column */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-[11px]">
                        <div>{formatDate(alert.createdAt)}</div>
                        {alert.updatedAt && (
                          <div className="mt-0.5 text-[10px] text-slate-500 italic">
                            Edited: {formatDate(alert.updatedAt)}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => void saveEdit(alert.id)}
                              disabled={isSavingEdit}
                              title="Save Changes"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              <Check size={13} />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={isSavingEdit}
                              title="Cancel"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                            >
                              <X size={13} />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Abort button: only shown when active */}
                            {alert.status === "active" && (
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    type: "abort",
                                    alertId: alert.id,
                                    alertTitle: alert.title
                                  })
                                }
                                title="Abort active alert delivery"
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 hover:border-amber-500/50"
                              >
                                <Ban size={12} />
                                Abort
                              </button>
                            )}

                            {/* Edit button */}
                            <button
                              onClick={() => startEdit(alert)}
                              title="Edit alert title & body"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  open: true,
                                  type: "delete",
                                  alertId: alert.id,
                                  alertTitle: alert.title
                                })
                              }
                              title="Delete alert permanently"
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:border-red-500/50"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c121d] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  confirmModal.type === "abort"
                    ? "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border border-red-500/40 bg-red-500/10 text-red-400"
                }`}
              >
                {confirmModal.type === "abort" ? <AlertTriangle size={20} /> : <Trash2 size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {confirmModal.type === "abort" ? "Abort Platform Alert?" : "Delete Platform Alert?"}
                </h3>
                <p className="text-xs text-slate-400">Action confirmation required</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              {confirmModal.type === "abort"
                ? `Are you sure you want to abort "${confirmModal.alertTitle}"? Active background listeners and device feeds will cease dispatching this notification.`
                : `Are you sure you want to permanently delete "${confirmModal.alertTitle}"? This cannot be undone and will remove the document from Firestore.`}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() =>
                  setConfirmModal({ open: false, type: "abort", alertId: "", alertTitle: "" })
                }
                disabled={isActionPending}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmModal.type === "abort"
                    ? void executeAbort(confirmModal.alertId)
                    : void executeDelete(confirmModal.alertId)
                }
                disabled={isActionPending}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-50 ${
                  confirmModal.type === "abort"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                    : "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                }`}
              >
                {isActionPending && <RefreshCw size={13} className="animate-spin" />}
                {confirmModal.type === "abort" ? "Confirm Abort" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
