import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Details on how ByteBreach uses essential authentication tokens, session persistence, and privacy controls.",
};

export default function CookiesPage() {
  return (
    <PublicPage eyebrow="Browser storage" title="Cookie Policy">
      <p>
        ByteBreach uses session tokens and Firebase Authentication persistence to keep you signed in between visits and protect your learning progress.
      </p>
      <p>
        Where enabled, Google AdSense and AdMob may use advertising cookies or device identifiers subject to their policies and your applicable consent choices.
      </p>
      <p>
        You can clear browser storage or adjust browser privacy controls, though doing so may sign you out.
      </p>
    </PublicPage>
  );
}
