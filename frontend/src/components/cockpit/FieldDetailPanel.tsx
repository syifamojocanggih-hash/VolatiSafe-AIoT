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

  // Helper round
  function round(val: number, dec: number = 1) {
    return Number(val.toFixed(dec));
  }

  // Active AVRI for hero display
  const activeAvri =
    activeTab === '72h'
      ? currentPoint.avri
      : isSimulatedCritical
      ? 74
      : parcel.avriScore;

  const isCritical = activeAvri >= 50;
  const isWarning = activeAvri > 25 && activeAvri < 50;

  const statusLabel = isCritical ? 'Kritis' : isWarning ? 'Waspada' : 'Aman';
  const statusBadgeClass = isCritical
    ? 'text-rose-300 bg-rose-500/20 border-rose-500/40'
    : isWarning
    ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
    : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40';

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
    <div className="w-[370px] bg-slate-950/90 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full shrink-0 select-none z-20 text-slate-200 transition-all">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Nama Petak & Status */}
        <div className="flex items-start justify-between gap-2 pr-6">
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">
              {parcel.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {parcel.cropVariety} · {parcel.areaHa} ha
            </p>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusBadgeClass} shrink-0`}
          >
            <FontAwesomeIcon
              icon={isCritical ? faTriangleExclamation : isWarning ? faTriangleExclamation : faCircleCheck}
              className="text-[10px]"
            />
            <span>{statusLabel}</span>
          </span>
        </div>

        {/* 2. Kartu Indeks Risiko (AVRI) Google Earth Dark Dynamic */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBolt} className="text-amber-400 text-xs" />
              <span>Indeks Risiko Volatilisasi</span>
            </span>
            <span
              className={`font-bold ${
                isCritical ? 'text-rose-400' : isWarning ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight leading-none font-mono">
              {activeAvri}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">AVRI</span>
          </div>

          {/* Bar Risiko Responsif */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, activeAvri))}%` }}
            />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
            {activeTab === '72h'
              ? currentPoint.recommendation
              : isCritical
              ? 'Tunda penaburan urea. Potensi penguapan amonia tinggi akibat suhu tanah terik.'
              : isWarning
              ? 'Gunakan metode tugal sedalam 4–5 cm untuk memitigasi penguapan pada kondisi ini.'
              : 'Kondisi mikroklimat tanah optimal. Segera lakukan pemupukan pada jendela aman.'}
          </p>
        </div>

        {/* 3. Grid 2x2 Metrik Biofisika Lapangan */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <FontAwesomeIcon icon={faTemperatureHalf} className="text-amber-400 text-xs" />
              <span>Suhu Tanah</span>
            </span>
            <p className="text-base font-bold text-white mt-1 font-mono">
              {soilTemp.toFixed(1)}°C
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <FontAwesomeIcon icon={faDroplet} className="text-sky-400 text-xs" />
              <span>Kadar Air (VWC)</span>
            </span>
            <p className="text-base font-bold text-white mt-1 font-mono">
              {moisture.toFixed(1)}%
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <FontAwesomeIcon icon={faFlask} className="text-purple-400 text-xs" />
              <span>pH Tanah</span>
            </span>
            <p className="text-base font-bold text-white mt-1 font-mono">
              {phVal.toFixed(2)}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBolt} className="text-emerald-400 text-xs" />
              <span>Laju Urease</span>
            </span>
            <p className="text-base font-bold text-white mt-1 font-mono">
              {ureaseRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">/jam</span>
            </p>
          </div>
        </div>

        {/* 4. Tab Analisis: Ringkasan | Faktor Risiko | 72 Jam Horizon */}
        <div className="space-y-3 pt-0.5">
          <div className="flex items-center bg-slate-900/80 border border-white/10 p-0.5 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FontAwesomeIcon icon={faFileLines} className="text-[11px] opacity-80" />
              <span>Ringkasan</span>
            </button>
            <button
              onClick={() => setActiveTab('shap')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'shap'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FontAwesomeIcon icon={faChartPie} className="text-[11px] opacity-80" />
              <span>Faktor Risiko</span>
            </button>
            <button
              onClick={() => setActiveTab('72h')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                activeTab === '72h'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-[11px] text-emerald-400" />
              <span>72 Jam</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 animate-pulse" />
            </button>
          </div>

          {/* Tab 1: Ringkasan */}
          {activeTab === 'summary' && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-white">Analisis Mikroklimat Solokuro:</p>
              <p>
                Dekomposisi urea di Solokuro dipengaruhi oleh reaksi enzimatik tinggi dan karakter tanah alkalin (pH {phVal.toFixed(1)}). Waktu penaburan menentukan apakah nitrogen diserap perakaran atau hilang menjadi gas amonia.
              </p>
              <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-slate-400 font-medium">
                <span>Status Pemupukan:</span>
                <span className="font-bold text-white">Belum Diaplikasikan</span>
              </div>
            </div>
          )}

          {/* Tab 2: Faktor Risiko (TreeSHAP) */}
          {activeTab === 'shap' && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs text-slate-300">
              <span className="font-bold text-white block">Kontribusi Parameter Risiko (TreeSHAP)</span>
              <div className="space-y-2.5">
                {shapFactors.map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>{f.name} ({f.value})</span>
                      <span className="font-bold text-emerald-400 font-mono">+{f.impact}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
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
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs text-slate-200">
              {/* Header Tab 72 Jam */}
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faClockRotateLeft} className="text-emerald-400 text-xs" />
                  <span>Simulasi Waktu 72 Jam</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                  {safeWindowInfo ? safeWindowInfo.label.split(',')[0] : 'Aman: Besok 06:00'}
                </span>
              </div>

              {/* A. Pemilih Hari Kustom */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 tracking-wider">
                  <FontAwesomeIcon icon={faCalendarDay} className="text-[10px]" />
                  <span>1. Pilih Hari Proyeksi</span>
                </span>
                <div className="grid grid-cols-4 gap-1">
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
                      className={`py-1 px-1 rounded-lg text-[11px] font-semibold transition-all text-center ${
                        selectedDayFilter === d.offset
                          ? 'bg-white/20 text-white shadow-sm border border-white/30 font-bold'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* B. Preset Waktu Jam Kritis & Optimal */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  2. Preset Waktu Strategis
                </span>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 6)}
                    className="py-1 px-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/40 transition-all text-center flex items-center justify-center gap-1"
                    title="Jendela pemupukan pagi paling sejuk"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />
                    <span>06:00 Pagi</span>
                  </button>
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 12)}
                    className="py-1 px-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold border border-rose-500/40 transition-all text-center flex items-center justify-center gap-1"
                    title="Puncak suhu dan radiasi terik"
                  >
                    <FontAwesomeIcon icon={faSun} className="text-[9px]" />
                    <span>12:00 Terik</span>
                  </button>
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 16)}
                    className="py-1 px-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-all text-center flex items-center justify-center gap-1"
                    title="Sore hari transisi"
                  >
                    <FontAwesomeIcon icon={faWind} className="text-[9px]" />
                    <span>16:00 Sore</span>
                  </button>
                  <button
                    onClick={() => handleSelectHour(selectedDayFilter * 24 + 21)}
                    className="py-1 px-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold border border-white/10 transition-all text-center"
                    title="Malam hari"
                  >
                    21:00 Malam
                  </button>
                </div>
              </div>

              {/* C. Grafik Interaktif 72 Jam dengan Scrubber Dinamis */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-white">{currentPoint.fullLabel}</span>
                  <span className="font-mono text-emerald-400 text-xs">+{currentPoint.hour} Jam</span>
                </div>

                {/* SVG Area Chart dengan Scrubber Bar */}
                <div
                  className="relative h-20 w-full bg-slate-950 rounded-xl p-2 border border-white/10 cursor-pointer overflow-hidden shadow-inner"
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
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.45" />
                        <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Garis Batas Aman (30%) & Batas Kritis (70%) */}
                    <line x1="0" y1={chartHeight - 30 * 0.6 - 5} x2={chartWidth} y2={chartHeight - 30 * 0.6 - 5} stroke="#10B981" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
                    <line x1="0" y1={chartHeight - 70 * 0.6 - 5} x2={chartWidth} y2={chartHeight - 70 * 0.6 - 5} stroke="#F43F5E" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

                    {/* Polygon Area Fill */}
                    <polygon
                      points={`0,${chartHeight} ${chartPointsSvg} ${chartWidth},${chartHeight}`}
                      fill="url(#avriGradient)"
                    />

                    {/* Line Plot */}
                    <polyline
                      points={chartPointsSvg}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Dynamic Scrubber Needle (Jarum Penunjuk Jam Terpilih) */}
                    <line
                      x1={activeCursorX}
                      y1="0"
                      x2={activeCursorX}
                      y2={chartHeight}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />

                    {/* Scrubber Dot on Curve */}
                    <circle
                      cx={activeCursorX}
                      cy={activeCursorY}
                      r="4"
                      fill={currentPoint.isSafe ? '#10B981' : currentPoint.avri >= 70 ? '#F43F5E' : '#F59E0B'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>

              {/* D. Slider Halus & Stepper Jam (+1j / -1j) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectHour(selectedHour - 1)}
                    disabled={selectedHour <= 0}
                    className="px-2.5 py-1 bg-white/10 border border-white/15 rounded-lg text-xs font-bold text-white hover:bg-white/20 disabled:opacity-30 transition-colors flex items-center gap-1"
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
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />

                  <button
                    onClick={() => handleSelectHour(selectedHour + 1)}
                    disabled={selectedHour >= 71}
                    className="px-2.5 py-1 bg-white/10 border border-white/15 rounded-lg text-xs font-bold text-white hover:bg-white/20 disabled:opacity-30 transition-colors flex items-center gap-1"
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
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xs" />
                    <span>{isPlaying ? 'Jeda Simulasi' : 'Putar Simulasi'}</span>
                  </button>

                  <div className="flex gap-1 bg-white/5 border border-white/10 p-0.5 rounded-lg text-[10px] font-bold">
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd as 1 | 2 | 4)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          playbackSpeed === spd ? 'bg-white/20 text-white shadow-sm font-black' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* E. INFORMASI DETAIL MIKROKLIMAT & BIOFISIKA JAM TERPILIH */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Evaluasi Jam Terpilih
                    </span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {currentPoint.fullLabel}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${
                      currentPoint.isSafe
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : currentPoint.avri >= 70
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    AVRI {currentPoint.avri}% ({currentPoint.status.toUpperCase()})
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal border-t border-white/10 pt-1.5">
                  {currentPoint.recommendation}
                </p>

                {/* 6 Grid Metrik Detail Jam Ini */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faTemperatureHalf} className="text-amber-400" />
                      <span>Suhu Tanah / Udara</span>
                    </span>
                    <span className="font-bold text-white font-mono mt-0.5 block">
                      {currentPoint.soilTemp}°C <span className="font-normal text-slate-400">/ {currentPoint.airTemp}°C</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faDroplet} className="text-sky-400" />
                      <span>Kadar Air Tanah / RH</span>
                    </span>
                    <span className="font-bold text-white font-mono mt-0.5 block">
                      {currentPoint.moisture}% <span className="font-normal text-slate-400">/ {currentPoint.rh}%</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faSun} className="text-yellow-400" />
                      <span>Radiasi Matahari</span>
                    </span>
                    <span className="font-bold text-white font-mono mt-0.5 block">{currentPoint.solarRad} MJ/m²</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faWind} className="text-teal-400" />
                      <span>Kecepatan Angin</span>
                    </span>
                    <span className="font-bold text-white font-mono mt-0.5 block">{currentPoint.windSpeed} m/s</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faFlask} className="text-purple-400" />
                      <span>Laju Urease</span>
                    </span>
                    <span className="font-bold text-white font-mono mt-0.5 block">{currentPoint.ureaseRate} /jam</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400" />
                      <span>Potensi Penguapan N</span>
                    </span>
                    <span
                      className={`font-bold font-mono mt-0.5 block ${
                        currentPoint.nitrogenLossEst >= 30 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ~{currentPoint.nitrogenLossEst}%
                    </span>
                  </div>
                </div>

                {/* Tombol Sinkronkan ke Peta */}
                <button
                  onClick={() => triggerMapSync(currentPoint)}
                  className="w-full py-2 px-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all text-center shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faArrowsRotate} className="text-xs" />
                  <span>Sinkronkan Kondisi Jam Ini ke Peta</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Rekomendasi Jendela Aman & SPK Button */}
        <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 shadow-xl space-y-2.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5 tracking-wider">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400 text-xs" />
                <span>Jendela Pemupukan Aman</span>
              </span>
              <p className="text-xs font-bold text-white mt-0.5">
                {safeWindowInfo ? safeWindowInfo.label : 'Besok, 06:00 – 09:00 WIB'}
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              AVRI {safeWindowInfo ? `${safeWindowInfo.avri}%` : '18%'}
            </span>
          </div>

          {onOpenSpkModal && (
            <button
              onClick={onOpenSpkModal}
              className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all text-center shadow-md flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faFileLines} className="text-xs text-emerald-400" />
              <span>Buat Surat Perintah Kerja (SPK)</span>
            </button>
          )}
        </div>

        {/* 6. Accordion: Data Teknis & Sensor */}
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors text-left text-xs font-bold text-slate-200"
          >
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faTowerBroadcast} className="text-emerald-400 text-xs" />
              <span>Data Teknis & Sensor</span>
            </span>
            <FontAwesomeIcon
              icon={showTechnicalDetails ? faChevronUp : faChevronDown}
              className="text-slate-400 text-xs"
            />
          </button>

          {showTechnicalDetails && (
            <div className="p-3 bg-slate-950/70 space-y-2 text-xs border-t border-white/10 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Stasiun BMKG:</span>
                <span className="font-semibold text-white">Solokuro, Lamongan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Node LoRa:</span>
                <span className="font-mono text-emerald-400 font-semibold">{parcel.nodeId} ({parcel.loraSignalDbm} dBm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Baterai Node:</span>
                <span className="font-mono text-white font-semibold flex items-center gap-1">
                  <FontAwesomeIcon icon={faBatteryFull} className="text-emerald-400 text-[10px]" />
                  <span>{parcel.batteryV}V ({parcel.batteryPct}%)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model Neraca:</span>
                <span className="text-white font-semibold">FAO-56 (Kc {dtTelemetry?.crop_and_kinetics.kc_coefficient || 0.74})</span>
              </div>
              {dtTelemetry?.data_provenance.checksum_sha256 && (
                <div className="pt-1.5 border-t border-white/10 flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>SHA-256:</span>
                  <span className="truncate max-w-[170px]">{dtTelemetry.data_provenance.checksum_sha256}</span>
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
