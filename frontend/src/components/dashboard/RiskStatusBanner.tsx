'use client';

import React from 'react';
import { StatusBannerData, RiskCategory, DayWindowProjection } from '@/types/dashboard';

interface RiskStatusBannerProps {
  banner: StatusBannerData;
  forecastDays?: DayWindowProjection[];
  onOpenDetails: () => void;
  onPostponeAction: () => void;
  isPostponed?: boolean;
  onOpenWhatsApp?: () => void;
}

const RISK_THEME: Record<
  RiskCategory,
  {
    containerClass: string;
    titleClass: string;
    primaryBtnClass: string;
    dividerClass: string;
    cardBorderClass: string;
    timeTextClass: string;
  }
> = {
  aman: {
    containerClass: 'bg-[#EDF8EE] border-[#C6E7C9]',
    titleClass: 'text-[#1B6633]',
    primaryBtnClass: 'bg-[#236B32] hover:bg-[#1C5628] text-white',
    dividerClass: 'border-[#C6E7C9]',
    cardBorderClass: 'border-[#C6E7C9]/80',
    timeTextClass: 'text-[#1B6633]',
  },
  waspada: {
    containerClass: 'bg-[#FFFBEB] border-[#FDE68A]',
    titleClass: 'text-[#B45309]',
    primaryBtnClass: 'bg-[#D97706] hover:bg-[#B45309] text-white',
    dividerClass: 'border-[#FDE68A]',
    cardBorderClass: 'border-[#FDE68A]/80',
    timeTextClass: 'text-[#B45309]',
  },
  kritis: {
    containerClass: 'bg-[#FFF7ED] border-[#FED7AA]',
    titleClass: 'text-[#C2410C]',
    primaryBtnClass: 'bg-[#EA580C] hover:bg-[#C2410C] text-white',
    dividerClass: 'border-[#FED7AA]',
    cardBorderClass: 'border-[#FED7AA]/80',
    timeTextClass: 'text-[#C2410C]',
  },
  bahaya: {
    containerClass: 'bg-[#FEF2F2] border-[#FECACA]',
    titleClass: 'text-[#DC2626]',
    primaryBtnClass: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
    dividerClass: 'border-[#FECACA]',
    cardBorderClass: 'border-[#FECACA]/80',
    timeTextClass: 'text-[#DC2626]',
  },
};

