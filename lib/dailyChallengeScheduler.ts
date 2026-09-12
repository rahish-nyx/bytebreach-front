import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { DAILY_CHALLENGE_POOL, ChallengePoolItem } from "./dailyChallengePool";
import {
  getIstDateParts,
  getCurrentCycleDate,
  getNextCycleRotationTime,
  getQuestionIndexForCycle,
} from "./dailyChallengeUtils";

export {
  getIstDateParts,
  getCurrentCycleDate,
  getNextCycleRotationTime,
  getQuestionIndexForCycle,
};

export type RotationResult =
  | { status: "rotated"; cycle: string; question: ChallengePoolItem; poolIndex: number }
  | { status: "already_up_to_date"; cycle: string; questionId?: string; title?: string }
  | { status: "skipped_manual_override"; cycle: string; title?: string; manualDate?: string }
  | { status: "error"; error: string };

/**
 * Rotates the daily challenge to today's 10:00 AM cycle if needed.
 *
 * Rules:
 * 1. If the current question was manually entered for today's cycle (`manualCycle === currentCycle`
 *    or `manualDate === currentCycle`), SKIP auto-rotation to preserve the admin's custom question.
 * 2. If it was already auto-rotated for today's cycle (`autoCycle === currentCycle`), return status: "already_up_to_date".
 * 3. If force is true, bypasses the cycle check and sets the chosen/next question.
 */
export async function rotateDailyChallengeIfNeeded(options?: {
  force?: boolean;
  questionId?: string;
  forceNextIndex?: number;
}): Promise<RotationResult> {
  try {
    const currentCycle = getCurrentCycleDate();
    const docRef = adminDb.collection("dailyChallenges").doc("current");
    const snapshot = await docRef.get();
    const existing = snapshot.exists ? snapshot.data() : null;

    // Check Manual Override Protection (Rule: skip that day if manually entered)
    if (!options?.force) {
      const isManualToday =
        existing?.source === "manual" &&
        (existing?.manualCycle === currentCycle ||
          existing?.manualDate === currentCycle ||
          existing?.updatedCycle === currentCycle);

      if (isManualToday) {
        return {
          status: "skipped_manual_override",
          cycle: currentCycle,
          title: existing?.title || "Custom Challenge",
          manualDate: existing?.manualDate || currentCycle,
        };
      }

      // Check if already rotated for today's 10:00 AM cycle
      if (existing?.autoCycle === currentCycle) {
        return {
          status: "already_up_to_date",
          cycle: currentCycle,
          questionId: existing?.poolQuestionId,
          title: existing?.title,
        };
      }
    }

    // Query Firestore pool collection first, falling back to static pool
    let activePool: ChallengePoolItem[] = DAILY_CHALLENGE_POOL;
    try {
      const poolSnap = await adminDb.collection("dailyChallengePool").get();
      if (!poolSnap.empty) {
        activePool = poolSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            title: String(d.title || ""),
            difficulty: (d.difficulty as "easy" | "medium") || "easy",
            category: String(d.category || d.parentTopic || "General"),
            scenario: String(d.scenario || ""),
            prompt: String(d.prompt || ""),
            instructions: String(d.instructions || ""),
            hint: String(d.hint || ""),
            answer: String(d.answer || ""),
          };
        });
        activePool.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      }
    } catch {
      // fallback to static DAILY_CHALLENGE_POOL
    }

    const poolLength = activePool.length > 0 ? activePool.length : 1;
    let poolIndex = getQuestionIndexForCycle(currentCycle) % poolLength;
    if (typeof options?.forceNextIndex === "number") {
      poolIndex = options.forceNextIndex % poolLength;
    }

    let question: ChallengePoolItem | undefined;
    if (options?.questionId) {
      question = activePool.find((q) => q.id === options.questionId);
    }
    if (!question) {
      question = activePool[poolIndex] || activePool[0];
    }

    const payload = {
      title: question.title,
      category: question.category,
      parentTopic: question.category,
      difficulty: question.difficulty,
      scenario: question.scenario,
      prompt: question.prompt,
      instructions: question.instructions,
      hint: question.hint,
      answer: question.answer,
      poolQuestionId: question.id,
      source: "auto",
      autoCycle: currentCycle,
      autoDate: currentCycle,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(payload, { merge: true });

    return {
      status: "rotated",
      cycle: currentCycle,
      question,
      poolIndex,
    };
  } catch (error) {
    console.error("[dailyChallengeScheduler] Rotation error:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown rotation error",
    };
  }
}
