import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Google AdSense & Data Protection",
  description:
    "Official ByteBreach Privacy Policy detailing data protection, Firebase Authentication, cookie usage, and third-party advertising disclosures including Google AdSense.",
};

export default function PrivacyPage() {
  return (
    <PublicPage eyebrow="Data protection & transparency" title="Privacy Policy">
      <div className="space-y-6 text-sm leading-7 text-slate-300">
        <p className="text-xs text-muted">Last Updated: September 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Introduction</h2>
          <p>
            Welcome to ByteBreach Security Academy (&ldquo;ByteBreach&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), accessible at{" "}
            <a href="https://bytebreach.in" className="text-cyan underline">https://bytebreach.in</a>. We are committed to safeguarding your personal data, privacy rights, and operational integrity while you participate in our cyber defense curricula, CTF practice labs, and academy resources.
          </p>
          <p>
            This Privacy Policy explains what information we collect, how we process and protect it, and your rights regarding your data, including specific disclosures regarding third-party vendors and advertising partners such as Google AdSense.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">Authentication & Profile Information:</strong> When you register or authenticate via Firebase Authentication (email/password or authorized OAuth providers), we securely store your email address, display name, operative handle, avatar initials, and authentication timestamps.
            </li>
            <li>
              <strong className="text-white">Learning Telemetry & CTF Progress:</strong> We record module completions, study room milestones, Daily Challenge submissions, CTF flag validation timestamps, streak counters, earned XP, and operative rank tier transitions to deliver gamified platform features.
            </li>
            <li>
              <strong className="text-white">Log & Diagnostic Telemetry:</strong> When you access our servers, technical telemetry such as IP address, browser type, device specifications, operating system, referring URLs, and error logs may be automatically recorded for defensive monitoring and denial-of-service mitigation.
            </li>
            <li>
              <strong className="text-white">Inquiry & Communications Data:</strong> When you transmit questions or support requests through our direct command uplink, we process your submitted name, email address, and message contents to respond to your inquiry.
            </li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-cyan/30 bg-cyan/5 p-5">
          <h2 className="text-lg font-bold text-cyan">3. Google AdSense, Google AdMob & Advertising Disclosures</h2>
          <p>
            To support free community access to our training tracks, cheat codes, and practice environments, ByteBreach displays third-party advertisements served by Google AdSense (on our website) and Google AdMob (within our mobile applications and progressive app containers):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-200">
            <li>
              <strong>Google AdSense (Web Browser Services):</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to ByteBreach or other websites across the Internet. Google&rsquo;s use of advertising cookies (such as the DoubleClick cookie) enables it and its partners to serve relevant ads to our web visitors.
            </li>
            <li>
              <strong>Google AdMob (Mobile Application Services):</strong> For students accessing ByteBreach through our mobile application, installed PWA, or native wrappers, advertisements are powered by Google AdMob. AdMob may process non-sensitive device identifiers, such as the Google Advertising ID (GAID) or Identifier for Advertisers (IDFA), to serve contextual and interest-based mobile advertisements in accordance with Google Play Developer Program Policies.
            </li>
            <li>
              <strong>Personalized Advertising Opt-Out:</strong> Web visitors may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline font-semibold"
              >
                Google Ads Settings
              </a>. Alternatively, you can opt out of a third-party vendor&rsquo;s use of cookies for personalized advertising by visiting{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline font-semibold"
              >
                www.aboutads.info
              </a>{" "}
              or the Network Advertising Initiative at{" "}
              <a
                href="http://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline font-semibold"
              >
                optout.networkadvertising.org
              </a>. Mobile app users can reset their advertising identifier or opt out of personalized ads directly within device settings (Android: Settings &gt; Google &gt; Ads &gt; Reset advertising ID / Delete advertising ID; iOS: Settings &gt; Privacy &amp; Security &gt; Tracking).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Cookies and Web Beacons</h2>
          <p>
            ByteBreach uses essential session tokens and persistent cookies to preserve your signed-in state, remember your theme and navigation preferences, and protect your account against cross-site forgery. Third-party advertisers on our site may also place and read cookies on your browser or use web beacons to collect information in the course of ads being served.
          </p>
          <p>
            For detailed insights on managing, inspecting, and clearing cookies, please review our dedicated{" "}
            <Link href="/cookies" className="text-cyan underline font-semibold">
              Cookie Policy
            </Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. How We Protect Your Data</h2>
          <p>
            We enforce strict security controls across all platform infrastructure:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Encrypted transport layer security (HTTPS / TLS 1.3) across all endpoints.</li>
            <li>Encrypted-at-rest database persistence managed by Google Cloud & Firebase infrastructure.</li>
            <li>Zero sale, rental, or trade of learner personal records or submitted credentials.</li>
            <li>Strict principle of least privilege applied to internal administrative interfaces.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Your Rights (GDPR & CCPA / CPRA)</h2>
          <p>
            Depending on your jurisdiction, you possess the right to request access to the personal data we hold about you, request corrections to inaccurate records, request deletion of your account and learning telemetry, or object to specific processing activities.
          </p>
          <p>
            To exercise any of these rights, contact our privacy officers directly at{" "}
            <a href="mailto:ikkaghostt@gmail.com" className="text-cyan underline">
              ikkaghostt@gmail.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Children&rsquo;s Privacy (COPPA)</h2>
          <p>
            ByteBreach does not knowingly collect or solicit personal identifiable information from anyone under the age of 13. If we discover that personal data of a minor under 13 has been collected without verifiable parental consent, we will promptly delete that information from our servers.
          </p>
        </section>

        <section className="space-y-3 border-t border-line/60 pt-5">
          <h2 className="text-lg font-bold text-white">8. Contact Us</h2>
          <p>
            If you have questions, feedback, or compliance inquiries regarding this Privacy Policy or our advertising practices, please reach out to:
          </p>
          <div className="rounded-xl border border-line bg-panel p-4 font-mono text-xs text-slate-300">
            <p className="text-cyan font-bold">ByteBreach Security Academy</p>
            <p>Email: ikkaghostt@gmail.com</p>
            <p>Domain: https://bytebreach.in</p>
            <p>Contact Uplink: /contact</p>
          </div>
        </section>
      </div>
    </PublicPage>
  );
}

