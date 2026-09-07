import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Paths & Certification Tracks",
  description:
    "Explore structured cybersecurity and networking training paths: CCNA, CCNP Enterprise, CCIE, and Ethical Hacking with hands-on practice rooms.",
  openGraph: {
    title: "Cybersecurity Learning Paths | ByteBreach",
    description:
      "Master Cisco networking and offensive security with interactive study tracks and hands-on rooms.",
  },
};

export default function LearningPathsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
