'use client';

import React from 'react';
import { StatusBannerData, RiskCategory } from '@/types/dashboard';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

interface RiskStatusBannerProps {
  banner: StatusBannerData;
  onOpenDetails: () => void;
  onPostponeAction: () => void;
  isPostponed?: boolean;
}

const RISK_CONFIG: Record<
  RiskCategory,
  {
    containerClass: string;
    tagClass: string;
    badgePillClass: string;
    badgeDotClass: string;
    titleClass: string;
    primaryBtnClass: string;
    secondaryBtnBorderClass: string;
    secondaryBtnTextClass: string;
    secondaryBtnHoverClass: string;
    badgeLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  aman: {
    containerClass: 'bg-[#EDF8EE] border-[#C6E7C9]',
    tagClass: 'text-[#276A32]',
    badgePillClass: 'bg-[#DCF3DF] text-[#1E6128] border-[#A8E2AF]',
    badgeDotClass: 'bg-[#16A34A]',
    titleClass: 'text-[#1A5323]',
    primaryBtnClass: 'bg-[#236B32] hover:bg-[#1C5628] text-white',
    secondaryBtnBorderClass: 'border-[#236B32]',
    secondaryBtnTextClass: 'text-[#236B32]',
    secondaryBtnHoverClass: 'hover:bg-emerald-50/50',
    badgeLabel: 'Aman',
    icon: CheckCircle2,
  },
  waspada: {
    containerClass: 'bg-[#FFFBEB] border-[#FDE68A]',
    tagClass: 'text-[#B45309]',
    badgePillClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
    badgeDotClass: 'bg-[#D97706]',
    titleClass: 'text-[#78350F]',
    primaryBtnClass: 'bg-[#D97706] hover:bg-[#B45309] text-white',
    secondaryBtnBorderClass: 'border-[#D97706]',
    secondaryBtnTextClass: 'text-[#D97706]',
    secondaryBtnHoverClass: 'hover:bg-amber-50/50',
    badgeLabel: 'Waspada',
    icon: AlertCircle,
  },
  kritis: {
    containerClass: 'bg-[#FFF7ED] border-[#FED7AA]',
    tagClass: 'text-[#C2410C]',
    badgePillClass: 'bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]',
    badgeDotClass: 'bg-[#EA580C]',
    titleClass: 'text-[#7C2D12]',
    primaryBtnClass: 'bg-[#EA580C] hover:bg-[#C2410C] text-white',
    secondaryBtnBorderClass: 'border-[#EA580C]',
    secondaryBtnTextClass: 'text-[#EA580C]',
    secondaryBtnHoverClass: 'hover:bg-orange-50/50',
    badgeLabel: 'Kritis',
    icon: AlertTriangle,
  },
  bahaya: {
    containerClass: 'bg-[#FEF2F2] border-[#FECACA]',
    tagClass: 'text-[#DC2626]',
    badgePillClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
    badgeDotClass: 'bg-[#DC2626]',
    titleClass: 'text-[#991B1B]',
    primaryBtnClass: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
    secondaryBtnBorderClass: 'border-[#DC2626]',
    secondaryBtnTextClass: 'text-[#DC2626]',
    secondaryBtnHoverClass: 'hover:bg-red-50/50',
    badgeLabel: 'Bahaya',
    icon: AlertOctagon,
  },
};

export const RiskStatusBanner: React.FC<RiskStatusBannerProps> = ({
  banner,
  onOpenDetails,
  onPostponeAction,
  isPostponed = false,
}) => {
  const category: RiskCategory = banner.category || 'aman';
  const config = RISK_CONFIG[category] || RISK_CONFIG.aman;
  const StatusIcon = config.icon;

  return (
    <section
      aria-label="Status Peringatan Risiko Volatilisasi Hari Ini"
      className={`rounded-2xl p-5 sm:p-6 border transition-all duration-200 shadow-2xs ${config.containerClass}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Text Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Badge Kategori + Skala 4 Jenis */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${config.badgePillClass}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>Status: {config.badgeLabel}</span>
            </span>

            {/* Skala 4 Jenis Risiko: Aman, Waspada, Kritis, Bahaya */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/70 border border-slate-200/80 text-[10.5px] font-semibold text-slate-500 shadow-3xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-0.5">Tingkat:</span>
              <span className={category === 'aman' ? 'text-[#16A34A] font-black' : 'text-slate-400'}>
                ● Aman
              </span>
              <span className="text-slate-300">·</span>
              <span className={category === 'waspada' ? 'text-[#D97706] font-black' : 'text-slate-400'}>
                ● Waspada
              </span>
              <span className="text-slate-300">·</span>
              <span className={category === 'kritis' ? 'text-[#EA580C] font-black' : 'text-slate-400'}>
                ● Kritis
              </span>
              <span className="text-slate-300">·</span>
              <span className={category === 'bahaya' ? 'text-[#DC2626] font-black' : 'text-slate-400'}>
                ● Bahaya
              </span>
            </div>
          </div>

          <p className={`text-xs font-bold tracking-wider uppercase ${config.tagClass}`}>
            {banner.tag}
          </p>
          <h3 className={`text-lg sm:text-2xl font-extrabold tracking-tight mt-1 mb-2 ${config.titleClass}`}>
            {banner.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {banner.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row lg:flex-col gap-2.5 sm:gap-3 w-full lg:w-52 shrink-0">
          <button
            onClick={onOpenDetails}
            className={`flex-1 lg:w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] text-center ${config.primaryBtnClass}`}
          >
            Lihat Detail Prediksi
          </button>

          <button
            onClick={onPostponeAction}
            className={`flex-1 lg:w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] text-center bg-white ${
              isPostponed
                ? 'bg-slate-100 text-slate-500 border border-slate-300'
                : `border ${config.secondaryBtnBorderClass} ${config.secondaryBtnTextClass} ${config.secondaryBtnHoverClass}`
            }`}
          >
            {isPostponed ? '✓ Sudah Ditunda' : 'Sudah Saya Tunda'}
          </button>
        </div>
      </div>
    </section>
  );
};
