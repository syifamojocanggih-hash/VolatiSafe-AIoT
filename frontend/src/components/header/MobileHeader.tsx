'use client';

import React from 'react';
import Image from 'next/image';

export const MobileHeader: React.FC = () => {
  return (
    <header className="md:hidden bg-[#5E9E49] text-white px-5 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        <Image
          src="/logo.png"
          alt="Logo Resmi VolatiSafe AIoT"
          width={32}
          height={32}
          className="w-full h-full object-contain filter drop-shadow-sm"
          priority
        />
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tight text-white drop-shadow-sm leading-none">
          VolatiSafe
        </h1>
        <p className="text-[9.5px] font-bold text-emerald-100 tracking-wider uppercase mt-0.5">
          AIoT Jagung Presisi
        </p>
      </div>
    </header>
  );
};
