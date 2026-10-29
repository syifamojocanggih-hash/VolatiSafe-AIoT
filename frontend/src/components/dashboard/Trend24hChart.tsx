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

  // ECharts Configuration Styled Exactly as User Mockup
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: 36,
      right: 48,
      top: 24,
      bottom: 28,
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
          const unit = item.seriesName.includes('Suhu') ? '°C' : '%';
          const val = typeof item.value === 'number' ? item.value.toFixed(1) : item.value;
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
        formatter: (val: string) => {
          if (val === '00.00' || val === '08.00' || val === '16.00' || val === '23.00') {
            return val;
          }
          return '';
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      min: 10,
      max: 48,
      show: false,
      splitLine: {
        show: false,
      },
    },
    series: [
      {
        name: 'Kelembapan tanah',
        type: 'line',
        data: moistureData,
        smooth: true,
        symbol: (value: number, params: { dataIndex: number }) => {
          return params.dataIndex === 8 ? 'circle' : 'none';
        },
        symbolSize: 7,
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
          silent: true,
          symbol: 'none',
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
                fontSize: 11,
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
        data: tempData,
        smooth: true,
        symbol: (value: number, params: { dataIndex: number }) => {
          return params.dataIndex === 8 ? 'circle' : 'none';
        },
        symbolSize: 7,
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
            <span className="w-3.5 h-1 rounded-full inline-block bg-[#2563EB]" />
            <span>Kelembapan tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full inline-block bg-[#C25E26]" />
            <span>Suhu Tanah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
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
