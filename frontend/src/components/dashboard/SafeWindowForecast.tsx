'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayWindowProjection, RiskCategory, SafeWindowSegment } from '@/types/dashboard';

interface SafeWindowForecastProps {
  days: DayWindowProjection[];
}

const CATEGORY_COLORS: Record<
  RiskCategory,
  {
    bg: string;
    text: string;
    label: string;
    hoverBg: string;
  }
> = {
  aman: {
    bg: 'bg-[#16A34A]',
    text: 'text-[#16A34A]',
    label: 'Aman (≤30%)',
    hoverBg: 'hover:bg-[#15803D]',
  },
  waspada: {
    bg: 'bg-[#D97706]',
    text: 'text-[#D97706]',
    label: 'Waspada (31–60%)',
    hoverBg: 'hover:bg-[#B45309]',
  },
  kritis: {
    bg: 'bg-[#EA580C]',
    text: 'text-[#EA580C]',
    label: 'Kritis (61–80%)',
    hoverBg: 'hover:bg-[#C2410C]',
  },
  bahaya: {
    bg: 'bg-[#DC2626]',
    text: 'text-[#DC2626]',
    label: 'Bahaya (>80%)',
    hoverBg: 'hover:bg-[#B91C1C]',
  },
};

function resolveHourlyCategory(
  isSafe: boolean,
  categoryFromList?: RiskCategory,
  hour?: number
): RiskCategory {
  if (categoryFromList) return categoryFromList;
  if (isSafe) return 'aman';

  // Fallback aproksimasi kurva diurnal terik siang BMKG jika data per-kategori belum ada
  if (hour !== undefined) {
    if (hour >= 11 && hour <= 14) return 'bahaya';
    if ((hour >= 9 && hour < 11) || (hour > 14 && hour <= 16)) return 'kritis';
    if ((hour >= 7 && hour < 9) || (hour > 16 && hour <= 18)) return 'waspada';
  }
  return 'kritis';
}

/**
 * Ekstraksi jendela aman terpisah (non-contiguous clusters) dari proyeksi harian
 */
function extractSafeWindows(day: DayWindowProjection): SafeWindowSegment[] {
  if (day.safeWindows && day.safeWindows.length > 0) {
    return day.safeWindows;
  }

  const safeHours: number[] = [];
  day.hourlyBlocks.forEach((isSafe, hour) => {
    if (isSafe) safeHours.push(hour);
  });

  if (safeHours.length === 0) {
    return [];
  }

  const clusters: Array<{ start: number; end: number }> = [];
  let current: { start: number; end: number } | null = null;

  for (const h of safeHours) {
    if (!current) {
      current = { start: h, end: h + 1 };
    } else if (h === current.end) {
      current.end = h + 1;
    } else {
      clusters.push(current);
      current = { start: h, end: h + 1 };
    }
  }
  if (current) clusters.push(current);

  return clusters.map((c) => {
    const rangeText = `${String(c.start).padStart(2, '0')}.00 – ${String(c.end).padStart(2, '0')}.00`;

    let cat: RiskCategory = 'aman';
    if (day.hourlyCategories) {
      const catsInCluster = day.hourlyCategories.slice(c.start, c.end);
      if (catsInCluster.includes('waspada')) cat = 'waspada';
      if (catsInCluster.includes('aman')) cat = 'aman';
    }

    return {
      startHour: c.start,
      endHour: c.end,
      rangeText,
      riskScoreText: day.riskScoreText || 'Aman',
      category: cat,
    };
  });
}

