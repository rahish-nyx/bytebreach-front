import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how ByteBreach handles authentication data, student profiles, learning telemetry, and push notification tokens safely.",
};

export default function PrivacyPage() {
  return (
    <PublicPage eyebrow="Data protection" title="Privacy Policy">
      <p>
        ByteBreach uses Firebase Authentication to manage sign-in identities and Firestore to store learning profiles, progress, submissions, and platform activity needed to operate the academy.
      </p>
      <p>
        We do not sell third-party credentials or learner profile data. Push notification tokens are stored only to deliver opted-in academy alerts and can be removed through the platform’s notification controls.
      </p>
      <p>
        Operational analytics are used to improve learning flows, reliability, and content quality.
      </p>
    </PublicPage>
  );
}
