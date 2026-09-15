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
      canonical: seo.canonicalUrl || `${siteUrl.replace(/\/+$/, "")}/`,
      languages: {
        "en": `${siteUrl.replace(/\/+$/, "")}/`,
        "x-default": `${siteUrl.replace(/\/+$/, "")}/`,
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
        name: "What is ByteBreach Security Academy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ByteBreach Security Academy is a hands-on cybersecurity training platform and gamified cyber warfare battleground providing interactive CLI terminal simulations, Cisco networking tracks (CCNA, CCNP, CCIE), and real-world Capture-The-Flag (CTF) practice labs.",
        },
      },
      {
        "@type": "Question",
        name: "How do I earn XP and rank on ByteBreach?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Daily Challenges award 50 XP, completed learning rooms award 25 XP, and hands-on CTF practice labs award between 50 and 300 XP. Consecutive logins build streak multipliers on the global operative leaderboard.",
        },
      },
      {
        "@type": "Question",
        name: "How are CTF challenge flags validated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Flags are submitted in standard FLAG{...} format and validated case-insensitively with automatic whitespace trimming through an instant verification engine.",
        },
      },
      {
        "@type": "Question",
        name: "Are ByteBreach practice labs and study rooms free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, ByteBreach provides free community access to structured study modules, protocol cheat sheets, and hands-on CTF practice labs.",
        },
      },
      {
        "@type": "Question",
        name: "Can beginners start learning cybersecurity on ByteBreach?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, foundational tracks like CCNA and Security Fundamentals require zero prior engineering experience, starting with basic networking, binary IP addressing, and Linux terminal operations before advancing to exploit techniques.",
        },
      },
      {
        "@type": "Question",
        name: "Which certifications does ByteBreach prepare you for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ByteBreach prepares operatives for Cisco CCNA 200-301, CCNP 350-401 ENCOR, CCIE Enterprise Infrastructure, CompTIA Security+, CEH, and OSCP through hands-on terminal labs and realistic topologies.",
        },
      },
      {
        "@type": "Question",
        name: "How do browser-based terminal labs work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Labs run directly in your web browser with interactive terminal consoles, packet inspectors, and simulated routers, eliminating the need to install heavy virtual machines or hypervisors locally.",
        },
      },
      {
        "@type": "Question",
        name: "What resources are in the ByteBreach cheat sheet vault?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The vault contains searchable command cheat codes, Nmap discovery templates, Wireshark filter recipes, Subnetting reference sheets, and Bash automation scripts for quick reference during labs and exams.",
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
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Academy Context" />
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
