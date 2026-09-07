"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";

export interface TrackCardProps {
  id: string;
  title: string;
  level: string;
  description: string;
  totalModules: number;
  completedModules: number;
  percentage: number;
  color?: string;
}

export function getTrackAccent(track: { id?: string; title?: string }) {
  const key = `${track.id || ""} ${track.title || ""}`.toLowerCase();

  if (key.includes("ccie")) {
    return {
      box: "border-amber-500/50 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
      text: "text-amber-400",
    };
  }
  if (key.includes("ccna")) {
    return {
      box: "border-cyan-500/50 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
      text: "text-cyan-400",
    };
  }
  if (key.includes("ccnp")) {
    return {
      box: "border-indigo-500/50 bg-indigo-950/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
      text: "text-indigo-400",
    };
  }
  if (key.includes("ethical") || key.includes("hack")) {
    return {
      box: "border-emerald-500/50 bg-emerald-950/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      text: "text-emerald-400",
    };
  }

  return {
    box: "border-blue-500/50 bg-blue-950/60 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    text: "text-blue-400",
  };
}

export function getTrackAccentColor(trackSlug: string, color?: string): string {
  const accent = getTrackAccent({ id: trackSlug });
  return `${accent.box} ${accent.text}`;
}

export function getTrackLogoStyle(track: { id?: string; title?: string }) {
  const key = `${track.id || ""} ${track.title || ""}`.toLowerCase();

  if (key.includes("ccna")) {
    return { backgroundColor: "#16383b", color: "#2dd4bf" };
  }
  if (key.includes("ccnp")) {
    return { backgroundColor: "#2a244d", color: "#a78bfa" };
  }
  if (key.includes("ccie")) {
    return { backgroundColor: "#3b2b1e", color: "#fb923c" };
  }
  if (key.includes("ethical") || key.includes("hack")) {
    return { backgroundColor: "#3b1f2b", color: "#fb7185" };
  }
  return { backgroundColor: "#16383b", color: "#2dd4bf" };
}

export function TrackCard({
  id,
  title,
  level,
  description,
  totalModules,
  completedModules,
  percentage,
  color,
}: TrackCardProps) {
  const progressPercent = Math.min(100, Math.max(0, percentage || 0));
  const logoStyle = getTrackLogoStyle({ id, title });
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    const isLocalAdmin =
      typeof window !== "undefined" &&
      window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true";

    if (!user && !isLocalAdmin) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(`/learning-paths/${id}`)}`);
    }
  };

  return (
    <Link
      href={`/learning-paths/${id}`}
      onClick={handleClick}
      className="flex flex-col justify-between h-full rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {/* Top Content Grouping */}
      <div>
        <div className="flex items-center justify-between">
          <div
            style={logoStyle}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 font-mono text-xs font-bold"
          >
            &gt;_
          </div>
          <span className="text-xs uppercase text-slate-400 font-medium tracking-wider">
            {level}
          </span>
        </div>

        <h3 className="mt-3 text-base font-semibold text-white transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-400 line-clamp-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom Progress Bar Anchoring */}
      <div className="mt-auto pt-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>
            {completedModules}/{totalModules} modules
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