export const SafeWindowForecast: React.FC<SafeWindowForecastProps> = ({ days }) => {
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const currentMobileDay = days[mobileDayIndex] || days[0];

  // Efek ketip-ketip per 5 detik untuk jadwal yang terpisah (multi-window)
  const [tick, setTick] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Ketip (fade out sejenak)
      setIsBlinking(true);
      // 2. Ganti jadwal & fade in kembali
      setTimeout(() => {
        setTick((prev) => prev + 1);
        setIsBlinking(false);
      }, 250);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handlePrevDay = () => {
    setMobileDayIndex((prev) => (prev > 0 ? prev - 1 : days.length - 1));
  };

  const handleNextDay = () => {
    setMobileDayIndex((prev) => (prev < days.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Title & Explanatory Subtitle + 4-Tier Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Jendela Waktu Aman — Proyeksi 72 Jam ke Depan
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap kolom mewakili 1 jam (00–23 WIB). Warna menunjukkan tingkat risiko volatilisasi amonia.
          </p>
        </div>

        {/* 4-Level Risk Legend */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A]" />
            <span className="text-emerald-800 font-bold">Aman</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]" />
            <span className="text-amber-800 font-bold">Waspada</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EA580C]" />
            <span className="text-orange-800 font-bold">Kritis</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" />
            <span className="text-red-800 font-bold">Bahaya</span>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP VIEW (3 Stacked Rows) ================= */}
      <div className="hidden lg:flex flex-col gap-4 pt-2">
        {days.map((day) => {
          const dayCategory = day.category || (day.isSafe ? 'aman' : 'kritis');
          const summaryConfig = CATEGORY_COLORS[dayCategory] || CATEGORY_COLORS.aman;
          const windows = extractSafeWindows(day);
          const hasMultipleWindows = windows.length > 1;
          const activeIndex = hasMultipleWindows ? tick % windows.length : 0;
          const activeWindow = windows[activeIndex];

          return (
            <div key={day.dayNumber} className="flex items-center gap-4">
              {/* Day Label */}
              <span className="w-14 text-xs font-bold text-slate-700 shrink-0">
                {day.dayLabel}
              </span>

              {/* 24 Hourly Blocks */}
              <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1.5 flex-1 max-w-2xl">
                {day.hourlyBlocks.map((isSafe, hour) => {
                  const cat = resolveHourlyCategory(
                    isSafe,
                    day.hourlyCategories ? day.hourlyCategories[hour] : undefined,
                    hour
                  );
                  const colorConfig = CATEGORY_COLORS[cat];

                  return (
                    <div
                      key={hour}
                      title={`Jam ${hour.toString().padStart(2, '0')}:00 WIB — ${colorConfig.label}`}
                      className={`h-4.5 sm:h-5 rounded-xs transition-all hover:scale-125 cursor-pointer shadow-3xs ${colorConfig.bg} ${colorConfig.hoverBg}`}
                    />
                  );
                })}
              </div>

              {/* Summary Text on Right (Ketip-ketip jika ada beberapa jadwal) */}
              <div className="w-48 text-right text-xs font-bold shrink-0 whitespace-nowrap">
                {day.isSafe && activeWindow ? (
                  <span
                    className={`${summaryConfig.text} inline-block transition-opacity duration-300 ${
                      hasMultipleWindows && isBlinking ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {activeWindow.rangeText} &nbsp; {activeWindow.riskScoreText}
                  </span>
                ) : (
                  <span className="text-[#EA580C] font-semibold">
                    {day.safeRangeText || 'Tidak ada jendela aman'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MOBILE VIEW (Single Day Navigator with 2x12 Grid) ================= */}
      <div className="lg:hidden pt-1">
        {/* Day Navigator */}
        <div className="flex items-center justify-between px-2 mb-3">
          <button
            onClick={handlePrevDay}
            className="p-1.5 text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800">
            {currentMobileDay.dayLabel}
          </span>
          <button
            onClick={handleNextDay}
            className="p-1.5 text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
            aria-label="Hari berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 24 Blocks: 2 rows of 12 blocks */}
        {(() => {
          const mobileWindows = extractSafeWindows(currentMobileDay);
          const hasMultipleMobileWindows = mobileWindows.length > 1;
          const mobileActiveIndex = hasMultipleMobileWindows ? tick % mobileWindows.length : 0;
          const mobileActiveWindow = mobileWindows[mobileActiveIndex];

          return (
            <div className="flex flex-col gap-2">
              {/* Row 1: Hours 00 - 11 */}
              <div className="grid grid-cols-12 gap-1.5">
                {currentMobileDay.hourlyBlocks.slice(0, 12).map((isSafe, i) => {
                  const hour = i;
                  const cat = resolveHourlyCategory(
                    isSafe,
                    currentMobileDay.hourlyCategories ? currentMobileDay.hourlyCategories[hour] : undefined,
                    hour
                  );
                  const colorConfig = CATEGORY_COLORS[cat];

                  return (
                    <div
                      key={`h1-${hour}`}
                      title={`Jam ${hour.toString().padStart(2, '0')}:00 WIB — ${colorConfig.label}`}
                      className={`h-5 rounded-xs transition-colors ${colorConfig.bg}`}
                    />
                  );
                })}
              </div>

              {/* Row 2: Hours 12 - 23 */}
              <div className="grid grid-cols-12 gap-1.5">
                {currentMobileDay.hourlyBlocks.slice(12, 24).map((isSafe, i) => {
                  const hour = i + 12;
                  const cat = resolveHourlyCategory(
                    isSafe,
                    currentMobileDay.hourlyCategories ? currentMobileDay.hourlyCategories[hour] : undefined,
                    hour
                  );
                  const colorConfig = CATEGORY_COLORS[cat];

                  return (
                    <div
                      key={`h2-${hour}`}
                      title={`Jam ${hour.toString().padStart(2, '0')}:00 WIB — ${colorConfig.label}`}
                      className={`h-5 rounded-xs transition-colors ${colorConfig.bg}`}
                    />
                  );
                })}
              </div>

              {/* Mobile Summary */}
              <div className="mt-4 text-right">
                {currentMobileDay.isSafe && mobileActiveWindow ? (
                  <span
                    className={`text-xs font-bold text-[#16A34A] inline-block transition-opacity duration-300 ${
                      hasMultipleMobileWindows && isBlinking ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {mobileActiveWindow.rangeText} &nbsp; {mobileActiveWindow.riskScoreText}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#EA580C]">
                    {currentMobileDay.safeRangeText || 'Tidak ada jendela aman'}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
