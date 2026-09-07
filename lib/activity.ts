import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Automated Day Streak Logic:
 * Store lastActiveDate (YYYY-MM-DD) and streakCount in users/{uid}.
 * Case 1: lastActiveDate === today: Do nothing (already accounted for).
 * Case 2: lastActiveDate === yesterday: Increment streakCount.
 * Case 3: lastActiveDate < yesterday (or undefined): Reset streakCount to 1.
 */
export async function updateUserActivity(uid: string): Promise<void> {
  if (!uid) return;

  try {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        streakCount: 1,
        streak: 1,
        lastActiveDate: today,
      }, { merge: true });
      return;
    }

    const data = snap.data();
    const lastActiveDate = typeof data?.lastActiveDate === "string" ? data.lastActiveDate : "";

    // Case 1: Already accounted for today
    if (lastActiveDate === today) {
      return;
    }

    // Case 2: Yesterday was active -> increment streak
    if (lastActiveDate === yesterday) {
      await updateDoc(userRef, {
        streakCount: increment(1),
        streak: increment(1),
        lastActiveDate: today,
      });
    } else {
      // Case 3: Missed a day or first activity -> reset streak back to 1
      await updateDoc(userRef, {
        streakCount: 1,
        streak: 1,
        lastActiveDate: today,
      });
    }
  } catch (error) {
    console.error("Failed to update user activity streak:", error);
  }
}
