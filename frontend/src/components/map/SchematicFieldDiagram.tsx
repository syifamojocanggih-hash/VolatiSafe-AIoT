'use client';

import React from 'react';
import { BedengParcel, ActiveLayer, ParcelMapSummary } from '@/types/parcel';

interface SchematicFieldDiagramProps {
  parcels: BedengParcel[];
  selectedId: string;
  activeLayer: ActiveLayer;
  summary: ParcelMapSummary;
  onSelectParcel: (id: string) => void;
}

export const SchematicFieldDiagram: React.FC<SchematicFieldDiagramProps> = ({
  parcels,
  selectedId,
  activeLayer,
  summary,
  onSelectParcel,
}) => {
  const getParcel = (id: string) => parcels.find((p) => p.id === id) || parcels[0];

  const pA1 = getParcel('A1');
  const pA2 = getParcel('A2');
  const pA3 = getParcel('A3');
  const pB1 = getParcel('B1');
  const pB2 = getParcel('B2');

  // Helper for card styling based on active layer or AVRI
  const getCardStyle = (p: BedengParcel, isSelected: boolean) => {
    const isSimulated = p.status === 'simulated';

    if (isSelected) {
      return {
        cardBorder: 'border-2 border-indigo-600 ring-4 ring-indigo-400/30 shadow-lg scale-[1.02]',
        badgeBg: 'bg-indigo-600 text-white',
        statusColor: 'text-indigo-700',
        lineColor: '#4F46E5',
        lineWidth: 2.5,
      };
    }

    if (activeLayer === 'battery') {
      if (p.batteryPct > 80) {
        return {
          cardBorder: 'border-2 border-[#16A34A] shadow-xs hover:border-[#15803D]',
          badgeBg: 'bg-[#DCFCE7] text-[#16A34A]',
          statusColor: 'text-[#16A34A]',
          lineColor: '#16A34A',
          lineWidth: 1.8,
        };
      }
      if (p.batteryPct > 50) {
        return {
          cardBorder: 'border-2 border-[#CA8A04] shadow-xs hover:border-[#A16207]',
          badgeBg: 'bg-[#FEF9C3] text-[#CA8A04]',
          statusColor: 'text-[#CA8A04]',
          lineColor: '#CA8A04',
          lineWidth: 1.8,
        };
      }
      return {
        cardBorder: 'border-2 border-[#DC2626] shadow-xs hover:border-[#B91C1C]',
        badgeBg: 'bg-[#FEE2E2] text-[#DC2626]',
        statusColor: 'text-[#DC2626]',
        lineColor: '#DC2626',
        lineWidth: 1.8,
      };
    }

    if (activeLayer === 'lora') {
      if (p.status === 'online') {
        return {
          cardBorder: 'border-2 border-[#16A34A] shadow-xs hover:border-[#15803D]',
          badgeBg: 'bg-[#DCFCE7] text-[#16A34A]',
          statusColor: 'text-[#16A34A]',
          lineColor: '#16A34A',
          lineWidth: 1.8,
        };
      }
      return {
        cardBorder: 'border-2 border-dashed border-[#CA8A04] bg-[#FEFCE8]/60 shadow-xs hover:border-[#A16207]',
        badgeBg: 'bg-[#FEF9C3] text-[#CA8A04]',
        statusColor: 'text-[#CA8A04]',
        lineColor: '#CA8A04',
        lineWidth: 1.8,
      };
    }

    // Default: AVRI Risk
    if (isSimulated) {
      return {
        cardBorder: 'border-2 border-dashed border-[#D97706] bg-[#FEFCE8]/80 shadow-xs hover:border-[#B45309]',
        badgeBg: 'bg-[#B45309] text-white',
        statusColor: 'text-[#B45309]',
        lineColor: '#D97706',
        lineWidth: 1.8,
      };
    }

    if (p.avriCategory === 'aman') {
      return {
        cardBorder: 'border-2 border-[#16A34A] shadow-xs hover:border-[#15803D]',
        badgeBg: 'bg-[#15803D] text-white',
        statusColor: 'text-[#15803D]',
        lineColor: '#16A34A',
        lineWidth: 1.8,
      };
    }

    if (p.avriCategory === 'waspada') {
      return {
        cardBorder: 'border-2 border-[#CA8A04] shadow-xs hover:border-[#A16207]',
        badgeBg: 'bg-[#CA8A04] text-white',
        statusColor: 'text-[#CA8A04]',
        lineColor: '#CA8A04',
        lineWidth: 1.8,
      };
    }

    if (p.avriCategory === 'kritis') {
      return {
        cardBorder: 'border-2 border-[#EA580C] shadow-xs hover:border-[#C2410C]',
        badgeBg: 'bg-[#C2410C] text-white',
        statusColor: 'text-[#C2410C]',
        lineColor: '#EA580C',
        lineWidth: 1.8,
      };
    }

    // Bahaya
    return {
      cardBorder: 'border-2 border-[#DC2626] shadow-xs hover:border-[#B91C1C]',
      badgeBg: 'bg-[#B91C1C] text-white',
      statusColor: 'text-[#B91C1C]',
      lineColor: '#DC2626',
      lineWidth: 1.8,
    };
  };

  const styleA1 = getCardStyle(pA1, selectedId === 'A1');
  const styleA2 = getCardStyle(pA2, selectedId === 'A2');
  const styleA3 = getCardStyle(pA3, selectedId === 'A3');
  const styleB1 = getCardStyle(pB1, selectedId === 'B1');
  const styleB2 = getCardStyle(pB2, selectedId === 'B2');

  return (
    <div className="relative w-full select-none py-2">
      {/* Main Diagram Area with SVG Connection Traces behind HTML Cards */}
      <div className="relative w-full min-h-[440px] sm:min-h-[480px]">
        {/* SVG Wireless Traces Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gatewayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E5E2C" />
              <stop offset="100%" stopColor="#0F3818" />
            </linearGradient>
          </defs>

          {/* Connection Lines from Gateway Center (Approx 50% X, 56% Y) */}
          {/* Line to A1 (Top Left approx 16% X, 20% Y) */}
          <line
            x1="50%"
            y1="56%"
            x2="16%"
            y2="20%"
            stroke="#C8BA9E"
            strokeWidth="1.8"
            strokeDasharray={selectedId === 'A1' ? '6 4' : ''}
          />

          {/* Line to A2 (Top Center approx 50% X, 20% Y) */}
          <line
            x1="50%"
            y1="56%"
            x2="50%"
            y2="20%"
            stroke="#C8BA9E"
            strokeWidth="1.8"
            strokeDasharray={selectedId === 'A2' ? '6 4' : ''}
          />

          {/* Line to A3 (Top Right approx 84% X, 20% Y) */}
          <line
            x1="50%"
            y1="56%"
            x2="84%"
            y2="20%"
            stroke="#C8BA9E"
            strokeWidth="1.8"
            strokeDasharray={selectedId === 'A3' ? '6 4' : ''}
          />

          {/* Line to B1 (Bottom Left approx 25% X, 85% Y) */}
          <line
            x1="50%"
            y1="56%"
            x2="25%"
            y2="85%"
            stroke="#C8BA9E"
            strokeWidth="1.8"
            strokeDasharray={selectedId === 'B1' ? '6 4' : ''}
          />

          {/* Line to B2 (Bottom Right approx 75% X, 85% Y - Dashed for Failover/Offline) */}
          <line
            x1="50%"
            y1="56%"
            x2="75%"
            y2="85%"
            stroke="#D97706"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        </svg>

        {/* ================= 1. UPPER ROW: NODES A1, A2, A3 ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
          {/* Card A1 */}
          <div
            onClick={() => onSelectParcel('A1')}
            className={`bg-white rounded-2xl p-4 sm:p-5 transition-all cursor-pointer ${styleA1.cardBorder}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  A1 · VS-A1-001
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase shrink-0 ${styleA1.badgeBg}`}>
                AVRI {pA1.avriScore}% · {pA1.avriCategory}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-medium text-slate-700 space-y-1">
              <p>
                θ {pA1.moisturePct.toString().replace('.', ',')}% &nbsp; T {pA1.soilTempC.toString().replace('.', ',')}°C &nbsp; pH {pA1.ph.toString().replace('.', ',')}
              </p>
              <p className="text-2xs text-slate-500">
                Baterai {pA1.batteryPct}% &nbsp;·&nbsp; RSSI {pA1.loraSignalDbm} dBm
              </p>
            </div>
          </div>

          {/* Card A2 */}
          <div
            onClick={() => onSelectParcel('A2')}
            className={`bg-white rounded-2xl p-4 sm:p-5 transition-all cursor-pointer ${styleA2.cardBorder}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  A2 · VS-A2-002
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase shrink-0 ${styleA2.badgeBg}`}>
                AVRI {pA2.avriScore}% · {pA2.avriCategory}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-medium text-slate-700 space-y-1">
              <p>
                θ {pA2.moisturePct.toString().replace('.', ',')}% &nbsp; T {pA2.soilTempC.toString().replace('.', ',')}°C &nbsp; pH {pA2.ph.toString().replace('.', ',')}
              </p>
              <p className="text-2xs text-slate-500">
                Baterai {pA2.batteryPct}% &nbsp;·&nbsp; RSSI {pA2.loraSignalDbm} dBm
              </p>
            </div>
          </div>

          {/* Card A3 */}
          <div
            onClick={() => onSelectParcel('A3')}
            className={`bg-white rounded-2xl p-4 sm:p-5 transition-all cursor-pointer ${styleA3.cardBorder}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  A3 · VS-A3-003
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase shrink-0 ${styleA3.badgeBg}`}>
                AVRI {pA3.avriScore}% · {pA3.avriCategory}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-medium text-slate-700 space-y-1">
              <p>
                θ {pA3.moisturePct.toString().replace('.', ',')}% &nbsp; T {pA3.soilTempC.toString().replace('.', ',')}°C &nbsp; pH {pA3.ph.toString().replace('.', ',')}
              </p>
              <p className="text-2xs text-slate-500">
                Baterai {pA3.batteryPct}% &nbsp;·&nbsp; RSSI {pA3.loraSignalDbm} dBm
              </p>
            </div>
          </div>
        </div>

        {/* ================= RSSI PILLS ACROSS UPPER CONNECTIONS ================= */}
        <div className="hidden md:flex justify-between px-16 sm:px-24 my-6 relative z-10 pointer-events-none">
          <span className="bg-white/95 text-slate-600 px-3 py-1 rounded-full text-2xs font-bold border border-slate-200/90 shadow-2xs">
            {pA1.loraSignalDbm} dBm
          </span>
          <span className="bg-white/95 text-slate-600 px-3 py-1 rounded-full text-2xs font-bold border border-slate-200/90 shadow-2xs">
            {pA2.loraSignalDbm} dBm
          </span>
          <span className="bg-white/95 text-slate-600 px-3 py-1 rounded-full text-2xs font-bold border border-slate-200/90 shadow-2xs">
            {pA3.loraSignalDbm} dBm
          </span>
        </div>

        {/* ================= 2. CENTER: GATEWAY BASECAMP LORA ================= */}
        <div className="flex flex-col items-center justify-center my-6 sm:my-8 relative z-20">
          <div className="relative flex items-center justify-center">
            {/* Concentric Signal Radar Animation */}
            <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-emerald-400 opacity-40"></span>
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-[#1E5E2C] to-[#0F3818] flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>
          <p className="font-extrabold text-sm text-slate-900 mt-2 tracking-tight">
            Gateway Basecamp
          </p>
          <p className="text-2xs text-slate-500 font-semibold">
            LoRa 433 MHz · Transceiver ESP32
          </p>
        </div>

        {/* ================= RSSI PILLS ACROSS LOWER CONNECTIONS ================= */}
        <div className="hidden md:flex justify-around px-20 sm:px-32 my-6 relative z-10 pointer-events-none">
          <span className="bg-white/95 text-slate-600 px-3 py-1 rounded-full text-2xs font-bold border border-slate-200/90 shadow-2xs">
            {pB1.loraSignalDbm} dBm
          </span>
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-2xs font-bold border border-amber-300 shadow-2xs">
            offline
          </span>
        </div>

        {/* ================= 3. LOWER ROW: NODES B1, B2 ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto relative z-10">
          {/* Card B1 */}
          <div
            onClick={() => onSelectParcel('B1')}
            className={`bg-white rounded-2xl p-4 sm:p-5 transition-all cursor-pointer ${styleB1.cardBorder}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  B1 · VS-B1-004
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase shrink-0 ${styleB1.badgeBg}`}>
                AVRI {pB1.avriScore}% · {pB1.avriCategory}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-medium text-slate-700 space-y-1">
              <p>
                θ {pB1.moisturePct.toString().replace('.', ',')}% &nbsp; T {pB1.soilTempC.toString().replace('.', ',')}°C &nbsp; pH {pB1.ph.toString().replace('.', ',')}
              </p>
              <p className="text-2xs text-slate-500">
                Baterai {pB1.batteryPct}% &nbsp;·&nbsp; RSSI {pB1.loraSignalDbm} dBm
              </p>
            </div>
          </div>

          {/* Card B2 (Digital Twin Failover) */}
          <div
            onClick={() => onSelectParcel('B2')}
            className={`rounded-2xl p-4 sm:p-5 transition-all cursor-pointer ${styleB2.cardBorder}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  B2 · VS-B2-005
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase shrink-0 ${styleB2.badgeBg}`}>
                Est-Simulated · FAO-56
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-200/80 text-xs font-medium text-slate-700 space-y-1">
              <p>
                θ {pB2.moisturePct.toString().replace('.', ',')}% &nbsp; T {pB2.soilTempC.toString().replace('.', ',')}°C &nbsp; pH {pB2.ph.toString().replace('.', ',')}
              </p>
              <p className="text-2xs text-amber-800 font-semibold">
                Baterai — &nbsp;·&nbsp; RSSI offline (Digital Twin Imputasi)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchematicFieldDiagram;
