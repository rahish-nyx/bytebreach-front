export interface RankTier {
  name: string;
  minXp: number;
  maxXp: number | null; // null for top tier
  badgeColor: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: "Script Kiddie", minXp: 0, maxXp: 249, badgeColor: "text-slate-400 bg-slate-800/60 border-slate-700" },
  { name: "Byte Scout", minXp: 250, maxXp: 749, badgeColor: "text-cyan-400 bg-cyan-950/60 border-cyan-800" },
  { name: "Packet Analyzer", minXp: 750, maxXp: 1499, badgeColor: "text-blue-400 bg-blue-950/60 border-blue-800" },
  { name: "Vulnerability Hunter", minXp: 1500, maxXp: 2999, badgeColor: "text-amber-400 bg-amber-950/60 border-amber-800" },
  { name: "Cyber Operative", minXp: 3000, maxXp: 5499, badgeColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800" },
  { name: "Zero-Day Architect", minXp: 5500, maxXp: 8999, badgeColor: "text-purple-400 bg-purple-950/60 border-purple-800" },
  { name: "Breach Specialist", minXp: 9000, maxXp: 14999, badgeColor: "text-rose-400 bg-rose-950/60 border-rose-800" },
  { name: "Root Master", minXp: 15000, maxXp: null, badgeColor: "text-red-500 bg-red-950/80 border-red-700 font-bold" },
];

export function getRankTier(xp: number): RankTier {
  const safeXp = Math.max(0, xp || 0);
  return (
    RANK_TIERS.slice().reverse().find((tier) => safeXp >= tier.minXp) || RANK_TIERS[0]
  );
}

export function getRankFromXp(xp: number): string {
  return getRankTier(xp).name;
}

export function getRankBadgeColor(rank: string): string {
  const tier = RANK_TIERS.find((item) => item.name === rank);
  return tier?.badgeColor || RANK_TIERS[0].badgeColor;
}

export function getRankGradientStyle(rankNameOrXp: string | number): string {
  const name = typeof rankNameOrXp === "number" ? getRankTier(rankNameOrXp).name : rankNameOrXp;
  switch (name) {
    case "Byte Scout":
      return "from-cyan-950/80 via-slate-900/90 to-blue-950/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]";
    case "Packet Analyzer":
      return "from-blue-950/80 via-slate-900/90 to-indigo-950/80 border-blue-500/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15)]";
    case "Vulnerability Hunter":
      return "from-amber-950/80 via-slate-900/90 to-orange-950/80 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]";
    case "Cyber Operative":
      return "from-emerald-950/80 via-slate-900/90 to-teal-950/80 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
    case "Zero-Day Architect":
      return "from-purple-950/80 via-slate-900/90 to-violet-950/80 border-purple-500/40 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]";
    case "Breach Specialist":
      return "from-rose-950/80 via-slate-900/90 to-pink-950/80 border-rose-500/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
    case "Root Master":
      return "from-red-950/90 via-slate-900/90 to-amber-950/90 border-red-500/60 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.25)] font-bold";
    case "Script Kiddie":
    default:
      return "from-slate-800/80 via-slate-900/90 to-slate-950 border-slate-700/60 text-slate-300";
  }
}
