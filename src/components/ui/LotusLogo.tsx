import React from "react";

interface LotusLogoProps {
  className?: string;
  size?: number;
}

export function LotusLogo({ className = "w-8 h-8", size = 32 }: LotusLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="lotusCenter" x1="24" y1="10" x2="24" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="lotusLeft" x1="12" y1="18" x2="22" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="lotusRight" x1="36" y1="18" x2="26" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="lotusFarLeft" x1="6" y1="24" x2="18" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="lotusFarRight" x1="42" y1="24" x2="30" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Far Left Petal */}
      <path
        d="M 6 28 C 6 22 14 26 22 36 C 14 36 6 34 6 28 Z"
        fill="url(#lotusFarLeft)"
        opacity="0.9"
      />

      {/* Far Right Petal */}
      <path
        d="M 42 28 C 42 22 34 26 26 36 C 34 36 42 34 42 28 Z"
        fill="url(#lotusFarRight)"
        opacity="0.9"
      />

      {/* Inner Left Petal */}
      <path
        d="M 12 18 C 12 18 20 22 23 37 C 16 35 11 27 12 18 Z"
        fill="url(#lotusLeft)"
      />

      {/* Inner Right Petal */}
      <path
        d="M 36 18 C 36 18 28 22 25 37 C 32 35 37 27 36 18 Z"
        fill="url(#lotusRight)"
      />

      {/* Center Main Petal */}
      <path
        d="M 24 8 C 21 17 20 28 24 38 C 28 28 27 17 24 8 Z"
        fill="url(#lotusCenter)"
      />

      {/* Golden/White Lotus Base Accent */}
      <ellipse cx="24" cy="38.5" rx="8" ry="2.5" fill="#F59E0B" opacity="0.8" />
    </svg>
  );
}
