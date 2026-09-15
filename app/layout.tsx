import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { adminDb } from "@/lib/firebaseAdmin";

import { GoogleAdSense } from "@/components/GoogleAdSense";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { FloatingBreachBuddy } from "@/components/FloatingBreachBuddy";
import { CookieBanner } from "@/components/CookieBanner";
import { RouteGuard } from "@/components/RouteGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

type Seo = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  googleVerification?: string;
  bingVerification?: string;
};

const defaultKeywords = [
  "cybersecurity academy",
  "ethical hacking labs",
  "CCNA networking course",
  "CCNP enterprise training",
  "CCIE security certification",
  "hands-on CTF challenges",
  "practice labs",
  "penetration testing",
  "cyber defense",
  "packet analysis",
  "cybersecurity cheat sheets",
  "network engineering labs",
  "ByteBreach security academy"
];

async function getSeo(): Promise<Seo> {
  try {
    const doc = await adminDb.doc("system/seo").get();
    return (doc.data() as Seo) || {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bytebreach.in";
  // 56 characters — strictly in ideal 50-60 character range
  const defaultTitle = "ByteBreach | Cybersecurity Training & Hands-On CTF Labs";
  // 154 characters — strictly in ideal 150-160 character range
  const defaultDescription =
    "Master hands-on cybersecurity, ethical hacking, CCNA to CCIE networking tracks, and real-world CTF challenges. Join ByteBreach Security Academy for free.";

  const title =
    seo.title && seo.title.length <= 60 && !seo.title.includes("Elite Cybersecurity Training & Hands-On CTF Labs")
      ? seo.title
      : defaultTitle;

  const description =
    seo.description && seo.description.length >= 130 && seo.description.length <= 165
      ? seo.description
      : defaultDescription;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: "%s | ByteBreach",
    },
    description: description,
    keywords: seo.keywords && seo.keywords.length > 0 ? seo.keywords : defaultKeywords,
    authors: [{ name: "ByteBreach Academy", url: siteUrl }],
    creator: "ByteBreach",
    publisher: "ByteBreach Security Academy",
    applicationName: "ByteBreach",
    generator: "Next.js",
    alternates: {
      canonical: seo.canonicalUrl || siteUrl,
      languages: {
        "en": siteUrl,
        "x-default": siteUrl,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      url: seo.canonicalUrl || siteUrl,
      siteName: "ByteBreach Security Academy",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: seo.ogImage || `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "ByteBreach Security Academy - Hands-On Cyber Warfare Training",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: [seo.ogImage || `${siteUrl}/og-image.png`],
      creator: "@bytebreach",
      site: "@bytebreach",
    },
    verification: {
      google: seo.googleVerification,
      other: seo.bingVerification ? { "msvalidate.01": seo.bingVerification } : undefined,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080b12",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const rawPublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID?.trim() || "";
  const adsensePublisherId = rawPublisherId
    ? rawPublisherId.startsWith("ca-")
      ? rawPublisherId
      : `ca-${rawPublisherId}`
    : "";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bytebreach.in";

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ByteBreach Security Academy",
    url: siteUrl,
    description: "Hands-on cybersecurity training, CCNA/CCNP/CCIE labs, and gamified CTF challenges.",
    sameAs: [
      "https://github.com/rahish-nyx/bytebreach-front",
      "https://twitter.com/bytebreach",
      "https://t.me/ByteBreachBot",
      "https://www.linkedin.com/company/bytebreach",
      "https://www.youtube.com/@ByteBreach"
    ],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/resources?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "ByteBreach Security Academy",
    description: "Hands-on cybersecurity training, enterprise networking, and gamified CTF labs.",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    sameAs: [
      "https://github.com/rahish-nyx/bytebreach-front",
      "https://twitter.com/bytebreach",
      "https://t.me/ByteBreachBot",
      "https://www.linkedin.com/company/bytebreach",
      "https://www.youtube.com/@ByteBreach"
    ],
    hasCourse: [
      {
        "@type": "Course",
        name: "CCNA - Cisco Certified Network Associate",
        description: "Foundational networking, IPv4/IPv6 subnetting, routing protocols, and packet analysis.",
        provider: { "@type": "EducationalOrganization", name: "ByteBreach Security Academy" },
      },
      {
        "@type": "Course",
        name: "CCNP - Enterprise Infrastructure",
        description: "Advanced enterprise routing, dual-stack architectures, infrastructure security, and automation.",
        provider: { "@type": "EducationalOrganization", name: "ByteBreach Security Academy" },
      },
      {
        "@type": "Course",
        name: "CCIE - Enterprise Infrastructure Masterclass",
        description: "Expert-level complex network topologies, border gateway routing, and critical infrastructure defense.",
        provider: { "@type": "EducationalOrganization", name: "ByteBreach Security Academy" },
      },
      {
        "@type": "Course",
        name: "Ethical Hacking & Penetration Testing",
        description: "Authorized offensive security, reconnaissance, web exploitation, privilege escalation, and defense.",
        provider: { "@type": "EducationalOrganization", name: "ByteBreach Security Academy" },
      },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I earn XP on ByteBreach?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Daily Challenges award 50 XP, completed study rooms award 25 XP, and CTF practice labs award between 50 and 300 XP.",
        },
      },
      {
        "@type": "Question",
        name: "How are CTF flags validated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Flags are trimmed and compared case-insensitively in FLAG{...} format.",
        },
      },
      {
        "@type": "Question",
        name: "Are the practice labs free to access?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, ByteBreach provides free community access to structured study rooms, cheat sheets, and CTF practice labs.",
        },
      },
    ],
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [website, organization, faq],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <link rel="preload" href="/bytebreach-logo.webp" as="image" type="image/webp" />
        <script
          id="schema-structured-data"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
        <GoogleAnalytics />
        <GoogleAdSense publisherId={adsensePublisherId} />
        <AuthProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
          <FloatingBreachBuddy />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
