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

// Helper untuk mendapatkan jam sekarang dalam zona waktu WIB (Asia/Jakarta, UTC+7)
// secara konsisten baik di Server SSR (UTC) maupun Browser Client
function getWibCurrentHour(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
    const hourStr = formatter.format(new Date());
    const hour = parseInt(hourStr, 10);
    return isNaN(hour) ? 16 : Math.min(23, Math.max(0, hour % 24));
  } catch {
    const now = new Date();
    const utcHours = now.getUTCHours();
    return (utcHours + 7) % 24;
  }
}

interface Trend24hChartProps {
  data: ForecastPoint[];
}

export const Trend24hChart: React.FC<Trend24hChartProps> = ({ data }) => {
  const [isClient, setIsClient] = useState(false);
  const [currentHourIndex, setCurrentHourIndex] = useState<number>(() => getWibCurrentHour());

  useEffect(() => {
    setIsClient(true);
    setCurrentHourIndex(getWibCurrentHour());

    const timer = setInterval(() => {
      setCurrentHourIndex(getWibCurrentHour());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const currentHourStr = `${String(currentHourIndex).padStart(2, '0')}.00`;

  const xCategories = data.map((d) => d.time);
  const moistureData = data.map((d) => d.moisture);
  const tempData = data.map((d) => d.temperature);

  // ECharts Configuration Styled Exactly as User Mockup
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: 10,
      right: 10,
      top: 34,
      bottom: 8,
      containLabel: true,
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
        const isNow = timeLabel === currentHourStr;
        let res = `<div class="font-bold text-xs text-emerald-400 mb-1 flex items-center justify-between gap-3">
          <span>Pukul ${timeLabel} WIB</span>
          ${isNow ? '<span class="text-emerald-300 text-3xs font-semibold">(Sekarang)</span>' : ''}
        </div>`;
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
        show: true,
        interval: 0,
        lineStyle: {
          color: '#CBD5E1',
          width: 1,
        },
      },
      axisLabel: {
        color: (val: string) => (val === currentHourStr ? '#1B6633' : '#475569'),
        fontWeight: (val: string) => (val === currentHourStr ? 'bold' : 'normal'),
        fontSize: 11,
        fontFamily: 'inherit',
        margin: 12,
        formatter: (val: string, index: number) => {
          // Selalu tampilkan jam nyata sekarang (posisi live sensor)
          if (val === currentHourStr) {
            return val;
          }
          // Tampilkan penanda jam berkala setiap 3 jam (00, 03, 06, 09, 12, 15, 18, 21, 23)
          if (index % 3 === 0 || index === 23) {
            // Sembunyikan jika berjarak hanya 1 jam dari currentHour agar teks tidak bertabrakan
            if (Math.abs(index - currentHourIndex) <= 1) {
              return '';
            }
            return val;
          }
          return '';
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: [
      {
        name: 'Kelembapan (%)',
        nameTextStyle: {
          color: '#2563EB',
          fontSize: 10,
          fontWeight: 700,
          padding: [0, 0, 4, 0],
        },
        type: 'value',
        position: 'left',
        min: 10,
        max: 50,
        interval: 10,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#2563EB',
            width: 1.5,
          },
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#2563EB',
          },
        },
        axisLabel: {
          show: true,
          formatter: '{value}%',
          color: '#2563EB',
          fontSize: 10,
          fontWeight: 600,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#F1F5F9',
            type: 'dashed',
            width: 1,
          },
        },
      },
      {
        name: 'Suhu (°C)',
        nameTextStyle: {
          color: '#C25E26',
          fontSize: 10,
          fontWeight: 700,
          padding: [0, 0, 4, 0],
        },
        type: 'value',
        position: 'right',
        min: 20,
        max: 40,
        interval: 5,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#C25E26',
            width: 1.5,
          },
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#C25E26',
          },
        },
        axisLabel: {
          show: true,
          formatter: '{value}°C',
          color: '#C25E26',
          fontSize: 10,
          fontWeight: 600,
        },
        splitLine: {
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
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: (value: number, params: { dataIndex: number }) => {
          return params.dataIndex === currentHourIndex ? 9 : 5;
        },
        itemStyle: {
          color: '#2563EB',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
          shadowBlur: 3,
          shadowColor: 'rgba(37, 99, 235, 0.3)',
        },
        lineStyle: {
          color: '#2563EB',
          width: 2.2,
        },
        emphasis: {
          scale: 1.4,
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 2,
            shadowBlur: 6,
            shadowColor: '#2563EB',
          },
        },
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          data: [
            {
              yAxis: 25,
              lineStyle: {
                color: '#94A3B8',
                type: 'dashed',
                width: 1.5,
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
        yAxisIndex: 1,
        data: tempData,
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: (value: number, params: { dataIndex: number }) => {
          return params.dataIndex === currentHourIndex ? 9 : 5;
        },
        itemStyle: {
          color: '#C25E26',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
          shadowBlur: 3,
          shadowColor: 'rgba(194, 94, 38, 0.3)',
        },
        lineStyle: {
          color: '#C25E26',
          width: 2.2,
        },
        emphasis: {
          scale: 1.4,
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 2,
            shadowBlur: 6,
            shadowColor: '#C25E26',
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
      {/* Title & Custom Legend Matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Tren 24 Jam (Forecast)
          </h4>
        </div>

        {/* Legend with explicit Dual-Axis and Threshold variable indicators */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4.5 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full inline-block bg-[#2563EB]" />
            <span className="text-slate-800 font-semibold">Kelembapan tanah <span className="text-[#2563EB] text-2xs">(Sumbu Kiri, %)</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full inline-block bg-[#C25E26]" />
            <span className="text-slate-800 font-semibold">Suhu Tanah <span className="text-[#C25E26] text-2xs">(Sumbu Kanan, °C)</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-600 font-semibold text-2xs sm:text-xs">Ambang Kritis (25%)</span>
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
