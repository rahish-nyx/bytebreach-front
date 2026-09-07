import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers regarding ByteBreach XP scoring, flag submission rules, certification learning paths, and lab environment details.",
  openGraph: {
    title: "Frequently Asked Questions | ByteBreach",
    description:
      "All your questions answered about platform scoring, tracks, challenges, and academy operations.",
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
