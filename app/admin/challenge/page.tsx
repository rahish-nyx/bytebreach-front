"use client";

import { useEffect, useState } from "react";
import { collection, doc, increment, onSnapshot, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import { Check, FileText, Save, Sparkles, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { db } from "@/lib/firebaseConfig";
import { getRankFromXp } from "@/src/lib/ranks";
import { DAILY_CHALLENGE_XP } from "@/lib/submissions";

type Submission = { id: string; userId?: string; userHandle?: string; userEmail?: string; question?: string; answer?: string; fileUrl?: string; submittedAt?: { toDate?: () => Date } | Date; status?: string };
type ChallengeForm = { title: string; category: string; prompt: string; scenario: string; instructions: string; hint: string; answer: string };

function submittedDate(value: Submission["submittedAt"]) {
  if (!value) return "Unknown time";
  const date = value instanceof Date ? value : typeof value?.toDate === "function" ? value.toDate() : null;
  return date ? date.toLocaleString() : "Submitted";
}

export default function DailyChallengeAdmin() {
  const [tab, setTab] = useState<"editor" | "review">("editor");
  const [form, setForm] = useState<ChallengeForm>({ title: "", category: "General", prompt: "", scenario: "", instructions: "", hint: "", answer: "" });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [saved, setSaved] = useState(false);
  const [busyId, setBusyId] = useState("");

  useEffect(() => onSnapshot(doc(db, "dailyChallenges", "current"), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    setForm({
      title: String(data.title || ""),
      category: String(data.category || data.parentTopic || "General"),
      prompt: String(data.prompt || ""),
      scenario: String(data.scenario || ""),
      instructions: String(data.instructions || data.content || ""),
      hint: String(data.hint || ""),
      answer: String(data.answer || "")
    });
  }), []);

  useEffect(() => onSnapshot(query(collection(db, "dailySubmissions"), where("status", "==", "pending")), (snapshot) => {
    setSubmissions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Submission)));
  }), []);

  const saveChallenge = async () => {
    await setDoc(doc(db, "dailyChallenges", "current"), { ...form, parentTopic: form.category, updatedAt: serverTimestamp() }, { merge: true });
    setSaved(true);
  };

  const review = async (submission: Submission, approved: boolean) => {
    if (!submission.userId || busyId) return;
    setBusyId(submission.id);
    try {
      const rewardResponse = await fetch("/api/settings/public", { cache: "no-store" });
      const rewardData = rewardResponse.ok ? await rewardResponse.json() as { dailyChallengeXp?: number } : {};
      const dailyXp = Number(rewardData.dailyChallengeXp || DAILY_CHALLENGE_XP);
      await runTransaction(db, async (transaction) => {
        const submissionRef = doc(db, "dailySubmissions", submission.id);
        const userRef = doc(db, "users", submission.userId!);
        const snapshot = await transaction.get(userRef);
        const data = snapshot.data() || {};
        if (submission.status !== "pending") return;
        const currentXp = Number(data.xp || 0);
        const nextXp = approved ? currentXp + dailyXp : currentXp;
        transaction.update(submissionRef, { status: approved ? "approved" : "rejected", reviewedAt: serverTimestamp(), points: approved ? dailyXp : 0 });
        if (approved) transaction.set(userRef, { xp: increment(dailyXp), rank: getRankFromXp(nextXp) }, { merge: true });
        transaction.set(doc(db, "notifications", `daily-review-${submission.id}`), {
          userId: submission.userId,
          target: "user",
          title: approved ? "Daily Challenge Approved!" : "Daily Challenge Rejected",
          body: approved ? "Daily Challenge Approved! +50 XP has been credited to your operative profile." : "Daily Challenge XP is not Granted because Your submitted answer is wrong.",
          createdAt: serverTimestamp()
        });
      });
      void fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        target: "user",
        userId: submission.userId,
        title: approved ? "Daily Challenge Approved!" : "Daily Challenge Rejected",
        body: approved ? "Daily Challenge Approved! +50 XP has been credited to your operative profile." : "Daily Challenge XP is not Granted because Your submitted answer is wrong."
      }) });
    } finally {
      setBusyId("");
    }
  };

  return <AdminShell>
    <div className="eyebrow text-cyan">Command center / daily challenge</div>
    <h1 className="mt-2 text-3xl font-bold">Daily Challenge</h1>
    <p className="mt-2 text-sm text-muted">Publish challenge content and manually review student submissions before awarding XP.</p>
    <div className="mt-6 flex gap-2"><button onClick={() => setTab("editor")} className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "editor" ? "bg-violet text-white" : "bg-panel text-muted"}`}><Sparkles className="mr-2 inline" size={14}/>Challenge editor</button><button onClick={() => setTab("review")} className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "review" ? "bg-cyan text-ink" : "bg-panel text-muted"}`}><FileText className="mr-2 inline" size={14}/>Review queue ({submissions.length})</button></div>
    {tab === "editor" ? <section className="mt-6 max-w-3xl rounded-2xl border border-line bg-panel p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-2"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="field"/><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="field"/></div>
      <textarea value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} placeholder="Scenario brief" className="field mt-3 min-h-24 w-full"/>
      <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Question / challenge prompt" className="field mt-3 min-h-24 w-full"/>
      <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Detailed instructions / writeup (blogger-style content)" className="field mt-3 min-h-40 w-full"/>
      <textarea value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} placeholder="Hint" className="field mt-3 min-h-20 w-full"/>
      <input value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Internal answer for review" className="field mt-3 w-full"/>
      <button onClick={() => void saveChallenge()} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet px-4 py-3 text-xs font-bold text-white"><Save size={15}/>Save / Publish challenge</button>{saved && <div className="mt-3 text-xs text-cyan">Published and synced to student screens.</div>}
    </section> : <section className="mt-6 space-y-3">{submissions.length === 0 && <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No pending submissions.</div>}{submissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-line bg-panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{submission.userHandle || "Operative"}</div><div className="text-xs text-muted">{submission.userEmail} · {submittedDate(submission.submittedAt)}</div></div><span className="rounded-full bg-amber/10 px-2 py-1 text-xs text-amber">Pending review</span></div><div className="mt-4 rounded-xl bg-[#0b1018] p-4 text-sm whitespace-pre-wrap">{submission.answer || "File-only submission"}</div>{submission.fileUrl && <div className="mt-3 text-xs text-cyan">{submission.fileUrl.startsWith("telegram:") ? "Attachment delivered to Telegram" : <a className="underline" href={submission.fileUrl} target="_blank" rel="noreferrer">Open attachment</a>}</div>}<div className="mt-4 flex flex-wrap gap-2"><button disabled={busyId === submission.id} onClick={() => void review(submission, true)} className="flex min-h-10 items-center gap-2 rounded-xl bg-cyan px-3 py-2 text-xs font-bold text-ink"><Check size={14}/>Grant 50 XP</button><button disabled={busyId === submission.id} onClick={() => void review(submission, false)} className="flex min-h-10 items-center gap-2 rounded-xl border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300"><X size={14}/>Reject answer</button></div></article>)}</section>}
  </AdminShell>;
}
