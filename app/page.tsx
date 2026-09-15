"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, Flame, Play, Shield, Terminal, TrendingUp } from "lucide-react";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";
import { Sidebar } from "@/components/Sidebar";
import { AdBanner } from "@/components/AdBanner";
import { NotificationBell } from "@/components/NotificationBell";
import { DailyChallenge } from "@/components/DailyChallenge";
import { TrackCard } from "@/components/TrackCard";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProfileOption } from "@/components/ProfileOption";
import { SiteFooter } from "@/components/SiteFooter";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { doc, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { getTodayDateString, getYesterdayDateString, updateUserActivity } from "@/lib/activity";
import { useLearningTimer } from "@/hooks/useLearningTimer";

const pathFilters = ["all", "ccna", "ccnp", "ccie", "ethical"];
const fallbackPaths = [
  { id: "ccna", title: "CCNA", level: "Beginner", description: "Build a rock-solid networking foundation.", totalModules: 24, completedModules: 0, percentage: 0, color: "cyan" },
  { id: "ccnp-enterprise", title: "CCNP Enterprise", level: "Advanced", description: "Design and troubleshoot enterprise networks.", totalModules: 32, completedModules: 0, percentage: 0, color: "indigo" },
  { id: "ccie", title: "CCIE", level: "Advanced", description: "Master expert-level infrastructure and troubleshooting.", totalModules: 36, completedModules: 0, percentage: 0, color: "amber" },
  { id: "ethical-hacking", title: "Ethical Hacking", level: "Intermediate", description: "Think like an attacker. Defend like a pro.", totalModules: 28, completedModules: 0, percentage: 0, color: "emerald" }
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
};

export default function Dashboard() {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState("all");
  const [greeting, setGreeting] = useState("Welcome");
  const { user } = useAuth();
  const { name, profile } = useUserProfile();
  const { progress } = useStudentProgress();
  const tracks = useFirestoreCollection(["tracks"]).data;
  const modules = useFirestoreCollection(["modules"], [where("published", "==", true)]).data;
  const displayName = name || user?.displayName || "Operative";

  const handleProtectedClick = (targetUrl: string, e: React.MouseEvent) => {
    const isLocalAdmin =
      typeof window !== "undefined" &&
      window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true";

    if (!user && !isLocalAdmin) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const userCompleted = Array.isArray(profile?.completedModules)
    ? profile.completedModules
    : Array.isArray((user as any)?.completedModules)
    ? (user as any).completedModules
    : [];

  const paths = tracks.length
    ? tracks.map((item) => {
        const trackModules = modules.filter((module) => String(module.trackId || "") === item.id);
        const completedCount = trackModules.filter((m) => userCompleted.includes(m.id)).length;
        const totalCount = trackModules.length || Number(item.totalModules || item.moduleCount || 0);
        const pathPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        return {
          id: item.id,
          title: String(item.title || item.name || item.id),
          level: String(item.level || "Beginner"),
          description: String(item.description || ""),
          totalModules: totalCount,
          completedModules: completedCount,
          percentage: pathPercentage,
          color: item.id.includes("ethical") ? "emerald" : item.id.includes("ccnp") ? "indigo" : item.id.includes("ccie") ? "amber" : "cyan"
        };
      })
    : fallbackPaths;
  const visiblePaths = selectedPath === "all" ? paths : paths.filter((item) => item.id === selectedPath || item.title.toLowerCase().includes(selectedPath));
  const visibleModules = useMemo(() => {
    const list = modules.filter((item) => item.published !== false).map((item) => ({ id: item.id, title: String(item.title || item.id), trackId: String(item.trackId || ""), track: paths.find((path) => path.id === item.trackId)?.title || String(item.trackId || "Learning path"), progress: Number(progress.find((entry) => entry.id === item.id)?.percent ?? item.progress ?? 0), duration: String(item.duration || `${item.durationMinutes || 0} min`) }));
    return selectedPath === "all" ? list : list.filter((item) => item.trackId === selectedPath);
  }, [modules, paths, progress, selectedPath]);
  const nextModule = visibleModules.find((item) => item.progress < 100) || visibleModules[0];
  useLearningTimer(user?.uid);

  const streak = useMemo(() => {
    if (!profile) return 1;
    const rawStreak = Number(profile.streakCount ?? profile.streak ?? 1);
    const lastActive = profile.lastActiveDate;
    if (!lastActive) return Math.max(1, rawStreak);

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (lastActive === today || lastActive === yesterday) {
      return Math.max(1, rawStreak);
    }

    return 1;
  }, [profile]);

  const formattedHours = useMemo(() => {
    const totalSeconds = profile?.totalLearningSeconds !== undefined
      ? Number(profile.totalLearningSeconds)
      : Number(profile?.learningTimeMinutes || 0) * 60;

    return (totalSeconds / 3600).toFixed(1);
  }, [profile]);

  const completedLabs = useMemo(() => {
    const practiceLabs = Array.isArray(profile?.completedLabs)
      ? profile.completedLabs.length
      : Number(profile?.completedLabs || 0);

    const roomLabs = Array.isArray((profile as any)?.completedRoomLabs)
      ? (profile as any).completedRoomLabs.length
      : 0;

    return practiceLabs + roomLabs;
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void updateUserActivity(user.uid);
  }, [user]);

  return (
    <div className="grid-bg min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 pl-0 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
          <header className="sticky top-0 z-20 flex min-h-[64px] items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur md:h-[76px] md:px-10">
            <div className="flex items-center gap-2.5">
              <ByteBreachLogo size={32} className="shrink-0 md:hidden" />
              <div className="text-sm font-semibold">Dashboard</div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ProfileOption />
            </div>
          </header>
          <div className="mx-auto max-w-[1500px] p-4 sm:p-5 md:p-10">
            <AdBanner label="ad slot · top banner" />
            <div className="mt-7 flex flex-col justify-between gap-5 sm:mt-8 lg:flex-row lg:items-end">
              <div>
                <div className="eyebrow text-cyan">Your cyber journey</div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {greeting}, {user?.displayName || displayName || "Rez"} <span className="text-cyan">⌁</span>
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Choose a path, complete a room, and keep moving forward.
                </p>
              </div>
              {nextModule ? (
                <Link
                  href={`/room/${nextModule.id}`}
                  onClick={(e) => handleProtectedClick(`/room/${nextModule.id}`, e)}
                  className="flex min-h-11 w-fit items-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-ink"
                >
                  <Play size={14} fill="currentColor" /> Continue learning
                </Link>
              ) : (
                <Link
                  href="/learning-paths"
                  onClick={(e) => handleProtectedClick("/learning-paths", e)}
                  className="flex min-h-11 w-fit items-center rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-ink"
                >
                  Choose a path
                </Link>
              )}
            </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric
          onClick={(e) => handleProtectedClick("/", e)}
          icon={
            <Flame
              size={18}
              color="#fbbf24"
              className="text-[#fbbf24] stroke-[#fbbf24] text-amber-400 stroke-amber-400"
            />
          }
          label="Day streak"
          value={`${streak} days`}
          badgeClassName="bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.25)]"
        />
        <Metric
          onClick={(e) => handleProtectedClick("/", e)}
          icon={
            <Clock3
              size={18}
              color="#38bdf8"
              className="text-[#38bdf8] stroke-[#38bdf8] text-cyan-400 stroke-cyan-400"
            />
          }
          label="Learning time"
          value={`${formattedHours} hours`}
          badgeClassName="bg-cyan-500/10 border border-blue-500/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        />
        <Metric
          onClick={(e) => handleProtectedClick("/", e)}
          icon={
            <Shield
              size={18}
              className="text-emerald-400 stroke-emerald-400"
            />
          }
          label="Labs completed"
          value={`${completedLabs} labs`}
          badgeClassName="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        />
      </div>
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Choose your specialization</div>
            <h2 className="mt-1 text-xl font-bold">Learning paths</h2>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-panel p-1">
            {pathFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedPath(filter)}
                className={`rounded-lg px-3 py-1.5 text-[11px] uppercase ${
                  selectedPath === filter ? "bg-cyan font-bold text-ink" : "text-muted"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          {visiblePaths.map((path) => (
            <TrackCard key={path.id} {...path} />
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="eyebrow">Resume your path</div>
              <h2 className="mt-1 text-xl font-bold">Recommended next modules</h2>
            </div>
            <Link
              href="/learning-paths"
              onClick={(e) => handleProtectedClick("/learning-paths", e)}
              className="text-xs text-cyan"
            >
              View paths <ChevronRight size={13} className="inline" />
            </Link>
          </div>
          {paths.filter((path) => path.completedModules >= path.totalModules && path.totalModules > 0).length > 0 && (
            <div className="mb-4 rounded-2xl border border-cyan/20 bg-cyan/[.04] p-4">
              <div className="text-xs font-semibold text-cyan">Next track unlocked</div>
              <div className="mt-1 text-sm text-white">
                Continue with {paths.find((path) => path.completedModules < path.totalModules)?.title || "your next specialization"}.
              </div>
            </div>
          )}
          <div className="space-y-3">
            {visibleModules.length ? (
              visibleModules.slice(0, 4).map((item) => (
                <Link
                  href={`/room/${item.id}`}
                  onClick={(e) => handleProtectedClick(`/room/${item.id}`, e)}
                  key={item.id}
                  className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:border-cyan/40"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/10 text-cyan">
                    <Terminal size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-muted">
                      {item.track} · {item.duration}
                    </div>
                    <div className="mt-1 font-semibold">{item.title}</div>
                    <div className="mt-3 h-1.5 rounded-full bg-line">
                      <div className="h-full rounded-full bg-cyan" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-cyan">
                    {item.progress === 100 ? "Completed" : "Continue"} <ChevronRight size={14} className="inline" />
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
                Select a learning path to see recommended modules.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <DailyChallenge />
          <AdBanner label="ad slot · sidebar" />
        </div>
      </div>

      {/* Academy Overview & Practical Curriculum (SEO & Learning Architecture) */}
      <section className="mt-14 border-t border-line/60 pt-10">
        <div className="eyebrow text-cyan">Academy Architecture & Cyber Warfare Readiness</div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Hands-On Cybersecurity Training & Enterprise Network Engineering
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
          ByteBreach Security Academy delivers an intensive, browser-accessible cyber battleground designed for aspiring network engineers, penetration testers, and security operatives. Rather than passive video lectures, every module immerses learners in interactive terminal simulations, live capture-the-flag (CTF) challenges, and realistic enterprise networking scenarios.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-line bg-panel p-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan" />
              Cisco Certified Networking Tracks
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Master enterprise routing and switching from foundational CCNA 200-301 to CCNP Enterprise and expert CCIE architectures. Build hands-on proficiency with OSPF, BGP, multi-area topologies, IPv4/IPv6 dual-stack addressing, VLAN segmentation, and automation scripts.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Defensive & Offensive CTF Arenas
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Engage with isolated cyber ranges that reflect actual breach tactics. Learn reconnaissance, web application exploitation (OWASP Top 10), binary triage, and Linux privilege escalation while validating flags in a secure, gamified scoring engine.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Continuous Skill Telemetry & XP
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Track daily learning streaks, timed challenge sprints, and peer rankings on the global operative leaderboard. Gain verifiable competency through structured study rooms, comprehensive cheatsheets, and practical laboratory exercises.
            </p>
          </div>
        </div>
      </section>
    </div>
    <SiteFooter />
  </main>
      <MobileBottomNav />
    </div>
  </div>
  );
}

function Metric({
  icon,
  label,
  value,
  onClick,
  badgeClassName = "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: (e: React.MouseEvent) => void;
  badgeClassName?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-blue-800/40 bg-slate-900/50 p-4 backdrop-blur-sm flex flex-col justify-between transition-all hover:border-blue-700/50 ${
        onClick ? "cursor-pointer hover:border-cyan-500/50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-400 font-medium">{label}</div>
          <div className="text-2xl font-bold text-white tracking-tight mt-1">{value}</div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${badgeClassName}`}>
          {icon}
        </div>
      </div>
      <div className="text-[11px] text-cyan-400/80 flex items-center gap-1.5 mt-3">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
        </span>
        <TrendingUp size={13} />
        <span>Live progress sync</span>
      </div>
    </div>
  );
}
