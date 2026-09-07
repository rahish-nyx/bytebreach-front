import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Operative Leaderboard",
  description:
    "Live rankings of top cybersecurity operatives on ByteBreach. Compare XP, streak metrics, and rank tiers from Script Kiddie to Root Master.",
  openGraph: {
    title: "Global Operative Leaderboard | ByteBreach",
    description:
      "Real-time standings of cyber operatives, lab completions, and platform achievements.",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
