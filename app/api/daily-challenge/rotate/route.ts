import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  getCurrentCycleDate,
  getNextCycleRotationTime,
  getQuestionIndexForCycle,
  rotateDailyChallengeIfNeeded,
} from "@/lib/dailyChallengeScheduler";
import { DAILY_CHALLENGE_POOL } from "@/lib/dailyChallengePool";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const syncParam = url.searchParams.get("sync");
    const forceParam = url.searchParams.get("force");

    const currentCycle = getCurrentCycleDate();
    const nextRotation = getNextCycleRotationTime();
    const poolIndex = getQuestionIndexForCycle(currentCycle);

    // If requested, perform check/rotation
    let rotationResult = null;
    if (syncParam === "true" || syncParam === "1" || forceParam === "true" || forceParam === "1") {
      rotationResult = await rotateDailyChallengeIfNeeded({
        force: forceParam === "true" || forceParam === "1",
      });
    }

    const docRef = adminDb.collection("dailyChallenges").doc("current");
    const snapshot = await docRef.get();
    const currentDoc = snapshot.exists ? snapshot.data() : null;

    return NextResponse.json({
      success: true,
      currentCycle,
      nextRotation: nextRotation.toISOString(),
      poolSize: DAILY_CHALLENGE_POOL.length,
      scheduledPoolIndex: poolIndex,
      scheduledQuestion: DAILY_CHALLENGE_POOL[poolIndex] || null,
      currentLive: {
        title: currentDoc?.title || null,
        category: currentDoc?.category || currentDoc?.parentTopic || null,
        difficulty: currentDoc?.difficulty || "medium",
        source: currentDoc?.source || "auto",
        manualCycle: currentDoc?.manualCycle || null,
        autoCycle: currentDoc?.autoCycle || null,
        poolQuestionId: currentDoc?.poolQuestionId || null,
        updatedAt: currentDoc?.updatedAt || null,
      },
      rotationResult,
    });
  } catch (error) {
    console.error("[api/daily-challenge/rotate] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to query rotation status",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "sync" | "force_rotate" | "set_question" | "reset_auto";
      questionId?: string;
    };

    const action = body.action || "sync";

    if (action === "force_rotate") {
      const result = await rotateDailyChallengeIfNeeded({ force: true });
      return NextResponse.json({ success: true, action, result });
    }

    if (action === "set_question" && body.questionId) {
      const result = await rotateDailyChallengeIfNeeded({
        force: true,
        questionId: body.questionId,
      });
      return NextResponse.json({ success: true, action, result });
    }

    if (action === "reset_auto") {
      const result = await rotateDailyChallengeIfNeeded({ force: true });
      return NextResponse.json({
        success: true,
        action,
        message: "Cleared manual override and reset to scheduled auto-pool question.",
        result,
      });
    }

    // Default: sync / auto-rotate check
    const result = await rotateDailyChallengeIfNeeded();
    return NextResponse.json({ success: true, action, result });
  } catch (error) {
    console.error("[api/daily-challenge/rotate] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute rotation action",
      },
      { status: 500 }
    );
  }
}
