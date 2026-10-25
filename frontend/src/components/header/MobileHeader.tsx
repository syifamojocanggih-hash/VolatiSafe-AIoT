'use client';

import React from 'react';

export const MobileHeader: React.FC = () => {
  return (
    <header className="md:hidden bg-[#5E9E49] text-white px-5 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center p-1 shadow-sm">
        <svg viewBox="0 0 512 512" fill="none" className="w-full h-full">
          <path
            d="M256 32C360 76 432 108 432 232C432 360 336 448 256 480C176 448 80 360 80 232C80 108 152 76 256 32Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M256 160C235 190 228 250 240 310C248 315 264 315 272 310C284 250 277 190 256 160Z"
            fill="#5E9E49"
          />
          <path
            d="M256 330C220 320 180 270 196 190C204 230 228 280 256 330Z"
            fill="#5E9E49"
          />
          <path
            d="M256 330C292 320 332 270 316 190C308 230 284 280 256 330Z"
            fill="#5E9E49"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
        VolatiSafe
      </h1>
    </header>
  );
};
