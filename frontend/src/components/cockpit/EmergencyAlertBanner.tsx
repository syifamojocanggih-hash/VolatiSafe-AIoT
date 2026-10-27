'use client';

import React from 'react';

interface EmergencyAlertBannerProps {
  avriScore: number;
  soilTempC: number;
  onPostpone: () => void;
  onInterveneIrrigation: () => void;
  onDismiss: () => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  avriScore,
  soilTempC,
  onPostpone,
  onInterveneIrrigation,
  onDismiss,
}) => {
  return (
    <div className="w-full bg-rose-950/90 backdrop-blur-xl text-rose-100 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between gap-3 z-30 select-none text-xs shadow-xl">
      <div className="flex items-center gap-2.5 min-w-0 truncate">
        <span className="font-semibold bg-rose-500/25 border border-rose-500/40 text-rose-300 px-2.5 py-0.5 rounded-full text-[11px] shrink-0 font-mono">
          Risiko Kritis {avriScore}%
        </span>
        <span className="truncate text-rose-200/90">
          Suhu tanah {soilTempC.toFixed(1)}°C memicu penguapan amonia tinggi. Tunda penaburan urea hingga jendela aman.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onPostpone}
          className="px-3 py-1 rounded-full bg-white text-rose-900 hover:bg-rose-100 font-semibold transition-all text-xs shadow-sm"
        >
          Tunda Pemupukan
        </button>

        <button
          onClick={onInterveneIrrigation}
          className="px-3 py-1 rounded-full bg-rose-600/60 hover:bg-rose-600 text-white border border-rose-400/40 font-medium transition-all text-xs"
        >
          Simulasi Irigasi
        </button>

        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-full flex items-center justify-center text-rose-300 hover:text-white hover:bg-white/10 transition-colors text-xs leading-none"
          title="Tutup peringatan"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default EmergencyAlertBanner;
