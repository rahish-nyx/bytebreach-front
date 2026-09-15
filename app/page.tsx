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

const defaultFallbackModules = [
  { id: "ccna-subnetting", title: "IPv4 & IPv6 Subnetting Architecture", trackId: "ccna", track: "CCNA", duration: "25 min", order: 1, progress: 0 },
  { id: "cisco-ios-cli", title: "Cisco IOS Switch & Router Configuration", trackId: "ccna", track: "CCNA", duration: "30 min", order: 2, progress: 0 },
  { id: "wireshark-pcaps", title: "Network Packet Analysis with Wireshark", trackId: "ccna", track: "CCNA", duration: "20 min", order: 3, progress: 0 },
  { id: "routing-ospf", title: "Enterprise Single-Area OSPFv2 Routing", trackId: "ccna", track: "CCNA", duration: "35 min", order: 4, progress: 0 },
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

  // Determine the student's active track based on filter, profile recency, progress activity, or progression
  const activeTrack = useMemo(() => {
    // 1. Explicit dashboard selection
    if (selectedPath !== "all") {
      const found = paths.find((p) => p.id === selectedPath || p.title.toLowerCase().includes(selectedPath));
      if (found) return found;
    }

    // 2. Profile lastActiveTrackId from Firestore
    const profileLastTrack = (profile as any)?.lastActiveTrackId;
    if (profileLastTrack) {
      const found = paths.find(
        (p) =>
          p.id.toLowerCase() === String(profileLastTrack).toLowerCase() ||
          p.title.toLowerCase() === String(profileLastTrack).toLowerCase()
      );
      if (found) return found;
    }

    // 3. Most recent progress activity
    if (progress.length > 0 && modules.length > 0) {
      const sorted = [...progress].sort((a, b) => {
        const timeA = (a.lastViewedAt as any)?.seconds ?? (a.completedAt as any)?.seconds ?? 0;
        const timeB = (b.lastViewedAt as any)?.seconds ?? (b.completedAt as any)?.seconds ?? 0;
        return timeB - timeA;
      });
      for (const p of sorted) {
        const mod = modules.find((m) => m.id === p.id);
        const modTrack = String(mod?.trackId || mod?.parentLabel || "").toLowerCase();
        if (modTrack) {
          const found = paths.find(
            (path) => path.id.toLowerCase() === modTrack || path.title.toLowerCase().includes(modTrack)
          );
          if (found) return found;
        }
      }
    }

    // 4. LocalStorage fallback
    if (typeof window !== "undefined") {
      try {
        const localTrack = window.localStorage.getItem("bytebreach_last_track");
        if (localTrack) {
          const found = paths.find(
            (p) =>
              p.id.toLowerCase() === localTrack.toLowerCase() ||
              p.title.toLowerCase().includes(localTrack.toLowerCase())
          );
          if (found) return found;
        }
      } catch {}
    }

    // 5. User completed modules fallback
    if (userCompleted.length > 0 && modules.length > 0) {
      for (const compId of userCompleted) {
        const mod = modules.find((m) => m.id === compId);
        const modTrack = String(mod?.trackId || mod?.parentLabel || "").toLowerCase();
        if (modTrack) {
          const found = paths.find(
            (p) => p.id.toLowerCase() === modTrack || p.title.toLowerCase().includes(modTrack)
          );
          if (found) return found;
        }
      }
    }

    // 6. Default to first path with uncompleted modules, or CCNA
    return paths.find((p) => p.completedModules < p.totalModules) || paths[0] || fallbackPaths[0];
  }, [selectedPath, paths, profile, progress, modules, userCompleted]);

  // Sequential recommended modules for the active track (Module 1 -> Module 2 -> Module 3...)
  const recommendedModules = useMemo(() => {
    const targetTrackId = activeTrack?.id || "ccna";

    if (!modules.length) {
      return defaultFallbackModules.map((item) => ({
        ...item,
        track: activeTrack?.title || item.track,
      }));
    }

    // Filter published modules matching the active track
    const trackModules = modules
      .filter(
        (item) =>
          item.published !== false &&
          (String(item.trackId || "").toLowerCase() === targetTrackId.toLowerCase() ||
            String(item.parentLabel || "").toLowerCase() === targetTrackId.toLowerCase() ||
            (targetTrackId === "ccna" && !item.trackId))
      )
      .map((item, index) => {
        const prog = progress.find((entry) => entry.id === item.id);
        const isCompleted =
          userCompleted.includes(item.id) ||
          prog?.status === "completed" ||
          Number(prog?.percent ?? 0) === 100;
        const progressPercent = isCompleted ? 100 : Number(prog?.percent ?? item.progress ?? 0);
        const order = typeof item.order === "number" ? item.order : index + 1;

        return {
          id: item.id,
          title: String(item.title || item.id),
          trackId: targetTrackId,
          track: activeTrack?.title || String(item.parentLabel || item.trackId || "Learning path"),
          duration: String(item.duration || `${item.durationMinutes || 0} min`),
          order,
          progress: progressPercent,
          isCompleted,
          status: prog?.status || (isCompleted ? "completed" : "not_started"),
        };
      });

    // Strictly sort by curriculum order
    trackModules.sort((a, b) => a.order - b.order);

    if (!trackModules.length) {
      return defaultFallbackModules.map((item) => ({
        ...item,
        track: activeTrack?.title || item.track,
      }));
    }

    // Find uncompleted modules in sequential order
    const uncompleted = trackModules.filter((m) => !m.isCompleted);

    // If student has uncompleted modules, recommend them sequentially (e.g. Module 2, 3, 4, 5...)
    if (uncompleted.length > 0) {
      return uncompleted.slice(0, 4);
    }

    // If all modules in this track are completed, show the last completed modules in order
    return trackModules.slice(0, 4);
  }, [modules, activeTrack, progress, userCompleted]);

  const nextModule = recommendedModules.find((item) => item.progress < 100) || recommendedModules[0];
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
              <div className="eyebrow text-cyan">
                Resume your path · {activeTrack?.title || "CCNA"}
              </div>
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
            {recommendedModules.length ? (
              recommendedModules.slice(0, 4).map((item) => (
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
                      {item.track} · Module {item.order} · {item.duration}
                    </div>
                    <div className="mt-1 font-semibold">{item.title}</div>
                    <div className="mt-3 h-1.5 rounded-full bg-line">
                      <div className="h-full rounded-full bg-cyan" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-cyan flex items-center gap-1 shrink-0 font-medium">
                    {item.progress === 100 ? "Review" : item.progress > 0 ? "Resume" : "Start"}{" "}
                    <ChevronRight size={14} className="inline" />
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

      {/* Academy Overview & Practical Curriculum (SEO & AI Answer Engine Optimization) */}
      <section className="mt-14 border-t border-line/60 pt-10">
        <div className="eyebrow text-cyan">Academy Architecture & Cyber Warfare Readiness</div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
          What is ByteBreach Security Academy?
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
          ByteBreach Security Academy is a high-intensity, browser-accessible cyber battleground engineered for aspiring network security specialists, penetration testers, and enterprise network engineers. Unlike passive video tutorials, ByteBreach immerses learners in interactive terminal simulations, live capture-the-flag (CTF) challenges, and realistic enterprise networking scenarios from day one.
        </p>

        {/* Feature Cards */}
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

        {/* Question-Style Heading: Learning Track Matrix (Structured Table for AI Citing) */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Which cybersecurity and networking tracks does ByteBreach offer?
          </h2>
          <p className="mt-2 text-xs text-muted max-w-3xl">
            Explore our curriculum paths designed to take operatives from foundational networking concepts to expert offensive and defensive cyber operations.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-panel/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-line bg-ink/70 text-[11px] font-semibold uppercase tracking-wider text-cyan">
                <tr>
                  <th scope="col" className="px-4 py-3">Curriculum Track</th>
                  <th scope="col" className="px-4 py-3">Skill Level</th>
                  <th scope="col" className="px-4 py-3">Key Technical Domains</th>
                  <th scope="col" className="px-4 py-3">Practical Lab Focus</th>
                  <th scope="col" className="px-4 py-3">Target Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">CCNA Network Associate</td>
                  <td className="px-4 py-3 text-cyan">Beginner</td>
                  <td className="px-4 py-3">IPv4/IPv6, Subnetting, VLANs, OSPFv2, NAT, Wireless</td>
                  <td className="px-4 py-3">CLI Router &amp; Switch Configuration</td>
                  <td className="px-4 py-3 text-slate-400">Cisco CCNA 200-301</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">CCNP Enterprise</td>
                  <td className="px-4 py-3 text-indigo-400">Advanced</td>
                  <td className="px-4 py-3">Dual-Stack Routing, BGP, Multicast, QoS, SD-WAN, Automation</td>
                  <td className="px-4 py-3">Enterprise Multi-Area Topologies</td>
                  <td className="px-4 py-3 text-slate-400">Cisco 350-401 ENCOR</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">CCIE Enterprise Infrastructure</td>
                  <td className="px-4 py-3 text-amber-400">Expert</td>
                  <td className="px-4 py-3">Complex Packet Analysis, Border Gateways, Zero Trust Architecture</td>
                  <td className="px-4 py-3">Mission-Critical Live Diagnostics</td>
                  <td className="px-4 py-3 text-slate-400">Cisco CCIE Lab Exam</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">Ethical Hacking &amp; Penetration Testing</td>
                  <td className="px-4 py-3 text-emerald-400">Intermediate</td>
                  <td className="px-4 py-3">OWASP Top 10, Port Scanning, Metasploit, PrivEsc, Web Shells</td>
                  <td className="px-4 py-3">Capture-The-Flag (CTF) Cyber Ranges</td>
                  <td className="px-4 py-3 text-slate-400">CompTIA PenTest+, CEH, OSCP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Question-Style Heading: CTF Practice Labs Matrix (Second Structured Table for AI) */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white">
            What Capture-The-Flag (CTF) practice lab domains are offered on ByteBreach?
          </h2>
          <p className="mt-2 text-xs text-muted max-w-3xl">
            ByteBreach hosts an extensive portfolio of browser-accessible cyber ranges designed to develop practical offensive and defensive skills.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-panel/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-line bg-ink/70 text-[11px] font-semibold uppercase tracking-wider text-cyan">
                <tr>
                  <th scope="col" className="px-4 py-3">Lab Category</th>
                  <th scope="col" className="px-4 py-3">Primary Attack Vectors &amp; Defense</th>
                  <th scope="col" className="px-4 py-3">Simulated Environment</th>
                  <th scope="col" className="px-4 py-3">XP Reward</th>
                  <th scope="col" className="px-4 py-3">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">Web Application Exploitation</td>
                  <td className="px-4 py-3">SQL Injection, Stored XSS, SSRF, IDOR, Broken Authentication</td>
                  <td className="px-4 py-3">Isolated Web App Docker Container</td>
                  <td className="px-4 py-3 text-cyan">100 - 250 XP</td>
                  <td className="px-4 py-3 text-emerald-400">Easy to Hard</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">Network Forensics &amp; Packet Triage</td>
                  <td className="px-4 py-3">PCAP Stream Reassembly, ARP Poisoning, Rogue DHCP Detection</td>
                  <td className="px-4 py-3">Wireshark Stream Terminal</td>
                  <td className="px-4 py-3 text-cyan">75 - 200 XP</td>
                  <td className="px-4 py-3 text-cyan">Beginner to Intermediate</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">Linux Privilege Escalation</td>
                  <td className="px-4 py-3">SUID Abuse, Sudoer Wildcards, Cron Manipulation, Kernel Exploits</td>
                  <td className="px-4 py-3">Interactive SSH Pseudo-Terminal</td>
                  <td className="px-4 py-3 text-cyan">150 - 300 XP</td>
                  <td className="px-4 py-3 text-indigo-400">Intermediate to Hard</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">Active Directory &amp; Kerberos Defense</td>
                  <td className="px-4 py-3">Kerberoasting, AS-REP Roasting, BloodHound Paths, Pass-the-Hash</td>
                  <td className="px-4 py-3">Domain Controller Virtual Topology</td>
                  <td className="px-4 py-3 text-cyan">200 - 350 XP</td>
                  <td className="px-4 py-3 text-amber-400">Advanced</td>
                </tr>
                <tr className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">Applied Cryptography &amp; Steganography</td>
                  <td className="px-4 py-3">RSA Padding Oracle, Hash Length Extension, AES-CBC Bit Flipping</td>
                  <td className="px-4 py-3">Python / CyberChef Crypto Sandbox</td>
                  <td className="px-4 py-3 text-cyan">100 - 250 XP</td>
                  <td className="px-4 py-3 text-indigo-400">Intermediate</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Question-Style Heading: Step-by-Step Learning Progression (Ordered List for AI) */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white">
            How does the ByteBreach operative training journey work step-by-step?
          </h2>
          <p className="mt-2 text-xs text-muted max-w-3xl">
            Our structured pedagogical framework guides learners through an immersive cycle of concept mastery, hands-on exploitation, and automated validation.
          </p>
          <ol className="mt-4 space-y-3 rounded-2xl border border-line bg-panel/60 p-5 text-xs text-slate-300 list-decimal list-inside">
            <li className="leading-relaxed">
              <strong className="text-white">Select a Structured Learning Path:</strong> Choose between CCNA networking, CCNP enterprise routing, CCIE expert architecture, or Ethical Hacking based on your career targets.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Launch Interactive Terminal Simulators:</strong> Execute hands-on configuration commands inside your browser without installing third-party virtualization software.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Capture and Validate Target Flags:</strong> Discover security misconfigurations, retrieve unique <code className="text-cyan bg-ink/70 px-1.5 py-0.5 rounded">FLAG&#123;...&#125;</code> tokens, and submit them for real-time verification.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Earn Telemetry XP and Maintain Streaks:</strong> Accumulate experience points, level up your operative rank from Script Kiddie to Root Master, and climb the leaderboard.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Leverage the Technical Resource Vault:</strong> Inspect searchable syntax sheets, Nmap scanning guides, and Wireshark filter templates to accelerate your problem-solving speed.
            </li>
          </ol>
        </div>

        {/* Question-Style Heading: Tactical Vault Resources (Bulleted List for AI) */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white">
            What technical cheat codes and tools are available in the ByteBreach vault?
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">Networking &amp; Infrastructure Playbooks</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                <li>IPv4 Subnetting Matrix (VLSM calculation cheat sheets)</li>
                <li>Cisco IOS Command Quick Reference (OSPF, BGP, VLANs, ACLs)</li>
                <li>Wireshark Packet Filters for Incident Response &amp; Forensics</li>
                <li>BGP Peering &amp; Dual-Stack IPv6 Configuration Recipes</li>
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">Offensive Security &amp; CTF Cheats</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                <li>Nmap Network Port Scanning &amp; NSE Script Reference</li>
                <li>Linux &amp; Windows Privilege Escalation Enumeration Commands</li>
                <li>OWASP Top 10 Web Exploitation Payloads &amp; Methodologies</li>
                <li>Bash &amp; Python Security Automation One-Liners</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Question-Style Heading: Complete Q&A Section for Answer Engines & AI Overviews */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Frequently Asked Questions (FAQ) About ByteBreach Security Academy
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">What is ByteBreach Security Academy?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                ByteBreach Security Academy is a hands-on cybersecurity training platform and gamified cyber warfare battleground providing interactive CLI terminal simulations, Cisco networking tracks (CCNA, CCNP, CCIE), and real-world Capture-The-Flag (CTF) practice labs.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">How do I earn XP and rank on the Leaderboard?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Daily Challenges award 50 XP, completed learning rooms award 25 XP, and hands-on CTF practice labs award between 50 and 300 XP depending on lab difficulty. Consecutive logins build learning streak multipliers.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">How are Capture-The-Flag (CTF) flags validated?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Flags are submitted in standard FLAG&#123;...&#125; format. Our automated verification engine trims whitespace and validates submissions case-insensitively, instantly updating your profile telemetry.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">Are ByteBreach study rooms and cheat sheets free?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                ByteBreach provides free community access to structured study modules, cheat sheets, protocol summaries, and interactive practice challenges to empower cybersecurity learners worldwide.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">Can beginners learn cybersecurity on ByteBreach?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Yes. The CCNA and Fundamentals tracks require zero prior engineering experience, starting with basic networking, binary IP addressing, and fundamental Linux terminal operations before progressing to advanced exploits.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">Which certifications does ByteBreach prepare you for?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                ByteBreach prepares operatives for Cisco CCNA 200-301, CCNP 350-401 ENCOR, CCIE Enterprise Infrastructure, CompTIA Security+, CEH, and OSCP through hands-on terminal labs and realistic topologies.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">How do browser-based terminal labs work?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Labs run directly in your web browser with interactive terminal consoles, packet inspectors, and simulated routers, eliminating the need to install heavy virtual machines or hypervisors locally.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-sm font-semibold text-white">What resources are in the ByteBreach cheat sheet vault?</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                The vault contains searchable command cheat codes, Nmap discovery templates, Wireshark filter recipes, Subnetting reference sheets, and Bash automation scripts for quick reference during labs and exams.
              </p>
            </div>
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
