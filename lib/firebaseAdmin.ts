import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";

function getServiceAccountCredential(): admin.ServiceAccount | null {
  // 1. Production: parse JSON string from FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
  const jsonString =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

  if (jsonString) {
    try {
      const parsed = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      return parsed;
    } catch (error) {
      console.error("[firebaseAdmin] Failed to parse JSON from FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
  }

  // 2. Production alternative: discrete environment variables
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  // 3. Local Development fallback: file path, but ONLY if the file actually exists on disk
  const credentialPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
  if (credentialPath && typeof credentialPath === "string") {
    try {
      if (existsSync(credentialPath)) {
        const fileContent = readFileSync(credentialPath, "utf8");
        return JSON.parse(fileContent);
      } else {
        console.warn(
          `[firebaseAdmin] Service account path '${credentialPath}' does not exist on disk. Skipping file read to avoid ENOENT.`
        );
      }
    } catch (pathError) {
      console.warn("[firebaseAdmin] Error reading local service account file:", pathError);
    }
  }

  return null;
}

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  try {
    const cred = getServiceAccountCredential();
    if (cred) {
      return admin.initializeApp({
        credential: admin.credential.cert(cred),
      });
    }

    // Development / GCP default fallback
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "bytebreach-void";

    return admin.initializeApp({
      projectId,
    });
  } catch (error: any) {
    if (admin.apps.length > 0 && admin.apps[0]) {
      return admin.apps[0];
    }
    console.error("[firebaseAdmin] Firebase admin initialization error:", error);
    throw error;
  }
}

export const adminApp = initAdmin();
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);

export default admin;
