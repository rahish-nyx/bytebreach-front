"use client";

import { arrayUnion, doc, onSnapshot, or, query, where, collection } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { useCallback, useEffect, useState } from "react";
import { db, getFirebaseMessaging } from "@/lib/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { updateRecord } from "@/lib/firestore";

export type AppNotification = { id: string; title?: string; body?: string; readBy?: string[]; dismissedBy?: string[]; createdAt?: unknown; target?: string; userId?: string };

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [foreground, setForeground] = useState<AppNotification | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    return onSnapshot(query(collection(db, "notifications"), or(where("target", "==", "all"), where("userId", "==", user.uid))), (snapshot) => {
      setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AppNotification)).filter((item) => !(item.dismissedBy || []).includes(user.uid)).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))));
    });
  }, [user]);

  useEffect(() => {
    let unsubscribe = () => {};
    void getFirebaseMessaging().then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => setForeground({
        id: `foreground-${Date.now()}`,
        title: payload.notification?.title || payload.data?.title,
        body: payload.notification?.body || payload.data?.body
      }));
    }).catch(() => {
      // Push messaging is optional; notification history remains available.
    });
    return () => unsubscribe();
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!user) throw new Error("Sign in before enabling push alerts.");
    if (!("Notification" in window) || !("serviceWorker" in navigator)) throw new Error("This browser does not support web push notifications.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission was not granted.");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = await getFirebaseMessaging();
    if (!messaging) throw new Error("Firebase Messaging is not supported in this browser.");
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) throw new Error("Firebase did not return a device token.");
    await updateRecord("users", user.uid, { fcmTokens: arrayUnion(token) });
    setPushEnabled(true);
    return token;
  }, [user]);

  const markRead = useCallback(async (notification: AppNotification) => {
    if (!user) return;
    await updateRecord("notifications", notification.id, { readBy: arrayUnion(user.uid) });
  }, [user]);

  const dismiss = useCallback(async (notification: AppNotification) => {
    if (!user) return;
    await updateRecord("notifications", notification.id, { dismissedBy: arrayUnion(user.uid) });
  }, [user]);

  const unreadCount = user ? notifications.filter((item) => !(item.readBy || []).includes(user.uid)).length : 0;
  return { notifications, foreground, unreadCount, pushEnabled, error, setError, requestNotificationPermission, markRead, dismiss };
}
