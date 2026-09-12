"use client";

import { useEffect } from "react";
import { isAppEnvironment } from "@/lib/adEnvironment";
import { initializeAdMob } from "@/services/admobService";

export function GoogleAdSense({ publisherId }: { publisherId?: string }) {
  useEffect(() => {
    // 1. Check if running inside mobile application / WebView / standalone container
    const isApp = isAppEnvironment();

    if (isApp) {
      // GOOGLE POLICY COMPLIANCE:
      // AdSense is strictly disallowed in mobile apps / WebViews.
      // Clean up any existing AdSense script to prevent policy strikes.
      const existingScript = document.querySelector(
        `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
      );
      if (existingScript) {
        existingScript.remove();
      }

      // Initialize AdMob native bridge for app users instead
      void initializeAdMob();
      return;
    }

    // 2. Web Browser traffic: Load Google AdSense
    if (!publisherId) return;
    const formatted = publisherId.startsWith("ca-") ? publisherId : `ca-${publisherId}`;

    // Prevent duplicate script tags
    if (
      document.querySelector(
        `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
      )
    ) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formatted}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, [publisherId]);

  return null;
}

export { GoogleAdSense as AdManager };
