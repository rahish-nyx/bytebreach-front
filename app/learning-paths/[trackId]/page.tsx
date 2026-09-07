"use client";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Lock, Terminal } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { StudentShell } from "@/components/StudentShell";
import { renderMarkdown } from "@/lib/markdown";
import { getRankTier } from "@/src/lib/ranks";

type Question = { id: string; question: string; prompt?: string; answer: string; points: number };
type Module = { id: string; title?: string; duration?: string; order?: number; content?: string; notes?: string; questions?: Question[] };

export default function TrackDetail({ params }: { params: Promise<{ trackId: string }> }) {
  const [trackId, setTrackId] = useState("");
  const [track, setTrack] = useState<{ title?: string; description?: string; content?: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { progress } = useStudentProgress();
  useEffect(() => { params.then(({ trackId: id }) => setTrackId(id)); }, [params]);
  useEffect(() => {
    if (!trackId) return;
    return onSnapshot(doc(db, "tracks", trackId), (snap) => setTrack(snap.exists() ? snap.data() as typeof track : null));
  }, [trackId]);
  useEffect(() => {
    if (!trackId) return;
    return onSnapshot(
      query(collection(db, "modules"), where("trackId", "==", trackId), where("published", "==", true)),
      (snap) => setModules(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Module)).sort((a, b) => (a.order || 0) - (b.order || 0)))
    );
  }, [trackId]);
  const check = async (moduleId: string, question: Question) => {
    if (!user || solved[question.id]) return;
    if (answers[question.id]?.trim().toLowerCase() !== question.answer.trim().toLowerCase()) return;
    setSolved((items) => ({ ...items, [question.id]: true }));

    const earnedXp = Number(question.points || 0);
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    const currentXp = Number(userSnap.data()?.xp ?? (user as any)?.xp ?? 0);
    const updatedXp = currentXp + earnedXp;
    const updatedRank = getRankTier(updatedXp).name;
    await updateDoc(userDocRef, {
      xp: updatedXp,
      rank: updatedRank,
    });
  };
  return <StudentShell><div className="grid-bg min-h-screen">
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/learning-paths" className="inline-flex items-center gap-2 rounded-lg py-2 text-xs text-muted transition hover:text-cyan"><ArrowLeft size={15}/> All learning paths</Link>
      <div className="mt-7 rounded-2xl border border-cyan/20 bg-cyan/[.04] p-5 sm:mt-8 sm:p-7"><div className="eyebrow text-cyan">Live learning path</div><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{track?.title || "Loading path..."}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{track?.description || "Follow the modules below to progress through this specialization."}</p>{track?.content && <div className="prose prose-invert mt-6 max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: track.content }}/>}<div className="mt-5 flex items-center gap-2 text-xs text-cyan"><Terminal size={14}/> {progress.filter((item) => item.status === "completed" && modules.some((module) => module.id === item.id)).length}/{modules.length} modules completed</div></div>
      {modules.length === 0 ? <div className="glass mt-6 rounded-2xl p-8 text-center"><p className="text-sm text-muted">No published modules are available for this path yet.</p></div> : <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">{modules.map((module) => <section key={module.id} className="glass rounded-2xl p-4 sm:p-7"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3 sm:gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan sm:h-11 sm:w-11"><Terminal size={20}/></div><div className="min-w-0"><div className="eyebrow">Module {module.order || 1} · {module.duration || "Self-paced"}</div><h2 className="mt-1 text-lg font-semibold sm:text-xl">{module.title}</h2></div></div><Link href={`/room/${module.id}`} className="shrink-0 rounded-lg bg-cyan px-3 py-2 text-xs font-bold text-ink">Open room</Link></div>{(module.content || module.notes) && <div className="prose prose-invert mt-5 max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: renderMarkdown(module.content || module.notes || "") }}/>}<div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">{(module.questions || []).length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-xs text-muted">This module has no questions yet.</p> : (module.questions || []).map((question) => <div key={question.id} className="rounded-xl border border-line bg-[#0b1018] p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm leading-6">{question.prompt || question.question}</p>{solved[question.id] ? <CheckCircle2 className="shrink-0 text-cyan" size={18}/> : user ? <Circle className="shrink-0 text-muted" size={16}/> : <Lock className="shrink-0 text-muted" size={16}/>}</div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input disabled={solved[question.id] || !user} value={answers[question.id] || ""} onChange={(event) => setAnswers((items) => ({ ...items, [question.id]: event.target.value }))} placeholder={user ? "Enter answer..." : "Sign in to answer"} className="field min-w-0 flex-1"/><button disabled={solved[question.id] || !user} onClick={() => check(module.id, question)} className="min-h-10 rounded-lg bg-cyan px-4 text-xs font-bold text-ink transition hover:bg-cyan/90 disabled:cursor-not-allowed disabled:opacity-40">Check answer</button></div>{solved[question.id] && <span className="mt-3 inline-block rounded-full bg-cyan/10 px-2 py-1 text-[10px] font-bold text-cyan">Correct · +{question.points} XP</span>}</div>)}</div></section>)}</div>}
    </div>
  </div></StudentShell>;
}
