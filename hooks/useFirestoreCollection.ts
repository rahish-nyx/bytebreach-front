"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, QueryConstraint, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
const emptyConstraints: QueryConstraint[] = [];

export type FirestoreRecord = { id: string; [key: string]: unknown };

export function useFirestoreCollection<T extends FirestoreRecord>(
  collectionPath: string[],
  constraints: QueryConstraint[] = emptyConstraints
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const target = query(collection(db, collectionPath.join("/")), ...constraints);
    return onSnapshot(
      target,
      (snapshot) => {
        setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T));
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [collectionPath.join("/"), JSON.stringify(constraints)]);

  return { data, loading, error };
}
