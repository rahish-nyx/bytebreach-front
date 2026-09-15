"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { isAppEnvironment } from "@/lib/adEnvironment";
import { initializeAdMob } from "@/services/admobService";

export function GoogleAdSense({ publisherId }: { publisherId?: string }) {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    const app = isAppEnvironment();
    setIsApp(app);

    if (app) {
      const existingScript = document.querySelector(
        `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
      void initializeAdMob();
    }
  }, []);

  if (isApp || !publisherId) return null;

  const formatted = publisherId.startsWith("ca-") ? publisherId : `ca-${publisherId}`;

  return (
    <Script
      id="google-adsense"
      strategy="lazyOnload"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formatted}`}
      crossOrigin="anonymous"
    />
  );
}

export { GoogleAdSense as AdManager };
