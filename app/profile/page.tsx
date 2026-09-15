"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, LogOut, Settings, Shield, Smartphone, Star, Trophy } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { StudentShell } from "@/components/StudentShell";
import { getRankTier } from "@/src/lib/ranks";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { useUserProfile } from "@/hooks/useUserProfile";

type Profile = {
  handle?: string;
  email?: string;
  rank?: string;
  xp?: number;
  completedLabs?: number | string[];
  completedModules?: string[];
  trackXp?: Record<string, number>;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<{ id: string; title?: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; trackId?: string }[]>([]);
  const { progress } = useStudentProgress();
  const { isAdmin } = useUserProfile();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as Profile) : null);
    });
  }, [loading, router, user]);

  useEffect(() => {
    return onSnapshot(collection(db, "tracks"), (snapshot) => {
      setTracks(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as { id: string; title?: string })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(query(collection(db, "modules"), where("published", "==", true)), (snapshot) => {
      setModules(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as { id: string; trackId?: string })));
    });
  }, []);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-muted">Loading profile...</div>;
  }

  const totalXp = profile?.xp ?? (user as any)?.xp ?? 0;
  const currentTier = getRankTier(totalXp);
  const initials = (profile?.handle || user.displayName || "RE").slice(0, 2).toUpperCase();
  const userCompleted = Array.isArray(profile?.completedModules) ? profile.completedModules : [];

  return (
    <StudentShell>
      <div className="grid-bg min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 text-xs text-muted hover:text-cyan">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/bytebreach.apk"
                download="ByteBreach.apk"
                className="flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                title="Download ByteBreach Android APK"
              >
                <Smartphone size={14} />
                <span>Download APK</span>
              </a>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-cyan/40 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/20 transition"
                >
                  <Settings size={14} /> Admin console
                </Link>
              )}
              <button
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
                className="flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs text-muted hover:border-red-400 hover:text-red-300"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </header>

          {/* Operative Profile Card */}
          <section className="mt-8 overflow-hidden rounded-3xl border border-line bg-panel shadow-glow sm:mt-12">
            <div className="h-24 bg-gradient-to-r from-cyan/20 via-violet/20 to-transparent sm:h-32" />
            <div className="-mt-10 px-4 pb-6 sm:px-6 sm:pb-8 md:px-10">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-panel bg-gradient-to-br from-violet to-cyan text-xl font-black text-ink">
                {initials}
              </div>
              <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <div className="eyebrow text-cyan">Operative profile</div>
                  <h1 className="mt-2 truncate text-2xl font-bold sm:text-3xl">
                    {profile?.handle || user?.displayName || "Anonymous"}
                  </h1>
                  <p className="mt-2 truncate text-sm text-muted">{profile?.email || user?.email}</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-blue-800/40 bg-slate-900/60 px-6 py-3.5 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)] min-w-[150px]">
                  <svg className="w-5 h-5 text-cyan-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10l4.5 4 4.5-7 4.5 7 4.5-4v10H3V10z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Rank</span>
                  <span className="text-sm font-bold text-white mt-0.5">{currentTier.name}</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-white">{totalXp}</span>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">XP</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-[#0b1018] p-4 sm:p-5">
                  <Star size={18} className="text-amber" />
                  <div className="mt-5 text-2xl font-bold">{totalXp}</div>
                  <div className="mt-1 text-xs text-muted">Experience points</div>
                </div>
                <div className="rounded-2xl border border-line bg-[#0b1018] p-4 sm:p-5">
                  <Trophy size={18} className="text-violet" />
                  <div className="mt-5 text-2xl font-bold">
                    {Array.isArray(profile?.completedLabs) ? profile.completedLabs.length : profile?.completedLabs ?? 0}
                  </div>
                  <div className="mt-1 text-xs text-muted">Completed labs</div>
                </div>
                <div className="rounded-2xl border border-line bg-[#0b1018] p-4 sm:p-5">
                  <Shield size={18} className="text-cyan" />
                  <div className="mt-5 text-2xl font-bold">Online</div>
                  <div className="mt-1">
                    <span className="text-xs text-slate-400">Status</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Android APK Download Card */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950 p-5 sm:p-6 shadow-[0_0_25px_rgba(16,185,129,0.08)]">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Smartphone size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Official Android Client
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">v1.0.0 • 7.4 MB APK</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white sm:text-lg">
                    ByteBreach Tactical Mobile App
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-xl">
                    Install ByteBreach directly on your Android phone or tablet. Practice Cisco commands on the go, solve Daily Challenges, and stay notified on new room releases.
                  </p>
                </div>
              </div>
              <a
                href="/bytebreach.apk"
                download="ByteBreach.apk"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-xs font-bold text-slate-950 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <Download size={15} />
                <span>Download APK</span>
              </a>
            </div>
          </section>

          {/* Track ranks */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <h2 className="sm:col-span-2 text-lg font-semibold">Track ranks</h2>
            {tracks.map((track) => {
              const trackModules = modules.filter((module) => module.trackId === track.id);
              const completed = trackModules.filter(
                (module) =>
                  userCompleted.includes(module.id) ||
                  progress.some((item) => item.id === module.id && item.status === "completed")
              ).length;
              const xp = profile?.trackXp?.[track.id] || 0;
              const trackTier = getRankTier(xp);
              return (
                <div key={track.id} className="rounded-2xl border border-line bg-panel p-4">
                  <div className="text-xs text-muted">{track.title || track.id}</div>
                  <div className="mt-2 inline-flex items-center rounded-full border border-slate-700 bg-slate-900/50 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                    {trackTier.name}
                  </div>
                  <div className="mt-3 text-sm">
                    {completed}/{trackModules.length} modules completed
                  </div>
                  <div className="mt-1 text-xs text-muted">{xp} track XP</div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </StudentShell>
  );
}
