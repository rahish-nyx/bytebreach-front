import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  if (getApps().length) return getApps()[0];
  const source = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH
    ? readFileSync(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH, "utf8")
    : process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!source) throw new Error("Firebase Admin credentials are not configured.");
  return initializeApp({ credential: cert(JSON.parse(source)) });
}

export async function GET() {
  try {
    const data = (await getFirestore(adminApp()).doc("system/settings").get()).data() || {};
    return NextResponse.json({
      dailyChallengeXp: Number(data.dailyChallengeXp || 50),
      roomCompletionXp: Number(data.roomCompletionXp || 25),
      practiceLabBaseXp: Number(data.practiceLabBaseXp || 100),
      maintenanceMode: data.maintenanceMode === true,
      registrationLocked: data.registrationLocked === true,
      announcementEnabled: data.announcementEnabled === true,
      announcementText: String(data.announcementText || "")
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Settings unavailable." }, { status: 503 });
  }
}
