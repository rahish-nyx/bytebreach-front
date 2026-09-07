import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cybersecurity Practice Labs & CTF Challenges",
  description:
    "Deploy onto 250+ isolated cyber targets across Web Security, Active Directory, Network Defense, DFIR, and Privilege Escalation. Capture flags and rank up.",
  openGraph: {
    title: "Practice Labs & CTF Challenges | ByteBreach",
    description:
      "250+ practical cybersecurity challenges covering offensive and defensive operations.",
  },
};

export default function PracticeLabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
