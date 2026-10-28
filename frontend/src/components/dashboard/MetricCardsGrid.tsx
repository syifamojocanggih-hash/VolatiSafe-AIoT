'use client';

import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { MetricItem, RiskCategory } from '@/types/dashboard';

interface MetricCardsGridProps {
  metrics: MetricItem[];
  riskCategory?: RiskCategory;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ metrics, riskCategory }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {metrics.map((item) => {
        if (item.isAvriCard) {
          // Tentukan warna dan status kartu AVRI sesuai 4 tingkat risiko (Aman, Waspada, Kritis, Bahaya)
          const isBahaya = riskCategory === 'bahaya' || item.numericValue > 80;
          const isKritis = !isBahaya && (riskCategory === 'kritis' || item.numericValue > 60);
          const isWaspada = !isBahaya && !isKritis && (riskCategory === 'waspada' || item.numericValue > 30 || item.status === 'warning');

          let bgClass = 'bg-[#236B32] border-[#1C5B2A]'; // default aman (hijau tua)
          let labelColor = 'text-emerald-100';
          let badgeClass = 'bg-emerald-900/50 text-emerald-100 border-emerald-400/30';
          let badgeText = 'Aman';
          let subtextColor = 'text-emerald-100/90';
          let subtext = 'Optimal Pemupukan';
          let TrendIcon = TrendingDown;
          let deltaText = item.delta24h || '-14%';

          if (isBahaya) {
            bgClass = 'bg-[#DC2626] border-[#B91C1C]'; // Bahaya / Merah pekat
            labelColor = 'text-red-100';
            badgeClass = 'bg-red-950/40 text-red-100 border-red-400/30';
            badgeText = 'Bahaya';
            subtextColor = 'text-red-100/90';
            subtext = 'Dilarang Tabur Urea';
            TrendIcon = TrendingUp;
            deltaText = item.delta24h || '+24%';
          } else if (isKritis) {
            bgClass = 'bg-[#EA580C] border-[#C2410C]'; // Kritis / Oranye
            labelColor = 'text-orange-100';
            badgeClass = 'bg-orange-950/40 text-orange-100 border-orange-400/30';
            badgeText = 'Kritis';
            subtextColor = 'text-orange-100/90';
            subtext = 'Tunda Pemupukan';
            TrendIcon = TrendingUp;
            deltaText = item.delta24h || '+18%';
          } else if (isWaspada) {
            bgClass = 'bg-[#D97706] border-[#B45309]'; // Waspada / Amber
            labelColor = 'text-amber-100';
            badgeClass = 'bg-amber-950/40 text-amber-100 border-amber-400/30';
            badgeText = 'Waspada';
            subtextColor = 'text-amber-100/90';
            subtext = 'Metode Benam / Tugal';
            TrendIcon = TrendingUp;
            deltaText = item.delta24h || '+6%';
          }

          return (
            <div
              key={item.id}
              className={`${bgClass} rounded-2xl p-4 sm:p-5 text-white shadow-xs border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`text-xs sm:text-sm font-bold tracking-wide uppercase ${labelColor}`}>
                  {item.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${badgeClass}`}
                >
                  <TrendIcon className="w-3 h-3" />
                  <span>{badgeText}</span>
                </span>
              </div>

              <div className="mt-3 sm:mt-4">
                <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {item.value}
                </span>
                <div className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium ${subtextColor}`}>
                  <span>{deltaText}</span>
                  <span>•</span>
                  <span>{subtext}</span>
                </div>
              </div>
            </div>
          );
        }

        // Kartu Telemetri Standar (Kelembapan Tanah, Suhu Tanah, pH Tanah)
        const isDanger = item.status === 'danger';
        const isWarning = item.status === 'warning';

        // Nilai warna angka, border kartu, badge, dan arah tren
        let valueColor = 'text-[#1B6633]'; // default aman (hijau)
        let borderClass = 'border-slate-200/90';
        let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
        let badgeText = 'Optimal';
        let subtext = 'Kondisi Ideal';
        let TrendIcon = Minus;

        if (item.id === 'moisture') {
          if (isDanger) {
            valueColor = 'text-[#DC2626]'; // MERAH saat kering
            borderClass = 'border-red-200/90';
            badgeBg = 'bg-red-50 text-red-700 border-red-200/80';
            badgeText = 'Kritis';
            subtext = 'Defisit Air (<25%)';
            TrendIcon = TrendingDown;
          } else if (isWarning) {
            valueColor = 'text-[#D97706]'; // AMBER
            borderClass = 'border-amber-200/90';
            badgeBg = 'bg-amber-50 text-amber-700 border-amber-200/80';
            badgeText = 'Waspada';
            subtext = 'Kadar Air Rendah';
            TrendIcon = TrendingDown;
          } else {
            valueColor = 'text-[#1B6633]'; // HIJAU
            badgeText = 'Optimal';
            subtext = 'Kapasitas Lapang (>40%)';
            TrendIcon = TrendingUp;
          }
        } else if (item.id === 'temp') {
          if (isDanger) {
            valueColor = 'text-[#DC2626]'; // MERAH saat terik
            borderClass = 'border-red-200/90';
            badgeBg = 'bg-red-50 text-red-700 border-red-200/80';
            badgeText = 'Kritis';
            subtext = 'Panas Terik (>30°C)';
            TrendIcon = TrendingUp;
          } else if (isWarning) {
            valueColor = 'text-[#D97706]'; // AMBER
            borderClass = 'border-amber-200/90';
            badgeBg = 'bg-amber-50 text-amber-700 border-amber-200/80';
            badgeText = 'Waspada';
            subtext = 'Mendekati Terik';
            TrendIcon = TrendingUp;
          } else {
            valueColor = 'text-[#1B6633]'; // HIJAU saat sejuk
            badgeText = 'Optimal';
            subtext = 'Suhu Sejuk (<28°C)';
            TrendIcon = TrendingDown;
          }
        } else if (item.id === 'ph') {
          if (isDanger) {
            valueColor = 'text-[#DC2626]'; // MERAH saat alkalin ekstrem
            borderClass = 'border-red-200/90';
            badgeBg = 'bg-red-50 text-red-700 border-red-200/80';
            badgeText = 'Kritis';
            subtext = 'Alkalin Tinggi (>8.0)';
            TrendIcon = TrendingUp;
          } else if (isWarning) {
            valueColor = 'text-[#D97706]'; // AMBER saat basa
            borderClass = 'border-amber-200/90';
            badgeBg = 'bg-amber-50 text-amber-700 border-amber-200/80';
            badgeText = 'Waspada';
            subtext = 'Basa Berkapur (>7.5)';
            TrendIcon = TrendingUp;
          } else {
            valueColor = 'text-[#1B6633]'; // HIJAU saat netral
            badgeText = 'Optimal';
            subtext = 'Netral Stabil (~7.0)';
            TrendIcon = Minus;
          }
        }

        const delta = item.delta24h || '';

        return (
          <div
            key={item.id}
            className={`bg-white rounded-2xl p-4 sm:p-5 border ${borderClass} shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {item.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${badgeBg}`}
              >
                <TrendIcon className="w-3 h-3" />
                <span>{badgeText}</span>
              </span>
            </div>

            <div className="mt-3 sm:mt-4">
              <span className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${valueColor}`}>
                {item.value}
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                {delta && <span>{delta}</span>}
                {delta && <span>•</span>}
                <span>{subtext}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
