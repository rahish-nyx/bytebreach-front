import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("notifications").get();
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      const rawDate = data.createdAt || data.sentAt;
      let createdAtStr: string = new Date().toISOString();

      if (rawDate && typeof rawDate.toDate === "function") {
        createdAtStr = rawDate.toDate().toISOString();
      } else if (rawDate instanceof Date) {
        createdAtStr = rawDate.toISOString();
      } else if (typeof rawDate === "string") {
        createdAtStr = rawDate;
      }

      let updatedAtStr: string | undefined = undefined;
      if (data.updatedAt && typeof data.updatedAt.toDate === "function") {
        updatedAtStr = data.updatedAt.toDate().toISOString();
      } else if (data.updatedAt instanceof Date) {
        updatedAtStr = data.updatedAt.toISOString();
      } else if (typeof data.updatedAt === "string") {
        updatedAtStr = data.updatedAt;
      }

      return {
        id: doc.id,
        title: data.title || "Untitled Alert",
        body: data.body || "",
        status: (data.status as "active" | "aborted" | "delivered") || "active",
        target: data.target || data.audience || "all",
        createdAt: createdAtStr,
        updatedAt: updatedAtStr
      };
    });

    // Sort newest first
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error) {
    console.error("[api/admin/notifications] Fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
