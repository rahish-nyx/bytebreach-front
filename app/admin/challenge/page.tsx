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
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  FileText,
  Filter,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
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
  id?: string;
  title: string;
  category: string;
  prompt: string;
  scenario: string;
  instructions: string;
  hint: string;
  answer: string;
  difficulty: "easy" | "medium";
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

const emptyForm: ChallengeForm = {
  title: "",
  category: "General",
  prompt: "",
  scenario: "",
  instructions: "",
  hint: "",
  answer: "",
  difficulty: "easy",
};

export default function DailyChallengeAdmin() {
  const [tab, setTab] = useState<"pool" | "editor" | "review">("pool");
  const [poolQuestions, setPoolQuestions] = useState<ChallengePoolItem[]>(DAILY_CHALLENGE_POOL);
  const [loadingPool, setLoadingPool] = useState(false);

  // Live document state
  const [liveMeta, setLiveMeta] = useState<LiveChallengeMeta | null>(null);
  const [editorForm, setEditorForm] = useState<ChallengeForm>(emptyForm);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [saved, setSaved] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [rotatorLoading, setRotatorLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Pool Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Expandable details tracking per card
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modals
  const [editingQuestion, setEditingQuestion] = useState<ChallengePoolItem | null>(null);
  const [editForm, setEditForm] = useState<ChallengeForm>(emptyForm);
  const [deletingQuestion, setDeletingQuestion] = useState<ChallengePoolItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ChallengeForm>(emptyForm);
  const [modalBusy, setModalBusy] = useState(false);

  const currentCycle = getCurrentCycleDate();
  const nextRotationDate = getNextCycleRotationTime();

  // Load pool from API / Firestore
  const fetchPool = async () => {
    setLoadingPool(true);
    try {
      const res = await fetch("/api/daily-challenge/pool");
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setPoolQuestions(data.questions);
      }
    } catch {
      // Fallback to initial pool
    } finally {
      setLoadingPool(false);
    }
  };

  useEffect(() => {
    void fetchPool();
  }, []);

  // Subscribe to live current challenge
  useEffect(() => {
    return onSnapshot(doc(db, "dailyChallenges", "current"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setLiveMeta(data as LiveChallengeMeta);
      setEditorForm({
        id: data.poolQuestionId || "",
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

  // Subscribe to pending submissions
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 5000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 1. Save live challenge from editor
  const saveLiveChallenge = async () => {
    const cycle = getCurrentCycleDate();
    await setDoc(
      doc(db, "dailyChallenges", "current"),
      {
        ...editorForm,
        parentTopic: editorForm.category,
        source: "manual",
        manualCycle: cycle,
        manualDate: cycle,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setSaved(true);
    showToast("Challenge updated & published! 10:00 AM auto-rotation is paused for today.");
    setTimeout(() => setSaved(false), 4000);
  };

  // 2. Rotate Actions
  const handleForceRotate = async () => {
    setRotatorLoading(true);
    try {
      const response = await fetch("/api/daily-challenge/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force_rotate" }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Force rotated to next challenge from 100-question pool!");
      } else {
        showToast(`Rotation error: ${data.error || "Unknown"}`);
      }
    } catch {
      showToast("Failed to execute rotation request.");
    } finally {
      setRotatorLoading(false);
    }
  };

  const handleResetToAuto = async () => {
    setRotatorLoading(true);
    try {
      const response = await fetch("/api/daily-challenge/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_auto" }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Reset to scheduled auto-pool question! Manual override cleared.");
      } else {
        showToast(`Reset error: ${data.error || "Unknown"}`);
      }
    } catch {
      showToast("Failed to execute reset.");
    } finally {
      setRotatorLoading(false);
    }
  };

  // 3. Set Question as Live Today
  const handleSetQuestionLive = async (item: ChallengePoolItem) => {
    const cycle = getCurrentCycleDate();
    try {
      await setDoc(
        doc(db, "dailyChallenges", "current"),
        {
          title: item.title,
          category: item.category,
          parentTopic: item.category,
          difficulty: item.difficulty,
          scenario: item.scenario,
          prompt: item.prompt,
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
      );
      showToast(`Question ${item.id} ("${item.title}") is now live! Auto-rotation will skip today.`);
    } catch (e) {
      showToast("Failed to set question as live.");
    }
  };

  // 4. Open Edit Modal
  const handleOpenEdit = (item: ChallengePoolItem) => {
    setEditingQuestion(item);
    setEditForm({
      id: item.id,
      title: item.title,
      category: item.category,
      prompt: item.prompt,
      scenario: item.scenario,
      instructions: item.instructions,
      hint: item.hint,
      answer: item.answer,
      difficulty: item.difficulty,
    });
  };

  // 5. Submit Edit
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setModalBusy(true);
    try {
      const res = await fetch("/api/daily-challenge/pool", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setPoolQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...editForm } : q))
        );
        showToast(`Question ${editingQuestion.id} updated successfully!`);
        setEditingQuestion(null);
      } else {
        showToast(`Edit failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      showToast("Network error while saving question.");
    } finally {
      setModalBusy(false);
    }
  };

  // 6. Delete Question
  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    setModalBusy(true);
    try {
      const res = await fetch(`/api/daily-challenge/pool?id=${encodeURIComponent(deletingQuestion.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPoolQuestions((prev) => prev.filter((q) => q.id !== deletingQuestion.id));
        showToast(`Question ${deletingQuestion.id} has been deleted from pool.`);
        setDeletingQuestion(null);
      } else {
        showToast(`Delete failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      showToast("Network error while deleting question.");
    } finally {
      setModalBusy(false);
    }
  };

  // 7. Create New Question
  const handleCreateQuestion = async () => {
    if (!createForm.title.trim() || !createForm.prompt.trim()) {
      showToast("Title and Prompt are required to create a question.");
      return;
    }
    setModalBusy(true);
    try {
      const res = await fetch("/api/daily-challenge/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success && data.question) {
        setPoolQuestions((prev) => [...prev, data.question]);
        showToast(`New question ${data.question.id} added to the pool!`);
        setIsCreating(false);
        setCreateForm(emptyForm);
      } else {
        showToast(`Creation failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      showToast("Network error while creating question.");
    } finally {
      setModalBusy(false);
    }
  };

  // 8. Review submission
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
    const set = new Set(poolQuestions.map((q) => q.category));
    return Array.from(set);
  }, [poolQuestions]);

  const easyCount = useMemo(() => poolQuestions.filter((q) => q.difficulty === "easy").length, [poolQuestions]);
  const mediumCount = useMemo(() => poolQuestions.filter((q) => q.difficulty === "medium").length, [poolQuestions]);

  const filteredPool = useMemo(() => {
    return poolQuestions.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesPrompt = item.prompt.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesAnswer = item.answer.toLowerCase().includes(query);
        return matchesTitle || matchesPrompt || matchesCat || matchesId || matchesAnswer;
      }
      return true;
    });
  }, [poolQuestions, searchQuery, difficultyFilter, categoryFilter]);

  return (
    <AdminShell>
      <div className="eyebrow text-cyan">Command center / daily challenge</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-bold">Daily Challenge Questions</h1>
          <p className="mt-1 text-sm text-muted">
            Manage, edit, delete, and inspect all 100 daily challenge questions with 10:00 AM auto-rotation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateForm(emptyForm);
            setIsCreating(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-blue-600 px-4 py-2.5 text-xs font-bold text-ink shadow-lg shadow-cyan/20 hover:brightness-110 active:scale-95 transition"
        >
          <Plus size={16} />
          Add New Question
        </button>
      </div>

      {/* Rotation Status Banner */}
      <div className="mt-6 rounded-2xl border border-cyan/25 bg-gradient-to-r from-[#0d1726] to-[#080f1a] p-4 sm:p-5 shadow-lg shadow-cyan/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted">Current Cycle:</span>
              <span className="font-mono text-xs font-bold text-slate-200">{currentCycle}</span>

              {isManualToday ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  <AlertCircle size={12} />
                  Manual Override Active for Today (10:00 AM auto-rotation skipped)
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
                className="flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan hover:text-cyan transition"
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

        {toastMessage && (
          <div className="mt-3 rounded-lg border border-cyan/40 bg-cyan/15 px-3.5 py-2 text-xs font-medium text-cyan animate-fade-in flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage("")} className="text-cyan/70 hover:text-cyan">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("pool")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
            tab === "pool" ? "bg-cyan text-ink shadow-md shadow-cyan/20" : "bg-panel text-muted hover:text-white"
          }`}
        >
          <Layers size={14} />
          All Questions Pool ({poolQuestions.length})
        </button>

        <button
          onClick={() => setTab("editor")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
            tab === "editor" ? "bg-violet text-white shadow-md shadow-violet/20" : "bg-panel text-muted hover:text-white"
          }`}
        >
          <Sparkles size={14} />
          Live Today &amp; Editor
        </button>

        <button
          onClick={() => setTab("review")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
            tab === "review" ? "bg-emerald-500 text-ink shadow-md shadow-emerald-500/20" : "bg-panel text-muted hover:text-white"
          }`}
        >
          <FileText size={14} />
          Review Queue ({submissions.length})
        </button>
      </div>

      {/* TAB 1: 100-Question Pool Visual Explorer */}
      {tab === "pool" && (
        <section className="mt-6 space-y-4">
          {/* Header Controls & Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 100 questions by ID (dc-001), title, category, keywords..."
                className="field w-full pl-10 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-[#0d1527] px-3 py-1.5 text-xs">
                <Filter size={13} className="text-muted" />
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as "all" | "easy" | "medium")}
                  className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Difficulties ({poolQuestions.length})</option>
                  <option value="easy">Easy ({easyCount})</option>
                  <option value="medium">Medium ({mediumCount})</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-[#0d1527] px-3 py-1.5 text-xs">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => void fetchPool()}
                disabled={loadingPool}
                title="Refresh from database"
                className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-[#0d1527] text-muted hover:text-white"
              >
                <RefreshCw size={13} className={loadingPool ? "animate-spin text-cyan" : ""} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted px-1">
            <div>
              Showing <strong className="text-white">{filteredPool.length}</strong> of {poolQuestions.length} questions
              {difficultyFilter !== "all" && <span> • Filter: <span className="uppercase text-cyan">{difficultyFilter}</span></span>}
              {categoryFilter !== "all" && <span> • Category: <span className="text-cyan">{categoryFilter}</span></span>}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Easy: {easyCount}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Medium: {mediumCount}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPool.map((item) => {
              const isLive = liveMeta?.poolQuestionId === item.id || liveMeta?.title === item.title;
              const isExpanded = expandedIds.has(item.id);

              return (
                <article
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                    isLive
                      ? "border-cyan/60 bg-gradient-to-b from-cyan/[.07] to-cyan/[.02] shadow-lg shadow-cyan/10 ring-1 ring-cyan/30"
                      : "border-line bg-panel hover:border-slate-700"
                  }`}
                >
                  <div>
                    {/* Card Top Row: ID, Badges, Live Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/40 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-cyan bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/20">
                          {item.id}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.difficulty === "easy"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="rounded-full bg-slate-800/90 px-2.5 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/50">
                          {item.category}
                        </span>
                      </div>

                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/20 border border-cyan/40 px-2.5 py-0.5 text-[11px] font-bold text-cyan shadow-sm shadow-cyan/20 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                          Live Challenge Today
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 text-base font-bold text-white tracking-tight leading-snug">
                      {item.title}
                    </h3>

                    {/* Prompt */}
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {item.prompt}
                    </p>

                    {/* Expandable full details */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 rounded-xl border border-line/60 bg-[#070c14] p-3.5 text-xs animate-fade-in">
                        {item.scenario && (
                          <div>
                            <span className="font-semibold text-cyan uppercase text-[10px] tracking-wider block">
                              Scenario Brief
                            </span>
                            <p className="mt-1 text-slate-300 leading-relaxed italic">{item.scenario}</p>
                          </div>
                        )}

                        {item.instructions && (
                          <div>
                            <span className="font-semibold text-violet uppercase text-[10px] tracking-wider block">
                              Instructions &amp; Guidance
                            </span>
                            <pre className="mt-1 font-sans text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {item.instructions}
                            </pre>
                          </div>
                        )}

                        {item.hint && (
                          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-amber-300/90 text-[11px]">
                            <strong className="text-amber-400">Tactical Hint:</strong> {item.hint}
                          </div>
                        )}

                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-300 text-[11px]">
                          <strong className="text-emerald-400">Answer Key:</strong>{" "}
                          <span className="font-mono text-emerald-200">{item.answer}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="mt-4 border-t border-line/60 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-1 text-[11px] text-muted hover:text-cyan transition"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={13} /> Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} /> View Full Question &amp; Answer
                          </>
                        )}
                      </button>

                      {/* Action Buttons: Edit, Delete, Set Live */}
                      <div className="flex items-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="flex items-center gap-1 rounded-lg border border-line bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-violet hover:text-violet transition"
                          title="Edit this question"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingQuestion(item)}
                          className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:border-red-500/50 hover:bg-red-500/20 transition"
                          title="Delete this question"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>

                        {/* Set as Live Button */}
                        <button
                          type="button"
                          onClick={() => void handleSetQuestionLive(item)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                            isLive
                              ? "bg-slate-800 text-slate-400 cursor-default"
                              : "bg-cyan text-ink hover:bg-cyan/90 shadow-sm shadow-cyan/20"
                          }`}
                          title="Publish as live challenge for today"
                        >
                          <Sparkles size={12} />
                          {isLive ? "Live" : "Set Live"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: Live Challenge Editor */}
      {tab === "editor" && (
        <section className="mt-6 max-w-3xl rounded-2xl border border-line bg-panel p-5 sm:p-7">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Live Challenge Editor</h2>
              <p className="text-xs text-muted">
                Edit and publish directly. Saving manually sets this question as live and pauses auto-rotation for today.
              </p>
            </div>
            <select
              value={editorForm.difficulty || "easy"}
              onChange={(e) => setEditorForm({ ...editorForm, difficulty: e.target.value as "easy" | "medium" })}
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
                value={editorForm.title}
                onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })}
                placeholder="Title"
                className="field mt-1 w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">Category / Track</label>
              <input
                value={editorForm.category}
                onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value })}
                placeholder="Category (e.g. Networking, Web Security)"
                className="field mt-1 w-full"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Scenario Brief</label>
            <textarea
              value={editorForm.scenario}
              onChange={(e) => setEditorForm({ ...editorForm, scenario: e.target.value })}
              placeholder="Realistic scenario / context..."
              className="field mt-1 min-h-24 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Challenge Prompt (The Question)</label>
            <textarea
              value={editorForm.prompt}
              onChange={(e) => setEditorForm({ ...editorForm, prompt: e.target.value })}
              placeholder="Question prompt asked to the student..."
              className="field mt-1 min-h-24 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Detailed Instructions / Writeup</label>
            <textarea
              value={editorForm.instructions}
              onChange={(e) => setEditorForm({ ...editorForm, instructions: e.target.value })}
              placeholder="Step-by-step guidance, suggested commands, tips..."
              className="field mt-1 min-h-36 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Hint</label>
            <textarea
              value={editorForm.hint}
              onChange={(e) => setEditorForm({ ...editorForm, hint: e.target.value })}
              placeholder="Tactical clue..."
              className="field mt-1 min-h-20 w-full"
            />
          </div>

          <div className="mt-3">
            <label className="text-[11px] font-semibold text-muted">Internal Answer Key (for reviewer)</label>
            <input
              value={editorForm.answer}
              onChange={(e) => setEditorForm({ ...editorForm, answer: e.target.value })}
              placeholder="Expected answer / review key"
              className="field mt-1 w-full"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void saveLiveChallenge()}
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

      {/* TAB 3: Review Queue */}
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

      {/* EDIT QUESTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-[#0c121e] p-5 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-cyan" />
                <h3 className="text-lg font-bold text-white">
                  Edit Question <span className="font-mono text-cyan">({editingQuestion.id})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted">Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="field mt-1 w-full"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted">Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as "easy" | "medium" })}
                    className="field mt-1 w-full uppercase font-bold"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Category</label>
                <input
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="field mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Question Prompt</label>
                <textarea
                  value={editForm.prompt}
                  onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                  className="field mt-1 min-h-24 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Scenario Brief</label>
                <textarea
                  value={editForm.scenario}
                  onChange={(e) => setEditForm({ ...editForm, scenario: e.target.value })}
                  className="field mt-1 min-h-20 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Instructions &amp; Guidance</label>
                <textarea
                  value={editForm.instructions}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  className="field mt-1 min-h-28 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Hint</label>
                <input
                  value={editForm.hint}
                  onChange={(e) => setEditForm({ ...editForm, hint: e.target.value })}
                  className="field mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Answer Key</label>
                <input
                  value={editForm.answer}
                  onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                  className="field mt-1 w-full font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalBusy}
                onClick={() => void handleSaveEdit()}
                className="flex items-center gap-2 rounded-xl bg-cyan px-5 py-2.5 text-xs font-bold text-ink hover:bg-cyan/90 transition shadow-lg shadow-cyan/20 disabled:opacity-50"
              >
                <Save size={14} />
                {modalBusy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0e1422] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 size={20} />
              <h3 className="text-base font-bold text-white">Delete Question</h3>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Are you sure you want to delete question{" "}
              <strong className="text-white font-mono">{deletingQuestion.id}</strong> (&ldquo;
              <strong className="text-cyan">{deletingQuestion.title}</strong>&rdquo;)?
            </p>
            <p className="mt-1 text-[11px] text-muted">
              This will remove the question from the pool and future 10:00 AM auto-rotations.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingQuestion(null)}
                className="rounded-xl border border-line bg-panel px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalBusy}
                onClick={() => void handleConfirmDelete()}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {modalBusy ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW QUESTION MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-[#0c121e] p-5 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-cyan" />
                <h3 className="text-lg font-bold text-white">Add New Challenge Question</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted">Title *</label>
                  <input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Subnet Mask Analysis"
                    className="field mt-1 w-full"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted">Difficulty</label>
                  <select
                    value={createForm.difficulty}
                    onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value as "easy" | "medium" })}
                    className="field mt-1 w-full uppercase font-bold"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Category</label>
                <input
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  placeholder="e.g. Networking, Web Security, Cryptography"
                  className="field mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Question Prompt *</label>
                <textarea
                  value={createForm.prompt}
                  onChange={(e) => setCreateForm({ ...createForm, prompt: e.target.value })}
                  placeholder="The question asked to students..."
                  className="field mt-1 min-h-24 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Scenario Brief</label>
                <textarea
                  value={createForm.scenario}
                  onChange={(e) => setCreateForm({ ...createForm, scenario: e.target.value })}
                  placeholder="Realistic incident context..."
                  className="field mt-1 min-h-20 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Instructions &amp; Guidance</label>
                <textarea
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                  placeholder="Commands, methodology steps..."
                  className="field mt-1 min-h-28 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Hint</label>
                <input
                  value={createForm.hint}
                  onChange={(e) => setCreateForm({ ...createForm, hint: e.target.value })}
                  placeholder="Tactical clue"
                  className="field mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Answer Key</label>
                <input
                  value={createForm.answer}
                  onChange={(e) => setCreateForm({ ...createForm, answer: e.target.value })}
                  placeholder="Expected review answer"
                  className="field mt-1 w-full font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalBusy}
                onClick={() => void handleCreateQuestion()}
                className="flex items-center gap-2 rounded-xl bg-cyan px-5 py-2.5 text-xs font-bold text-ink hover:bg-cyan/90 transition shadow-lg shadow-cyan/20 disabled:opacity-50"
              >
                <Plus size={14} />
                {modalBusy ? "Creating..." : "Add to Pool"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
