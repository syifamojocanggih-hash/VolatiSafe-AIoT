'use client';

import React from 'react';
import {
  Thermometer,
  Droplets,
  BatteryCharging,
  Radio,
  AlertTriangle,
  CheckCircle2,
  X,
  TrendingUp,
} from 'lucide-react';
import { BedengParcel } from '@/types/parcel';

interface NodeDetailPinCardProps {
  parcel: BedengParcel;
  onClose?: () => void;
  onToggleFailover?: () => void;
}

export const NodeDetailPinCard: React.FC<NodeDetailPinCardProps> = ({
  parcel,
  onClose,
  onToggleFailover,
}) => {
  const isCritical = parcel.avriCategory === 'kritis';
  const isWarning = parcel.avriCategory === 'waspada';

  return (
    <div className="w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-4 text-white space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto">
      {/* Header Card */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isCritical
                ? 'bg-red-500 animate-pulse'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <div>
            <h4 className="text-xs font-bold text-white leading-tight">
              {parcel.name}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Node: {parcel.nodeId} · {parcel.cropVariety}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Metric Reading (Suhu & Kelembaban Besar - Gaya Gambar 1) */}
      <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
        <div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-red-400" />
            Suhu Tanah
          </span>
          <div className="text-lg font-black text-white mt-0.5">
            {parcel.soilTempC.toFixed(1)}°C
          </div>
          <span className="text-[9px] text-red-400 font-medium">+1.8°C (Siang Terik)</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-400" />
            Kelembaban
          </span>
          <div className="text-lg font-black text-white mt-0.5">
            {parcel.moisturePct.toFixed(1)}%
          </div>
          <span className="text-[9px] text-amber-400 font-medium">Bawah Titik Optimal</span>
        </div>
      </div>

      {/* Mini Sparkline 24h Trend (SVG Curve bergaya Gambar 1 & Gambar 2) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Tren Suhu Permukaan (24 Jam)
          </span>
          <span className="font-mono text-slate-300">Puncak: 35.4°C</span>
        </div>

        <div className="h-10 w-full bg-slate-800/40 rounded-lg p-1 flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 25 Q 25 22, 50 12 T 75 8 T 100 6 L 100 30 L 0 30 Z"
              fill="url(#sparklineGrad)"
            />
            <path
              d="M 0 25 Q 25 22, 50 12 T 75 8 T 100 6"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Glowing Peak Dot */}
            <circle cx="100" cy="6" r="3" fill="#EF4444" className="animate-ping" />
            <circle cx="100" cy="6" r="2.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Status Rekomendasi Preskriptif */}
      <div
        className={`p-2.5 rounded-xl border text-2xs font-medium ${
          isCritical
            ? 'bg-red-950/60 border-red-800/80 text-red-200'
            : isWarning
            ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
            : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold mb-0.5">
          {isCritical ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>
            {isCritical
              ? 'RISIKO KRITIS (AVRI 74%)'
              : isWarning
              ? 'ZONA WASPADA (AVRI 42%)'
              : 'ZONA AMAN (AVRI 18%)'}
          </span>
        </div>
        <p className="line-clamp-2 text-slate-300">
          {parcel.prescription ||
            'Tunda penaburan Urea sekarang. Potensi penguapan amonia tinggi akibat suhu tanah > 30°C.'}
        </p>
      </div>

      {/* Footer Info Telemetri & Tombol */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
        <span className="flex items-center gap-1">
          <BatteryCharging className="w-3 h-3 text-emerald-400" />
          {parcel.batteryPct}% ({parcel.batteryV}V)
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Radio className="w-3 h-3 text-blue-400" />
          {parcel.loraSignalDbm} dBm
        </span>

        {onToggleFailover && (
          <button
            onClick={onToggleFailover}
            className="text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold transition-colors"
          >
            {parcel.status === 'simulated' ? 'Reset LoRa' : 'Simulasi Dropout'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NodeDetailPinCard;
