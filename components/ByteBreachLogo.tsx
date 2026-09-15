"use client";

import React from "react";

interface ByteBreachLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function ByteBreachLogo({
  size = 56,
  className = "",
  animated = false,
}: ByteBreachLogoProps) {
  const defaultSrc =
    size <= 48
      ? "/bytebreach-logo-48.webp"
      : size <= 96
      ? "/bytebreach-logo-96.webp"
      : "/bytebreach-logo-192.webp";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <picture>
        <source
          type="image/webp"
          srcSet="/bytebreach-logo-48.webp 48w, /bytebreach-logo-96.webp 96w, /bytebreach-logo-192.webp 192w, /bytebreach-logo.webp 512w"
          sizes={`${size}px`}
        />
        <img
          src={defaultSrc}
          srcSet="/bytebreach-logo-48.webp 48w, /bytebreach-logo-96.webp 96w, /bytebreach-logo-192.webp 192w, /bytebreach-logo.webp 512w"
          sizes={`${size}px`}
          alt="ByteBreach Security Academy Official Logo"
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-contain rounded-xl select-none filter drop-shadow-[0_0_14px_rgba(0,212,255,0.7)] transition-all duration-300 ${
            animated ? "animate-pulse" : ""
          }`}
        />
      </picture>
    </div>
  );
}
