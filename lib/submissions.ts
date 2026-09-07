import { arrayUnion, collection, doc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getRankFromXp } from "@/src/lib/ranks";

export const TASK_XP = 25;
export const DAILY_CHALLENGE_XP = 50;

async function liveRewards() {
  try {
    const response = await fetch("/api/settings/public", { cache: "no-store" });
    if (response.ok) return await response.json() as { dailyChallengeXp?: number; roomCompletionXp?: number; practiceLabBaseXp?: number };
  } catch {
    // Defaults preserve progression if the settings service is temporarily unavailable.
  }
  return {};
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type DailyChallengeResult = "submitted" | "already-submitted";

function activityUpdate(data: Record<string, unknown> | undefined) {
  const today = dateKey();
  const previous = typeof data?.lastActiveDate === "string" ? data.lastActiveDate : "";
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKey(yesterdayDate);
  const currentStreak = Number(data?.streakCount ?? data?.streak ?? 0);
  const streak = previous === today ? (currentStreak || 1) : previous === yesterday ? currentStreak + 1 : 1;
  return { streak, streakCount: streak, lastActiveDate: today };
}

export async function recordLearningActivity(uid: string) {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", uid);
    const snapshot = await transaction.get(userRef);
    transaction.set(userRef, activityUpdate(snapshot.data()), { merge: true });
  });
}

