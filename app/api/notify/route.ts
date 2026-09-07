import { NextResponse } from "next/server";
import { adminApp, adminDb } from "@/lib/firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";

type NotifyRequest = { title?: string; body?: string; target?: "all" | "token" | "user"; token?: string; userId?: string; link?: string };

export async function POST(request: Request) {
  try {
    const payload = await request.json() as NotifyRequest;
    if (!payload.title?.trim() || !payload.body?.trim()) return NextResponse.json({ error: "title and body are required." }, { status: 400 });
    const messaging = getMessaging(adminApp);
    let tokens: string[] = [];
    if (payload.target === "token" && payload.token) tokens = [payload.token];
    else if (payload.target === "user" && payload.userId) {
      const user = (await adminDb.doc(`users/${payload.userId}`).get()).data();
      tokens = Array.isArray(user?.fcmTokens) ? user.fcmTokens.filter((token): token is string => typeof token === "string") : [];
    } else {
      const snapshot = await adminDb.collection("users").get();
      tokens = snapshot.docs.flatMap((document) => {
        const values = document.data().fcmTokens;
        return Array.isArray(values) ? values.filter((token): token is string => typeof token === "string") : [];
      });
    }
    tokens = [...new Set(tokens)];
    let sent = 0;
    for (let index = 0; index < tokens.length; index += 500) {
      const response = await messaging.sendEachForMulticast({
        tokens: tokens.slice(index, index + 500),
        notification: { title: payload.title.trim(), body: payload.body.trim() },
        data: { link: payload.link || "/" }
      });
      sent += response.successCount;
    }
    return NextResponse.json({ sent, devices: tokens.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notification delivery failed." }, { status: 503 });
  }
}
