import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

const staticPaths = [
  "/",
  "/learning-paths",
  "/practice-labs",
  "/resources",
  "/leaderboard",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/disclaimer",
  "/careers",
  "/privacy",
  "/cookies"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bytebreach.in";
  const base = rawBase.includes("bytebreach.in") && !rawBase.includes("www.bytebreach.in")
    ? rawBase.replace("bytebreach.in", "www.bytebreach.in")
    : rawBase;

  const urls: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1.0 : 0.7,
    images: path === "/" ? [`${base}/og-image.png`, `${base}/bytebreach-logo.png`] : undefined,
  }));

  try {
    const firestore = adminDb;
    const [tracks, modules, labs] = await Promise.all([
      firestore.collection("tracks").where("published", "==", true).get(),
      firestore.collection("modules").where("published", "==", true).get(),
      firestore.collection("labs").where("published", "==", true).get(),
    ]);

    return [
      ...urls,
      ...tracks.docs.map((item) => ({
        url: `${base}/learning-paths/${item.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: [`${base}/og-image.png`],
      })),
      ...modules.docs.map((item) => ({
        url: `${base}/room/${item.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...labs.docs.map((item) => ({
        url: `${base}/practice-labs#${item.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return urls;
  }
}
