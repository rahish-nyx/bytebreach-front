import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bytebreach.in";
  const base = rawBase.includes("bytebreach.in") && !rawBase.includes("www.bytebreach.in")
    ? rawBase.replace("bytebreach.in", "www.bytebreach.in")
    : rawBase;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Applebot-Extended",
          "cohere-ai",
          "Bytespider",
          "CCBot",
          "Meta-ExternalAgent",
          "FacebookBot",
        ],
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/image-sitemap.xml`,
    ],
    host: base,
  };
}
