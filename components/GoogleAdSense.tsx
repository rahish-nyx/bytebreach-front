"use client";

import { useEffect } from "react";

export function GoogleAdSense({ publisherId }: { publisherId?: string }) {
  useEffect(() => {
    if (!publisherId) return;
    const formatted = publisherId.startsWith("ca-") ? publisherId : `ca-${publisherId}`;

    // Prevent duplicate script tags
    if (document.querySelector(`script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`)) {
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
