import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Review ByteBreach platform rules, authorized sandbox usage policies, and code of conduct for cybersecurity students and researchers.",
};

export default function TermsPage() {
  return (
    <PublicPage eyebrow="Operational terms" title="Terms & Conditions">
      <p>
        ByteBreach is an educational platform. You agree to use every module, tool, target, and credential only within the authorized sandbox or environment explicitly provided by the academy.
      </p>
      <p>
        Unauthorized attacks, automated credential stuffing, harassment, disruption of third-party services, malware deployment, and weaponizing educational payloads outside authorized labs are strictly prohibited.
      </p>
      <p>
        Access may be suspended when activity threatens other users, systems, or the integrity of the learning environment.
      </p>
    </PublicPage>
  );
}
