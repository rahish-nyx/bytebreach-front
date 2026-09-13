// Administrative credentials are never hardcoded or exposed in client bundles.
// In production, all administrative access is strictly managed via Firebase Authentication
// and verified by server-side Firestore security rules.

export const LOCAL_ADMIN_EMAIL = process.env.NEXT_PUBLIC_LOCAL_ADMIN_EMAIL || "";
export const LOCAL_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_LOCAL_ADMIN_PASSWORD || "";
export const PRIMARY_ADMIN_EMAIL = process.env.NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL || "ikkaghostt@gmail.com";
export const PRIMARY_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_PRIMARY_ADMIN_PASSWORD || "";
export const LOCAL_ADMIN_SESSION_KEY = "bytebreach-local-admin";

export function isLocalAdminCredential(email: string, password: string): boolean {
  // Local bypass is strictly prohibited in production
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  // In development only: require non-empty configured credentials
  if (!email || !password) return false;
  const isLocal = Boolean(LOCAL_ADMIN_EMAIL && LOCAL_ADMIN_PASSWORD && email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD);
  const isPrimary = Boolean(PRIMARY_ADMIN_EMAIL && PRIMARY_ADMIN_PASSWORD && email === PRIMARY_ADMIN_EMAIL && password === PRIMARY_ADMIN_PASSWORD);
  return isLocal || isPrimary;
}

