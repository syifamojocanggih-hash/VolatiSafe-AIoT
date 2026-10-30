'use client';

import React from 'react';
import { MetricItem, RiskCategory } from '@/types/dashboard';

interface MetricCardsGridProps {
  metrics: MetricItem[];
  riskCategory?: RiskCategory;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ metrics, riskCategory = 'aman' }) => {
  const getMetricTextColor = (item: MetricItem): string => {
    // 1. Prioritaskan status metrik individual
    let effectiveStatus = item.status;

    if (!effectiveStatus || effectiveStatus === 'normal') {
      if (item.id === 'moisture') {
        effectiveStatus = item.numericValue < 24 ? 'danger' : item.numericValue < 30 ? 'warning' : 'optimal';
      } else if (item.id === 'temp') {
        effectiveStatus = item.numericValue > 32 ? 'danger' : item.numericValue > 28 ? 'warning' : 'optimal';
      } else if (item.id === 'ph') {
        effectiveStatus = item.numericValue > 7.7 ? 'danger' : item.numericValue > 7.3 ? 'warning' : 'optimal';
      }
    }

    if (effectiveStatus === 'danger') {
      if (riskCategory === 'bahaya') return 'text-[#DC2626]';
      return 'text-[#C2410C]'; // Oranye Kritis
    }

    if (effectiveStatus === 'warning') {
      if (riskCategory === 'kritis') return 'text-[#C2410C]';
      return 'text-[#B45309]'; // Amber Waspada
    }

    // 2. Jika status metrik optimal tapi field secara keseluruhan waspada/kritis/bahaya
    if (riskCategory === 'waspada') {
      if (
        (item.id === 'moisture' && item.numericValue < 30) ||
        (item.id === 'temp' && item.numericValue > 28) ||
        (item.id === 'ph' && item.numericValue > 7.3)
      ) {
        return 'text-[#B45309]';
      }
    } else if (riskCategory === 'kritis' || riskCategory === 'bahaya') {
      if (
        (item.id === 'moisture' && item.numericValue < 28) ||
        (item.id === 'temp' && item.numericValue > 30) ||
        (item.id === 'ph' && item.numericValue > 7.4)
      ) {
        return riskCategory === 'bahaya' ? 'text-[#DC2626]' : 'text-[#C2410C]';
      }
    }

    // Default kondisi aman/optimal
    return 'text-[#1B6633]';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {metrics.map((item) => {
        if (item.isAvriCard || item.id === 'avri') {
          // Kartu AVRI (12 JAM) dengan background hijau tua pekat sesuai screenshot
          const isBahaya = riskCategory === 'bahaya' || item.numericValue > 80;
          const isKritis = !isBahaya && (riskCategory === 'kritis' || item.numericValue > 60);
          const isWaspada = !isBahaya && !isKritis && (riskCategory === 'waspada' || item.numericValue > 30);

          let avriBgClass = 'bg-[#236B32] border-[#1C5B2A]'; // default aman
          if (isBahaya) {
            avriBgClass = 'bg-[#DC2626] border-[#B91C1C]';
          } else if (isKritis) {
            avriBgClass = 'bg-[#EA580C] border-[#C2410C]';
          } else if (isWaspada) {
            avriBgClass = 'bg-[#D97706] border-[#B45309]';
          }

          return (
            <div
              key={item.id}
              className={`${avriBgClass} rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-2xs border flex flex-col justify-between transition-all duration-200`}
            >
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider block">
                {item.label}
              </span>

              <div className="mt-2.5 sm:mt-3">
                <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight block">
                  {item.value}
                </span>
              </div>
            </div>
          );
        }

        const valueColorClass = getMetricTextColor(item);

        // Kartu Telemetri Standar (Kelembapan Tanah, Suhu Tanah, pH Tanah)
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all duration-200"
          >
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {item.label}
            </span>

            <div className="mt-2.5 sm:mt-3">
              <span className={`text-2xl sm:text-4xl font-extrabold ${valueColorClass} tracking-tight block`}>
                {item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
