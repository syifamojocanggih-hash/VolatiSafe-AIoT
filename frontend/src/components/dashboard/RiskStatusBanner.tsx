'use client';

import React from 'react';
import { StatusBannerData } from '@/types/dashboard';

interface RiskStatusBannerProps {
  banner: StatusBannerData;
  onOpenDetails: () => void;
  onPostponeAction: () => void;
  isPostponed?: boolean;
}

export const RiskStatusBanner: React.FC<RiskStatusBannerProps> = ({
  banner,
  onOpenDetails,
  onPostponeAction,
  isPostponed = false,
}) => {
  const isAman = banner.category === 'aman';

  return (
    <section
      aria-label="Status Risiko Volatilisasi Hari Ini"
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        isAman
          ? 'bg-[#EDF8EE] border-[#C6E7C9]'
          : 'bg-[#FEF2F2] border-[#FECACA]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Text Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-bold tracking-wider uppercase ${
              isAman ? 'text-[#276A32]' : 'text-[#DC2626]'
            }`}
          >
            {banner.tag}
          </p>
          <h3
            className={`text-lg sm:text-2xl font-extrabold tracking-tight mt-1 mb-2 ${
              isAman ? 'text-[#1A5323]' : 'text-[#991B1B]'
            }`}
          >
            {banner.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {banner.description}
          </p>
        </div>

        {/* Action Buttons: Stacked on desktop, side-by-side on mobile */}
        <div className="flex flex-row lg:flex-col gap-2.5 sm:gap-3 w-full lg:w-52 shrink-0">
          <button
            onClick={onOpenDetails}
            className={`flex-1 lg:w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98] text-center ${
              isAman
                ? 'bg-[#236B32] hover:bg-[#1C5628] text-white'
                : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
            }`}
          >
            Lihat Detail Prediksi
          </button>

          <button
            onClick={onPostponeAction}
            className={`flex-1 lg:w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] text-center bg-white ${
              isPostponed
                ? 'bg-slate-100 text-slate-500 border border-slate-300'
                : isAman
                ? 'border border-[#236B32] text-[#236B32] hover:bg-emerald-50/50'
                : 'border border-[#DC2626] text-[#DC2626] hover:bg-red-50/50'
            }`}
          >
            {isPostponed ? '✓ Sudah Ditunda' : 'Sudah Saya Tunda'}
          </button>
        </div>
      </div>
    </section>
  );
};
