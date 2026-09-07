"use client";

import { useEffect, useRef, useState } from "react";

type AdBannerProps = {
  slotId?: string;
  label?: string;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdBanner({ slotId, label = "sponsored learning tools", className = "" }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWidth, setHasWidth] = useState(false);
  const rawPublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID?.trim() || "";
  const formattedPublisherId = rawPublisherId
    ? (rawPublisherId.startsWith("ca-") ? rawPublisherId : `ca-${rawPublisherId}`)
    : "";
  const [configured, setConfigured] = useState(Boolean(formattedPublisherId && slotId));
  const adPushedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateWidth = () => setHasWidth(container.getBoundingClientRect().width > 0);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!configured || !hasWidth || adPushedRef.current) return;
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      }
    } catch {
      setConfigured(false);
    }
  }, [configured, hasWidth]);

  if (!configured || !hasWidth) {
    return (
      <div
        ref={containerRef}
        className={`flex min-h-[74px] items-center justify-center rounded-2xl border border-dashed border-line bg-white/[.015] text-[10px] uppercase tracking-[.2em] text-muted/60 ${className}`}
      >
        {label}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`overflow-hidden rounded-2xl border border-line bg-white/[.015] ${className}`}>
      <ins
        className="adsbygoogle block min-h-[74px] w-full"
        style={{ display: "block" }}
        data-ad-client={formattedPublisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
