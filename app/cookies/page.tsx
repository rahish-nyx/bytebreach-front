import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Cookie Policy | Google AdSense & Browser Storage",
  description:
    "Details on how ByteBreach uses essential authentication tokens, session persistence, Google AdSense cookies, and privacy controls.",
};

export default function CookiesPage() {
  return (
    <PublicPage eyebrow="Browser storage & privacy" title="Cookie Policy">
      <div className="space-y-6 text-sm leading-7 text-slate-300">
        <p className="text-xs text-muted">Last Updated: September 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. What Are Cookies?</h2>
          <p>
            Cookies and local browser storage (such as HTML5 LocalStorage) are small data files placed on your device when you visit websites. They are widely used to maintain security, enable interactive web features, preserve authenticated sessions, and measure platform effectiveness.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Categories of Cookies We Use</h2>
          
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-panel p-4">
              <h3 className="font-bold text-white">A. Strictly Necessary & Authentication Cookies</h3>
              <p className="mt-1 text-xs text-muted leading-5">
                These tokens are essential for core platform operation. We use Firebase Authentication persistence and encrypted session tokens to keep your operative profile securely signed in, preserve your room deployment progress, and prevent cross-site request forgery (CSRF).
              </p>
            </div>

            <div className="rounded-xl border border-cyan/40 bg-cyan/5 p-4">
              <h3 className="font-bold text-cyan">B. Advertising, Google AdSense & Google AdMob</h3>
              <p className="mt-1 text-xs text-slate-200 leading-5">
                ByteBreach partners with Google AdSense (on web) and Google AdMob (on mobile applications) to serve advertisements that support free cybersecurity training. Google and its certified partners use cookies (such as DoubleClick cookies) and mobile device advertising identifiers to serve relevant ads based on prior browsing activity.
              </p>
              <p className="mt-2 text-xs text-slate-200 leading-5">
                These technologies help display relevant educational tools, prevent fraud, and limit the frequency of displayed advertisements.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4">
              <h3 className="font-bold text-white">C. Functional & Preferences Cookies</h3>
              <p className="mt-1 text-xs text-muted leading-5">
                These cookies remember choices you make (such as UI preferences, audio cues, or dismissed banners) to deliver a consistent, personalized experience.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. How to Manage and Opt Out of Cookies</h2>
          <p>
            You have full control over your cookie preferences:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">Google Personalized Ads Opt-Out:</strong> Visit{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline"
              >
                Google Ads Settings
              </a>{" "}
              to customize your Google ad experience or opt out of interest-based ads.
            </li>
            <li>
              <strong className="text-white">Industry Opt-Out Platforms:</strong> Opt out of third-party behavioral advertising at{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline"
              >
                aboutads.info/choices
              </a>{" "}
              or{" "}
              <a
                href="http://www.youronlinechoices.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline"
              >
                Your Online Choices (EU)
              </a>.
            </li>
            <li>
              <strong className="text-white">Browser Controls:</strong> Most web browsers allow you to reject all cookies, block third-party cookies, or clear existing cookies through their settings. Note that disabling strictly necessary cookies will prevent you from staying signed in.
            </li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-line/60 pt-5">
          <h2 className="text-lg font-bold text-white">4. Additional Privacy Disclosures</h2>
          <p>
            For a comprehensive review of our data protection practices, please read our full{" "}
            <Link href="/privacy" className="text-cyan underline font-semibold">
              Privacy Policy
            </Link>{" "}
            or contact us at{" "}
            <a href="mailto:support@bytebreach.in" className="text-cyan underline">
              support@bytebreach.in
            </a>.
          </p>
        </section>
      </div>
    </PublicPage>
  );
}

