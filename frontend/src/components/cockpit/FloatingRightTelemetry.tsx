'use client';

import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  Activity,
  Sun,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  FileText,
} from 'lucide-react';
import { BedengParcel } from '@/types/parcel';

export interface ForecastPoint {
  hour: number;
  label: string;
  avri: number;
  temp: number;
  moisture: number;
  status: string;
  isSafe: boolean;
}

interface FloatingRightTelemetryProps {
  parcel: BedengParcel;
  isSimulatedCritical: boolean;
  onOpenSpkModal?: () => void;
  onTimelinePointSelect?: (point: ForecastPoint) => void;
}

// Proyeksi data 72 jam terstruktur (dibagi per blok 3 jam)
export const forecast72hTimeline: ForecastPoint[] = [
  { hour: 0, label: 'Hari Ini 12:00', avri: 74, temp: 34.1, moisture: 22.4, status: 'kritis', isSafe: false },
  { hour: 3, label: 'Hari Ini 15:00', avri: 68, temp: 33.0, moisture: 22.0, status: 'waspada', isSafe: false },
  { hour: 6, label: 'Hari Ini 18:00', avri: 46, temp: 28.5, moisture: 22.8, status: 'waspada', isSafe: false },
  { hour: 12, label: 'Malam 00:00', avri: 28, temp: 25.1, moisture: 24.2, status: 'aman', isSafe: false },
  { hour: 18, label: 'Besok 06:00', avri: 18, temp: 24.8, moisture: 26.5, status: 'aman', isSafe: true },
  { hour: 21, label: 'Besok 09:00', avri: 22, temp: 26.4, moisture: 25.8, status: 'aman', isSafe: true },
  { hour: 24, label: 'Besok 12:00', avri: 72, temp: 33.8, moisture: 21.9, status: 'kritis', isSafe: false },
  { hour: 36, label: 'Malam H+1', avri: 32, temp: 25.4, moisture: 23.5, status: 'waspada', isSafe: false },
  { hour: 42, label: 'Lusa 06:00', avri: 20, temp: 25.0, moisture: 25.2, status: 'aman', isSafe: true },
  { hour: 48, label: 'Lusa 12:00', avri: 70, temp: 33.5, moisture: 21.2, status: 'kritis', isSafe: false },
  { hour: 72, label: 'H+3 12:00', avri: 65, temp: 32.8, moisture: 20.8, status: 'waspada', isSafe: false },
];

