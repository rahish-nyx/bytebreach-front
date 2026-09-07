export const LOCAL_ADMIN_EMAIL = process.env.NEXT_PUBLIC_LOCAL_ADMIN_EMAIL || "bytebreach@void";
export const LOCAL_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_LOCAL_ADMIN_PASSWORD || "void";
export const PRIMARY_ADMIN_EMAIL = process.env.NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL || "ikkaghostt@gmail.com";
export const PRIMARY_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_PRIMARY_ADMIN_PASSWORD || "bytebreach2026";
export const LOCAL_ADMIN_SESSION_KEY = "bytebreach-local-admin";

export function isLocalAdminCredential(email: string, password: string) {
  return (email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD)
    || (email === PRIMARY_ADMIN_EMAIL && password === PRIMARY_ADMIN_PASSWORD);
}
