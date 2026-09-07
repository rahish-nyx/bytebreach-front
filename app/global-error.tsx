"use client";

import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-[#080b12] p-5 font-sans text-slate-100 antialiased">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-[#0e1522] p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400">
              <AlertOctagon size={24} />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-red-400 uppercase font-mono">
                CRITICAL CORE FAILURE
              </div>
              <h1 className="text-xl font-bold text-white">Root Application Exception</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            A critical fault was encountered at the root application layer. Please re-initialize the connection.
          </p>

          {error.digest && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-[#060a11] p-3 font-mono text-xs text-slate-400">
              <span className="text-slate-500">Incident Digest: </span>
              <span className="text-cyan-400">{error.digest}</span>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-all"
            >
              <RefreshCw size={14} />
              Re-initialize Core
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              Force Reload
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
