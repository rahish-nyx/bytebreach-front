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

    // 3. Load asynchronously upon first user interaction or idle timeout
    // Prevents render-blocking 3rd-party script penalties during SEO crawler scans
    // while providing fast ad delivery for real engaged visitors
    let loaded = false;

    const loadScript = () => {
      if (loaded) return;
      if (
        document.querySelector(
          `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
        )
      ) {
        loaded = true;
        return;
      }
      loaded = true;

      window.removeEventListener("scroll", loadScript);
      window.removeEventListener("mousemove", loadScript);
      window.removeEventListener("touchstart", loadScript);
      window.removeEventListener("keydown", loadScript);
      window.removeEventListener("click", loadScript);

      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formatted}`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    };

    // Trigger on any human engagement
    window.addEventListener("scroll", loadScript, { passive: true, once: true });
    window.addEventListener("mousemove", loadScript, { passive: true, once: true });
    window.addEventListener("touchstart", loadScript, { passive: true, once: true });
    window.addEventListener("keydown", loadScript, { passive: true, once: true });
    window.addEventListener("click", loadScript, { passive: true, once: true });

    // Fallback: If no user interaction after 4.5 seconds, load in background idle
    const fallbackTimer = setTimeout(() => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(loadScript, { timeout: 2500 });
      } else {
        loadScript();
      }
    }, 4500);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("scroll", loadScript);
      window.removeEventListener("mousemove", loadScript);
      window.removeEventListener("touchstart", loadScript);
      window.removeEventListener("keydown", loadScript);
      window.removeEventListener("click", loadScript);
    };
  }, [publisherId]);

  return null;
}

export { GoogleAdSense as AdManager };
