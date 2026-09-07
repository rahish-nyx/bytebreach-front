import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function PublicPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="grid-bg min-h-screen px-4 py-8 sm:px-6 sm:py-14"><div className="mx-auto max-w-4xl"><Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-cyan"><ArrowLeft size={15}/> Back to ByteBreach</Link><div className="mt-12 rounded-3xl border border-line bg-panel/90 p-6 shadow-2xl sm:p-10"><div className="eyebrow flex items-center gap-2 text-cyan"><ShieldCheck size={15}/>{eyebrow}</div><h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1><div className="public-content mt-7 space-y-6 text-sm leading-7 text-slate-300">{children}</div></div></div></main>;
}
