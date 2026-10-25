'use client';

import React from 'react';
import { MetricItem } from '@/types/dashboard';

interface MetricCardsGridProps {
  metrics: MetricItem[];
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {metrics.map((item) => {
        if (item.isAvriCard) {
          // Solid Green AVRI Card as shown in the mockup
          return (
            <div
              key={item.id}
              className="bg-[#236B32] rounded-2xl p-4 sm:p-5 text-white shadow-xs border border-[#1C5B2A] flex flex-col justify-between transition-transform hover:-translate-y-0.5"
            >
              <span className="text-xs sm:text-sm font-bold text-emerald-100 tracking-wide uppercase">
                {item.label}
              </span>
              <div className="mt-2.5 sm:mt-4">
                <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {item.value}
                </span>
              </div>
            </div>
          );
        }

        // Standard White Metric Cards with clean green accent value
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5"
          >
            <span className="text-xs sm:text-sm font-semibold text-slate-800">
              {item.label}
            </span>
            <div className="mt-2.5 sm:mt-4">
              <span className="text-2xl sm:text-4xl font-extrabold text-[#1B6633] tracking-tight">
                {item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
