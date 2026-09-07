import type { MetadataRoute } from "next";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const staticPaths = ["/", "/learning-paths", "/practice-labs", "/resources", "/leaderboard", "/about", "/contact", "/faq", "/terms", "/disclaimer", "/careers", "/privacy", "/cookies"];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://bytebreach.com";
  const urls = staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 }));
  try {
    const source = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH ? readFileSync(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH, "utf8") : process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    if (!source) return urls;
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(source)) });
    const firestore = getFirestore(app);
    const [tracks, modules, labs] = await Promise.all([firestore.collection("tracks").where("published", "==", true).get(), firestore.collection("modules").where("published", "==", true).get(), firestore.collection("labs").where("published", "==", true).get()]);
    return [...urls, ...tracks.docs.map((item) => ({ url: `${base}/learning-paths/${item.id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 })), ...modules.docs.map((item) => ({ url: `${base}/room/${item.id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 })), ...labs.docs.map((item) => ({ url: `${base}/practice-labs#${item.id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 }))];
  } catch { return urls; }
}
