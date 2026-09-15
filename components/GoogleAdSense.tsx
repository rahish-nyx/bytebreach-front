"use client";

import { useEffect } from "react";
import { isAppEnvironment } from "@/lib/adEnvironment";
import { initializeAdMob } from "@/services/admobService";

export function GoogleAdSense({ publisherId }: { publisherId?: string }) {
  useEffect(() => {
    // 1. Mobile app container check: disable AdSense to comply with Google policies
    const isApp = isAppEnvironment();

    if (isApp) {
      const existingScript = document.querySelector(
        `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
      void initializeAdMob();
      return;
    }

    if (!publisherId) return;

    const formatted = publisherId.startsWith("ca-") ? publisherId : `ca-${publisherId}`;

    // 2. Prevent duplicate script injection
    if (
      document.querySelector(
        `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
      )
    ) {
      return;
    }

    // 3. Load asynchronously during browser idle time without Next.js 'data-nscript' attribute
    // This completely eliminates the "AdSense head tag doesn't support data-nscript attribute" console warning
    const loadScript = () => {
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
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(loadScript, { timeout: 2000 });
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    } else {
      const timer = setTimeout(loadScript, 1000);
      return () => clearTimeout(timer);
    }
  }, [publisherId]);

  return null;
}

export { GoogleAdSense as AdManager };
