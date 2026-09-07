import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Educational & Security Disclaimer",
  description:
    "Official disclaimer outlining ethical guidelines, research policies, and authorized testing parameters for ByteBreach cyber labs.",
};

export default function DisclaimerPage() {
  return (
    <PublicPage eyebrow="Responsible research" title="Cybersecurity Educational Disclaimer">
      <p>
        All ByteBreach materials, labs, exploit walkthroughs, code, and tools are supplied solely for educational, defensive, and authorized research purposes.
      </p>
      <p>
        Do not apply techniques against systems you do not own or have explicit permission to test. ByteBreach assumes no liability for external misuse, unauthorized access, damage, loss, or legal consequences arising from use outside the academy’s authorized environments.
      </p>
    </PublicPage>
  );
}
