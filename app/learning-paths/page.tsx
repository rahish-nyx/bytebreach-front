"use client";

import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ChevronRight, Network, Server, Shield, Sparkles } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { StudentShell } from "@/components/StudentShell";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

type Track = { id: string; title?: string; name?: string; level?: string; description?: string; totalModules?: number; moduleCount?: number; icon?: string };
type ModuleItem = { id: string; trackId?: string };

const icons = { network: Network, server: Server, shield: Shield };

export default function LearningPathsPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const { user } = useAuth();
  const { profile } = useUserProfile();

  useEffect(() => onSnapshot(collection(db, "tracks"), (snapshot) => setTracks(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, "modules"), where("published", "==", true)), (snapshot) => setModules(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ModuleItem)))), []);

  const userCompleted = Array.isArray(profile?.completedModules)
    ? profile.completedModules
    : Array.isArray((user as any)?.completedModules)
    ? (user as any).completedModules
    : [];

  return <StudentShell><div className="grid-bg min-h-screen">
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow text-cyan">Workspace / curriculum</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Learning paths</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Choose a specialization, build momentum, and unlock the next room in your route through the breach.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs text-cyan sm:self-auto"><Sparkles size={14}/> Live curriculum</div>
      </div>
      {tracks.length === 0 ? <div className="glass mt-8 rounded-2xl p-8 text-center"><p className="text-sm text-muted">No learning paths are published yet.</p></div> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tracks.map((track) => {
        const Icon = icons[track.icon as keyof typeof icons] || Network;
        const trackModules = modules.filter((m) => m.trackId === track.id);
        const completedCount = trackModules.filter((m) => userCompleted.includes(m.id)).length;
        const totalCount = trackModules.length || Number(track.totalModules || track.moduleCount || 0);
        const pathPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return <Link href={`/learning-paths/${track.id}`} key={track.id} className="glass group relative flex min-h-[285px] flex-col overflow-hidden rounded-2xl p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan/50 hover:shadow-glow sm:p-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan/10 blur-3xl transition group-hover:bg-cyan/20"/>
          <div className="relative flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan/10 text-cyan"><Icon size={22}/></div><span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{track.level || "Self-paced"}</span></div>
          <div className="relative mt-6"><h2 className="text-xl font-semibold">{track.title || track.name || "Untitled path"}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-muted">{track.description || "Explore this learning route."}</p></div>
          <div className="relative mt-auto pt-6"><div className="flex justify-between text-xs text-muted"><span>{completedCount}/{totalCount} modules</span><span className="font-semibold text-cyan">{pathPercentage}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${pathPercentage}%` }}/></div><div className="mt-5 flex items-center gap-1 text-xs font-bold text-cyan">Enter path <ChevronRight size={14} className="transition group-hover:translate-x-1"/></div></div>
        </Link>;
      })}</div>}
    </div>
  </div></StudentShell>;
}
