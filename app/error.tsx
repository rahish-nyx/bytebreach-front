"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client exceptions
    console.error("ByteBreach Runtime Error Boundary Caught:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center grid-bg bg-[#080b12] p-5 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-panel/95 p-7 sm:p-9 shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <AlertOctagon size={24} />
          </div>
          <div>
            <div className="eyebrow text-red-400 font-mono text-[10px] tracking-wider">
              SYSTEM EXCEPTION ENCOUNTERED
            </div>
            <h1 className="mt-1 text-xl font-bold text-white">Execution Interrupted</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          An unexpected error occurred while rendering this academy workspace. The operative session has been safely isolated to prevent data corruption.
        </p>

        {error.digest && (
          <div className="mt-4 rounded-xl border border-line bg-[#060a11] p-3 font-mono text-xs text-slate-400">
            <span className="text-muted">Incident Digest: </span>
            <span className="text-cyan">{error.digest}</span>
          </div>
        )}

        <div className="mt-7 pt-5 border-t border-line/60 flex flex-wrap items-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-ink hover:bg-cyan/90 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <RefreshCw size={14} />
            Re-attempt Connection
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:border-cyan/50 transition-all"
          >
            <Home size={14} />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
