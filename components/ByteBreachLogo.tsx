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
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="bbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0070f3" />
          </linearGradient>

          <filter id="bbAmbientGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="24" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Ambient Pulsing Glow Halo */}
        <rect
          x="70"
          y="70"
          width="372"
          height="372"
          rx="116"
          fill="#00d4ff"
          opacity={animated ? "0.6" : "0.35"}
          filter="url(#bbAmbientGlow)"
          className={animated ? "animate-pulse" : ""}
        />

        {/* Squircle Background with Cyan-to-Blue Cyber Gradient */}
        <rect
          x="76"
          y="76"
          width="360"
          height="360"
          rx="110"
          fill="url(#bbGradient)"
        />

        {/* Detached Binary Pixel Glitch Elements */}
        {/* Far Left Isolated Pixel */}
        <rect
          x="116"
          y="248"
          width="28"
          height="28"
          rx="3"
          fill="#080d16"
          className={animated ? "animate-pulse" : ""}
          style={animated ? { animationDelay: "150ms" } : undefined}
        />

        {/* Upper Left Pixel */}
        <rect
          x="150"
          y="212"
          width="28"
          height="28"
          rx="3"
          fill="#080d16"
          className={animated ? "animate-pulse" : ""}
          style={animated ? { animationDelay: "300ms" } : undefined}
        />

        {/* Lower Left Pixel */}
        <rect
          x="150"
          y="284"
          width="28"
          height="28"
          rx="3"
          fill="#080d16"
          className={animated ? "animate-pulse" : ""}
          style={animated ? { animationDelay: "450ms" } : undefined}
        />

        {/* Letter B Main Body with Pill Counter Holes */}
        <path
          fill="#080d16"
          fillRule="evenodd"
          d="
            M 184 156
            L 316 156
            C 356 156, 386 178, 386 216
            C 386 242, 368 258, 348 264
            C 374 270, 396 290, 396 322
            C 396 362, 362 388, 316 388
            L 184 388
            L 184 326
            L 218 326
            L 218 284
            L 184 284
            L 184 248
            L 204 248
            L 204 212
            L 184 212
            Z

            M 234 192
            L 306 192
            C 326 192, 342 202, 342 218
            C 342 234, 326 244, 306 244
            L 234 244
            Z

            M 238 274
            L 314 274
            C 336 274, 352 286, 352 304
            C 352 322, 336 334, 314 334
            L 238 334
            Z
          "
        />
      </svg>
    </div>
  );
}
