import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cheats, Commands & Resource Library",
  description:
    "Instant cybersecurity cheat sheets, command syntax guides, code snippets, and lab handouts for Nmap, Wireshark, Bash, Python, and SQL injection testing.",
  openGraph: {
    title: "Cheats & Technical Resources | ByteBreach",
    description:
      "Essential command references, penetration testing cheat codes, and networking syntax libraries.",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
