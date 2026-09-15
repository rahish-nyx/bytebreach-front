import { NextResponse } from "next/server";

export async function GET() {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bytebreach.in";
  const base = rawBase.includes("bytebreach.in") && !rawBase.includes("www.bytebreach.in")
    ? rawBase.replace("bytebreach.in", "www.bytebreach.in")
    : rawBase;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${base}/</loc>
    <image:image>
      <image:loc>${base}/bytebreach-logo.webp</image:loc>
      <image:title>ByteBreach Official Logo</image:title>
      <image:caption>ByteBreach Cybersecurity Academy and Hands-On CTF Labs</image:caption>
    </image:image>
    <image:image>
      <image:loc>${base}/og-image.webp</image:loc>
      <image:title>ByteBreach Academy Platform Banner</image:title>
      <image:caption>Master hands-on cybersecurity, ethical hacking, CCNA to CCIE networking tracks</image:caption>
    </image:image>
  </url>
  <url>
    <loc>${base}/learning-paths</loc>
    <image:image>
      <image:loc>${base}/og-image.webp</image:loc>
      <image:title>Cybersecurity Learning Paths</image:title>
    </image:image>
  </url>
  <url>
    <loc>${base}/practice-labs</loc>
    <image:image>
      <image:loc>${base}/og-image.webp</image:loc>
      <image:title>Hands-On CTF Practice Labs</image:title>
    </image:image>
  </url>
  <url>
    <loc>${base}/resources</loc>
    <image:image>
      <image:loc>${base}/og-image.webp</image:loc>
      <image:title>Cybersecurity Cheat Sheets and Study Guides</image:title>
    </image:image>
  </url>
  <url>
    <loc>${base}/about</loc>
    <image:image>
      <image:loc>${base}/bytebreach-logo.webp</image:loc>
      <image:title>About ByteBreach Security Academy</image:title>
    </image:image>
  </url>
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}
