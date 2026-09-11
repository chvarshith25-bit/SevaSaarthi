import React from "react";

interface StateEmblemProps {
  className?: string;
  size?: number;
}

export function StateEmblem({ className = "", size = 32 }: StateEmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central Lion Head */}
      <path d="M44 14 C44 8, 56 8, 56 14 C58 16, 61 17, 61 21 C61 25, 58 27, 56 29 C56 34, 44 34, 44 29 C42 27, 39 25, 39 21 C39 17, 42 16, 44 14 Z" />
      {/* Central Lion Mane & Crown */}
      <path d="M41 12 C44 6, 56 6, 59 12 C64 15, 66 22, 63 28 C61 32, 57 36, 50 38 C43 36, 39 32, 37 28 C34 22, 36 15, 41 12 Z" opacity="0.3" />
      
      {/* Left Lion Silhouette */}
      <path d="M28 20 C28 14, 38 15, 38 22 C38 27, 34 30, 31 34 C26 31, 23 26, 28 20 Z" />
      <path d="M22 28 C20 35, 26 42, 33 44 C34 40, 34 36, 32 32 C27 30, 24 28, 22 28 Z" opacity="0.4" />

      {/* Right Lion Silhouette */}
      <path d="M72 20 C72 14, 62 15, 62 22 C62 27, 66 30, 69 34 C74 31, 77 26, 72 20 Z" />
      <path d="M78 28 C80 35, 74 42, 67 44 C66 40, 66 36, 68 32 C73 30, 76 28, 78 28 Z" opacity="0.4" />

      {/* Central Chest & Front Paws */}
      <path d="M42 38 C42 38, 40 54, 38 65 C44 67, 56 67, 62 65 C60 54, 58 38, 58 38 C54 41, 46 41, 42 38 Z" />
      
      {/* Left Paw Pillar */}
      <path d="M28 46 C32 46, 36 54, 35 65 C30 65, 25 62, 28 46 Z" />
      {/* Right Paw Pillar */}
      <path d="M72 46 C68 46, 64 54, 65 65 C70 65, 75 62, 72 46 Z" />

      {/* Abacus / Base Platform */}
      <rect x="14" y="66" width="72" height="6" rx="2" />
      
      {/* Central Dharma Chakra (Wheel of Law) on Abacus */}
      <circle cx="50" cy="80" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="50" cy="80" r="2" />
      {/* Chakra Spokes */}
      <line x1="50" y1="72" x2="50" y2="88" stroke="currentColor" strokeWidth="1.5" />
      <line x1="42" y1="80" x2="58" y2="80" stroke="currentColor" strokeWidth="1.5" />
      <line x1="44" y1="74" x2="56" y2="86" stroke="currentColor" strokeWidth="1" />
      <line x1="44" y1="86" x2="56" y2="74" stroke="currentColor" strokeWidth="1" />

      {/* Flanking Galloping Horse (Left) & Bull (Right) motifs on frieze */}
      <path d="M22 76 C26 74, 30 76, 32 82 C28 84, 24 82, 22 76 Z" />
      <path d="M78 76 C74 74, 70 76, 68 82 C72 84, 76 82, 78 76 Z" />

      {/* Lower Bell Shaped Inverted Lotus Base */}
      <rect x="10" y="89" width="80" height="5" rx="1.5" />
      <path d="M16 95 C25 106, 75 106, 84 95 Z" opacity="0.8" />
      
      {/* Satyameva Jayate Banner Base */}
      <rect x="18" y="106" width="64" height="4" rx="1" />
      {/* Script lines representing Devanagari "सत्यमेव जयते" */}
      <line x1="26" y1="113" x2="74" y2="113" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="117" x2="42" y2="117" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="46" y1="117" x2="54" y2="117" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="58" y1="117" x2="68" y2="117" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
