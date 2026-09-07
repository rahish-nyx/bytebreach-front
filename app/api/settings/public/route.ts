import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const data = (await adminDb.doc("system/settings").get()).data() || {};
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
