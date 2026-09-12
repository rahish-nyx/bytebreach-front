import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { DAILY_CHALLENGE_POOL, ChallengePoolItem } from "@/lib/dailyChallengePool";

export async function GET() {
  try {
    const poolCollection = adminDb.collection("dailyChallengePool");
    let snapshot = await poolCollection.get();

    // If Firestore collection is empty, auto-seed with the initial 100 questions
    if (snapshot.empty) {
      console.log("[dailyChallengePool API] Initializing Firestore pool with 100 questions...");
      const batchSize = 100;
      const batch = adminDb.batch();

      for (const item of DAILY_CHALLENGE_POOL) {
        const docRef = poolCollection.doc(item.id);
        batch.set(docRef, {
          ...item,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      snapshot = await poolCollection.get();
    }

    const questions: ChallengePoolItem[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: String(data.title || ""),
        difficulty: (data.difficulty as "easy" | "medium") || "easy",
        category: String(data.category || data.parentTopic || "General"),
        scenario: String(data.scenario || ""),
        prompt: String(data.prompt || ""),
        instructions: String(data.instructions || ""),
        hint: String(data.hint || ""),
        answer: String(data.answer || ""),
      };
    });

    // Sort questions by ID naturally (dc-001, dc-002, etc.)
    questions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("[api/daily-challenge/pool] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load questions pool",
        questions: DAILY_CHALLENGE_POOL,
        count: DAILY_CHALLENGE_POOL.length,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChallengePoolItem>;

    if (!body.title?.trim() || !body.prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title and Prompt are required." },
        { status: 400 }
      );
    }

    const poolCollection = adminDb.collection("dailyChallengePool");

    // Generate next ID if not provided (e.g., dc-101)
    let newId = body.id?.trim();
    if (!newId) {
      const snapshot = await poolCollection.get();
      const count = snapshot.size;
      newId = `dc-${String(count + 1).padStart(3, "0")}`;
    }

    const newQuestion: ChallengePoolItem = {
      id: newId,
      title: body.title.trim(),
      difficulty: body.difficulty === "medium" ? "medium" : "easy",
      category: body.category?.trim() || "General",
      scenario: body.scenario?.trim() || "",
      prompt: body.prompt.trim(),
      instructions: body.instructions?.trim() || "",
      hint: body.hint?.trim() || "",
      answer: body.answer?.trim() || "",
    };

    await poolCollection.doc(newId).set({
      ...newQuestion,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: `Question ${newId} created successfully.`,
    });
  } catch (error) {
    console.error("[api/daily-challenge/pool] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create question" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChallengePoolItem> & { id: string };

    if (!body.id?.trim()) {
      return NextResponse.json({ success: false, error: "Question ID is required." }, { status: 400 });
    }

    const questionId = body.id.trim();
    const docRef = adminDb.collection("dailyChallengePool").doc(questionId);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json(
        { success: false, error: `Question with ID ${questionId} not found.` },
        { status: 404 }
      );
    }

    const updatedData: Partial<ChallengePoolItem> = {
      title: body.title?.trim(),
      difficulty: body.difficulty === "medium" ? "medium" : "easy",
      category: body.category?.trim() || "General",
      scenario: body.scenario?.trim() || "",
      prompt: body.prompt?.trim() || "",
      instructions: body.instructions?.trim() || "",
      hint: body.hint?.trim() || "",
      answer: body.answer?.trim() || "",
    };

    await docRef.update({
      ...updatedData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // If this question is currently the live challenge, update the live document as well
    const currentLiveDoc = await adminDb.collection("dailyChallenges").doc("current").get();
    if (currentLiveDoc.exists && currentLiveDoc.data()?.poolQuestionId === questionId) {
      await adminDb.collection("dailyChallenges").doc("current").update({
        ...updatedData,
        parentTopic: updatedData.category,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      question: { id: questionId, ...updatedData },
      message: `Question ${questionId} updated successfully.`,
    });
  } catch (error) {
    console.error("[api/daily-challenge/pool] PUT error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id?.trim()) {
      return NextResponse.json({ success: false, error: "Question ID is required." }, { status: 400 });
    }

    const questionId = id.trim();
    const docRef = adminDb.collection("dailyChallengePool").doc(questionId);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json(
        { success: false, error: `Question with ID ${questionId} not found.` },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      deletedId: questionId,
      message: `Question ${questionId} deleted successfully.`,
    });
  } catch (error) {
    console.error("[api/daily-challenge/pool] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete question" },
      { status: 500 }
    );
  }
}
