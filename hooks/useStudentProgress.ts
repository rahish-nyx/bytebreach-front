"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";

export type ProgressRecord = {
  id: string;
  status?: "not_started" | "in_progress" | "completed";
  percent?: number;
  lastViewedAt?: unknown;
  completedAt?: unknown;
};

export function useStudentProgress() {
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopProgress: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProgress?.();
      if (!user) {
        setProgress([]);
        setReady(true);
        return;
      }
      stopProgress = onSnapshot(
        collection(db, "users", user.uid, "progress"),
        (snapshot) => {
          setProgress(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ProgressRecord));
          setReady(true);
        },
        () => setReady(true)
      );
    });
    return () => {
      stopProgress?.();
      stopAuth();
    };
  }, []);

  return { progress, ready };
}
