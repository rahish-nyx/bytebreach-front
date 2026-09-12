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
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/bytebreach-logo.png"
        alt="ByteBreach Logo"
        width={size}
        height={size}
        className={`h-full w-full object-contain rounded-xl select-none filter drop-shadow-[0_0_14px_rgba(0,212,255,0.7)] transition-all duration-300 ${
          animated ? "animate-pulse" : ""
        }`}
      />
    </div>
  );
}