export const RiskStatusBanner: React.FC<RiskStatusBannerProps> = ({
  banner,
  forecastDays,
  onOpenDetails,
  onPostponeAction,
  isPostponed = false,
}) => {
  const category: RiskCategory = banner.category || 'aman';
  const theme = RISK_THEME[category] || RISK_THEME.aman;

  // Jadwal jendela aman: membaca dinamis 100% dari backend API (/fields/BLOK-A/forecast-window)
  const getDaySchedule = (dayIndex: number): { isSafe: boolean; windows: string[]; unsafeReason: string } => {
    // 1. Jika kondisi lapangan hari ini Kritis atau Bahaya
    if (dayIndex === 0 && (category === 'kritis' || category === 'bahaya')) {
      return { isSafe: false, windows: [], unsafeReason: 'Tidak ada pemupukan aman hari ini' };
    }

    // 2. Ambil dari data backend (forecastDays yang dipassing dari page.tsx)
    const day = forecastDays?.[dayIndex];
    if (day) {
      if (!day.isSafe || !day.safeWindows || day.safeWindows.length === 0) {
        return {
          isSafe: false,
          windows: [],
          unsafeReason:
            dayIndex === 0
              ? 'Tidak ada pemupukan untuk hari ini'
              : dayIndex === 1
              ? 'Tidak ada pemupukan untuk besok'
              : 'Tidak ada pemupukan untuk lusa',
        };
      }
      const windows = day.safeWindows.map((w) =>
        w.rangeText.includes('WIB') ? w.rangeText : `${w.rangeText} WIB`
      );
      return { isSafe: true, windows, unsafeReason: '' };
    }

    return {
      isSafe: false,
      windows: [],
      unsafeReason: dayIndex === 1 ? 'Tidak ada pemupukan untuk besok' : 'Memuat jadwal...',
    };
  };

  const renderSchedule = (dayIndex: number) => {
    const { isSafe, windows, unsafeReason } = getDaySchedule(dayIndex);

    if (!isSafe || windows.length === 0) {
      return (
        <span className="text-[11px] sm:text-xs md:text-sm font-bold text-red-600 block leading-snug">
          {unsafeReason || 'Tidak ada pemupukan untuk hari ini'}
        </span>
      );
    }

    return (
      <div className={`grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[11px] sm:text-xs md:text-sm font-bold ${theme.timeTextClass}`}>
        {windows.map((win, idx) => (
          <span key={idx} className="whitespace-nowrap">
            {win}
          </span>
        ))}
      </div>
    );
  };

  return (
    <section
      aria-label="Status Peringatan Risiko Volatilisasi Hari Ini"
      className={`rounded-3xl p-5 sm:p-7 border transition-all duration-200 shadow-2xs ${theme.containerClass}`}
    >
      {/* ================= BAGIAN ATAS: STATUS PREDIKSI AI & TOMBOL AKSI ================= */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        {/* Sisi Kiri: Headline & Deskripsi Prediksi */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${theme.titleClass}`}>
            {banner.title || 'Aman, waktu optimal pemupukan'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1.5 max-w-2xl">
            {banner.description ||
              'Suhu tanah 26,0°C, kelembapan 42,0%, pH 7,10. Tanah cukup untuk mengikat nitrogen ke zona perakaran.'}
          </p>
        </div>

        {/* Sisi Kanan: Dua Tombol Aksi (Side-by-side on Mobile, Stacked on Desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2.5 w-full sm:w-48 shrink-0">
          <button
            onClick={onOpenDetails}
            className={`w-full py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] text-center ${theme.primaryBtnClass}`}
          >
            Lihat Detail Prediksi
          </button>

          <button
            onClick={onPostponeAction}
            className={`w-full py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-[0.98] text-center bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 ${
              isPostponed ? 'bg-slate-100 text-slate-500' : ''
            }`}
          >
            {isPostponed ? '✓ Sudah Ditunda' : 'Sudah Saya Tunda'}
          </button>
        </div>
      </div>

      {/* ================= GARIS PEMBATAS ================= */}
      <hr className={`border-t my-4 sm:my-5 ${theme.dividerClass}`} />

      {/* ================= BAGIAN BAWAH: JENDELA WAKTU AMAN (HARI INI, BESOK, LUSA) ================= */}
      <div className="space-y-3.5">
        <h4 className="text-center text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Jendela waktu aman pemupukan
        </h4>

        {/* 3 Kartu Proyeksi Jendela Waktu (Desktop: 3 Kolom, Mobile: 3 Baris) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Kartu 1: Hari Ini */}
          <div
            className={`bg-white rounded-2xl p-3.5 sm:p-4.5 border ${theme.cardBorderClass} shadow-2xs`}
          >
            <div className="flex items-center sm:block gap-3 sm:gap-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-500 w-16 sm:w-auto shrink-0 sm:mb-2 block">
                Hari ini :
              </span>
              <div className="flex-1 min-w-0">
                {renderSchedule(0)}
              </div>
            </div>
          </div>

          {/* Kartu 2: Besok */}
          <div
            className={`bg-white rounded-2xl p-3.5 sm:p-4.5 border ${theme.cardBorderClass} shadow-2xs`}
          >
            <div className="flex items-center sm:block gap-3 sm:gap-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-500 w-16 sm:w-auto shrink-0 sm:mb-2 block">
                Besok :
              </span>
              <div className="flex-1 min-w-0">
                {renderSchedule(1)}
              </div>
            </div>
          </div>

          {/* Kartu 3: Lusa */}
          <div
            className={`bg-white rounded-2xl p-3.5 sm:p-4.5 border ${theme.cardBorderClass} shadow-2xs`}
          >
            <div className="flex items-center sm:block gap-3 sm:gap-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-500 w-16 sm:w-auto shrink-0 sm:mb-2 block">
                Lusa :
              </span>
              <div className="flex-1 min-w-0">
                {renderSchedule(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
