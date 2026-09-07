"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { ArrowLeft, CheckCircle2, Flag, LockKeyhole, Play, Terminal } from "lucide-react";
import { showModuleCompletionAd } from "@/services/admobService";
import { completeModule, completeRoomLab, recordLearningActivity } from "@/lib/submissions";
import { saveModuleProgress } from "@/lib/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { StudentShell } from "@/components/StudentShell";
import { useAuth } from "@/src/context/AuthContext";
import { useLearningTimer } from "@/hooks/useLearningTimer";
import { updateUserActivity } from "@/lib/activity";
import { renderMarkdown } from "@/lib/markdown";

type Question = { id: string; question: string; prompt?: string; answer: string; correctAnswer?: string; explanation?: string; points?: number; type?: "direct" | "mcq"; options?: { A: string; B: string; C: string; D: string }; correctOption?: "A" | "B" | "C" | "D" };
type Module = { id: string; title?: string; parentLabel?: string; trackId?: string; duration?: string; content?: string; notes?: string; questions?: Question[]; labChallenge?: { name?: string; briefing?: string; target?: string; flag?: string; points?: number } };

export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, string>>({});
  const [isKnowledgeCheckComplete, setIsKnowledgeCheckComplete] = useState(false);
  const [studyDone, setStudyDone] = useState(false);
  const [labAnswer, setLabAnswer] = useState("");
  const [labDone, setLabDone] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [finishing, setFinishing] = useState(false);

  useLearningTimer(user?.uid || auth.currentUser?.uid);

  useEffect(() => {
    void params.then(async ({ slug }) => {
      const snapshot = await getDoc(doc(db, "modules", slug));
      setModule(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Module : null);
      setLoading(false);
    });
  }, [params]);
  useEffect(() => {
    if (!module || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    void updateUserActivity(uid);
    void recordLearningActivity(uid);
    void getDoc(doc(db, "users", uid, "progress", module.id)).then((snapshot) => setCompleted(snapshot.data()?.status === "completed"));
    const timer = window.setTimeout(() => setStudyDone(true), 8000);
    const onScroll = () => { if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight * 0.75) setStudyDone(true); };
    window.addEventListener("scroll", onScroll);
    return () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, [module]);

  const knowledgeDone = useMemo(() => {
    const questions = module?.questions || [];
    return questions.length === 0 || questions.every((item) => solvedMap[item.id] === true);
  }, [module, solvedMap]);
  useEffect(() => {
    setIsKnowledgeCheckComplete(knowledgeDone);
  }, [knowledgeDone]);
  const hasLab = Boolean(module?.labChallenge?.name && module.labChallenge.flag);
  const ready = studyDone && isKnowledgeCheckComplete && (!hasLab || labDone);

  const handleCheckQuestion = (qId: string, correctAnswer: string) => {
    const input = (answers[qId] || "").trim().toUpperCase();
    const expected = (correctAnswer || "").trim().toUpperCase();
    const question = module?.questions?.find((item) => item.id === qId);
    const isCorrect = question?.type === "mcq"
      ? input === expected || input === (question.correctOption || "").trim().toUpperCase() || input === (question.correctAnswer || "").trim().toUpperCase()
      : input === expected;
    setQuestionFeedback((previous) => ({ ...previous, [qId]: isCorrect ? "Answer accepted! Complete all questions to finish the room." : "Incorrect answer, try again." }));
    if (isCorrect) {
      setSolvedMap((previous) => ({ ...previous, [qId]: true }));
      setIsKnowledgeCheckComplete(Boolean(module?.questions?.length) && (module?.questions || []).every((question) => question.id === qId || solvedMap[question.id] === true));
    }
  };

  const checkLab = async () => {
    if (!module?.labChallenge?.flag) return;
    if (labAnswer.trim().toUpperCase() === module.labChallenge.flag.trim().toUpperCase()) { setLabDone(true); setError(""); if (auth.currentUser) await completeRoomLab(auth.currentUser.uid, module.id, module.labChallenge.points || 0); }
    else setError("Invalid lab flag. Analyze the briefing and try again.");
  };
  const finishRoom = async () => {
    if (!module || !auth.currentUser || completed || !ready) return;
    setFinishing(true); setError("");
    try {
      const awarded = await completeModule(auth.currentUser.uid, module.id, module.trackId || "", 25, Number.parseInt(module.duration || "30", 10) || 30);
      if (awarded) await saveModuleProgress(auth.currentUser.uid, module.id, { status: "completed", percent: 100 });
      setCompleted(true);
      await showModuleCompletionAd();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save room completion."); }
    finally { setFinishing(false); }
  };
  if (loading) return <StudentShell><div className="grid min-h-screen place-items-center text-sm text-muted">Loading room...</div></StudentShell>;
  if (!module) return <StudentShell><div className="grid min-h-screen place-items-center text-sm text-muted">This module could not be found.</div></StudentShell>;
  return <StudentShell><div className="grid-bg min-h-screen"><header className="flex min-h-[64px] items-center border-b border-line px-4 sm:px-6 md:h-[72px] md:px-10"><Link href={`/learning-paths/${module.trackId || ""}`} className="flex items-center gap-2 text-xs text-muted hover:text-cyan"><ArrowLeft size={16}/> Back to learning path</Link><span className="mx-3 text-line">/</span><span className="truncate text-xs text-muted">{module.parentLabel || module.trackId || "Learning"} / {module.title}</span></header><div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1fr_300px] lg:gap-8"><article className="min-w-0"><div className="eyebrow text-cyan">{module.parentLabel || "Learning module"}</div><h1 className="mt-3 text-3xl font-bold sm:text-4xl">{module.title}</h1><p className="mt-3 text-sm text-muted">{module.duration || "Self-paced"} learning room</p>  <div className="room-content mt-7 prose prose-invert max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: renderMarkdown(module.content || module.notes || "<p>No study content has been published yet.</p>") }}/>{module.questions?.map((item) => <div key={item.id} className="mt-7 rounded-2xl border border-cyan/20 bg-cyan/[.04] p-4 sm:p-5"><div className="flex items-center gap-2 text-sm font-semibold text-cyan"><Flag size={16}/> {item.prompt || item.question}</div>{item.type === "mcq" && item.options ? <><div className="mt-4 grid gap-2 sm:grid-cols-2">{(["A", "B", "C", "D"] as const).map((option) => <label key={option} className={`rounded-xl border p-3 text-xs ${answers[item.id] === option ? "border-cyan text-cyan" : "border-line text-muted"}`}><input type="radio" name={item.id} value={option} disabled={solvedMap[item.id]} checked={answers[item.id] === option} onChange={(event) => setAnswers({ ...answers, [item.id]: event.target.value })}/> <span className="ml-2">{option}. {item.options?.[option]}</span></label>)}</div><button type="button" onClick={() => handleCheckQuestion(item.id, item.correctOption || item.correctAnswer || item.answer)} disabled={solvedMap[item.id] || !answers[item.id]?.trim()} className={`mt-3 shrink-0 rounded-lg px-5 py-2.5 text-sm font-bold tracking-wide transition-all ${solvedMap[item.id] ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400" : "    bg-[#22d3ee] text-[#06111f] shadow-lg shadow-cyan-500/20 hover:bg-[#67e8f9]"}`}>{solvedMap[item.id] ? "Accepted ✔" : "Check"}</button></> : <div className="mt-3 flex w-full items-center gap-3"><input type="text" value={answers[item.id] || ""} onChange={(event) => setAnswers({ ...answers, [item.id]: event.target.value })} placeholder="Enter your answer" disabled={solvedMap[item.id]} className="flex-1 rounded-lg border border-cyan-500/30 bg-[#0d1527] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"/><button type="button" onClick={() => handleCheckQuestion(item.id, item.correctAnswer || item.answer)} disabled={solvedMap[item.id] || !answers[item.id]?.trim()} className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-bold tracking-wide transition-all ${solvedMap[item.id] ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"   : "cursor-pointer bg-[#22d3ee] text-[#06111f] shadow-lg shadow-cyan-500/20 hover:bg-[#67e8f9] disabled:cursor-not-allowed disabled:opacity-50"}`}>{solvedMap[item.id] ? "Accepted ✔" : "Check"}</button></div>}{questionFeedback[item.id] && <div className={`mt-3 text-xs ${solvedMap[item.id] ? "text-emerald-400" : "text-red-400"}`}>{questionFeedback[item.id]}</div>}{solvedMap[item.id] && item.explanation && <div className="mt-3 rounded-xl border border-cyan/20 bg-cyan/[.06] p-3 text-xs leading-relaxed text-slate-300"><strong className="text-cyan">Explanation: </strong>{item.explanation}</div>}</div>)}{hasLab && <div className="mt-7 rounded-2xl border border-violet/30 bg-violet/[.05] p-5"><div className="flex items-center gap-2 font-semibold text-violet-200"><Terminal size={16}/> {module.labChallenge?.name}</div><p className="mt-2 text-sm text-muted">{module.labChallenge?.briefing}</p>{module.labChallenge?.target && <div className="mt-2 font-mono text-xs text-cyan">{module.labChallenge.target}</div>}<div className="mt-4 flex flex-col gap-2 sm:flex-row"><input disabled={labDone} value={labAnswer} onChange={(event) => setLabAnswer(event.target.value)} placeholder="FLAG{...}" className="field flex-1"/>  <button disabled={labDone} onClick={() => void checkLab()} className="rounded-xl bg-violet-300 px-4 py-3 text-xs font-bold text-ink">{labDone ? "Captured ✔" : "Check flag"}</button></div></div>}<button onClick={() => void finishRoom()} disabled={completed || finishing || !ready} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={16}/>{completed ? "Completed ✔" : finishing ? "Saving..." : ready ? "Complete room (+25 XP)" : "Complete the checklist first"}</button>{error && <div className="mt-3 text-xs text-red-300">{error}</div>}</article><aside><div className="rounded-2xl border border-line bg-panel p-4 sm:sticky sm:top-5 sm:p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Terminal size={16} className="text-cyan"/> Room progress</div><div className="mt-6 space-y-3 text-xs"><div className={`flex items-center gap-3 ${studyDone ? "text-cyan" : "text-muted"}`}>{studyDone ? <CheckCircle2 size={15}/> : <Play size={14} fill="currentColor"/>} Study content</div><div className={`flex items-center gap-3 ${knowledgeDone ? "text-cyan" : "text-muted"}`}>{  isKnowledgeCheckComplete ? <CheckCircle2 size={15}/> : <Play size={14} fill="currentColor"/>} Knowledge check{isKnowledgeCheckComplete && " ✔"}</div><div className={`flex items-center gap-3 ${!hasLab || labDone ? "text-cyan" : "text-muted"}`}>{!hasLab || labDone ? <CheckCircle2 size={15}/> : <LockKeyhole size={14}/>} Lab challenge{!hasLab && " (not required)"}</div></div></div></aside></div></div></StudentShell>;
}
