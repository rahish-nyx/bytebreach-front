import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      emergencyCode?: string;
      newPassword?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const emergencyCode = body.emergencyCode?.trim();
    const newPassword = body.newPassword;

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }
    if (!emergencyCode) {
      return NextResponse.json({ error: "Emergency Pass Code is required." }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const auth = adminAuth;
    const firestore = adminDb;

    // Look up user by email in Firebase Auth and Firestore
    let uid = "";
    try {
      const authUser = await auth.getUserByEmail(email);
      uid = authUser.uid;
    } catch {
      // User not found in Firebase Auth
    }

    let userDocData: Record<string, any> | null = null;
    let targetDocId = uid;

    if (uid) {
      const docSnap = await firestore.collection("users").doc(uid).get();
      if (docSnap.exists) {
        userDocData = docSnap.data() || null;
      }
    }

    // Fallback: search by email field in Firestore users collection
    if (!userDocData) {
      const querySnap = await firestore
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        targetDocId = foundDoc.id;
        userDocData = foundDoc.data() || null;
        if (!uid) {
          uid = (userDocData?.uid as string) || targetDocId;
        }
      }
    }

    if (!userDocData || !uid) {
      return NextResponse.json(
        { error: "No operative account found matching that registered email address." },
        { status: 404 }
      );
    }

    const crypto = await import("crypto");
    const inputHash = crypto.createHash("sha256").update(emergencyCode).digest("hex");
    const savedHash = userDocData.emergencyCodeHash ? String(userDocData.emergencyCodeHash).trim() : null;
    const legacyPlain = userDocData.emergencyCode ? String(userDocData.emergencyCode).trim() : null;

    if (!savedHash && !legacyPlain) {
      return NextResponse.json(
        {
          error:
            "No Emergency Pass Code is registered for this account. Please contact ByteBreach Support to verify your identity."
        },
        { status: 400 }
      );
    }

    const matchesHash = Boolean(savedHash && savedHash.toLowerCase() === inputHash.toLowerCase());
    const matchesPlain = Boolean(legacyPlain && legacyPlain === emergencyCode);

    if (!matchesHash && !matchesPlain) {
      return NextResponse.json(
        {
          error: "Invalid Emergency Pass Code. Please verify your 6-digit code and try again."
        },
        { status: 401 }
      );
    }

    // Update password in Firebase Auth
    await auth.updateUser(uid, { password: newPassword });

    // Ensure plaintext emergency code is deleted and securely replaced with SHA-256 hash
    if (legacyPlain || !savedHash) {
      const { FieldValue } = await import("firebase-admin/firestore");
      await firestore
        .collection("users")
        .doc(targetDocId)
        .update({
          emergencyCodeHash: inputHash,
          emergencyCode: FieldValue.delete()
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new credentials."
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Password reset processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
