'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ForecastPoint } from '@/types/dashboard';

// Dynamic import with ssr: false to prevent Next.js server-side hydration mismatch
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 sm:h-64 flex items-center justify-center bg-slate-50/50 rounded-2xl animate-pulse">
      <span className="text-xs font-semibold text-slate-400">Memuat grafik telemetri...</span>
    </div>
  ),
});

interface Trend24hChartProps {
  data: ForecastPoint[];
}

export const Trend24hChart: React.FC<Trend24hChartProps> = ({ data }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const xCategories = data.map((d) => d.time);
  const moistureData = data.map((d) => d.moisture);
  const tempData = data.map((d) => d.temperature);
  const phData = data.map((d) => (d.ph != null ? Number(d.ph.toFixed(2)) : 7.82));

  // ECharts Configuration Styled with Shadcn UI Aesthetics
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: 48,
      right: 36,
      top: 18,
      bottom: 24,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: '#334155',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#F8FAFC',
        fontFamily: 'inherit',
        fontSize: 12,
      },
      borderRadius: 12,
      formatter: (params: Array<{ seriesName: string; value: number; marker: string; name?: string; axisValueLabel?: string }>) => {
        if (!params || params.length === 0) return '';
        const timeLabel = params[0].axisValueLabel || params[0].name || '';
        let res = `<div class="font-bold text-xs text-emerald-400 mb-1">Pukul ${timeLabel} WIB</div>`;
        params.forEach((item) => {
          let unit = '%';
          let val: string | number = item.value;
          if (item.seriesName.includes('Suhu')) {
            unit = '°C';
            val = typeof item.value === 'number' ? item.value.toFixed(1) : item.value;
          } else if (item.seriesName.includes('pH')) {
            unit = ' pH';
            val = typeof item.value === 'number' ? item.value.toFixed(2) : item.value;
          } else {
            unit = '%';
            val = typeof item.value === 'number' ? item.value.toFixed(1) : item.value;
          }
          res += `<div class="flex items-center justify-between gap-4 text-xs py-0.5">
            <span class="flex items-center gap-1.5 text-slate-300">${item.marker} ${item.seriesName}</span>
            <span class="font-bold text-white">${val}${unit}</span>
          </div>`;
        });
        return res;
      },
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#1F2937',
          width: 1.5,
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        fontFamily: 'inherit',
        margin: 12,
        hideOverlap: true,
        interval: (index: number) => {
          // Display evenly spaced interval markers across 24h: 00.00, 03.00, 06.00, 09.00, 12.00, 15.00, 18.00, 21.00, 23.00
          return index % 3 === 0 || index === 23;
        },
      },
    },
    yAxis: [
      {
        type: 'value',
        min: 15,
        max: 50,
        interval: 10,
        splitLine: {
          show: false,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#1F2937',
            width: 1.5,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
      },
      {
        type: 'value',
        min: 4,
        max: 10,
        splitLine: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: 'Kelembapan tanah',
        type: 'line',
        yAxisIndex: 0,
        data: moistureData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#2563EB',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
        },
        lineStyle: {
          color: '#2563EB',
          width: 2.2,
        },
        markLine: {
          symbol: 'none',
          silent: true,
          data: [
            {
              yAxis: 25,
              lineStyle: {
                color: '#94A3B8',
                type: 'dashed',
                width: 1.2,
              },
              label: {
                formatter: '25%',
                position: 'end',
                color: '#64748B',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'inherit',
              },
            },
          ],
        },
      },
      {
        name: 'Suhu Tanah',
        type: 'line',
        yAxisIndex: 0,
        data: tempData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#C25E26',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
        },
        lineStyle: {
          color: '#C25E26',
          width: 2.2,
        },
      },
      {
        name: 'pH Tanah',
        type: 'line',
        yAxisIndex: 1,
        data: phData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#8B5CF6',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
        },
        lineStyle: {
          color: '#8B5CF6',
          width: 2.2,
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
      {/* Title & Custom Legend Matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Tren 24 Jam (Forecast)
        </h4>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#2563EB' }} />
            <span>Kelembapan tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#C25E26' }} />
            <span>Suhu Tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#8B5CF6' }} />
            <span>pH Tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
            <span>Ambang Kritis</span>
          </div>
        </div>
      </div>

      {/* ECharts Chart Container */}
      <div className="w-full h-52 sm:h-64">
        {isClient ? (
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-2xl">
            <span className="text-xs text-slate-400">Memuat ECharts...</span>
          </div>
        )}
      </div>
    </div>
  );
};
