import React from "react";

export function IndiaMonumentsBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-end overflow-hidden pointer-events-none ${className}`}>
      {/* Sovereignty slogan text */}
      <div className="text-right hidden sm:block select-none mr-4 z-10">
        <div className="text-[13px] font-black tracking-wider text-slate-800 uppercase">
          Citizens
        </div>
        <div className="text-[13px] font-black tracking-wider text-blue-900 uppercase">
          Stronger India
        </div>
        <div className="text-[13px] font-black tracking-wider text-slate-700 uppercase">
          Brighter Tomorrow
        </div>
        <div className="h-1 w-20 ml-auto mt-1 flex rounded-full overflow-hidden">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="w-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </div>

      {/* SVG Monuments Silhouette + Waving Flag Ribbon + Flying Birds */}
      <div className="w-48 sm:w-64 md:w-80 h-28 sm:h-32 relative shrink-0">
        <svg
          viewBox="0 0 320 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="flagSaffron" x1="120" y1="10" x2="300" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF9933" stopOpacity="0.9" />
              <stop offset="1" stopColor="#FF9933" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="flagWhite" x1="120" y1="20" x2="300" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="1" stopColor="#F8FAFC" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="flagGreen" x1="120" y1="30" x2="300" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#138808" stopOpacity="0.9" />
              <stop offset="1" stopColor="#138808" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="monumentGold" x1="0" y1="50" x2="0" y2="130" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D97706" stopOpacity="0.45" />
              <stop offset="1" stopColor="#B45309" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Flying Birds in Sky */}
          <path d="M 60 22 Q 65 18 70 22 Q 75 18 80 22" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M 78 14 Q 82 11 86 14 Q 90 11 94 14" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M 96 26 Q 99 23 102 26 Q 105 23 108 26" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />

          {/* Tricolor Waving Ribbon in Sky */}
          <path
            d="M 120 18 C 170 8, 210 32, 260 16 C 285 8, 305 15, 320 22 L 320 32 C 305 25, 285 18, 260 26 C 210 42, 170 18, 120 28 Z"
            fill="url(#flagSaffron)"
          />
          <path
            d="M 120 28 C 170 18, 210 42, 260 26 C 285 18, 305 25, 320 32 L 320 42 C 305 35, 285 28, 260 36 C 210 52, 170 28, 120 38 Z"
            fill="url(#flagWhite)"
          />
          <path
            d="M 120 38 C 170 28, 210 52, 260 36 C 285 28, 305 35, 320 42 L 320 52 C 305 45, 285 38, 260 46 C 210 62, 170 38, 120 48 Z"
            fill="url(#flagGreen)"
          />

          {/* India Gate Silhouette (Left Monument) */}
          <g fill="url(#monumentGold)">
            {/* Base */}
            <rect x="40" y="115" width="46" height="15" rx="1" />
            {/* Left & Right Piers */}
            <rect x="44" y="65" width="10" height="50" rx="1" />
            <rect x="72" y="65" width="10" height="50" rx="1" />
            {/* Main Arch Cutout */}
            <path d="M 54 85 C 54 75, 72 75, 72 85 L 72 115 L 54 115 Z" fill="#F8FAFC" opacity="0.3" />
            {/* Top Attic/Cornice */}
            <rect x="42" y="55" width="42" height="10" rx="1" />
            <rect x="46" y="48" width="34" height="7" rx="1" />
            {/* Chhatri Cupola on Top */}
            <rect x="58" y="40" width="10" height="8" rx="1" />
          </g>

          {/* Taj Mahal Silhouette (Center-Right Monument) */}
          <g fill="url(#monumentGold)">
            {/* Main Platform Plinth */}
            <rect x="100" y="118" width="120" height="12" rx="1" />
            {/* Left Minaret */}
            <rect x="104" y="55" width="5" height="63" rx="1" />
            <circle cx="106.5" cy="53" r="3.5" />
            <line x1="106.5" y1="50" x2="106.5" y2="44" stroke="#B45309" strokeWidth="1.5" />
            {/* Right Minaret */}
            <rect x="211" y="55" width="5" height="63" rx="1" />
            <circle cx="213.5" cy="53" r="3.5" />
            <line x1="213.5" y1="50" x2="213.5" y2="44" stroke="#B45309" strokeWidth="1.5" />
            {/* Main Central Tomb Body */}
            <rect x="120" y="78" width="80" height="40" rx="2" />
            {/* Main Central Arch Iwan */}
            <path d="M 145 118 L 145 92 C 145 84, 175 84, 175 92 L 175 118 Z" fill="#F8FAFC" opacity="0.25" />
            {/* Side smaller arches */}
            <path d="M 126 112 L 126 98 C 126 94, 138 94, 138 98 L 138 112 Z" fill="#F8FAFC" opacity="0.2" />
            <path d="M 182 112 L 182 98 C 182 94, 194 94, 194 98 L 194 112 Z" fill="#F8FAFC" opacity="0.2" />
            {/* Central Onion Dome */}
            <path
              d="M 148 78 C 144 68, 148 50, 160 40 C 172 50, 176 68, 172 78 Z"
              fill="url(#monumentGold)"
            />
            {/* Finial Spike on Dome */}
            <line x1="160" y1="40" x2="160" y2="28" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
            <circle cx="160" cy="27" r="2" fill="#92400E" />
            {/* Flanking Chhatris */}
            <path d="M 132 78 C 130 72, 133 66, 138 66 C 143 66, 146 72, 144 78 Z" />
            <path d="M 176 78 C 174 72, 177 66, 182 66 C 187 66, 190 72, 188 78 Z" />
          </g>

          {/* Red Fort Rampart Wall (Right Extension) */}
          <g fill="url(#monumentGold)">
            <rect x="235" y="90" width="70" height="40" rx="1" />
            {/* Battlements merlons */}
            {[235, 245, 255, 265, 275, 285, 295].map((bx, i) => (
              <rect key={i} x={bx} y="84" width="6" height="6" />
            ))}
            {/* Bastion tower */}
            <rect x="270" y="70" width="24" height="60" rx="2" />
            <path d="M 270 70 C 270 60, 294 60, 294 70 Z" />
          </g>
        </svg>
      </div>
    </div>
  );
}
