'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayWindowProjection } from '@/types/dashboard';

interface SafeWindowForecastProps {
  days: DayWindowProjection[];
}

export const SafeWindowForecast: React.FC<SafeWindowForecastProps> = ({ days }) => {
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const currentMobileDay = days[mobileDayIndex] || days[0];

  const handlePrevDay = () => {
    setMobileDayIndex((prev) => (prev > 0 ? prev - 1 : days.length - 1));
  };

  const handleNextDay = () => {
    setMobileDayIndex((prev) => (prev < days.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
      {/* Title & Explanatory Subtitle */}
      <div>
        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Jendela waktu aman - 72 Jam ke Depan
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Setiap kolom mewakili satu jam (00-23 WIB). Hijau = aman untuk aplikasi Urea
        </p>
      </div>

      {/* ================= DESKTOP VIEW (3 Stacked Rows) ================= */}
      <div className="hidden lg:flex flex-col gap-4 mt-6">
        {days.map((day) => (
          <div key={day.dayNumber} className="flex items-center gap-4">
            {/* Day Label */}
            <span className="w-14 text-xs font-bold text-slate-700 shrink-0">
              {day.dayLabel}
            </span>

            {/* 24 Hourly Blocks */}
            <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1.5 flex-1 max-w-2xl">
              {day.hourlyBlocks.map((isSafe, hour) => (
                <div
                  key={hour}
                  title={`Jam ${hour.toString().padStart(2, '0')}:00 WIB — ${isSafe ? 'Aman' : 'Tunda'}`}
                  className={`h-4.5 sm:h-5 rounded-sm transition-all hover:scale-110 cursor-pointer ${
                    isSafe ? 'bg-[#286E34]' : 'bg-[#D9D9D9] hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Summary Text on Right */}
            <div className="w-44 text-right text-xs font-bold shrink-0">
              {day.isSafe ? (
                <span className="text-[#286E34]">
                  {day.safeRangeText} &nbsp; {day.riskScoreText}
                </span>
              ) : (
                <span className="text-[#DC2626] font-medium">
                  {day.safeRangeText}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MOBILE VIEW (Single Day Navigator with 2x12 Grid) ================= */}
      <div className="lg:hidden mt-5">
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
        <div className="flex flex-col gap-2">
          {/* Row 1: Hours 00 - 11 */}
          <div className="grid grid-cols-12 gap-1.5">
            {currentMobileDay.hourlyBlocks.slice(0, 12).map((isSafe, i) => (
              <div
                key={`h1-${i}`}
                title={`Jam ${i.toString().padStart(2, '0')}:00 WIB`}
                className={`h-5 rounded-xs transition-colors ${
                  isSafe ? 'bg-[#286E34]' : 'bg-[#D9D9D9]'
                }`}
              />
            ))}
          </div>

          {/* Row 2: Hours 12 - 23 */}
          <div className="grid grid-cols-12 gap-1.5">
            {currentMobileDay.hourlyBlocks.slice(12, 24).map((isSafe, i) => (
              <div
                key={`h2-${i}`}
                title={`Jam ${(i + 12).toString().padStart(2, '0')}:00 WIB`}
                className={`h-5 rounded-xs transition-colors ${
                  isSafe ? 'bg-[#286E34]' : 'bg-[#D9D9D9]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Summary */}
        <div className="mt-4 text-right">
          {currentMobileDay.isSafe ? (
            <span className="text-xs font-bold text-[#286E34]">
              {currentMobileDay.safeRangeText} &nbsp; {currentMobileDay.riskScoreText}
            </span>
          ) : (
            <span className="text-xs font-semibold text-[#DC2626]">
              {currentMobileDay.safeRangeText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
