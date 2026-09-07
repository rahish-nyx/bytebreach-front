import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  if (getApps().length) return getApps()[0];
  const credentialPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
  const credentialJson = credentialPath
    ? readFileSync(credentialPath, "utf8")
    : process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!credentialJson) throw new Error("Firebase Admin credentials are not configured.");
  return initializeApp({ credential: cert(JSON.parse(credentialJson)) });
}

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

    const app = adminApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

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

    const savedCode = userDocData.emergencyCode ? String(userDocData.emergencyCode).trim() : null;

    if (!savedCode) {
      return NextResponse.json(
        {
          error:
            "No Emergency Pass Code is registered for this account. Please contact ByteBreach Support to verify your identity."
        },
        { status: 400 }
      );
    }

    if (savedCode !== emergencyCode) {
      return NextResponse.json(
        {
          error: "Invalid Emergency Pass Code. Please verify your 6-digit code and try again."
        },
        { status: 401 }
      );
    }

    // Update password in Firebase Auth
    await auth.updateUser(uid, { password: newPassword });

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
