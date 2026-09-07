import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Support Uplink",
  description:
    "Direct communication channel to ByteBreach academy instructors, support team, and student community via Telegram, email, and live messaging.",
  openGraph: {
    title: "Contact ByteBreach Academy",
    description: "Transmit inquiries or reach our security instructors and community managers.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
