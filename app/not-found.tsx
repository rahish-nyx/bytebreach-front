import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, Home, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "404: Page Not Found | ByteBreach Security Academy",
  description: "The requested tactical resource, study room, or route could not be found on ByteBreach.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center grid-bg bg-[#080b12] p-5 text-slate-100 selection:bg-cyan/20 selection:text-cyan">
      <div className="w-full max-w-xl rounded-3xl border border-line/80 bg-panel/90 p-7 sm:p-10 shadow-[0_0_50px_rgba(6,182,212,0.12)] backdrop-blur-xl">
        {/* Top Status Badge */}
        <div className="flex items-center justify-between border-b border-line/60 pb-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse" />
            <span className="eyebrow text-red-400 font-mono text-[11px] tracking-wider">
              ERROR 404 // BREACH TERMINATED
            </span>
          </div>
          <span className="rounded-lg border border-line bg-[#080d16] px-2 py-1 font-mono text-[10px] text-muted">
            HTTP_NOT_FOUND
          </span>
        </div>

        {/* Content Section */}
        <div className="mt-8 flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <AlertTriangle size={32} />
          </div>

          <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            404 - Page Not Found
          </h1>
          <p className="mt-1 text-xs font-mono text-cyan">
            TARGET NODE NOT FOUND // BREACH TERMINATED
          </p>

          <p className="mt-3 text-sm leading-6 text-muted">
            The requested tactical resource, study room, or route could not be reached. The endpoint may have been decommissioned, relocated, or entered incorrectly.
          </p>

          {/* Terminal Box */}
          <div className="mt-6 w-full rounded-2xl border border-line bg-[#060a11] p-4 font-mono text-xs text-slate-400 overflow-x-auto">
            <div className="flex items-center gap-2 text-[10px] text-muted border-b border-line/40 pb-2 mb-2">
              <Terminal size={12} className="text-cyan" />
              <span>DIAGNOSTIC LOG</span>
            </div>
            <p className="text-red-400/90">&gt; GET target URI: UNRESOLVED</p>
            <p className="text-slate-500">&gt; Status: 404 (Node unavailable)</p>
            <p className="text-cyan/80">&gt; Recommended action: Fallback to active mission cluster</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-line/60 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-ink hover:bg-cyan/90 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Home size={15} />
            Return to Dashboard
          </Link>

          <Link
            href="/learning-paths"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-cyan hover:border-cyan/50 transition-all"
          >
            <BookOpen size={15} />
            Learning Paths
          </Link>

          <Link
            href="/practice-labs"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-cyan hover:border-cyan/50 transition-all"
          >
            <Terminal size={15} />
            Practice Labs
          </Link>
        </div>
      </div>
    </main>
  );
}
