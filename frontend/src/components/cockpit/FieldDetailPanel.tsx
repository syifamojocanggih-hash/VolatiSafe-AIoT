/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faClockRotateLeft,
  faFileLines,
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep,
  faTemperatureHalf,
  faDroplet,
  faFlask,
  faBolt,
  faSun,
  faWind,
  faArrowsRotate,
  faChevronDown,
  faChevronUp,
  faTowerBroadcast,
  faBatteryFull,
  faCircleCheck,
  faTriangleExclamation,
  faCalendarDay,
} from '@fortawesome/free-solid-svg-icons';
import { BedengParcel } from '@/types/parcel';
import { DigitalTwin15Telemetry, getDigitalTwin72hForecast } from '@/services/api';

export interface DetailedForecastPoint {
  hour: number;
  timestamp: string;
  dayIndex: number;
  dayLabel: string;
  timeLabel: string;
  fullLabel: string;
  avri: number;
  status: 'aman' | 'waspada' | 'kritis' | 'bahaya';
  isSafe: boolean;
  soilTemp: number;
  airTemp: number;
  moisture: number;
  rh: number;
  windSpeed: number;
  solarRad: number;
  ureaseRate: number;
  nitrogenLossEst: number;
  recommendation: string;
}

// Interface kompatibel untuk integrasi Leaflet Map
export interface ForecastPoint {
  hour: number;
  label: string;
  avri: number;
  temp: number;
  moisture: number;
  status: string;
  isSafe: boolean;
}