export async function submitQuestionAnswer(uid: string, moduleId: string, questionId: string, _points: number, learningMinutes = 30, trackId = "") {
  return runTransaction(db, async (transaction) => {
    const progressRef = doc(db, "users", uid, "progress", moduleId);
    const progressSnapshot = await transaction.get(progressRef);
    if (progressSnapshot.data()?.status === "completed") return false;
    const userRef = doc(db, "users", uid);
    const userSnapshot = await transaction.get(userRef);
    const newXp = Number(userSnapshot.data()?.xp || 0) + TASK_XP;
    const previousTrackXp = Number(userSnapshot.data()?.trackXp?.[trackId] || 0);
    transaction.set(userRef, { ...activityUpdate(userSnapshot.data()), xp: newXp, rank: getRankFromXp(newXp), learningTimeMinutes: Number(userSnapshot.data()?.learningTimeMinutes || 0) + learningMinutes, ...(trackId ? { [`trackXp.${trackId}`]: previousTrackXp + TASK_XP } : {}) }, { merge: true });
    transaction.set(progressRef, { percent: 100, status: "completed", completedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    transaction.set(doc(collection(db, "submissions")), { uid, type: "question", moduleId, questionId, points: TASK_XP, createdAt: serverTimestamp() });
    return true;
  });
}

export async function completeModule(uid: string, moduleId: string, trackId: string, _points: number, learningMinutes = 30) {
  const rewards = await liveRewards();
  const roomXp = Number(rewards.roomCompletionXp || TASK_XP);
  return runTransaction(db, async (transaction) => {
    const progressRef = doc(db, "users", uid, "progress", moduleId);
    const progressSnapshot = await transaction.get(progressRef);
    const userRef = doc(db, "users", uid);
    const userSnapshot = await transaction.get(userRef);
    const data = userSnapshot?.data();
    const completedModules = Array.isArray(data?.completedModules) ? data.completedModules : [];
    if (completedModules.includes(moduleId) || progressSnapshot.data()?.status === "completed") return false;
    const newXp = Number(data?.xp || 0) + roomXp;
    const previousTrackXp = Number(data?.trackXp?.[trackId] || 0);
    transaction.set(userRef, { ...activityUpdate(data), xp: increment(roomXp), rank: getRankFromXp(newXp), completedModules: arrayUnion(moduleId), learningTimeMinutes: Number(data?.learningTimeMinutes || 0) + learningMinutes, ...(trackId ? { [`trackXp.${trackId}`]: previousTrackXp + roomXp } : {}) }, { merge: true });
    transaction.set(progressRef, { percent: 100, status: "completed", completedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    transaction.set(doc(collection(db, "submissions")), { uid, type: "module", moduleId, trackId, points: roomXp, createdAt: serverTimestamp() });
    return true;
  });
}

export async function completeRoomLab(uid: string, moduleId: string, points: number) {
  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", uid);
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data();
    const completed = Array.isArray(data?.completedRoomLabs) ? data.completedRoomLabs : [];
    if (completed.includes(moduleId)) return false;
    const reward = Math.max(0, Number(points) || 0);
    const newXp = Number(data?.xp || 0) + reward;
    transaction.set(userRef, { ...activityUpdate(data), xp: increment(reward), rank: getRankFromXp(newXp), completedRoomLabs: arrayUnion(moduleId) }, { merge: true });
    transaction.set(doc(collection(db, "submissions")), { uid, type: "room-lab", moduleId, points: reward, createdAt: serverTimestamp() });
    return true;
  });
}

function checkFlagMatch(submitted: string, preset: string): boolean {
  const cleanInput = submitted.trim().replace(/^["'`]|["'`]$/g, "").toUpperCase();
  const cleanPreset = preset.trim().replace(/^["'`]|["'`]$/g, "").toUpperCase();

  if (!cleanInput || !cleanPreset) return false;
  if (cleanInput === cleanPreset) return true;

  // Support stripping outer FLAG{...} wrapper (e.g. FLAG{B} vs B, FLAG{443} vs 443)
  const strippedInput = cleanInput.replace(/^FLAG\{|\}$/gi, "").trim();
  const strippedPreset = cleanPreset.replace(/^FLAG\{|\}$/gi, "").trim();
  if (strippedInput && strippedInput === strippedPreset) return true;

  // If preset is a single letter (MCQ: A, B, C, D)
  if (/^[A-D]$/.test(strippedPreset)) {
    const letterMatch =
      strippedInput.match(/^[\[\(]?([A-D])[\]\)]?\.?$/) ||
      strippedInput.match(/^OPTION\s+([A-D])$/i);
    if (letterMatch && letterMatch[1].toUpperCase() === strippedPreset) return true;
  }

  return false;
}

export async function submitLabFlag(
  uid: string,
  userHandle: string,
  userEmail: string,
  lab: { id: string; title?: string; category?: string; flag?: string; presetFlag?: string; points?: number },
  submittedFlag: string
) {
  const rewards = await liveRewards();
  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await transaction.get(userRef);
    const data = userSnapshot?.data();
    const completedLabs = Array.isArray(data?.completedLabs) ? data.completedLabs : [];
    const alreadyCompleted = completedLabs.includes(lab.id);

    // Only one-time correct answer submission allowed per student account
    if (alreadyCompleted) {
      return "already-completed" as const;
    }

    const preset = String(lab.presetFlag || lab.flag || "");
    const isCorrect = checkFlagMatch(submittedFlag, preset);
    const points = Number(lab.points || rewards.practiceLabBaseXp || 0);

    // Audit log each attempt
    transaction.set(doc(collection(db, "labSubmissions")), {
      userId: uid,
      userHandle,
      userEmail,
      labId: lab.id,
      labTitle: lab.title || lab.id,
      category: lab.category || "Practice lab",
      submittedFlag,
      isCorrect,
      xpAwarded: isCorrect ? points : 0,
      timestamp: serverTimestamp(),
    });

    // If answer is incorrect, do not complete lab; student can retry again and again
    if (!isCorrect) {
      return "incorrect" as const;
    }

    // Award XP and permanently mark completed in student's profile
    const newXp = Number(data?.xp || 0) + points;
    transaction.set(
      userRef,
      {
        ...activityUpdate(data),
        xp: increment(points),
        rank: getRankFromXp(newXp),
        completedLabs: arrayUnion(lab.id),
        learningTimeMinutes: Number(data?.learningTimeMinutes || 0) + 30,
      },
      { merge: true }
    );
    transaction.set(doc(collection(db, "submissions")), {
      uid,
      type: "lab",
      labId: lab.id,
      points,
      createdAt: serverTimestamp(),
    });

    return "awarded" as const;
  });
}

export async function submitDailyChallenge(uid: string, userHandle: string, userEmail: string, question: string, answer: string, fileUrl: string): Promise<DailyChallengeResult> {
  await liveRewards();
  return runTransaction(db, async (transaction) => {
    const today = dateKey();
    const userRef = doc(db, "users", uid);
    const userSnapshot = await transaction.get(userRef);
    const data = userSnapshot.data();
    const alreadyCompletedToday = data?.lastDailyChallengeDate === today;
    if (alreadyCompletedToday) return "already-submitted";
    const submissionRef = doc(db, "dailySubmissions", `${uid}_${today}`);
    transaction.set(submissionRef, {
      userId: uid,
      userHandle,
      userEmail,
      challengeId: "current",
      question,
      answer,
      fileUrl,
      submittedAt: serverTimestamp(),
      status: "pending",
      date: today
    });
    transaction.set(userRef, { ...activityUpdate(data), lastDailySubmissionDate: today }, { merge: true });
    return "submitted";
  });
}
