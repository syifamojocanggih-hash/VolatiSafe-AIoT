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

  // Day 1 (Hari ini)
  const day1IsSafe = category === 'aman' || (forecastDays && forecastDays[0] && forecastDays[0].isSafe);
  // Day 2 (Besok)
  const day2IsSafe = forecastDays && forecastDays[1] ? forecastDays[1].isSafe : false;
  // Day 3 (Lusa)
  const day3IsSafe = forecastDays && forecastDays[2] ? forecastDays[2].isSafe : true;

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

        {/* Sisi Kanan: Dua Tombol Aksi (Lihat Detail Prediksi & Sudah Saya Tunda) */}
        <div className="flex flex-col gap-2.5 w-full sm:w-48 shrink-0">
          <button
            onClick={onOpenDetails}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] text-center ${theme.primaryBtnClass}`}
          >
            Lihat Detail Prediksi
          </button>

          <button
            onClick={onPostponeAction}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-[0.98] text-center bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 ${
              isPostponed ? 'bg-slate-100 text-slate-500' : ''
            }`}
          >
            {isPostponed ? '✓ Sudah Ditunda' : 'Sudah Saya Tunda'}
          </button>
        </div>
      </div>

      {/* ================= GARIS PEMBATAS ================= */}
      <hr className={`border-t my-5 sm:my-6 ${theme.dividerClass}`} />

      {/* ================= BAGIAN BAWAH: JENDELA WAKTU AMAN (HARI INI, BESOK, LUSA) ================= */}
      <div className="space-y-3.5">
        <h4 className="text-center text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
          Waktu yang ideal untuk memberi pupuk
        </h4>

        {/* 3 Kartu Proyeksi Jendela Waktu (Desktop: 3 Kolom, Mobile: 3 Baris) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Kartu 1: Hari Ini */}
          <div
            className={`bg-white rounded-2xl p-4 sm:p-4.5 border ${theme.cardBorderClass} shadow-2xs flex flex-col justify-between`}
          >
            <span className="text-xs font-semibold text-slate-500 mb-2 block">
              Hari ini :
            </span>
            {day1IsSafe ? (
              <div className="space-y-1 text-xs font-bold leading-relaxed">
                <div className={`flex items-center justify-between gap-2 ${theme.timeTextClass}`}>
                  <span>10.00 - 11.00 WIB</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span>13.02 - 14.00 WIB</span>
                </div>
                <div className={`flex items-center justify-between gap-2 ${theme.timeTextClass}`}>
                  <span>19.00 - 20.02 WIB</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span>21.00 - 22.01 WIB</span>
                </div>
              </div>
            ) : (
              <span className="text-xs font-bold text-red-600 block">
                Tidak ada pemupukan untuk hari ini
              </span>
            )}
          </div>

          {/* Kartu 2: Besok */}
          <div
            className={`bg-white rounded-2xl p-4 sm:p-4.5 border ${theme.cardBorderClass} shadow-2xs flex flex-col justify-between`}
          >
            <span className="text-xs font-semibold text-slate-500 mb-2 block">
              Besok :
            </span>
            {day2IsSafe ? (
              <div className={`text-xs font-bold ${theme.timeTextClass}`}>
                <span>06.00 - 09.00 WIB</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-red-600 block leading-snug">
                Tidak ada pemupukan untuk hari ini
              </span>
            )}
          </div>

          {/* Kartu 3: Lusa */}
          <div
            className={`bg-white rounded-2xl p-4 sm:p-4.5 border ${theme.cardBorderClass} shadow-2xs flex flex-col justify-between`}
          >
            <span className="text-xs font-semibold text-slate-500 mb-2 block">
              Lusa :
            </span>
            {day3IsSafe ? (
              <div className="space-y-1 text-xs font-bold leading-relaxed">
                <div className={`flex items-center justify-between gap-2 ${theme.timeTextClass}`}>
                  <span>10.00 - 11.00 WIB</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span>13.02 - 14.00 WIB</span>
                </div>
              </div>
            ) : (
              <span className="text-xs font-bold text-red-600 block">
                Tidak ada pemupukan untuk hari ini
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
