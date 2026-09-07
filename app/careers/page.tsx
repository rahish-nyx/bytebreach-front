import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Careers & Recruitment",
  description:
    "Join ByteBreach. Explore engineering, curriculum development, and cybersecurity instructor opportunities as our platform scales.",
};

export default function CareersPage() {
  return (
    <PublicPage eyebrow="Recruitment desk" title="Operative Recruitment Status: Offline / Standby">
      <p>
        ByteBreach is currently developing stealth mode operations. No active roles are open right now. Check back as our global infrastructure expands.
      </p>
    </PublicPage>
  );
}
