"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { db } from "@/lib/firebaseConfig";
import { getRankFromXp } from "@/src/lib/ranks";
import { DAILY_CHALLENGE_XP } from "@/lib/submissions";
import { DAILY_CHALLENGE_POOL, ChallengePoolItem } from "@/lib/dailyChallengePool";
import { getCurrentCycleDate, getNextCycleRotationTime } from "@/lib/dailyChallengeScheduler";

type Submission = {
  id: string;
  userId?: string;
  userHandle?: string;
  userEmail?: string;
  question?: string;
  answer?: string;
  fileUrl?: string;
  submittedAt?: { toDate?: () => Date } | Date;
  status?: string;
};

type ChallengeForm = {
  title: string;
  category: string;
  prompt: string;
  scenario: string;
  instructions: string;
  hint: string;
  answer: string;
  difficulty?: "easy" | "medium";
};

type LiveChallengeMeta = {
  title?: string;
  source?: "auto" | "manual";
  manualCycle?: string;
  manualDate?: string;
  autoCycle?: string;
  poolQuestionId?: string;
  difficulty?: string;
  updatedAt?: { toDate?: () => Date } | Date;
};

function submittedDate(value: Submission["submittedAt"]) {
  if (!value) return "Unknown time";
  const date = value instanceof Date ? value : typeof value?.toDate === "function" ? value.toDate() : null;
  return date ? date.toLocaleString() : "Submitted";
}

