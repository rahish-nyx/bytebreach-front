import Link from "next/link";
import { ByteBreachLogo } from "@/components/ByteBreachLogo";
import { ShieldCheck, Terminal } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/80 bg-[#060a12]/90 backdrop-blur-md pt-12 pb-16 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <ByteBreachLogo size={32} className="shrink-0" />
              <span className="font-extrabold tracking-tight text-white">
                BYTE<span className="text-cyan">BREACH</span>
              </span>
            </Link>
            <p className="mt-3 text-xs leading-5 text-muted max-w-xs">
              Hands-on cybersecurity academy, enterprise networking certification tracks (CCNA, CCNP, CCIE), and gamified CTF battleground.
            </p>
          </div>

          {/* Col 2: Learning Tracks */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Training Tracks
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/learning-paths/ccna" className="hover:text-cyan transition-colors">
                  CCNA Networking
                </Link>
              </li>
              <li>
                <Link href="/learning-paths/ccnp-enterprise" className="hover:text-cyan transition-colors">
                  CCNP Enterprise
                </Link>
              </li>
              <li>
                <Link href="/learning-paths/ccie" className="hover:text-cyan transition-colors">
                  CCIE Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/learning-paths/ethical-hacking" className="hover:text-cyan transition-colors">
                  Ethical Hacking CTF
                </Link>
              </li>
              <li>
                <Link href="/practice-labs" className="hover:text-cyan transition-colors">
                  Practice Labs Sandbox
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform Resources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform & Vault
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/resources" className="hover:text-cyan transition-colors">
                  Cheat Codes & Vault
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-cyan transition-colors">
                  Operative Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan transition-colors">
                  About the Academy
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-cyan transition-colors">
                  Careers & Roles
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-cyan transition-colors">
                  FAQ & Knowledge Base
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies (Google AdSense Required) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Legal & Disclosures
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-cyan transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-cyan transition-colors font-medium">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-cyan transition-colors">
                  Educational Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan transition-colors text-cyan font-semibold">
                  Contact Support Uplink
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider and copyright */}
        <div className="mt-10 border-t border-line/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck size={14} className="text-cyan shrink-0" />
            <span>&copy; {new Date().getFullYear()} ByteBreach Security Academy (<strong className="text-slate-300">bytebreach.in</strong>). All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-cyan transition">Privacy</Link>
            <span>&bull;</span>
            <Link href="/cookies" className="hover:text-cyan transition">Cookies</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-cyan transition">Terms</Link>
            <span>&bull;</span>
            <Link href="/contact" className="hover:text-cyan transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
