import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { DAILY_CHALLENGE_POOL, ChallengePoolItem } from "./dailyChallengePool";

// Target timezone: Indian Standard Time (UTC+5:30)
const IST_OFFSET_MINUTES = 330;

/**
 * Returns current date/time components adjusted to IST.
 */
export function getIstDateParts(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + IST_OFFSET_MINUTES * 60000);
  return {
    year: istTime.getFullYear(),
    month: String(istTime.getMonth() + 1).padStart(2, "0"),
    day: String(istTime.getDate()).padStart(2, "0"),
    hour: istTime.getHours(),
    minute: istTime.getMinutes(),
    second: istTime.getSeconds(),
    dateObj: istTime,
  };
}

/**
 * Calculates the current 10:00 AM cycle string (YYYY-MM-DD).
 * A cycle starts at 10:00:00 AM IST and runs until 09:59:59 AM IST the next day.
 */
export function getCurrentCycleDate(date = new Date()): string {
  const ist = getIstDateParts(date);
  if (ist.hour >= 10) {
    return `${ist.year}-${ist.month}-${ist.day}`;
  }
  // Before 10:00 AM IST, the active cycle belongs to yesterday
  const yesterday = new Date(ist.dateObj.getTime() - 24 * 60 * 60 * 1000);
  const yYear = yesterday.getFullYear();
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
  const yDay = String(yesterday.getDate()).padStart(2, "0");
  return `${yYear}-${yMonth}-${yDay}`;
}

/**
 * Calculates the next upcoming 10:00 AM IST rotation timestamp.
 */
export function getNextCycleRotationTime(date = new Date()): Date {
  const ist = getIstDateParts(date);
  const targetYear = ist.year;
  const targetMonth = ist.dateObj.getMonth();
  let targetDay = ist.dateObj.getDate();

  // If already at or past 10:00 AM IST, next rotation is tomorrow at 10:00 AM IST
  if (ist.hour >= 10) {
    targetDay += 1;
  }

  // 10:00 AM IST in UTC is 04:30 AM UTC
  const utcDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 4, 30, 0, 0));
  return utcDate;
}

/**
 * Maps a cycle date string (YYYY-MM-DD) deterministically to an index [0 .. DAILY_CHALLENGE_POOL.length - 1].
 */
export function getQuestionIndexForCycle(cycleDate: string): number {
  const anchor = new Date("2026-01-01T00:00:00Z").getTime();
  const current = new Date(`${cycleDate}T00:00:00Z`).getTime();
  const diffDays = Math.floor((current - anchor) / (24 * 60 * 60 * 1000));
  const poolSize = DAILY_CHALLENGE_POOL.length || 100;
  return ((diffDays % poolSize) + poolSize) % poolSize;
}

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

    // Select the question from pool
    let poolIndex = getQuestionIndexForCycle(currentCycle);
    if (typeof options?.forceNextIndex === "number") {
      poolIndex = options.forceNextIndex % DAILY_CHALLENGE_POOL.length;
    }

    let question: ChallengePoolItem | undefined;
    if (options?.questionId) {
      question = DAILY_CHALLENGE_POOL.find((q) => q.id === options.questionId);
    }
    if (!question) {
      question = DAILY_CHALLENGE_POOL[poolIndex] || DAILY_CHALLENGE_POOL[0];
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
