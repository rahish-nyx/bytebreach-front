import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:demo"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Long polling is more reliable than WebChannel on localhost, VPNs, and restrictive proxies.
/** @type {import("firebase/firestore").Firestore} */
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false
  });
} catch {
  db = getFirestore(app);
}
export { db };
export const storage = getStorage(app);
export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  const { getMessaging, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  return getMessaging(app);
}
// Analytics is opt-in because browser extensions, ad blockers, and offline
// development commonly reject the Google Analytics network request.
export const analytics = Promise.resolve(null);
export { app, firebaseConfig };
