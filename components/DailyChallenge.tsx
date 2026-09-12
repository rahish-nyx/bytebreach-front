"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, FileText, Loader2, Send, Sparkles, Upload, X } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { DAILY_CHALLENGE_XP, submitDailyChallenge } from "@/lib/submissions";
import { updateUserActivity } from "@/lib/activity";

type Challenge = {
  title?: string;
  prompt?: string;
  scenario?: string;
  instructions?: string;
  category?: string;
  parentTopic?: string;
  difficulty?: "easy" | "medium";
  id?: string;
  updatedAt?: unknown;
};

export function DailyChallenge() {
  const router = useRouter();
  const { user } = useAuth();
  const { name } = useUserProfile();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setSubmitted(false);
      return;
    }
    return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const today = new Date().toISOString().slice(0, 10);
      setSubmitted(snapshot.data()?.lastDailySubmissionDate === today);
    });
  }, [user]);

  useEffect(() => {
    // Proactively verify 10:00 AM cycle rotation
    void fetch("/api/daily-challenge/rotate?sync=1").catch(() => {});
    return onSnapshot(doc(db, "dailyChallenges", "current"), (snapshot) => {
      setChallenge(snapshot.exists() ? (snapshot.data() as Challenge) : null);
    });
  }, []);

  const submit = async () => {
    if (!user) {
      setError("Sign in before submitting the daily challenge.");
      return;
    }
    if (!answer.trim() && !file) {
      setError("Add an answer or attach a DOCX, PDF, or TXT file.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("studentName", name || user.displayName || "Operative");
      form.append("studentEmail", user.email || "");
      form.append("parentTopic", challenge?.parentTopic || "General");
      form.append("challengeTitle", challenge?.title || "Daily challenge");
      form.append("answer", answer.trim());
      if (file) form.append("attachment", file, file.name);

      const telegramResponse = await fetch("/api/telegram/notify", {
        method: "POST",
        body: form,
      });

      if (!telegramResponse.ok) {
        const result = (await telegramResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "Telegram delivery failed.");
      }

      const telegramResult = (await telegramResponse.json()) as { attachmentId?: string };
      const result = await submitDailyChallenge(
        user.uid,
        name || user.displayName || "Operative",
        user.email || "",
        challenge?.prompt || challenge?.title || "Daily challenge",
        answer.trim(),
        telegramResult.attachmentId ? `telegram:${telegramResult.attachmentId}` : ""
      );

      if (result === "already-submitted") {
        setSubmitted(true);
        setError("Already submitted today. No second submission is allowed.");
        return;
      }

      setSubmitted(true);
      void updateUserActivity(user.uid);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Submission failed. Check your Firebase Storage and Firestore rules."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!challenge) {
    return (
      <section className="rounded-2xl border border-violet/20 bg-violet/[.05] p-4 sm:p-5 text-xs sm:text-sm text-muted">
        <div className="flex items-center gap-2 text-violet">
          <Sparkles size={16} className="animate-pulse" />
          <span className="font-bold">Daily challenge</span>
        </div>
        <p className="mt-2">Daily challenge loading...</p>
      </section>
    );
  }

  const canSubmit = Boolean(answer.trim() || file);

  return (
    <section className="rounded-2xl border border-violet/25 bg-gradient-to-b from-violet/[.08] to-violet/[.02] p-4 sm:p-5 shadow-lg shadow-violet-500/5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between text-xs tracking-wider">
        <div className="flex items-center gap-2 text-violet font-semibold uppercase">
          <Sparkles size={16} />
          <span>Daily challenge</span>
        </div>
        {challenge.difficulty && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              challenge.difficulty === "easy"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {challenge.difficulty}
          </span>
        )}
      </div>

      <h2 className="mt-2.5 text-base sm:text-lg font-bold text-white tracking-tight">
        {challenge.title || "Daily breach challenge"}
      </h2>

      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-300/90">
        {challenge.prompt}
      </p>

      {/* Row 1: Answer Input & Attachment */}
      {!submitted && (
        <div
          onClick={!user ? () => router.push("/login?redirect=%2F") : undefined}
          className={`mt-4 flex flex-col gap-2 sm:flex-row sm:items-center ${!user ? "cursor-pointer" : ""}`}
        >
          <input
            readOnly={!user}
            disabled={Boolean(user && busy)}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={user ? "Submit your answer..." : "Click to sign in & submit your answer..."}
            className={`field min-w-0 flex-1 text-xs sm:text-sm ${
              !user ? "cursor-pointer hover:border-cyan/50" : "disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <label
              className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-[#0b1018] px-3.5 py-2.5 text-xs text-muted transition hover:border-violet/50 hover:text-white ${
                !user ? "cursor-pointer" : busy ? "cursor-not-allowed opacity-40" : "cursor-pointer"
              }`}
            >
              <Upload size={14} className="text-violet shrink-0" />
              <span className="max-w-[120px] truncate">{file ? file.name : "Attach"}</span>
              <input
                disabled={!user || busy}
                type="file"
                accept=".docx,.pdf,.txt"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label="Remove attachment"
                className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-[#0b1018] text-muted hover:border-red-500/50 hover:text-red-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row 2: Full-Width Primary Action Button */}
      {submitted ? (
        <div className="mt-4">
          <button
            type="button"
            disabled
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs sm:text-sm font-bold text-emerald-300 cursor-not-allowed shadow-sm transition-all"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            Submitted for review ✔️
          </button>
          <p className="mt-2 text-center text-xs text-emerald-400/90 font-medium">
            Under manual review • Resets in 24 hours
          </p>
        </div>
      ) : !user ? (
        <Link
          href="/login?redirect=%2F"
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.99]"
        >
          <Send size={15} />
          Sign in to submit
        </Link>
      ) : (
        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={(event) => {
            event.preventDefault();
            void submit();
          }}
          className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            busy
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white opacity-80 cursor-wait shadow-lg shadow-cyan-500/20"
              : canSubmit
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.99] cursor-pointer"
              : "bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
          }`}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Transmitting...
            </>
          ) : (
            <>
              <Send size={15} />
              Submit for review
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Helper Note */}
      <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-muted">
        <FileText size={14} className="shrink-0 text-violet" />
        <span>Accepted attachments: DOCX, PDF, TXT • Review reward: {DAILY_CHALLENGE_XP} XP</span>
      </div>
    </section>
  );
}

export const DailyChallengeCard = DailyChallenge;
