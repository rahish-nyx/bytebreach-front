import { addDoc, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName?: string;
  handle?: string;
  role?: "admin" | "student";
  rank?: string;
  xp?: number;
  completedLabs?: number | string[];
  streak?: number;
  learningTimeMinutes?: number;
  lastActiveDate?: string;
  emergencyCode?: string;
};

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function upsertUserProfile(profile: UserProfile) {
  await setDoc(doc(db, "users", profile.uid), profile, { merge: true });
}

export const createRecord = (collectionName: string, data: Record<string, unknown>) => addDoc(collection(db, collectionName), data);
export const updateRecord = (collectionName: string, id: string, data: Record<string, unknown>) => updateDoc(doc(db, collectionName, id), data);
export const removeRecord = (collectionName: string, id: string) => deleteDoc(doc(db, collectionName, id));

export async function saveModuleProgress(
  uid: string,
  moduleId: string,
  progress: { status: "in_progress" | "completed"; percent: number }
) {
  await setDoc(
    doc(db, "users", uid, "progress", moduleId),
    { ...progress, lastViewedAt: serverTimestamp(), ...(progress.status === "completed" ? { completedAt: serverTimestamp() } : {}) },
    { merge: true }
  );
}
