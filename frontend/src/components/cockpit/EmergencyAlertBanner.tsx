'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faClockRotateLeft,
  faDroplet,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

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
    <div className="w-full bg-rose-50/95 backdrop-blur-xl text-rose-900 border border-rose-200 rounded-2xl px-4 py-2 flex items-center justify-between gap-3 z-30 select-none text-xs shadow-sm ring-1 ring-rose-500/10 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-2.5 min-w-0 truncate">
        <span className="font-bold bg-rose-100 border border-rose-300 text-rose-800 px-3 py-1 rounded-xl text-[11px] shrink-0 font-mono flex items-center gap-1.5 shadow-xs">
          <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span>Risiko Kritis {avriScore}%</span>
        </span>
        <span className="truncate text-rose-800 text-xs font-medium">
          Suhu tanah {soilTempC.toFixed(1)}°C memicu penguapan amonia tinggi. Tunda penaburan urea hingga jendela aman.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onPostpone}
          className="px-3.5 py-1.5 rounded-xl bg-white text-rose-900 hover:bg-rose-100 active:scale-95 font-bold transition-all duration-150 text-xs border border-rose-200 shadow-xs flex items-center gap-1.5"
        >
          <FontAwesomeIcon icon={faClockRotateLeft} className="w-3 h-3 text-rose-600" />
          <span>Tunda Pemupukan</span>
        </button>

        <button
          onClick={onInterveneIrrigation}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold transition-all duration-150 text-xs flex items-center gap-1.5 shadow-xs"
        >
          <FontAwesomeIcon icon={faDroplet} className="w-3 h-3" />
          <span>Simulasi Irigasi</span>
        </button>

        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-rose-600 hover:text-rose-900 hover:bg-rose-100 active:scale-90 transition-all duration-150 text-xs"
          title="Tutup peringatan"
        >
          <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EmergencyAlertBanner;
