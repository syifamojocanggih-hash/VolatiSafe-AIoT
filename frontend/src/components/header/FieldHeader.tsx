'use client';

import React from 'react';
import { RefreshCw, BatteryMedium, Settings } from 'lucide-react';
import { FieldInfo } from '@/types/dashboard';

interface FieldHeaderProps {
  field: FieldInfo;
  onOpenSettings: () => void;
}

export const FieldHeader: React.FC<FieldHeaderProps> = ({
  field,
  onOpenSettings,
}) => {
  return (
    <div className="bg-white px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between border-b border-slate-100 shadow-sm">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {field.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          {field.block} - {field.areaHa.toString().replace('.', ',')} ha - {field.datDays} HST ({field.phaseName})
        </p>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Badges */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Last Updated Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300/80 bg-white text-slate-700 text-xs font-semibold shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Update {field.lastUpdatedMinutesAgo} Menit Lalu</span>
          </div>

          {/* Battery Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-50/50 text-emerald-800 text-xs font-semibold shadow-2xs">
            <BatteryMedium className="w-4 h-4 text-emerald-700" />
            <span>Baterai {field.batteryPct}%</span>
          </div>
        </div>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          title="Pengaturan Petak & Sensor"
          aria-label="Pengaturan Petak & Sensor"
          className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};
