"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { BookOpen, ChevronRight, FileUp, Bell, Users, Crosshair } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { db } from "@/lib/firebaseConfig";
import type { Route } from "next";

type Counts = { learners: number; activeStreaks: number; tracks: number; modules: number; labs: number; alerts: number };

export default function AdminPage() {
  const [counts, setCounts] = useState<Counts>({ learners: 0, activeStreaks: 0, tracks: 0, modules: 0, labs: 0, alerts: 0 });
  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "users")), (snap) => {
        const learners = snap.docs.map((item) => item.data()).filter((item) => item.role !== "admin");
        setCounts((current) => ({ ...current, learners: learners.length, activeStreaks: learners.filter((item) => Number(item.streak || 0) > 0).length }));
      }),
      onSnapshot(query(collection(db, "tracks")), (snap) => setCounts((current) => ({ ...current, tracks: snap.size }))),
      onSnapshot(query(collection(db, "modules")), (snap) => setCounts((current) => ({ ...current, modules: snap.size }))),
      onSnapshot(query(collection(db, "labs")), (snap) => setCounts((current) => ({ ...current, labs: snap.docs.filter((item) => item.data().published !== false && item.data().active !== false).length }))),
      onSnapshot(query(collection(db, "notifications")), (snap) => setCounts((current) => ({ ...current, alerts: snap.size }))),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, []);
  return <AdminShell><div className="eyebrow text-cyan">Admin console</div><h1 className="mt-2 text-3xl font-bold">Build the next breach-proof generation.</h1><p className="mt-2 text-sm text-muted">Manage curriculum, learners, media, notifications, and platform settings.</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat href="/admin/learners" label="Active learners" value={`${counts.learners} registered`} detail={`${counts.activeStreaks} with active streaks`} icon={Users}/><Stat href="/admin/modules" label="Content manager" value={`${counts.tracks} tracks · ${counts.modules} modules`} detail={`${counts.labs} active labs`} icon={BookOpen}/><Stat href="/admin/notifications" label="Broadcasts" value="FCM Push Online" detail={`${counts.alerts} active platform alerts`} icon={Bell}/></div><div className="mt-8 grid gap-4 md:grid-cols-2">{[["Tracks & modules","Edit paths, notes, questions, answer keys and publishing.","/admin/modules",BookOpen],["Practice Labs","Author Blogger-style labs and review flag submissions.","/admin/practice-labs",Crosshair],["Learners","Review learner profiles, XP and completion activity.","/admin/learners",Users],["Media library","Manage lab files, cheatsheets and Firebase Storage assets.","/admin/media",FileUp],["Notifications","Prepare broadcasts for all connected students.","/admin/notifications",Bell]].map(([title, description, href, Icon]) => <Link href={href as Route} key={title as string} className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:border-cyan/40"><Icon size={19} className="text-cyan"/><h2 className="mt-4 font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-5 text-muted">{description as string}</p><span className="mt-5 flex items-center gap-1 text-xs font-bold text-cyan">Open workspace <ChevronRight size={14}/></span></Link>)}</div></AdminShell>;
}

function Stat({ href, label, value, detail, icon: Icon }: { href: Route; label: string; value: string; detail: string; icon: typeof Users }) {
  return <Link href={href} className="glass block rounded-2xl p-5 transition hover:-translate-y-1 hover:border-cyan/40"><Icon size={18} className="text-cyan"/><div className="mt-5 text-xs text-muted">{label}</div><div className="mt-2 font-semibold">{value}</div><div className="mt-1 text-xs text-muted">{detail}</div></Link>;
}