// Generator 72 jam kontinu berbasis pemodelan biofisika diurnal Lamongan (FAO-56 + Arrhenius)
const generateContinuous72hData = (
  baseTemp: number = 26.4,
  baseMoist: number = 28.4,
  basePh: number = 7.85
): DetailedForecastPoint[] => {
  const points: DetailedForecastPoint[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  for (let h = 0; h < 72; h++) {
    const ptDate = new Date(now.getTime() + h * 3600 * 1000);
    const hourLocal = ptDate.getHours();
    const dayOffset = Math.floor((currentHour + h) / 24);

    const dayName =
      dayOffset === 0
        ? 'Hari Ini'
        : dayOffset === 1
        ? 'Besok'
        : dayOffset === 2
        ? 'Lusa'
        : `H+${dayOffset}`;

    const dateStr = ptDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = `${String(hourLocal).padStart(2, '0')}:00`;

    // Pola diurnal radiasi & suhu udara Lamongan
    const isDay = hourLocal >= 6 && hourLocal <= 18;
    const solarFactor = isDay ? Math.sin((Math.PI * (hourLocal - 6)) / 12) : 0;
    const solarRad = Number(Math.max(0, solarFactor * 3.4).toFixed(2));
    const airTemp = Number((24.2 + solarFactor * 10.2).toFixed(1));
    const rh = Number(Math.max(45, Math.min(95, 88 - solarFactor * 40)).toFixed(0));
    const windSpeed = Number((1.2 + solarFactor * 1.6).toFixed(1));

    // Suhu tanah teredam dengan jeda fase 1.5 jam dari radiasi puncak
    const soilTempFactor = isDay ? Math.sin((Math.PI * Math.max(0, hourLocal - 7)) / 12) : 0;
    const soilTemp = Number((baseTemp - 1.2 + soilTempFactor * 8.8).toFixed(1));

    // Kadar air tanah terdeplesi bertahap akibat evapotranspirasi
    const etDepletion = (h * 0.08) % 6;
    const moisture = Number(Math.max(16, baseMoist - etDepletion).toFixed(1));

    // Kinetika dekomposisi enzim urease Arrhenius
    const ureaseRate = Number((0.08 * Math.exp(0.065 * (soilTemp - 24))).toFixed(2));

    // Estimasi skor AVRI proxy komprehensif (Suhu + Kekeringan + pH)
    const tempImpact = Math.max(0, (soilTemp - 22) * 2.8);
    const moistImpact = Math.max(0, (36.5 - moisture) * 1.4);
    const phImpact = Math.max(0, (basePh - 7.0) * 12);
    const rawAvri = Math.round(Math.min(95, Math.max(8, tempImpact + moistImpact + phImpact)));

    const status: 'aman' | 'waspada' | 'kritis' | 'bahaya' =
      rawAvri >= 70 ? 'kritis' : rawAvri >= 30 ? 'waspada' : 'aman';
    const isSafe = status === 'aman';

    const nitrogenLossEst = Math.round(rawAvri * 0.52);

    let recommendation = '';
    if (status === 'aman') {
      recommendation =
        'Jendela aman optimal. Suhu tanah sejuk, kelembaban ideal untuk pelarutan urea tanpa penguapan amonia berlebih.';
    } else if (status === 'waspada') {
      recommendation =
        'Kondisi transisi. Gunakan teknik tugal/benam 4–5 cm di samping perakaran. Hindari penaburan permukaan.';
    } else {
      recommendation =
        'Tunda pemupukan! Terik siang hari dan suhu tanah tinggi memicu hidrolisis cepat. Kehilangan pupuk ke udara tinggi.';
    }

    points.push({
      hour: h,
      timestamp: ptDate.toISOString(),
      dayIndex: dayOffset,
      dayLabel: dayName,
      timeLabel: timeStr,
      fullLabel: `${dayName} (${dateStr}), ${timeStr} WIB`,
      avri: rawAvri,
      status,
      isSafe,
      soilTemp,
      airTemp,
      moisture,
      rh,
      windSpeed,
      solarRad,
      ureaseRate,
      nitrogenLossEst,
      recommendation,
    });
  }

  return points;
};

// Helper round
function round(val: number, dec: number = 1) {
  return Number(val.toFixed(dec));
}

interface FieldDetailPanelProps {
  parcel: BedengParcel;
  isSimulatedCritical: boolean;
  onOpenSpkModal?: () => void;
  onTimelinePointSelect?: (point: ForecastPoint) => void;
  dtTelemetry?: DigitalTwin15Telemetry | null;
}

export const FieldDetailPanel: React.FC<FieldDetailPanelProps> = ({
  parcel,
  isSimulatedCritical,
  onOpenSpkModal,
  onTimelinePointSelect,
  dtTelemetry,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'shap' | '72h'>('summary');
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number>(0);

  // Generate continuous 72 hours data based on actual parcel metrics
  const full72hTimeline = useMemo(() => {
    return generateContinuous72hData(
      parcel.soilTempC || 26.4,
      parcel.moisturePct || 28.4,
      parcel.ph || 7.85
    );
  }, [parcel.soilTempC, parcel.moisturePct, parcel.ph]);

  // Load real 72h BMKG forecast from backend if available
  const [timelinePoints, setTimelinePoints] = useState<DetailedForecastPoint[]>(full72hTimeline);
  const [safeWindowInfo, setSafeWindowInfo] = useState<{ label: string; avri: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadForecast = async () => {
      try {
        const res = await getDigitalTwin72hForecast(parcel.id || 'BLOK-A');
        if (res && mounted) {
          if (res.hourly_timeline && res.hourly_timeline.length >= 72) {
            const mapped: DetailedForecastPoint[] = res.hourly_timeline.map((item: any, idx: number) => {
              const dt = new Date(item.timestamp_utc);
              const dayOffset = Math.floor(idx / 24);
              const dayName =
                dayOffset === 0
                  ? 'Hari Ini'
                  : dayOffset === 1
                  ? 'Besok'
                  : dayOffset === 2
                  ? 'Lusa'
                  : `H+${dayOffset}`;
              const dateStr = dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
              const timeStr = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

              const avri = Math.round(item.avri_score);
              const cat = item.risk_category || (avri >= 70 ? 'kritis' : avri >= 30 ? 'waspada' : 'aman');

              return {
                hour: idx,
                timestamp: item.timestamp_utc,
                dayIndex: dayOffset,
                dayLabel: dayName,
                timeLabel: timeStr,
                fullLabel: `${dayName} (${dateStr}), ${timeStr} WIB`,
                avri,
                status: cat,
                isSafe: cat === 'aman',
                soilTemp: round(item.projected_soil_temp_c, 1),
                airTemp: round(item.temp_air_c || 28.0, 1),
                moisture: round(item.projected_theta_pct, 1),
                rh: 75,
                windSpeed: 2.0,
                solarRad: 2.1,
                ureaseRate: round(item.k_urease_rate_hr || 0.2, 2),
                nitrogenLossEst: Math.round(avri * 0.52),
                recommendation:
                  cat === 'aman'
                    ? 'Kondisi mikroklimat tanah optimal untuk pemupukan. Kehilangan gas amonia minimal.'
                    : cat === 'waspada'
                    ? 'Waspada penguapan. Tugal pupuk sedalam 4–5 cm di samping perakaran.'
                    : 'Tunda penaburan urea. Suhu terik memicu dekomposisi cepat dan kehilangan nitrogen tinggi.',
              };
            });
            setTimelinePoints(mapped);
          }

          if (res.next_safe_window) {
            const startDt = new Date(res.next_safe_window.start_time);
            const endDt = new Date(res.next_safe_window.end_time);
            const dateStr = startDt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
            const startH = startDt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const endH = endDt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setSafeWindowInfo({
              label: `${dateStr}, ${startH} – ${endH} WIB`,
              avri: Math.round(res.next_safe_window.projected_avri),
            });
          }
        }
      } catch {
        // Fallback to local continuous generator
      }
    };
    loadForecast();
    return () => {
      mounted = false;
    };
  }, [parcel.id, full72hTimeline]);

  // Current active time point
  const currentPoint = timelinePoints[selectedHour] || timelinePoints[0];

  // Sync to spatial map when user scrubs or time-lapse plays
  const triggerMapSync = useCallback(
    (pt: DetailedForecastPoint) => {
      if (onTimelinePointSelect) {
        onTimelinePointSelect({
          hour: pt.hour,
          label: pt.fullLabel,
          avri: pt.avri,
          temp: pt.soilTemp,
          moisture: pt.moisture,
          status: pt.status,
          isSafe: pt.isSafe,
        });
      }
    },
    [onTimelinePointSelect]
  );

  // Time-lapse loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedHour((prev) => {
        const next = prev >= timelinePoints.length - 1 ? 0 : prev + 1;
        triggerMapSync(timelinePoints[next]);
        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timelinePoints, triggerMapSync]);

  // Handle custom time scrubber change
  const handleSelectHour = (h: number) => {
    const clamped = Math.max(0, Math.min(timelinePoints.length - 1, h));
    setSelectedHour(clamped);
    setSelectedDayFilter(Math.floor(clamped / 24));
    triggerMapSync(timelinePoints[clamped]);
  };

  // Active AVRI for hero display
  const activeAvri =
    activeTab === '72h'
      ? currentPoint.avri
      : isSimulatedCritical
      ? 74
      : parcel.avriScore;

  const isCritical = activeAvri >= 70;
  const isWarning = activeAvri >= 30 && activeAvri < 70;

  const statusLabel = isCritical ? 'Kritis' : isWarning ? 'Waspada' : 'Aman';
  const statusBadgeClass = isCritical
    ? 'text-rose-700 bg-rose-50 border-rose-300'
    : isWarning
    ? 'text-amber-700 bg-amber-50 border-amber-300'
    : 'text-emerald-700 bg-emerald-50 border-emerald-300';

  // Live telemetry fallbacks
  const soilTemp = dtTelemetry?.soil_biophysics_dynamic.soil_temp_c ?? parcel.soilTempC;
  const moisture = dtTelemetry?.soil_biophysics_dynamic.moisture_pct ?? parcel.moisturePct;
  const phVal = dtTelemetry?.soil_biophysics_dynamic.ph ?? parcel.ph;
  const ureaseRate = dtTelemetry?.crop_and_kinetics.k_urease_rate_hr ?? 0.42;

  // TreeSHAP factor contributions
  const shapFactors = [
    { name: 'Suhu Tanah', value: `${soilTemp.toFixed(1)}°C`, impact: 38.5 },
    { name: 'Kadar Air Tanah', value: `${moisture.toFixed(1)}%`, impact: 26.0 },
    { name: 'pH Tanah', value: `${phVal.toFixed(2)}`, impact: 9.7 },
    { name: 'Radiasi Surya', value: '2.8 MJ/m²', impact: 5.2 },
  ];

  // SVG Chart path calculation for 72 points
  const chartWidth = 300;
  const chartHeight = 70;
  const chartPointsSvg = useMemo(() => {
    if (!timelinePoints || timelinePoints.length === 0) return '';
    const total = timelinePoints.length;
    return timelinePoints
      .map((pt, idx) => {
        const x = (idx / (total - 1)) * chartWidth;
        const y = chartHeight - (pt.avri / 100) * (chartHeight - 10) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [timelinePoints]);

  const activeCursorX = useMemo(() => {
    if (!timelinePoints || timelinePoints.length === 0) return 0;
    return (selectedHour / (timelinePoints.length - 1)) * chartWidth;
  }, [selectedHour, timelinePoints]);

  const activeCursorY = useMemo(() => {
    return chartHeight - (currentPoint.avri / 100) * (chartHeight - 10) - 5;
  }, [currentPoint.avri]);

  return (
    <div className="w-full h-full flex flex-col shrink-0 select-none text-slate-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 cockpit-scrollbar">
        {/* 1. Nama Petak & Status */}
        <div className="flex items-start justify-between gap-2 pr-8">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                BLOK {parcel.id}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {parcel.cropVariety} · {parcel.areaHa} ha
              </span>
            </div>
            <h2 className="text-sm font-bold text-[#172B3A] leading-tight">
              {parcel.name}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Solokuro, Lamongan
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${statusBadgeClass} shrink-0 shadow-xs`}
          >
            <FontAwesomeIcon
              icon={isCritical ? faTriangleExclamation : isWarning ? faTriangleExclamation : faCircleCheck}
              className="text-[10px]"
            />
            <span>{statusLabel}</span>
          </span>
        </div>

        {/* 2. Kartu Indeks Risiko (AVRI) Dynamic Cyberpunk Glass HUD */}
        <div
          className={`p-4 rounded-3xl border transition-all duration-300 space-y-3 ${
            isCritical
              ? 'bg-rose-50 border-rose-200 shadow-sm'
              : isWarning
              ? 'bg-amber-50 border-amber-200 shadow-sm'
              : 'bg-emerald-50 border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-200">
                <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
              </span>
              <span>Indeks Risiko Volatilisasi</span>
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${statusBadgeClass}`}
            >
              {statusLabel.toUpperCase()}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#172B3A] tracking-tight leading-none font-mono">
                {activeAvri}%
              </span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">AVRI Score</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Ambang Kritis: <span className="text-rose-600 font-bold">≥70%</span>
            </span>
          </div>

          {/* Bar Risiko Segmented & Glowing */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden ring-1 ring-slate-200 relative">
              <div
                className={`h-full transition-all duration-300 rounded-full bg-gradient-to-r ${
                  isCritical
                    ? 'from-amber-400 via-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : isWarning
                    ? 'from-emerald-400 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, activeAvri))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono font-bold">
              <span className="text-emerald-700">0% Aman</span>
              <span className="text-amber-700">30% Waspada</span>
              <span className="text-rose-700">70% Kritis</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/90 text-xs text-slate-700 leading-relaxed">
            {activeTab === '72h'
              ? currentPoint.recommendation
              : isCritical
              ? 'Tunda penaburan urea. Potensi penguapan amonia tinggi akibat suhu tanah terik.'
              : isWarning
              ? 'Gunakan metode tugal sedalam 4–5 cm untuk memitigasi penguapan pada kondisi ini.'
              : 'Kondisi mikroklimat tanah optimal. Segera lakukan pemupukan pada jendela aman.'}
          </div>
        </div>

        {/* 3. Grid 2x2 Metrik Biofisika Lapangan Bento Box */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#F7F9FC] hover:bg-white border border-[#DCE5EE] hover:border-slate-300 shadow-xs transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Suhu Tanah</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-200">
                <FontAwesomeIcon icon={faTemperatureHalf} className="text-[11px]" />
              </div>
            </div>
            <p className="text-lg font-black text-[#172B3A] mt-1.5 font-mono group-hover:text-amber-600 transition-colors">
              {soilTemp.toFixed(1)}°C
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {soilTemp > 30 ? '⚠ Terik Ekstrem' : '✓ Normal Lapangan'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F7F9FC] hover:bg-white border border-[#DCE5EE] hover:border-slate-300 shadow-xs transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kadar Air</span>
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center ring-1 ring-sky-200">
                <FontAwesomeIcon icon={faDroplet} className="text-[11px]" />
              </div>
            </div>
            <p className="text-lg font-black text-[#172B3A] mt-1.5 font-mono group-hover:text-sky-600 transition-colors">
              {moisture.toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {moisture < 20 ? '⚠ Tanah Kering' : '✓ Lembab Cukup'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F7F9FC] hover:bg-white border border-[#DCE5EE] hover:border-slate-300 shadow-xs transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">pH Tanah</span>
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-200">
                <FontAwesomeIcon icon={faFlask} className="text-[11px]" />
              </div>
            </div>
            <p className="text-lg font-black text-[#172B3A] mt-1.5 font-mono group-hover:text-purple-600 transition-colors">
              {phVal.toFixed(2)}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Alkalin Kapur
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F7F9FC] hover:bg-white border border-[#DCE5EE] hover:border-slate-300 shadow-xs transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Laju Urease</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200">
                <FontAwesomeIcon icon={faBolt} className="text-[11px]" />
              </div>
            </div>
            <p className="text-lg font-black text-[#172B3A] mt-1.5 font-mono group-hover:text-emerald-600 transition-colors">
              {ureaseRate.toFixed(2)} <span className="text-xs font-normal text-slate-500">/j</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Arrhenius Aktif
            </span>
          </div>
        </div>

        {/* 4. Tab Analisis: Ringkasan | Faktor Risiko | 72 Jam Horizon */}
        <div className="space-y-3 pt-0.5">
          <div className="flex items-center bg-[#EDF2F7] border border-[#DCE5EE] p-1 rounded-2xl text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-white text-[#172B3A] font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-[#172B3A] hover:bg-white/60'
              }`}
            >
              <FontAwesomeIcon icon={faFileLines} className="text-[11px] opacity-80" />
              <span>Ringkasan</span>
            </button>
            <button
              onClick={() => setActiveTab('shap')}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                activeTab === 'shap'
                  ? 'bg-white text-[#172B3A] font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-[#172B3A] hover:bg-white/60'
              }`}
            >
              <FontAwesomeIcon icon={faChartPie} className="text-[11px] opacity-80" />
              <span>Faktor Risiko</span>
            </button>
            <button
              onClick={() => setActiveTab('72h')}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                activeTab === '72h'
                  ? 'bg-white text-[#172B3A] font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-[#172B3A] hover:bg-white/60'
              }`}
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-[11px] text-emerald-600" />
              <span>72 Jam</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/40 animate-pulse" />
            </button>
          </div>

          {/* Tab 1: Ringkasan */}
          {activeTab === 'summary' && (
            <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#DCE5EE] space-y-2.5 text-xs text-slate-600 leading-relaxed shadow-sm">
              <p className="font-semibold text-[#172B3A]">Analisis Mikroklimat Solokuro:</p>
              <p>
                Dekomposisi urea di Solokuro dipengaruhi oleh reaksi enzimatik tinggi dan karakter tanah alkalin (pH {phVal.toFixed(1)}). Waktu penaburan menentukan apakah nitrogen diserap perakaran atau hilang menjadi gas amonia.
              </p>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Status Pemupukan:</span>
                <span className="font-bold text-[#172B3A]">Belum Diaplikasikan</span>
              </div>
            </div>
          )}

          {/* Tab 2: Faktor Risiko (TreeSHAP) */}
          {activeTab === 'shap' && (
            <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#DCE5EE] space-y-3 text-xs text-slate-600 shadow-sm">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-[#172B3A] text-xs">Kontribusi Parameter Risiko (TreeSHAP)</span>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold">Model PIML v2.4</span>
              </div>
              <div className="space-y-3">
                {shapFactors.map((f, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>{f.name} <span className="text-slate-500 font-mono text-[11px]">({f.value})</span></span>
                      <span className="font-bold text-emerald-700 font-mono">+{f.impact}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        style={{ width: `${(f.impact / 40) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Proyeksi 72 Jam Interaktif & Kontrol Waktu Kustom */}
          {activeTab === '72h' && (
            <div className="p-4 rounded-3xl bg-[#F7F9FC] border border-[#DCE5EE] space-y-3.5 text-xs text-slate-800 shadow-sm">
              {/* Header Tab 72 Jam */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-[#172B3A] text-xs flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="text-xs" />
                  </div>
                  <span>Simulasi Waktu 72 Jam</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 font-mono shadow-xs">
                  {safeWindowInfo ? safeWindowInfo.label.split(',')[0] : 'Aman: Besok 06:00'}
                </span>
              </div>

              {/* A. Pemilih Hari Kustom */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider">
                  <FontAwesomeIcon icon={faCalendarDay} className="text-[10px]" />
                  <span>1. Pilih Hari Proyeksi</span>
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Hari Ini', offset: 0 },
                    { label: 'Besok', offset: 1 },
                    { label: 'Lusa', offset: 2 },
                    { label: 'H+3', offset: 3 },
                  ].map((d) => (
                    <button
                      key={d.offset}
                      onClick={() => {
                        setSelectedDayFilter(d.offset);
                        const targetH = Math.min(71, d.offset * 24 + 6);
                        handleSelectHour(targetH);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 active:scale-95 text-center ${
                        selectedDayFilter === d.offset
                          ? 'bg-white text-[#172B3A] shadow-xs border border-slate-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:text-[#172B3A]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* B. Preset Waktu Jam Kritis & Optimal */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                  2. Preset Waktu Strategis
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 6)}
                    className="py-1.5 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-bold border border-emerald-200 transition-all duration-150 text-center flex items-center justify-center gap-1 shadow-xs"
                    title="Jendela pemupukan pagi paling sejuk"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />
                    <span>06:00 Pagi</span>
                  </button>
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 12)}
                    className="py-1.5 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold border border-rose-200 transition-all duration-150 text-center flex items-center justify-center gap-1 shadow-xs"
                    title="Puncak suhu dan radiasi terik"
                  >
                    <FontAwesomeIcon icon={faSun} className="text-[9px]" />
                    <span>12:00 Terik</span>
                  </button>
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 16)}
                    className="py-1.5 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 font-bold border border-amber-200 transition-all duration-150 text-center flex items-center justify-center gap-1 shadow-xs"
                    title="Sore hari transisi"
                  >
                    <FontAwesomeIcon icon={faWind} className="text-[9px]" />
                    <span>16:00 Sore</span>
                  </button>
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 21)}
                    className="py-1.5 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 font-bold border border-slate-200 transition-all duration-150 text-center"
                    title="Malam hari"
                  >
                    21:00 Malam
                  </button>
                </div>
              </div>

              {/* C. Grafik Interaktif 72 Jam dengan Scrubber Dinamis */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-[#172B3A] font-medium">{currentPoint.fullLabel}</span>
                  <span className="font-mono text-emerald-700 text-xs font-bold">+{currentPoint.hour} Jam Horizon</span>
                </div>

                {/* SVG Area Chart dengan Scrubber Bar & Glow Filter */}
                <div
                  className="relative h-20 w-full bg-slate-50 rounded-2xl p-2 border border-slate-200 cursor-pointer overflow-hidden shadow-xs ring-1 ring-slate-100"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left - 8;
                    const pct = Math.max(0, Math.min(1, clickX / (rect.width - 16)));
                    const targetHour = Math.round(pct * 71);
                    handleSelectHour(targetHour);
                  }}
                  title="Klik langsung pada grafik untuk melompat ke jam tersebut"
                >
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="avriGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
                        <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                      </linearGradient>
                      <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0284C7" floodOpacity="0.3" />
                      </filter>
                    </defs>

                    {/* Garis Batas Aman (30%) & Batas Kritis (70%) */}
                    <line x1="0" y1={chartHeight - (30 / 100) * (chartHeight - 10) - 5} x2={chartWidth} y2={chartHeight - (30 / 100) * (chartHeight - 10) - 5} stroke="#059669" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />
                    <line x1="0" y1={chartHeight - (70 / 100) * (chartHeight - 10) - 5} x2={chartWidth} y2={chartHeight - (70 / 100) * (chartHeight - 10) - 5} stroke="#E11D48" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />

                    {/* Polygon Area Fill */}
                    <polygon
                      points={`0,${chartHeight} ${chartPointsSvg} ${chartWidth},${chartHeight}`}
                      fill="url(#avriGradient)"
                    />

                    {/* Line Plot */}
                    <polyline
                      points={chartPointsSvg}
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      filter="url(#chartGlow)"
                    />

                    {/* Dynamic Scrubber Needle (Jarum Penunjuk Jam Terpilih) */}
                    <line
                      x1={activeCursorX}
                      y1="0"
                      x2={activeCursorX}
                      y2={chartHeight}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      opacity="0.7"
                    />

                    {/* Scrubber Dot on Curve */}
                    <circle
                      cx={activeCursorX}
                      cy={activeCursorY}
                      r="4.5"
                      fill={currentPoint.isSafe ? '#10B981' : currentPoint.avri >= 70 ? '#E11D48' : '#D97706'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* D. Slider Halus & Stepper Jam (+1j / -1j) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectHour(selectedHour - 1)}
                    disabled={selectedHour <= 0}
                    className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[#172B3A] hover:bg-slate-200 active:scale-95 disabled:opacity-30 transition-all duration-150 flex items-center gap-1 shadow-sm"
                    title="Mundur 1 jam"
                  >
                    <FontAwesomeIcon icon={faBackwardStep} className="text-[10px]" />
                    <span>-1j</span>
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="71"
                    step="1"
                    value={selectedHour}
                    onChange={(e) => handleSelectHour(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />

                  <button
                    onClick={() => handleSelectHour(selectedHour + 1)}
                    disabled={selectedHour >= 71}
                    className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[#172B3A] hover:bg-slate-200 active:scale-95 disabled:opacity-30 transition-all duration-150 flex items-center gap-1 shadow-sm"
                    title="Maju 1 jam"
                  >
                    <span>+1j</span>
                    <FontAwesomeIcon icon={faForwardStep} className="text-[10px]" />
                  </button>
                </div>

                {/* Kontrol Playback Simulasi Time-Lapse */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold transition-all duration-150 shadow-sm flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xs" />
                    <span>{isPlaying ? 'Jeda Simulasi' : 'Putar Simulasi'}</span>
                  </button>

                  <div className="flex gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-xl text-[10px] font-bold">
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd as 1 | 2 | 4)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          playbackSpeed === spd ? 'bg-white text-[#172B3A] shadow-xs border border-slate-200 font-bold' : 'text-slate-500 hover:text-[#172B3A]'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* E. INFORMASI DETAIL MIKROKLIMAT & BIOFISIKA JAM TERPILIH */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                      Evaluasi Jam Terpilih
                    </span>
                    <p className="text-xs font-bold text-[#172B3A] mt-0.5">
                      {currentPoint.fullLabel}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-xl text-xs font-bold border font-mono ${
                      currentPoint.isSafe
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : currentPoint.avri >= 70
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    AVRI {currentPoint.avri}% ({currentPoint.status.toUpperCase()})
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-normal border-t border-slate-200 pt-2">
                  {currentPoint.recommendation}
                </p>

                {/* 6 Grid Metrik Detail Jam Ini */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1 font-medium">
                      <FontAwesomeIcon icon={faTemperatureHalf} className="text-amber-500" />
                      <span>Suhu Tanah / Udara</span>
                    </span>
                    <span className="font-bold text-[#172B3A] font-mono mt-0.5 block">
                      {currentPoint.soilTemp}°C <span className="font-normal text-slate-500">/ {currentPoint.airTemp}°C</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1 font-medium">
                      <FontAwesomeIcon icon={faDroplet} className="text-sky-500" />
                      <span>Kadar Air / RH</span>
                    </span>
                    <span className="font-bold text-[#172B3A] font-mono mt-0.5 block">
                      {currentPoint.moisture}% <span className="font-normal text-slate-500">/ {currentPoint.rh}%</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1 font-medium">
                      <FontAwesomeIcon icon={faSun} className="text-yellow-400" />
                      <span>Radiasi Surya</span>
                    </span>
                    <span className="font-bold text-[#172B3A] font-mono mt-0.5 block">{currentPoint.solarRad} MJ/m²</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1 font-medium">
                      <FontAwesomeIcon icon={faWind} className="text-teal-500" />
                      <span>Kecepatan Angin</span>
                    </span>
                    <span className="font-bold text-[#172B3A] font-mono mt-0.5 block">{currentPoint.windSpeed} m/s</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1 font-medium">
                      <FontAwesomeIcon icon={faFlask} className="text-purple-400" />
                      <span>Laju Urease</span>
                    </span>
                    <span className="font-bold text-[#172B3A] font-mono mt-0.5 block">{currentPoint.ureaseRate} /j</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1 font-medium">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-500" />
                      <span>Potensi Penguapan</span>
                    </span>
                    <span
                      className={`font-bold font-mono mt-0.5 block ${
                        currentPoint.nitrogenLossEst >= 30 ? 'text-rose-500' : 'text-emerald-400'
                      }`}
                    >
                      ~{currentPoint.nitrogenLossEst}%
                    </span>
                  </div>
                </div>

                {/* Tombol Sinkronkan ke Peta */}
                <button
                  onClick={() => triggerMapSync(currentPoint)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:scale-[0.98] text-white text-[11px] font-bold transition-all text-center shadow-sm flex items-center justify-center gap-2 mt-1"
                >
                  <FontAwesomeIcon icon={faArrowsRotate} className="text-xs" />
                  <span>Sinkronkan Kondisi Jam Ini ke Peta</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Rekomendasi Jendela Aman & SPK Button */}
        <div className="p-4 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1.5 tracking-wider">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-600 text-xs" />
                <span>Jendela Pemupukan Aman</span>
              </span>
              <p className="text-xs font-bold text-[#172B3A] mt-1">
                {safeWindowInfo ? safeWindowInfo.label : 'Besok, 06:00 – 09:00 WIB'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono shadow-xs">
              AVRI {safeWindowInfo ? `${safeWindowInfo.avri}%` : '18%'}
            </span>
          </div>

          {onOpenSpkModal && (
            <button
              onClick={onOpenSpkModal}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-xs transition-all duration-200 text-center shadow-[0_4px_24px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faFileLines} className="text-xs" />
              <span>Buat Surat Perintah Kerja (SPK)</span>
            </button>
          )}
        </div>

        {/* 6. Accordion: Data Teknis & Sensor */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-50">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-slate-100 transition-colors text-left text-xs font-bold text-slate-800"
          >
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
                <FontAwesomeIcon icon={faTowerBroadcast} className="text-[10px]" />
              </div>
              <span>Data Teknis & Sensor Lapangan</span>
            </span>
            <FontAwesomeIcon
              icon={showTechnicalDetails ? faChevronUp : faChevronDown}
              className="text-slate-500 text-xs"
            />
          </button>

          {showTechnicalDetails && (
            <div className="p-3.5 bg-white space-y-2 text-xs border-t border-slate-200 text-slate-700 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-slate-500 font-medium">Stasiun BMKG:</span>
                <span className="font-semibold text-[#172B3A]">Solokuro, Lamongan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-medium">Node LoRa:</span>
                <span className="text-emerald-700 font-semibold">{parcel.nodeId} ({parcel.loraSignalDbm} dBm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-medium">Baterai Node:</span>
                <span className="text-[#172B3A] font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBatteryFull} className="text-emerald-600 text-[10px]" />
                  <span>{parcel.batteryV}V ({parcel.batteryPct}%)</span>
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-500 font-medium">Model Neraca:</span>
                <span className="text-[#172B3A] font-semibold">FAO-56 (Kc {dtTelemetry?.crop_and_kinetics.kc_coefficient || 0.74})</span>
              </div>
              {dtTelemetry?.data_provenance.checksum_sha256 && (
                <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                  <span>SHA-256:</span>
                  <span className="truncate max-w-[170px] text-slate-600">{dtTelemetry.data_provenance.checksum_sha256}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldDetailPanel;
