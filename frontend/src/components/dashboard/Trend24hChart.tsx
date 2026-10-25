'use client';

import React, { useState } from 'react';
import { ForecastPoint } from '@/types/dashboard';

interface Trend24hChartProps {
  data: ForecastPoint[];
}

export const Trend24hChart: React.FC<Trend24hChartProps> = ({ data }) => {
  const [activePoint, setActivePoint] = useState<ForecastPoint | null>(null);

  // Chart coordinates mapping (Width: 600, Height: 240)
  // X coordinates corresponding to 00.00, 08.00, 16.00, 23.00
  const width = 600;
  const height = 240;
  const padLeft = 30;
  const padRight = 40;
  const padTop = 25;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Scale: Min 15, Max 50 for value mapping
  const minVal = 15;
  const maxVal = 50;

  const getX = (index: number) => padLeft + (index / (data.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  const moistureCoords = data.map((d, i) => ({ x: getX(i), y: getY(d.moisture), val: d.moisture, point: d }));
  const tempCoords = data.map((d, i) => ({ x: getX(i), y: getY(d.temperature), val: d.temperature, point: d }));

  const moisturePath = moistureCoords.reduce(
    (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    ''
  );

  const tempPath = tempCoords.reduce(
    (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    ''
  );

  const thresholdY = getY(25);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Tren 24 Jam (Forecast)
        </h4>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-[#2563EB] rounded-full inline-block" />
            <span>Kelembapan tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-[#C25E26] rounded-full inline-block" />
            <span>Suhu Tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
            <span>Ambang Kritis</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-64 overflow-visible"
        >
          {/* Grid Baseline X & Y Axis */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + chartH}
            stroke="#1F2937"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={padLeft + chartW}
            y2={padTop + chartH}
            stroke="#1F2937"
            strokeWidth="1.5"
          />

          {/* Ambang Kritis 25% Dashed Line */}
          <line
            x1={padLeft}
            y1={thresholdY}
            x2={padLeft + chartW}
            y2={thresholdY}
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text
            x={padLeft + chartW + 6}
            y={thresholdY + 4}
            fill="#64748B"
            fontSize="10"
            fontWeight="600"
          >
            25%
          </text>

          {/* Moisture Line (Blue) */}
          <path
            d={moisturePath}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Moisture Dots */}
          {moistureCoords.map((coord, i) => (
            <circle
              key={`m-${i}`}
              cx={coord.x}
              cy={coord.y}
              r={i === 1 ? '4.5' : '3.5'}
              fill="#2563EB"
              className="cursor-pointer hover:r-5 transition-all"
              onMouseEnter={() => setActivePoint(coord.point)}
            />
          ))}

          {/* Temperature Line (Brown/Orange) */}
          <path
            d={tempPath}
            fill="none"
            stroke="#C25E26"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Temperature Dots */}
          {tempCoords.map((coord, i) => (
            <circle
              key={`t-${i}`}
              cx={coord.x}
              cy={coord.y}
              r={i === 1 ? '4.5' : '3.5'}
              fill="#C25E26"
              className="cursor-pointer hover:r-5 transition-all"
              onMouseEnter={() => setActivePoint(coord.point)}
            />
          ))}

          {/* X Axis Time Labels */}
          {data.map((item, i) => (
            <text
              key={`label-${i}`}
              x={getX(i)}
              y={padTop + chartH + 18}
              textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
              fill="#475569"
              fontSize="11"
              fontWeight="500"
            >
              {item.time}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && (
          <div className="absolute top-2 right-4 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm pointer-events-none">
            <span className="font-bold text-emerald-400">Jam {activePoint.time}</span> |
            Kelembapan: <span className="font-semibold text-blue-300">{activePoint.moisture}%</span> |
            Suhu: <span className="font-semibold text-amber-300">{activePoint.temperature}°C</span>
          </div>
        )}
      </div>
    </div>
  );
};
