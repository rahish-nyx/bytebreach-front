"use client";

import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CheckCircle2, Crosshair, HelpCircle, LockKeyhole, Wifi } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { submitLabFlag } from "@/lib/submissions";
import { StudentShell } from "@/components/StudentShell";
import { useLearningTimer } from "@/hooks/useLearningTimer";
import { updateUserActivity } from "@/lib/activity";
import { getRankTier } from "@/src/lib/ranks";

type Lab = {
  id: string;
  title?: string;
  subtitle?: string;
  category?: string;
  difficulty?: string;
  scenario?: string;
  instructions?: string;
  targetIp?: string;
  targetPort?: string;
  presetFlag?: string;
  flag?: string;
  points?: number;
  published?: boolean;
  active?: boolean;
};

export default function PracticeLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [flags, setFlags] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { name } = useUserProfile();

  useLearningTimer(user?.uid);

  useEffect(
    () =>
      onSnapshot(collection(db, "labs"), (snapshot) =>
        setLabs(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() } as Lab))
            .filter((lab) => lab.published === true || lab.active === true)
        )
      ),
    []
  );

  useEffect(() => {
    if (!user) return;
    void updateUserActivity(user.uid);
    return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const values = snapshot.data()?.completedLabs;
      if (Array.isArray(values)) setCompleted(Object.fromEntries(values.map((id) => [id, true])));
    });
  }, [user]);

  const submit = async (lab: Lab) => {
    // Only one time correct answer submission is allowed per student account
    if (!user || completed[lab.id] || submitting[lab.id]) return;

    const answer = (flags[lab.id] || "").trim();
    if (!answer) return;

    setSubmitting((s) => ({ ...s, [lab.id]: true }));
    try {
      const result = await submitLabFlag(
        user.uid,
        name || user.displayName || "Operative",
        user.email || "",
        { ...lab, flag: lab.presetFlag || lab.flag },
        answer
      );
      setStatus((items) => ({ ...items, [lab.id]: result }));
      if (result === "awarded") {
        setCompleted((items) => ({ ...items, [lab.id]: true }));
        void updateUserActivity(user.uid);
      } else if (result === "already-completed") {
        setCompleted((items) => ({ ...items, [lab.id]: true }));
      }
      // If result === "incorrect", completed remains false, allowing student to retry again and again
    } catch (err) {
      console.error("Lab submission failed:", err);
      setStatus((items) => ({ ...items, [lab.id]: "incorrect" }));
    } finally {
      setSubmitting((s) => ({ ...s, [lab.id]: false }));
    }
  };

  return (
    <StudentShell>
      <div className="grid-bg min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="eyebrow text-cyan">Workspace / offensive security</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Practice labs</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Hands-on targets & technical mastery challenges. Test muscle memory, answer core security questions, and capture flags to level up.
          </p>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {labs.map((lab) => {
              const hasIp = Boolean(lab.targetIp?.trim());
              const preset = String(lab.presetFlag || lab.flag || "").trim();
              const isSingleLetterMcq = preset.length === 1 && /^[A-D]$/i.test(preset);
              const isChecking = Boolean(submitting[lab.id]);

              return (
                <article key={lab.id} className="glass rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        className={`grid h-11 w-11 place-items-center rounded-xl ${
                          hasIp ? "bg-amber/10 text-amber" : "bg-cyan/10 text-cyan"
                        }`}
                      >
                        {hasIp ? <Crosshair size={21} /> : <HelpCircle size={21} />}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          lab.difficulty === "Easy"
                            ? "bg-cyan/10 text-cyan"
                            : lab.difficulty === "Hard" || lab.difficulty === "Insane"
                            ? "bg-red-400/10 text-red-300"
                            : "bg-amber/10 text-amber"
                        }`}
                      >
                        {lab.difficulty}
                      </span>
                    </div>

                    <div className="mt-5 eyebrow text-muted">
                      {lab.category} · {lab.points} XP {!hasIp && "· Knowledge Check"}
                    </div>

                    <h2 className="mt-2 text-xl font-semibold">{lab.title}</h2>

                    {lab.subtitle && (
                      <p className="mt-2 text-sm leading-6 text-muted">{lab.subtitle}</p>
                    )}

                    {lab.scenario && (
                      <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {lab.scenario}
                      </div>
                    )}

                    {hasIp && (
                      <div className="mt-5 flex min-w-0 items-center gap-3 rounded-xl border border-line bg-[#0b1018] p-3 font-mono text-xs">
                        <Wifi size={15} className="shrink-0 text-cyan" />
                        <span className="truncate">
                          target: {lab.targetIp}
                          {lab.targetPort?.trim() ? `:${lab.targetPort}` : ""}
                        </span>
                      </div>
                    )}

                    {lab.instructions && (
                      <div className="mt-4 whitespace-pre-wrap rounded-xl border border-line bg-panel p-4 text-xs leading-6 text-muted">
                        {lab.instructions}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {completed[lab.id] ? (
                        <div className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-cyan/10 px-4 py-3 text-xs font-bold text-cyan">
                          <CheckCircle2 size={16} /> Completed ✔️ · +{lab.points} XP
                        </div>
                      ) : (
                        <>
                          <input
                            disabled={!user || isChecking}
                            value={flags[lab.id] || ""}
                            onChange={(event) => {
                              const val = event.target.value;
                              setFlags((items) => ({ ...items, [lab.id]: val }));
                              if (status[lab.id] && status[lab.id] !== "awarded") {
                                setStatus((items) => ({ ...items, [lab.id]: "" }));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void submit(lab);
                              }
                            }}
                            placeholder={
                              user
                                ? hasIp
                                  ? "FLAG{...}"
                                  : isSingleLetterMcq
                                  ? "Option (e.g. A, B, C, D)..."
                                  : "Enter answer..."
                                : "Sign in to submit"
                            }
                            className="field min-w-0 flex-1 font-mono disabled:opacity-50"
                          />
                          <button
                            disabled={!user || isChecking || !(flags[lab.id] || "").trim()}
                            onClick={() => void submit(lab)}
                            className="min-h-11 rounded-xl bg-cyan px-4 text-xs font-bold text-ink disabled:opacity-40 hover:bg-cyan/90 transition-all flex items-center justify-center gap-2 shrink-0"
                          >
                            {user ? (
                              isChecking ? (
                                "Verifying..."
                              ) : hasIp ? (
                                "Submit Flag"
                              ) : (
                                "Submit Answer"
                              )
                            ) : (
                              <LockKeyhole size={15} />
                            )}
                          </button>
                        </>
                      )}
                    </div>

                    {status[lab.id] === "awarded" && (
                      <div className="mt-3 text-xs font-semibold text-cyan">
                        +{lab.points} XP Granted! {hasIp ? "Flag captured successfully." : "Answer verified successfully."}
                      </div>
                    )}
                    {status[lab.id] === "incorrect" && (
                      <div className="mt-3 text-xs text-red-300">
                        {hasIp
                          ? "Invalid Flag. Analyze your target and try again."
                          : "Incorrect answer. Review the question and try again."}
                      </div>
                    )}
                    {status[lab.id] === "already-completed" && (
                      <div className="mt-3 text-xs text-amber">Completed ✔️</div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {labs.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              No published labs yet.
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