export const FloatingRightTelemetry: React.FC<FloatingRightTelemetryProps> = ({
  parcel,
  isSimulatedCritical,
  onOpenSpkModal,
  onTimelinePointSelect,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'shap' | 'timeline'>('telemetry');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);

  // Auto-play loop for 72h time-lapse
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedHourIndex((prev) => {
        const next = prev >= forecast72hTimeline.length - 1 ? 0 : prev + 1;
        if (onTimelinePointSelect) {
          onTimelinePointSelect(forecast72hTimeline[next]);
        }
        return next;
      });
    }, 1400 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, onTimelinePointSelect]);

  const handleSliderChange = (idx: number) => {
    setSelectedHourIndex(idx);
    if (onTimelinePointSelect) {
      onTimelinePointSelect(forecast72hTimeline[idx]);
    }
  };

  const currentTimePoint = forecast72hTimeline[selectedHourIndex];

  // Gunakan data scrubbed saat di tab timeline, atau data live saat di tab telemetry
  const activeAvri =
    activeTab === 'timeline'
      ? currentTimePoint.avri
      : isSimulatedCritical
      ? 74
      : parcel.avriScore;

  const isCritical = activeAvri >= 70;
  const isWarning = activeAvri >= 30 && activeAvri < 70;

  // Nilai radial gauge stroke-dasharray (keliling = 2 * PI * 40 ≈ 251.2)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeAvri / 100) * (circumference * 0.75);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-800 group pointer-events-auto select-none"
        title="Buka Panel Telemetri Biofisika & AI"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-2xs font-bold border border-emerald-200">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>PIML</span>
        </div>
        <span>Telemetri AI</span>
        <span
          className={`px-2 py-0.5 rounded-full text-2xs font-black ${
            isCritical ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
          }`}
        >
          {activeAvri}%
        </span>
      </button>
    );
  }

  return (
    <div className="w-76 sm:w-80 lg:w-84 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-3.5 text-slate-800 space-y-3 select-none pointer-events-auto max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-right-4 duration-200">
      {/* 1. Header Panel & Navigation Tabs */}
      <div className="border-b border-slate-100 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Telemetri Biofisika & AI</h3>
            <span className="text-[10px] text-slate-500">Persil: {parcel.name} · Solokuro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-2xs font-bold border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>PIML v1.2</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Perkecil Panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Switcher (Gaya Gambar 2: Pill Navigation) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'telemetry'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Biofisika
          </button>
          <button
            onClick={() => setActiveTab('shap')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'shap'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            TreeSHAP
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>72 Jam</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </div>

      {/* 2. Hero Radial Gauge (Inspirasi Circular Gauge 98% Gambar 2) */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Ammonia Volatilization Risk</span>
            {activeTab === 'timeline' && (
              <span className="text-indigo-600 font-mono font-bold">({currentTimePoint.label})</span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-black ${
                isCritical ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-emerald-600'
              }`}
            >
              {activeAvri}%
            </span>
            <span
              className={`text-2xs font-bold uppercase px-2 py-0.5 rounded-md ${
                isCritical
                  ? 'bg-red-100 text-red-700'
                  : isWarning
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isCritical ? 'Risiko Kritis' : isWarning ? 'Waspada' : 'Zona Aman'}
            </span>
          </div>
          <p className="text-2xs text-slate-500 leading-tight">
            {isCritical
              ? 'Kehilangan nitrogen diproyeksikan 40–50%. Tunda penaburan.'
              : isWarning
              ? 'Gunakan teknik benam/tugal 4 cm untuk mitigasi penguapan.'
              : 'Kondisi mikroklimat tanah optimal untuk kelarutan urea.'}
          </p>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
            {/* Dynamic Value Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <Activity
              className={`w-4 h-4 ${
                isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'
              }`}
            />
            <span className="text-[10px] font-bold text-slate-700">AVRI</span>
          </div>
        </div>
      </div>

      {/* 3. KONTEN TAB 1: BIOFISIKA TANAH & BMKG */}
      {activeTab === 'telemetry' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Grid 4 Metrik Biofisika Tanah */}
          <div className="grid grid-cols-2 gap-2">
            {/* Suhu Tanah */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-red-500" />
                  Suhu Tanah
                </span>
                <span className="text-[9px] font-bold text-red-500">+1.8°C</span>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">
                {parcel.soilTempC.toFixed(1)}°C
              </div>
              <span className="text-[9px] text-slate-400">Kedalaman 5–10 cm</span>
            </div>

            {/* Kelembaban Tanah */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  Kelembaban
                </span>
                <span className="text-[9px] font-bold text-amber-500">-3.2%</span>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">
                {parcel.moisturePct.toFixed(1)}%
              </div>
              <span className="text-[9px] text-slate-400">FC 36.5% · WP 14.2%</span>
            </div>

            {/* pH Tanah */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-purple-500" />
                  pH Tanah
                </span>
                <span className="text-[9px] font-bold text-slate-600">Alkalin</span>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">
                {parcel.ph.toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-400">Solokuro Karst</span>
            </div>

            {/* Laju Urease */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Laju Urease
                </span>
                <span className="text-[9px] font-bold text-red-500">Arrhenius</span>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">
                0.42 <span className="text-xs font-normal text-slate-500">/ jam</span>
              </div>
              <span className="text-[9px] text-slate-400">Hidrolisis Cepat</span>
            </div>
          </div>

          {/* Mikroklimat Agroklimat BMKG & VPD */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-2xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Mikroklimat BMKG & VPD Atmosfer
              </span>
              <span className="text-[9px] text-emerald-600">Live Provenance</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center text-2xs">
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-400 block">Suhu</span>
                <b className="text-slate-800">31.0°C</b>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-400 block">RH</span>
                <b className="text-slate-800">62%</b>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-400 block">Angin</span>
                <b className="text-slate-800">2.1 m/s</b>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-400 block">VPD</span>
                <b className="text-amber-600">1.68 kPa</b>
              </div>
            </div>
          </div>

          {/* LoRa Telemetry Terminal Status */}
          <div className="p-2.5 rounded-xl bg-slate-900 text-white text-2xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                LoRa SX1278 Diagnostic
              </span>
              <span className="text-emerald-400 font-bold">ACK OK</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5 text-[10px]">
              <div>RSSI: <span className="text-emerald-300 font-bold">{parcel.loraSignalDbm} dBm</span></div>
              <div>SNR: <span className="text-emerald-300 font-bold">+9.5 dB</span></div>
              <div>Baterai: <span className="text-emerald-300 font-bold">{parcel.batteryV}V ({parcel.batteryPct}%)</span></div>
              <div>Deep Sleep: <span className="text-slate-300">15 Menit</span></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. KONTEN TAB 2: TREESHAP AI EXPLAINABILITY (Inspirasi Bar Chart Gambar 2) */}
      {activeTab === 'shap' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">TreeSHAP Feature Attribution</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold">
                TOP RISK DRIVERS
              </span>
            </div>
            <p className="text-2xs text-slate-500">
              Kontribusi persentase faktor lingkungan lokal terhadap lonjakan risiko volatilisasi amonia hari ini:
            </p>

            {/* Bar List (Gaya Bar Kapsul Gambar 2) */}
            <div className="space-y-2 pt-1">
              {/* 1. Suhu Tanah (TOP) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-bold">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Thermometer className="w-3 h-3 text-red-500" />
                    Suhu Tanah Tinggi (34.1°C)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-black uppercase">
                      TOP
                    </span>
                    <span className="text-red-600 font-mono">+38.5%</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full w-[85%] transition-all" />
                </div>
              </div>

              {/* 2. Kelembaban Kering */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-bold">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Droplets className="w-3 h-3 text-amber-500" />
                    Kelembaban Kering (22.4%)
                  </span>
                  <span className="text-amber-600 font-mono">+26.0%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full w-[65%] transition-all" />
                </div>
              </div>

              {/* 3. pH Alkalin */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-bold">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Activity className="w-3 h-3 text-purple-500" />
                    pH Tanah Kapur (7.83)
                  </span>
                  <span className="text-purple-600 font-mono">+9.7%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-[35%] transition-all" />
                </div>
              </div>

              {/* 4. Radiasi Surya */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-bold">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Sun className="w-3 h-3 text-emerald-500" />
                    Radiasi Surya (2.8 MJ)
                  </span>
                  <span className="text-emerald-600 font-mono">+5.2%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full w-[20%] transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-2xs text-emerald-800 space-y-1">
            <b className="font-bold block">Kesimpulan Logika Fisika (Explainable AI):</b>
            <p>
              Tingginya suhu tanah 34.1°C melipatgandakan konstanta reaksi urease (k = 0.42 / jam),
              sementara tanah yang kering menghambat urea larut ke bawah. Akibatnya gas amonia (NH3) lepas ke udara.
            </p>
          </div>
        </div>
      )}

      {/* 5. KONTEN TAB 3: 72-HOUR TIMELINE SCRUBBER (Inspirasi Curve Gambar 2) */}
      {activeTab === 'timeline' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white to-emerald-50/30 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Scrubber Prediksi 72 Jam</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Jendela Terbaik: H+18
              </span>
            </div>

            {/* SVG Spline Trend Curve Dinamis dengan Titik Penunjuk */}
            <div className="relative h-24 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveFillTimeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area Fill */}
                <path
                  d="M 0 45 C 30 50, 60 15, 90 12 C 120 10, 150 48, 180 40 L 200 35 L 200 60 L 0 60 Z"
                  fill="url(#curveFillTimeline)"
                />
                {/* Line Stroke */}
                <path
                  d="M 0 45 C 30 50, 60 15, 90 12 C 120 10, 150 48, 180 40 L 200 35"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Titik Penunjuk Sesuai Scrubbed Index */}
                {(() => {
                  const xPos = (selectedHourIndex / (forecast72hTimeline.length - 1)) * 200;
                  const yPos = 60 - (currentTimePoint.avri / 100) * 45;
                  return (
                    <g>
                      <circle cx={xPos} cy={yPos} r="5.5" fill="#10B981" className="animate-ping" />
                      <circle cx={xPos} cy={yPos} r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
                    </g>
                  );
                })()}
              </svg>

              {/* Floating Pill on Selected Point */}
              <div
                className="absolute -top-1 transition-all duration-150 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1"
                style={{
                  left: `${(selectedHourIndex / (forecast72hTimeline.length - 1)) * 100}%`,
                }}
              >
                {currentTimePoint.isSafe ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                )}
                <span>AVRI {currentTimePoint.avri}%</span>
              </div>
            </div>

            {/* Slider Range Controller & Automated Player */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-2xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-emerald-600" />
                  Waktu: <b className="text-slate-900">{currentTimePoint.label}</b>
                </span>
                <span className="font-mono text-emerald-700">+{currentTimePoint.hour} Jam</span>
              </div>

              {/* Range Input Slider */}
              <input
                type="range"
                min="0"
                max={forecast72hTimeline.length - 1}
                value={selectedHourIndex}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Sekarang (0h)</span>
                <span className="text-emerald-700 font-bold">Besok 06:00 (H+18)</span>
                <span>H+72</span>
              </div>

              {/* Time-lapse Play/Pause Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-bold transition-all shadow-xs ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? 'Jeda Simulasi' : '▶ Putar 72h Time-Lapse'}</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">
                  <button
                    onClick={() => setPlaybackSpeed(1)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      playbackSpeed === 1 ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setPlaybackSpeed(2)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      playbackSpeed === 2 ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    2x
                  </button>
                </div>
              </div>
            </div>

            {/* Preskripsi Hasil Scrubbing */}
            <div
              className={`p-2.5 rounded-xl border text-2xs ${
                currentTimePoint.isSafe
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <b>Rekomendasi Waktu Terpilih:</b>
              <p className="mt-0.5">
                {currentTimePoint.isSafe
                  ? '✓ JENDELA SANGAT AMAN! Suhu tanah turun ke 24.8°C dan kelembaban naik ke 26.5%. Waktu penaburan terbaik.'
                  : '⚠️ HINDARI JAM INI! Suhu tanah terik menyebabkan lonjakan volatilisasi amonia.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action: Cetak Surat Perintah Kerja (SPK) */}
      {onOpenSpkModal && (
        <button
          onClick={onOpenSpkModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-900/20"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cetak Surat Perintah Kerja (SPK)</span>
        </button>
      )}

      {/* Footer Quick Action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
        <span>Model: LightGBM Regressor (MAE 2.8%)</span>
        <button
          onClick={() => setActiveTab(activeTab === 'timeline' ? 'telemetry' : 'timeline')}
          className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
        >
          <span>{activeTab === 'timeline' ? 'Lihat Sensor' : 'Simulasi 72h'}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default FloatingRightTelemetry;