export default function DailyChallengeAdmin() {
  const [tab, setTab] = useState<"editor" | "review" | "pool">("editor");
  const [form, setForm] = useState<ChallengeForm>({
    title: "",
    category: "General",
    prompt: "",
    scenario: "",
    instructions: "",
    hint: "",
    answer: "",
    difficulty: "easy",
  });
  const [liveMeta, setLiveMeta] = useState<LiveChallengeMeta | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [saved, setSaved] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [rotatorLoading, setRotatorLoading] = useState(false);
  const [rotatorMessage, setRotatorMessage] = useState("");

  // Pool explorer filters
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const currentCycle = getCurrentCycleDate();
  const nextRotationDate = getNextCycleRotationTime();

  useEffect(() => {
    return onSnapshot(doc(db, "dailyChallenges", "current"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setLiveMeta(data as LiveChallengeMeta);
      setForm({
        title: String(data.title || ""),
        category: String(data.category || data.parentTopic || "General"),
        prompt: String(data.prompt || ""),
        scenario: String(data.scenario || ""),
        instructions: String(data.instructions || data.content || ""),
        hint: String(data.hint || ""),
        answer: String(data.answer || ""),
        difficulty: (data.difficulty as "easy" | "medium") || "easy",
      });
    });
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "dailySubmissions"), where("status", "==", "pending")),
      (snapshot) => {
        setSubmissions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Submission)));
      }
    );
  }, []);

  const isManualToday =
    liveMeta?.source === "manual" &&
    (liveMeta?.manualCycle === currentCycle || liveMeta?.manualDate === currentCycle);

  const saveChallenge = async () => {
    const cycle = getCurrentCycleDate();
    await setDoc(
      doc(db, "dailyChallenges", "current"),
      {
        ...form,
        parentTopic: form.category,
        source: "manual",
        manualCycle: cycle,
        manualDate: cycle,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setSaved(true);
    setRotatorMessage("Custom challenge published! 10:00 AM auto-rotation is paused for today.");
    setTimeout(() => setSaved(false), 5000);
  };

  const handleForceRotate = async () => {
    setRotatorLoading(true);
    setRotatorMessage("");
    try {
      const response = await fetch("/api/daily-challenge/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force_rotate" }),
      });
      const data = await response.json();
      if (data.success) {
        setRotatorMessage("Force rotated to next challenge from 100-question pool!");
      } else {
        setRotatorMessage(`Rotation error: ${data.error || "Unknown"}`);
      }
    } catch (error) {
      setRotatorMessage("Failed to execute rotation request.");
    } finally {
      setRotatorLoading(false);
    }
  };

  const handleResetToAuto = async () => {
    setRotatorLoading(true);
    setRotatorMessage("");
    try {
      const response = await fetch("/api/daily-challenge/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_auto" }),
      });
      const data = await response.json();
      if (data.success) {
        setRotatorMessage("Reset to scheduled auto-pool question! Manual override cleared.");
      } else {
        setRotatorMessage(`Reset error: ${data.error || "Unknown"}`);
      }
    } catch (error) {
      setRotatorMessage("Failed to execute reset.");
    } finally {
      setRotatorLoading(false);
    }
  };

  const handleLoadFromPool = (item: ChallengePoolItem, publishDirectly = false) => {
    setForm({
      title: item.title,
      category: item.category,
      prompt: item.prompt,
      scenario: item.scenario,
      instructions: item.instructions,
      hint: item.hint,
      answer: item.answer,
      difficulty: item.difficulty,
    });

    if (publishDirectly) {
      const cycle = getCurrentCycleDate();
      void setDoc(
        doc(db, "dailyChallenges", "current"),
        {
          title: item.title,
          category: item.category,
          parentTopic: item.category,
          difficulty: item.difficulty,
          prompt: item.prompt,
          scenario: item.scenario,
          instructions: item.instructions,
          hint: item.hint,
          answer: item.answer,
          poolQuestionId: item.id,
          source: "manual",
          manualCycle: cycle,
          manualDate: cycle,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).then(() => {
        setRotatorMessage(`Published "${item.title}"! (Set as manual override for today)`);
      });
    }

    setTab("editor");
  };

  const review = async (submission: Submission, approved: boolean) => {
    if (!submission.userId || busyId) return;
    setBusyId(submission.id);
    try {
      const rewardResponse = await fetch("/api/settings/public", { cache: "no-store" });
      const rewardData = rewardResponse.ok
        ? ((await rewardResponse.json()) as { dailyChallengeXp?: number })
        : {};
      const dailyXp = Number(rewardData.dailyChallengeXp || DAILY_CHALLENGE_XP);
      await runTransaction(db, async (transaction) => {
        const submissionRef = doc(db, "dailySubmissions", submission.id);
        const userRef = doc(db, "users", submission.userId!);
        const snapshot = await transaction.get(userRef);
        const data = snapshot.data() || {};
        if (submission.status !== "pending") return;
        const currentXp = Number(data.xp || 0);
        const nextXp = approved ? currentXp + dailyXp : currentXp;
        transaction.update(submissionRef, {
          status: approved ? "approved" : "rejected",
          reviewedAt: serverTimestamp(),
          points: approved ? dailyXp : 0,
        });
        if (approved) {
          transaction.set(
            userRef,
            { xp: increment(dailyXp), rank: getRankFromXp(nextXp) },
            { merge: true }
          );
        }
        transaction.set(doc(db, "notifications", `daily-review-${submission.id}`), {
          userId: submission.userId,
          target: "user",
          title: approved ? "Daily Challenge Approved!" : "Daily Challenge Rejected",
          body: approved
            ? `Daily Challenge Approved! +${dailyXp} XP has been credited to your operative profile.`
            : "Daily Challenge XP is not Granted because Your submitted answer is wrong.",
          createdAt: serverTimestamp(),
        });
      });
      void fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "user",
          userId: submission.userId,
          title: approved ? "Daily Challenge Approved!" : "Daily Challenge Rejected",
          body: approved
            ? `Daily Challenge Approved! +${dailyXp} XP has been credited to your operative profile.`
            : "Daily Challenge XP is not Granted because Your submitted answer is wrong.",
        }),
      });
    } finally {
      setBusyId("");
    }
  };

  // Filter pool questions
  const categories = useMemo(() => {
    const set = new Set(DAILY_CHALLENGE_POOL.map((q) => q.category));
    return Array.from(set);
  }, []);

  const filteredPool = useMemo(() => {
    return DAILY_CHALLENGE_POOL.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesPrompt = item.prompt.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        return matchesTitle || matchesPrompt || matchesCat || matchesId;
      }
      return true;
    });
  }, [searchQuery, difficultyFilter, categoryFilter]);

  return (
    <AdminShell>
      <div className="eyebrow text-cyan">Command center / daily challenge</div>
      <h1 className="mt-2 text-3xl font-bold">Daily Challenge</h1>
      <p className="mt-2 text-sm text-muted">
        Automated 10:00 AM rotation, 100-question pool, manual overrides, and student submission reviews.
      </p>

      {/* Rotation Status Banner */}
      <div className="mt-6 rounded-2xl border border-cyan/25 bg-gradient-to-r from-[#0d1726] to-[#080f1a] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted">Current Cycle:</span>
              <span className="font-mono text-xs font-bold text-slate-200">{currentCycle}</span>

              {isManualToday ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  <AlertCircle size={12} />
                  Manual Override Active for Today (10 AM auto-rotation skipped)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 size={12} />
                  Auto-Rotation Active (10:00 AM Daily)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock size={13} className="text-cyan shrink-0" />
              <span>
                Next scheduled rotation:{" "}
                <strong className="text-slate-300">
                  {nextRotationDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} IST
                </strong>{" "}
                ({nextRotationDate.toLocaleDateString()})
              </span>
            </div>

            {liveMeta?.title && (
              <div className="text-xs text-slate-400">
                Live Challenge: <strong className="text-white">{liveMeta.title}</strong>
                {liveMeta.difficulty && (
                  <span className="ml-2 uppercase text-[10px] font-bold text-cyan">
                    [{liveMeta.difficulty}]
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isManualToday && (
              <button
                type="button"
                disabled={rotatorLoading}
                onClick={() => void handleResetToAuto()}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan hover:text-cyan"
              >
                <RefreshCw size={13} className={rotatorLoading ? "animate-spin" : ""} />
                Reset to Auto-Pool
              </button>
            )}

            <button
              type="button"
              disabled={rotatorLoading}
              onClick={() => void handleForceRotate()}
              className="flex items-center gap-1.5 rounded-xl bg-cyan px-3 py-2 text-xs font-bold text-ink hover:bg-cyan/90 transition"
            >
              <RefreshCw size={13} className={rotatorLoading ? "animate-spin" : ""} />
              Force Next Question
            </button>
          </div>
        </div>

        {rotatorMessage && (
          <div className="mt-3 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs text-cyan">
            {rotatorMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("editor")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === "editor" ? "bg-violet text-white" : "bg-panel text-muted hover:text-white"
          }`}
        >
          <Sparkles className="mr-2 inline" size={14} />
          Challenge Editor
        </button>

        <button
          onClick={() => setTab("pool")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === "pool" ? "bg-cyan text-ink" : "bg-panel text-muted hover:text-white"
          }`}
        >
          <Layers className="mr-2 inline" size={14} />
          Question Pool (100)
        </button>

        <button
          onClick={() => setTab("review")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === "review" ? "bg-emerald-500 text-ink" : "bg-panel text-muted hover:text-white"
          }`}
        >
          <FileText className="mr-2 inline" size={14} />
          Review Queue ({submissions.length})
        </button>
      </div>

      {/* Tab 1: Editor */}
      {tab === "editor" && (
        <section className="mt-6 max-w-3xl rounded-2xl border border-line bg-panel p-5 sm:p-7">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Edit & Publish Challenge</h2>
              <p className="text-xs text-muted">
                Publishing manually sets this question as live and pauses auto-rotation for today.
              </p>
            </div>
            <select
              value={form.difficulty || "easy"}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as "easy" | "medium" })}
              className="field text-xs uppercase font-bold"
            >
              <option value="easy">Difficulty: Easy</option>
              <option value="medium">Difficulty: Medium</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-muted">Challenge Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="field mt-1 w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">Category / Track</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Category (e.g. Networking, Web Security)"
                className="field mt-1 w-full"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Scenario Brief</label>
            <textarea
              value={form.scenario}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })}
              placeholder="Realistic scenario / context..."
              className="field mt-1 min-h-24 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Challenge Prompt (The Question)</label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder="Question prompt asked to the student..."
              className="field mt-1 min-h-24 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Detailed Instructions / Writeup</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Step-by-step guidance, suggested commands, tips..."
              className="field mt-1 min-h-36 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Hint</label>
            <textarea
              value={form.hint}
              onChange={(e) => setForm({ ...form, hint: e.target.value })}
              placeholder="Tactical clue..."
              className="field mt-1 min-h-20 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Internal Answer Key (for reviewer)</label>
            <input
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Expected answer / review key"
              className="field mt-1 w-full"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void saveChallenge()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 text-xs font-bold text-white hover:bg-violet/90 transition shadow-lg shadow-violet-500/20"
            >
              <Save size={15} />
              Save / Publish Challenge (Manual Override)
            </button>

            <button
              type="button"
              onClick={() => setTab("pool")}
              className="text-xs text-cyan hover:underline"
            >
              Browse 100-Question Pool &rarr;
            </button>
          </div>

          {saved && (
            <div className="mt-3 rounded-lg border border-cyan/40 bg-cyan/10 p-3 text-xs text-cyan">
              Challenge published! It is live on student screens. Today&apos;s 10:00 AM auto-rotation will be skipped.
            </div>
          )}
        </section>
      )}

      {/* Tab 2: 100-Question Pool Explorer */}
      {tab === "pool" && (
        <section className="mt-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, keyword, or prompt..."
                className="field w-full pl-10 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-[#0d1527] px-3 py-1.5 text-xs">
                <Filter size={13} className="text-muted" />
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as "all" | "easy" | "medium")}
                  className="bg-transparent text-xs text-slate-200 outline-none"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy (50)</option>
                  <option value="medium">Medium (50)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-[#0d1527] px-3 py-1.5 text-xs">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted">
            Showing <strong className="text-white">{filteredPool.length}</strong> of 100 questions in pool
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPool.map((item) => {
              const isLive = liveMeta?.poolQuestionId === item.id || liveMeta?.title === item.title;
              return (
                <article
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    isLive
                      ? "border-cyan/50 bg-cyan/[.04] shadow-md shadow-cyan-500/10"
                      : "border-line bg-panel hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted">{item.id}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.difficulty === "easy"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          {item.category}
                        </span>
                      </div>

                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan/20 px-2 py-0.5 text-[10px] font-bold text-cyan">
                          <Check size={11} /> Currently Live
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-300">
                      {item.prompt}
                    </p>

                    {item.scenario && (
                      <p className="mt-2 line-clamp-2 text-[11px] text-muted italic">
                        Scenario: {item.scenario}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                    <div className="text-[11px] text-muted truncate max-w-[180px]">
                      Answer: <span className="font-mono text-slate-400">{item.answer}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadFromPool(item, false)}
                        className="rounded-lg border border-line bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:border-violet hover:text-white"
                      >
                        Load to Editor
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadFromPool(item, true)}
                        className="flex items-center gap-1 rounded-lg bg-cyan px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-cyan/90"
                      >
                        Publish Now <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 3: Review Queue */}
      {tab === "review" && (
        <section className="mt-6 space-y-3">
          {submissions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              No pending submissions.
            </div>
          )}
          {submissions.map((submission) => (
            <article key={submission.id} className="rounded-2xl border border-line bg-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{submission.userHandle || "Operative"}</div>
                  <div className="text-xs text-muted">
                    {submission.userEmail} · {submittedDate(submission.submittedAt)}
                  </div>
                </div>
                <span className="rounded-full bg-amber/10 px-2 py-1 text-xs text-amber">
                  Pending review
                </span>
              </div>

              {submission.question && (
                <div className="mt-3 text-xs text-muted">
                  Question: <strong className="text-slate-300">{submission.question}</strong>
                </div>
              )}

              <div className="mt-3 rounded-xl bg-[#0b1018] p-4 text-sm whitespace-pre-wrap">
                {submission.answer || "File-only submission"}
              </div>

              {submission.fileUrl && (
                <div className="mt-3 text-xs text-cyan">
                  {submission.fileUrl.startsWith("telegram:") ? (
                    "Attachment delivered to Telegram"
                  ) : (
                    <a className="underline" href={submission.fileUrl} target="_blank" rel="noreferrer">
                      Open attachment
                    </a>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  disabled={busyId === submission.id}
                  onClick={() => void review(submission, true)}
                  className="flex min-h-10 items-center gap-2 rounded-xl bg-cyan px-3 py-2 text-xs font-bold text-ink"
                >
                  <Check size={14} />
                  Grant 50 XP
                </button>
                <button
                  disabled={busyId === submission.id}
                  onClick={() => void review(submission, false)}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300"
                >
                  <X size={14} />
                  Reject answer
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
