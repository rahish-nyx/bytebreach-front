import type { Metadata } from "next";
import { AdminGuard } from "@/components/AdminGuard";

export const metadata: Metadata = {
  title: "Admin Console | ByteBreach",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
