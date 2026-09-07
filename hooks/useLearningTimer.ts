"use client";

import { useEffect, useRef } from "react";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/**
 * Automated Learning Time Tracker:
 * Accumulates active learning seconds while the browser tab is visible.
 * Periodically flushes active time to users/{uid}.totalLearningSeconds (and learningTimeMinutes).
 * Also flushes on tab hide, page navigation (unmount), and beforeunload.
 */
export function useLearningTimer(uid: string | undefined) {
  const accumulatedSecondsRef = useRef<number>(0);
  const uidRef = useRef<string | undefined>(uid);

  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    const flushTime = async () => {
      const secondsToFlush = accumulatedSecondsRef.current;
      if (secondsToFlush <= 0 || !uidRef.current) return;
      accumulatedSecondsRef.current = 0;

      try {
        await updateDoc(userRef, {
          totalLearningSeconds: increment(secondsToFlush),
          learningTimeMinutes: increment(Math.round(secondsToFlush / 60)),
        });
      } catch (error) {
        // Restore seconds on failure so they can be retried on the next flush
        accumulatedSecondsRef.current += secondsToFlush;
        console.error("Failed to persist learning time:", error);
      }
    };

    let secondsSinceLastFlush = 0;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        accumulatedSecondsRef.current += 1;
        secondsSinceLastFlush += 1;

        // Flush every 60 seconds (1 minute of active engagement)
        if (secondsSinceLastFlush >= 60) {
          secondsSinceLastFlush = 0;
          void flushTime();
        }
      }
    }, 1000);

    const handleBeforeUnload = () => {
      void flushTime();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushTime();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Flush any remaining active seconds on unmount/page transition
      void flushTime();
    };
  }, [uid]);
}
