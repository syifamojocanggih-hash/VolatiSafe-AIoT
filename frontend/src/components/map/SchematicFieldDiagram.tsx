'use client';

import React, { useState } from 'react';
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Parcel styling helper based on active layer
  const getParcelColors = (p: BedengParcel, isSelected: boolean) => {
    if (isSelected) {
      return {
        fill: '#818CF8', // Purple highlight
        fillOpacity: 0.35,
        stroke: '#4F46E5',
        strokeWidth: 4,
        badgeBg: 'bg-indigo-600',
        badgeText: 'text-white',
        ring: 'ring-4 ring-indigo-400/40',
      };
    }

    if (activeLayer === 'battery') {
      if (p.batteryPct > 80) {
        return {
          fill: '#10B981',
          fillOpacity: 0.22,
          stroke: '#059669',
          strokeWidth: 2.5,
          badgeBg: 'bg-emerald-600',
          badgeText: 'text-white',
          ring: '',
        };
      }
      if (p.batteryPct > 50) {
        return {
          fill: '#F59E0B',
          fillOpacity: 0.22,
          stroke: '#D97706',
          strokeWidth: 2.5,
          badgeBg: 'bg-amber-600',
          badgeText: 'text-white',
          ring: '',
        };
      }
      return {
        fill: '#EF4444',
        fillOpacity: 0.25,
        stroke: '#DC2626',
        strokeWidth: 2.5,
        badgeBg: 'bg-red-600',
        badgeText: 'text-white',
        ring: '',
      };
    }

    if (activeLayer === 'lora') {
      if (p.status === 'online') {
        return {
          fill: '#10B981',
          fillOpacity: 0.22,
          stroke: '#059669',
          strokeWidth: 2.5,
          badgeBg: 'bg-emerald-600',
          badgeText: 'text-white',
          ring: '',
        };
      }
      return {
        fill: '#F59E0B',
        fillOpacity: 0.22,
        stroke: '#D97706',
        strokeWidth: 2.5,
        badgeBg: 'bg-amber-600',
        badgeText: 'text-white',
        ring: '',
      };
    }

    // Default: AVRI Risk Layer
    if (p.avriCategory === 'aman') {
      return {
        fill: '#10B981',
        fillOpacity: 0.25,
        stroke: '#059669',
        strokeWidth: 2.5,
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        ring: '',
      };
    }
    if (p.avriCategory === 'waspada' || p.status === 'simulated') {
      return {
        fill: '#F59E0B',
        fillOpacity: 0.25,
        stroke: '#D97706',
        strokeWidth: 2.5,
        badgeBg: 'bg-amber-600',
        badgeText: 'text-white',
        ring: '',
      };
    }
    if (p.avriCategory === 'kritis') {
      return {
        fill: '#F97316',
        fillOpacity: 0.28,
        stroke: '#EA580C',
        strokeWidth: 3,
        badgeBg: 'bg-orange-600',
        badgeText: 'text-white',
        ring: '',
      };
    }
    // Bahaya
    return {
      fill: '#EF4444',
      fillOpacity: 0.3,
      stroke: '#DC2626',
      strokeWidth: 3,
      badgeBg: 'bg-red-600',
      badgeText: 'text-white',
      ring: '',
    };
  };

  // Organic geometric schematic polygons (ViewBox: 0 0 920 540)
  const parcelGeometries: {
    [id: string]: {
      path: string;
      center: [number, number];
      labelPos: [number, number];
      elevationText: string;
      soilBedengs: string[];
    };
  } = {
    A1: {
      path: 'M 70 85 C 130 75, 230 78, 305 95 C 320 145, 310 195, 295 240 C 220 245, 140 248, 65 235 C 50 185, 55 130, 70 85 Z',
      center: [185, 160],
      labelPos: [185, 115],
      elevationText: 'Elevasi: 72m dpl · Lereng Utara',
      soilBedengs: [
        'M 95 110 L 280 115',
        'M 90 140 L 285 145',
        'M 85 170 L 290 175',
        'M 80 200 L 285 205',
      ],
    },
    A2: {
      path: 'M 320 95 C 410 75, 500 78, 595 90 C 605 140, 595 195, 580 235 C 490 245, 410 245, 310 240 C 315 190, 318 140, 320 95 Z',
      center: [450, 160],
      labelPos: [450, 115],
      elevationText: 'Elevasi: 65m dpl · Lembah Basah',
      soilBedengs: [
        'M 340 110 L 575 110',
        'M 335 140 L 580 140',
        'M 330 170 L 575 170',
        'M 325 200 L 565 200',
      ],
    },
    A3: {
      path: 'M 610 90 C 700 75, 790 78, 855 95 C 870 145, 860 195, 845 240 C 760 250, 680 248, 595 235 C 600 185, 605 135, 610 90 Z',
      center: [730, 160],
      labelPos: [730, 115],
      elevationText: 'Elevasi: 85m dpl · Puncak Karst',
      soilBedengs: [
        'M 630 110 L 835 115',
        'M 625 140 L 840 145',
        'M 620 170 L 845 175',
        'M 610 200 L 830 205',
      ],
    },
    B1: {
      path: 'M 75 285 C 190 280, 310 282, 435 290 C 445 350, 430 420, 415 480 C 290 495, 180 488, 70 470 C 60 410, 65 345, 75 285 Z',
      center: [255, 385],
      labelPos: [255, 330],
      elevationText: 'Elevasi: 68m dpl · Zona Irigasi',
      soilBedengs: [
        'M 95 315 L 415 320',
        'M 90 350 L 420 355',
        'M 85 385 L 425 390',
        'M 80 420 L 420 425',
        'M 80 450 L 410 455',
      ],
    },
    B2: {
      path: 'M 455 290 C 580 282, 720 280, 845 285 C 855 345, 860 410, 850 470 C 740 488, 620 495, 505 480 C 490 420, 475 350, 455 290 Z',
      center: [655, 385],
      labelPos: [655, 330],
      elevationText: 'Elevasi: 78m dpl · Terasering Lereng',
      soilBedengs: [
        'M 475 315 L 825 315',
        'M 480 350 L 835 350',
        'M 490 385 L 840 385',
        'M 495 420 L 835 420',
        'M 510 450 L 825 450',
      ],
    },
  };

  const getParcelData = (id: string) => parcels.find((p) => p.id === id) || parcels[0];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#E5DEC7] shadow-inner bg-[#FAF6EE] p-4 sm:p-6 select-none">
      {/* Top Diagram Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-[#EADFC7]/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            IoT
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Diagram Topologi Lahan & Hamparan Tegal Kapur Bluri
            </h4>
            <p className="text-2xs text-slate-500 font-medium">
              Representasi Vektor Geometris Petak Bedengan Jagung & Transceiver LoRa 433 MHz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-2xs font-semibold text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>5 Node Aktif · Jaringan Mesh LoRa</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="w-full aspect-[920/540] max-h-[560px] relative">
        <svg
          viewBox="0 0 920 540"
          className="w-full h-full drop-shadow-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Terrain Pattern */}
            <pattern id="terrainGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E6DAC0" strokeWidth="0.8" opacity="0.6" />
            </pattern>

            {/* Karst Contour Lines */}
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.8" />
            </linearGradient>

            {/* Soil Bedeng Furrow Pattern */}
            <pattern id="bedengStripe" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#D1C4A5" strokeWidth="1.2" opacity="0.4" />
            </pattern>
          </defs>

          {/* Background Soil Matrix */}
          <rect x="15" y="15" width="890" height="510" rx="24" fill="#F4EDE0" stroke="#E2D4BA" strokeWidth="2" />
          <rect x="15" y="15" width="890" height="510" rx="24" fill="url(#terrainGrid)" />

          {/* Karst Hill Contour Elevation Rings (Subtle topography relief) */}
          <ellipse cx="730" cy="160" rx="145" ry="90" fill="none" stroke="#D8C7A5" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.5" />
          <ellipse cx="730" cy="160" rx="110" ry="65" fill="none" stroke="#D8C7A5" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <ellipse cx="655" cy="385" rx="155" ry="95" fill="none" stroke="#D8C7A5" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.5" />

          {/* Outer Territory Boundary Line (Blue Dashed matching Leaflet) */}
          <path
            d="M 50 65 C 250 50, 650 48, 870 70 C 895 240, 885 360, 865 490 C 650 515, 280 515, 55 490 C 35 360, 30 220, 50 65 Z"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeDasharray="8 8"
            opacity="0.85"
          />

          {/* ================= 1. GATEWAY BASECAMP RADIO TOWER (NORTH) ================= */}
          <g transform="translate(460, 42)">
            {/* Concentric LoRa Radio Wave Pulses */}
            <circle cx="0" cy="0" r="18" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" className="animate-ping" />
            <circle cx="0" cy="0" r="26" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

            {/* Base Tower Badge */}
            <circle cx="0" cy="0" r="14" fill="#047857" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />
            <path d="M -5 5 L 0 -7 L 5 5 Z" fill="#FFFFFF" />
            <circle cx="0" cy="-8" r="2" fill="#FFFFFF" />

            {/* Radio Wave Arcs */}
            <path d="M -9 -4 A 10 10 0 0 1 -9 -12" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 9 -4 A 10 10 0 0 0 9 -12" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

            {/* Text Label */}
            <text x="0" y="24" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              Gateway Basecamp LoRa (433 MHz)
            </text>
          </g>

          {/* LoRa Wireless Connection Traces to each parcel node */}
          {Object.entries(parcelGeometries).map(([id, geo]) => {
            const p = getParcelData(id);
            const isSelected = id === selectedId;
            return (
              <line
                key={`link-${id}`}
                x1="460"
                y1="42"
                x2={geo.center[0]}
                y2={geo.center[1] - 15}
                stroke={isSelected ? '#4F46E5' : p.status === 'online' ? '#10B981' : '#F59E0B'}
                strokeWidth={isSelected ? 2.5 : 1.2}
                strokeDasharray={isSelected ? '6 4' : '4 4'}
                opacity={isSelected ? 0.9 : 0.45}
              />
            );
          })}

          {/* ================= 2. NATURAL WINDING ROAD & DRAINAGE DITCH ================= */}
          <g>
            {/* Dirt Farm Path (Jalan Usaha Tani) */}
            <path
              d="M 30 250 C 220 270, 420 255, 620 272 C 750 280, 820 265, 890 275"
              fill="none"
              stroke="#D4C5A3"
              strokeWidth="24"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 30 250 C 220 270, 420 255, 620 272 C 750 280, 820 265, 890 275"
              fill="none"
              stroke="#B3A27D"
              strokeWidth="1.5"
              strokeDasharray="8 8"
              opacity="0.7"
            />

            {/* Natural Blue Stream / Drainage Ditch (Alur Drainase) */}
            <path
              d="M 30 262 C 220 282, 420 267, 620 284 C 750 292, 820 277, 890 287"
              fill="none"
              stroke="url(#streamGrad)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 30 262 C 220 282, 420 267, 620 284 C 750 292, 820 277, 890 287"
              fill="none"
              stroke="#BAE6FD"
              strokeWidth="2"
              strokeDasharray="12 6"
              opacity="0.8"
            />

            {/* Bridge/Culvert Crossings */}
            <rect x="290" y="246" width="16" height="34" rx="3" fill="#78716C" stroke="#44403C" strokeWidth="1.5" />
            <rect x="600" y="258" width="16" height="34" rx="3" fill="#78716C" stroke="#44403C" strokeWidth="1.5" />

            {/* Road & Waterway Label Banner */}
            <g transform="translate(460, 274)">
              <rect x="-120" y="-10" width="240" height="20" rx="10" fill="#0C4A6E" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                🌊 Alur Drainase & Jalan Usaha Tani Desa Bluri
              </text>
            </g>
          </g>

          {/* ================= 3. THE 5 CADASTRAL PARCEL GEOMETRIES ================= */}
          {['A1', 'A2', 'A3', 'B1', 'B2'].map((id) => {
            const p = getParcelData(id);
            const geo = parcelGeometries[id];
            const isSelected = id === selectedId;
            const isHovered = id === hoveredId;
            const style = getParcelColors(p, isSelected);

            return (
              <g
                key={`parcel-${id}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectParcel(id)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Parcel Boundary Shape */}
                <path
                  d={geo.path}
                  fill={style.fill}
                  fillOpacity={isHovered ? style.fillOpacity + 0.15 : style.fillOpacity}
                  stroke={isSelected ? '#4F46E5' : isHovered ? '#0284C7' : style.stroke}
                  strokeWidth={isSelected ? 4.5 : isHovered ? 3.5 : style.strokeWidth}
                  strokeDasharray={p.status === 'simulated' ? '6 6' : ''}
                  className="transition-colors duration-150"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 6px 12px rgba(79, 70, 229, 0.35))' : 'none',
                  }}
                />

                {/* Internal Crop Furrows / Bedengan Stripes */}
                {geo.soilBedengs.map((bPath, bIdx) => (
                  <path
                    key={`b-${id}-${bIdx}`}
                    d={bPath}
                    fill="none"
                    stroke={isSelected ? '#6366F1' : style.stroke}
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity={isSelected ? 0.45 : 0.3}
                  />
                ))}

                {/* Elevation & Terrain Contour Label */}
                <text
                  x={geo.center[0]}
                  y={geo.labelPos[1] - 12}
                  textAnchor="middle"
                  fill="#78716C"
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {geo.elevationText}
                </text>

                {/* Parcel Title Banner */}
                <g transform={`translate(${geo.labelPos[0]}, ${geo.labelPos[1]})`}>
                  <rect
                    x="-90"
                    y="-11"
                    width="180"
                    height="22"
                    rx="11"
                    fill={isSelected ? '#4338CA' : '#FFFFFF'}
                    stroke={isSelected ? '#312E81' : '#E2E8F0'}
                    strokeWidth="1.5"
                    className="shadow-xs"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={isSelected ? '#FFFFFF' : '#0F172A'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {id} · {p.shortName.replace(`${id} · `, '')}
                  </text>
                </g>

                {/* IoT Sensor Station Probe Pin Icon */}
                <g transform={`translate(${geo.center[0]}, ${geo.center[1] + 10})`}>
                  {/* Ground Sensor Insertion Ring */}
                  <ellipse cx="0" cy="18" rx="14" ry="5" fill="#44403C" opacity="0.3" />

                  {/* Node Enclosure Badge */}
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill={isSelected ? '#4F46E5' : '#0F172A'}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="shadow-md"
                  />
                  <text
                    x="0"
                    y="4.5"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="extrabold"
                    fontFamily="sans-serif"
                  >
                    {id}
                  </text>

                  {/* Sensor Antenna Mast */}
                  <line x1="0" y1="-15" x2="0" y2="-28" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="0" cy="-28" r="2.5" fill={p.status === 'online' ? '#10B981' : '#F59E0B'} />

                  {/* Subterranean FDR + NTC Soil Probe illustration */}
                  <line x1="0" y1="15" x2="0" y2="30" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="-3" y1="28" x2="3" y2="28" stroke="#0284C7" strokeWidth="2" />
                </g>

                {/* Telemetry Indicator Badges inside Parcel */}
                <g transform={`translate(${geo.center[0]}, ${geo.center[1] + 58})`}>
                  {/* AVRI Score Pill */}
                  <rect
                    x="-65"
                    y="-9"
                    width="130"
                    height="18"
                    rx="9"
                    fill={
                      p.avriCategory === 'aman'
                        ? '#059669'
                        : p.avriCategory === 'waspada'
                        ? '#D97706'
                        : '#DC2626'
                    }
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    AVRI: {p.avriScore}% ({p.avriCategory.toUpperCase()})
                  </text>
                </g>

                {/* Soil Measurements: θ, T, pH */}
                <g transform={`translate(${geo.center[0]}, ${geo.center[1] + 82})`}>
                  <rect
                    x="-80"
                    y="-8"
                    width="160"
                    height="16"
                    rx="8"
                    fill="#FFFFFF"
                    fillOpacity="0.85"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#334155"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    θ {p.moisturePct}% | T {p.soilTempC}°C | pH {p.ph}
                  </text>
                </g>
              </g>
            );
          })}

          {/* North Direction Indicator Compass Rose (Top Left) */}
          <g transform="translate(48, 50)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" className="shadow-xs" />
            <path d="M 0 -11 L 4 0 L -4 0 Z" fill="#DC2626" />
            <path d="M 0 11 L 4 0 L -4 0 Z" fill="#64748B" />
            <text x="0" y="-13" textAnchor="middle" fill="#DC2626" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
              U
            </text>
          </g>

          {/* Scale Legend Indicator (Bottom Left) */}
          <g transform="translate(48, 510)">
            <rect x="0" y="0" width="80" height="3" fill="#0F172A" />
            <line x1="0" y1="-3" x2="0" y2="6" stroke="#0F172A" strokeWidth="1.5" />
            <line x1="40" y1="-2" x2="40" y2="5" stroke="#0F172A" strokeWidth="1" />
            <line x1="80" y1="-3" x2="80" y2="6" stroke="#0F172A" strokeWidth="1.5" />
            <text x="40" y="-6" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
              100 Meter
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Helper Text */}
      <div className="flex items-center justify-between text-2xs text-slate-500 font-medium pt-3 mt-1 border-t border-[#EADFC7]/80">
        <span>* Klik petak lahan atau ikon node untuk menyorot analisis telemetri dan preskripsi di panel bawah.</span>
        <span className="hidden sm:inline-block font-semibold text-slate-700">Skala Topologi 1:1.000 · Desa Bluri</span>
      </div>
    </div>
  );
};

export default SchematicFieldDiagram;
