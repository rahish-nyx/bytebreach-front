"use client";

import { useEffect, useRef, useState } from "react";
import { useAdEnvironment } from "@/lib/adEnvironment";
import { ADMOB_NATIVE_AD_UNIT_ID, requestNativeAd } from "@/services/admobService";

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

export function AdBanner({
  slotId,
  label = "sponsored learning tools",
  className = "",
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWidth, setHasWidth] = useState(false);
  const { isApp, isReady } = useAdEnvironment();

  // AdSense Publisher ID (Client format: ca-pub-XXXXX)
  const rawPublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID?.trim() || "";
  const formattedPublisherId = rawPublisherId
    ? rawPublisherId.startsWith("ca-")
      ? rawPublisherId
      : `ca-${rawPublisherId}`
    : "ca-pub-8726665576912950";

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

  // Web Browser: Push AdSense ad
  useEffect(() => {
    if (isApp || !configured || !hasWidth || adPushedRef.current) return;
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      }
    } catch {
      setConfigured(false);
    }
  }, [isApp, configured, hasWidth]);

  // Mobile Application: Request AdMob Native Ad
  useEffect(() => {
    if (!isApp || !hasWidth) return;
    void requestNativeAd();
  }, [isApp, hasWidth]);

  // Mobile Application View: Render AdMob Native Ad Container
  if (isReady && isApp) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl border border-cyan/20 bg-panel/80 p-4 transition-all hover:border-cyan/40 ${className}`}
        data-admob-native-unit={ADMOB_NATIVE_AD_UNIT_ID}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2 text-[10px] uppercase tracking-wider text-muted">
          <span className="flex items-center gap-1 font-mono text-cyan">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            Ad · Sponsored
          </span>
          <span className="text-[9px] text-muted/60 font-mono">ByteBreach App AdMob</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-white">Advanced Cybersecurity Labs & Certifications</div>
            <div className="text-[11px] text-muted leading-relaxed">
              Explore professional offensive security tools, cloud sandbox networks, and exam vouchers.
            </div>
          </div>
          <a
            href="/resources"
            className="shrink-0 rounded-xl border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-xs font-medium text-cyan hover:bg-cyan/20 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    );
  }

  // Web Browser: AdSense Unit or Placeholder
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
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-2xl border border-line bg-white/[.015] ${className}`}
    >
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
