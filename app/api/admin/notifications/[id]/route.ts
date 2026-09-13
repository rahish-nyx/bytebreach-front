import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
    }

    const docRef = adminDb.collection("notifications").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Notification document not found." }, { status: 404 });
    }

    const payload = (await request.json()) as {
      action?: "abort" | "edit" | string;
      title?: string;
      body?: string;
    };

    if (payload.action === "abort") {
      await docRef.update({
        status: "aborted",
        abortedAt: new Date()
      });
      return NextResponse.json({ success: true, message: "Alert aborted successfully." }, { status: 200 });
    }

    if (payload.action === "edit") {
      const title = payload.title?.trim();
      const body = payload.body?.trim();

      if (!title || !body) {
        return NextResponse.json(
          { error: "Both title and body are required for edit action." },
          { status: 400 }
        );
      }

      await docRef.update({
        title,
        body,
        updatedAt: new Date()
      });

      return NextResponse.json({ success: true, message: "Alert updated successfully." }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions are 'abort' or 'edit'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/admin/notifications/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update alert." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
    }

    const docRef = adminDb.collection("notifications").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Notification document not found." }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: "Alert deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("[api/admin/notifications/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete alert." },
      { status: 500 }
    );
  }
}
