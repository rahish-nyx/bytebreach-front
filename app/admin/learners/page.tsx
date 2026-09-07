"use client";

import { collection, deleteDoc, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BookOpen, Check, Copy, Minus, Pencil, Plus, Save, Shield, Trophy } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { db } from "@/lib/firebaseConfig";
import { updateRecord } from "@/lib/firestore";
import { getRankTier } from "@/src/lib/ranks";

type Learner = { id: string; handle?: string; displayName?: string; email?: string; xp?: number; rank?: string; completedLabs?: number; role?: string; emergencyCode?: string };
type Activity = { id: string; type?: string; moduleId?: string; labId?: string; points?: number; createdAt?: unknown };

export default function LearnersPage() {
  const [users, setUsers] = useState<Learner[]>([]);
  const [selected, setSelected] = useState<Learner | null>(null);
  const [xpValue, setXpValue] = useState("0");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch {
      // Fallback
    }
  };
  useEffect(() => onSnapshot(query(collection(db, "users")), (snap) => setUsers(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Learner)).filter((item) => item.role !== "admin").sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0)))), []);
  useEffect(() => {
    if (!selected) { setActivities([]); return; }
    return onSnapshot(query(collection(db, "submissions"), where("uid", "==", selected.id)), (snap) => setActivities(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Activity))));
  }, [selected]);
  const select = (learner: Learner) => { setSelected(learner); setXpValue(String(learner.xp || 0)); setSaved(false); };
  const saveXp = async () => {
    if (!selected) return;
    const xp = Math.max(0, Number(xpValue) || 0);
    const rank = getRankTier(xp).name;
    await updateRecord("users", selected.id, { xp, rank });
    setSelected({ ...selected, xp, rank });
    setSaved(true);
  };
  const adjustXp = (amount: number) => setXpValue(String(Math.max(0, (Number(xpValue) || 0) + amount)));
  const deleteLearner = async () => {
    if (!selected) return;
    const deleted = selected;
    const [activity, daily, labs] = await Promise.all([
      getDocs(query(collection(db, "submissions"), where("uid", "==", deleted.id))),
      getDocs(query(collection(db, "dailySubmissions"), where("userId", "==", deleted.id))),
      getDocs(query(collection(db, "labSubmissions"), where("userId", "==", deleted.id)))
    ]);
    await Promise.all([...activity.docs, ...daily.docs, ...labs.docs].map((item) => deleteDoc(item.ref)));
    await deleteDoc(doc(db, "users", deleted.id));
    setSelected(null);
    setConfirmDelete(false);
    setToast(`Operative ${deleted.handle || deleted.email || deleted.id} purged from ByteBreach database.`);
    window.setTimeout(() => setToast(""), 5000);
  };
  return <AdminShell>{toast && <div className="fixed right-5 top-5 z-50 rounded-xl border border-cyan/40 bg-panel px-4 py-3 text-xs text-cyan shadow-2xl">{toast}</div>}{confirmDelete && selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-panel p-6 shadow-2xl"><h2 className="text-lg font-bold text-red-300">Purge operative?</h2><p className="mt-3 text-sm leading-6 text-muted">Are you sure you want to delete operative {selected.handle || selected.email}? This action will permanently remove their profile, completed labs, and XP records.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setConfirmDelete(false)} className="rounded-xl border border-line px-4 py-2.5 text-xs text-muted">Cancel</button><button onClick={() => void deleteLearner()} className="rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white">Confirm</button></div></div></div>}<div className="eyebrow text-cyan">Command center / people</div><h1 className="mt-2 text-3xl font-bold">Learners</h1><p className="mt-2 text-sm text-muted">View every registered operative, learning activity, XP, and live rank. Administrators can correct XP and rank progression.</p><div className="mt-8 grid gap-5 xl:grid-cols-[1fr_420px]"><section className="overflow-hidden rounded-2xl border border-line bg-panel">{users.length ? users.map((learner) => { const tier = getRankTier(Number(learner.xp || 0)); return <button key={learner.id} onClick={() => select(learner)} className={`flex w-full items-center gap-4 border-b border-line p-4 text-left last:border-0 hover:bg-white/[.03] ${selected?.id === learner.id ? "bg-cyan/[.06]" : ""}`}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">{String(learner.handle || learner.displayName || learner.email || "OP").slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate font-medium">{learner.handle || learner.displayName || "Operative"}</div><div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] ${tier.badgeColor}`}>{tier.name}</div></div><div className="text-right text-xs"><div className="font-bold text-cyan">{learner.xp || 0} XP</div><div className="text-muted">{learner.completedLabs || 0} labs</div></div></button>; }) : <div className="p-8 text-center text-sm text-muted">No registered students found.</div>}</section>{selected ? <section className="rounded-2xl border border-line bg-panel p-5"><div className="flex items-start justify-between gap-3"><div><div className="eyebrow text-cyan">Learner profile</div><h2 className="mt-1 text-xl font-bold">{selected.handle || selected.displayName || "Operative"}</h2><p className="mt-1 text-xs text-muted">{selected.email || selected.id}</p><div className="mt-2.5 flex flex-wrap items-center gap-2"><span className="text-xs text-muted font-medium">Emergency Pass Code:</span>{selected.emergencyCode ? <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-bold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"><span>{selected.emergencyCode}</span><button type="button" onClick={() => copyCode(selected.emergencyCode!)} title="Copy Emergency Pass Code" className="text-amber-400 hover:text-amber-200 transition-colors">{copiedCode === selected.emergencyCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}</button></div> : <span className="text-xs italic text-muted">Not assigned</span>}</div></div><div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-xs font-bold text-ink">{String(selected.handle || selected.email || "OP").slice(0, 2).toUpperCase()}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-[#0b1018] p-4"><Trophy size={16} className="text-amber"/><div className="mt-3 text-2xl font-bold">{selected.xp || 0}</div><div className="text-xs text-muted">Current XP</div></div><div className="rounded-xl border border-line bg-[#0b1018] p-4"><Shield size={16} className="text-cyan"/><div className={`mt-3 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRankTier(Number(xpValue) || 0).badgeColor}`}>{getRankTier(Number(xpValue) || 0).name}</div><div className="mt-1 text-xs text-muted">Automatic rank tier</div></div></div><div className="mt-5"><label className="text-xs font-semibold">Adjust XP / level</label><div className="mt-2 flex gap-2"><button onClick={() => adjustXp(-50)} className="grid h-11 w-11 place-items-center rounded-xl border border-line text-muted hover:text-white"><Minus size={15}/></button><input value={xpValue} onChange={(event) => setXpValue(event.target.value)} type="number" min="0" className="field min-w-0 flex-1 text-center font-bold"/><button onClick={() => adjustXp(50)} className="grid h-11 w-11 place-items-center rounded-xl border border-line text-muted hover:text-white"><Plus size={15}/></button></div>  <button onClick={() => void saveXp()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-xs font-bold text-ink"><Save size={15}/> Save XP and update rank</button><button onClick={() => setConfirmDelete(true)} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-red-500/40 px-4 py-3 text-xs font-bold text-red-300 hover:bg-red-500/10">Delete Operative</button>{saved && <div className="mt-2 text-center text-xs text-cyan">Learner progression updated.</div>}</div><div className="mt-6 border-t border-line pt-5"><div className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} className="text-violet"/> Tracks and module learning</div><div className="mt-3 space-y-2">{activities.length ? activities.map((activity) => <div key={activity.id} className="flex items-center justify-between rounded-xl bg-[#0b1018] p-3 text-xs"><span>{activity.type === "lab" ? `Lab: ${activity.labId}` : `Module: ${activity.moduleId}`}</span><span className="text-cyan">+{activity.points || 0} XP</span></div>) : <div className="text-xs text-muted">No module or lab activity recorded yet.</div>}</div></div></section> : <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted"><div><Pencil className="mx-auto mb-3 text-cyan" size={24}/>Select a learner to inspect and manage their profile.</div></section>}</div></AdminShell>;
}
