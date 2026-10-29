'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  Flame,
  Droplets,
  TestTube2,
  CloudRain,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { simulateWhatIf, WhatIfSimulationResponse } from '@/services/api';

interface SimulationParams {
  soilTemp: number; // 15 - 45 C
  soilMoisture: number; // 5 - 80 %
  soilPh: number; // 4.0 - 9.5
  rain6h: number; // 0 - 50 mm
}

const PRESET_SCENARIOS = [
  {
    id: 'scen-aman',
    title: 'Skenario 1 : Pagi Sejuk & Lembap',
    desc: 'Waktu emas aplikasi Urea pagi hari (06:00-09:00 WIB). Enzim tertekan & amonia cepat terserap.',
    badge: 'Aman (AVRI 4%)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-[#16A34A]',
    params: {
      soilTemp: 24.0,
      soilMoisture: 40.0,
      soilPh: 6.85,
      rain6h: 5.0,
    },
  },
  {
    id: 'scen-waspada',
    title: 'Skenario 2 : Siang Berawan Suhu Naik',
    desc: 'Risiko penguapan sedang. Disarankan metode tugal 5–7 cm ke samping perakaran.',
    badge: 'Waspada (AVRI 48%)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-[#D97706]',
    params: {
      soilTemp: 27.0,
      soilMoisture: 33.0,
      soilPh: 7.15,
      rain6h: 0.0,
    },
  },
  {
    id: 'scen-kritis',
    title: 'Skenario 3 : Terik Siang Panas & Kering',
    desc: 'Aktivasi termal enzim urease tinggi. Tunda penaburan hingga jendela aman terbuka.',
    badge: 'Kritis (AVRI 73%)',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    dotColor: 'bg-[#EA580C]',
    params: {
      soilTemp: 31.0,
      soilMoisture: 26.0,
      soilPh: 7.35,
      rain6h: 0.0,
    },
  },
  {
    id: 'scen-bahaya',
    title: 'Skenario 4 : Panas Ekstrem & Tanah Berkapur',
    desc: 'Dilarang tabur! Kehilangan nitrogen >80% akibat penguapan instan ke atmosfer.',
    badge: 'Bahaya (AVRI 95%)',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    dotColor: 'bg-[#DC2626]',
    params: {
      soilTemp: 36.0,
      soilMoisture: 18.0,
      soilPh: 7.95,
      rain6h: 0.0,
    },
  },
];

// Definisi Geometri Busur Radial Bersegmen (14 Blok Semicircle Tile sesuai referensi)
const SEGMENTS_COUNT = 14;
const GAUGE_CX = 130;
const GAUGE_CY = 130;
const GAUGE_R_OUT = 104;
const GAUGE_R_IN = 72;
const GAUGE_GAP_DEG = 2.6;
const GAUGE_MARGIN_DEG = 1.2;
const GAUGE_TOTAL_ARC = 180;
const GAUGE_SEG_DEG =
  (GAUGE_TOTAL_ARC - 2 * GAUGE_MARGIN_DEG - (SEGMENTS_COUNT - 1) * GAUGE_GAP_DEG) /
  SEGMENTS_COUNT; // ~10.2714 deg

interface RadialSegment {
  id: number;
  pathD: string;
  midPct: number;
  activeColor: string;
  activeStroke: string;
}

const RADIAL_SEGMENTS: RadialSegment[] = Array.from(
  { length: SEGMENTS_COUNT },
  (_, i) => {
    const theta1 = GAUGE_MARGIN_DEG + i * (GAUGE_SEG_DEG + GAUGE_GAP_DEG);
    const theta2 = theta1 + GAUGE_SEG_DEG;
    const rad1 = (theta1 * Math.PI) / 180;
    const rad2 = (theta2 * Math.PI) / 180;

    // Koordinat busur setengah lingkaran: theta=0 di kiri (-X), theta=90 di atas (-Y), theta=180 di kanan (+X)
    const p1 = {
      x: GAUGE_CX - GAUGE_R_IN * Math.cos(rad1),
      y: GAUGE_CY - GAUGE_R_IN * Math.sin(rad1),
    };
    const p2 = {
      x: GAUGE_CX - GAUGE_R_OUT * Math.cos(rad1),
      y: GAUGE_CY - GAUGE_R_OUT * Math.sin(rad1),
    };
    const p3 = {
      x: GAUGE_CX - GAUGE_R_OUT * Math.cos(rad2),
      y: GAUGE_CY - GAUGE_R_OUT * Math.sin(rad2),
    };
    const p4 = {
      x: GAUGE_CX - GAUGE_R_IN * Math.cos(rad2),
      y: GAUGE_CY - GAUGE_R_IN * Math.sin(rad2),
    };

    const pathD = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} A ${GAUGE_R_OUT} ${GAUGE_R_OUT} 0 0 1 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} A ${GAUGE_R_IN} ${GAUGE_R_IN} 0 0 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;

    const midPct = ((i + 0.5) / SEGMENTS_COUNT) * 100;

    // Karakteristik warna VolatiSafe AIoT (Aman, Waspada, Kritis, Bahaya)
    let activeColor = '#16A34A'; // Hijau Aman (0-30%)
    let activeStroke = '#15803D';
    if (midPct > 80) {
      activeColor = '#DC2626'; // Merah Bahaya (81-100%)
      activeStroke = '#B91C1C';
    } else if (midPct > 60) {
      activeColor = '#EA580C'; // Oranye Kritis (61-80%)
      activeStroke = '#C2410C';
    } else if (midPct > 30) {
      activeColor = '#CA8A04'; // Kuning Waspada (31-60%)
      activeStroke = '#A16207';
    }

    return {
      id: i,
      pathD,
      midPct,
      activeColor,
      activeStroke,
    };
  }
);

export const WhatIfPanel: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    soilTemp: 31.0,
    soilMoisture: 26.0,
    soilPh: 7.35,
    rain6h: 0.0,
  });

  const [activePreset, setActivePreset] = useState<string | null>('scen-kritis');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendPrediction, setBackendPrediction] = useState<WhatIfSimulationResponse | null>(null);
  const [isSyncingBackend, setIsSyncingBackend] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsSyncingBackend(true);
      try {
        const res = await simulateWhatIf({
          soil_temp_c: params.soilTemp,
          moisture_pct: params.soilMoisture,
          ph: params.soilPh,
          rain_mm: params.rain6h,
        });
        if (res && !isCancelled) {
          setBackendPrediction(res);
        }
      } catch (err) {
        console.warn('Simulator backend call failed:', err);
      } finally {
        if (!isCancelled) setIsSyncingBackend(false);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [params]);

  // Perhitungan Physics-Informed ML (Arrhenius + Michaelis-Menten + pH Sigmoid + Rain Washout)
  const calculation = useMemo(() => {
    const { soilTemp, soilMoisture, soilPh, rain6h } = params;

    const tempDelta = Math.max(0.0, (soilTemp - 20.0) * 2.5);
    const moisturePenalty = Math.max(0.0, (40.0 - soilMoisture) * 1.8);
    const phPenalty = Math.max(0.0, (soilPh - 6.5) * 12.0);
    const rainDiscount = Math.min(45.0, rain6h * 4.0);
    const rawScore = 10.0 + tempDelta + moisturePenalty + phPenalty - rainDiscount;
    const fallbackScore = Math.round(Math.max(3.0, Math.min(95.0, rawScore)));

    // Prioritaskan hasil komputasi backend FastAPI jika ada, atau rumus analitikal fallback
    const avriScore =
      backendPrediction?.avri_score !== undefined
        ? Math.round(backendPrediction.avri_score)
        : fallbackScore;

    // Kategori Risiko resmi (4 tingkatan: aman, waspada, kritis, bahaya)
    let category: 'aman' | 'waspada' | 'kritis' | 'bahaya' = 'aman';
    let statusColor = '#16A34A';
    let bgBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let title = 'AMAN : WAKTU OPTIMAL PEMUPUKAN UREA';
    let prescriptionText =
      'Kondisi tanah dingin dan lembap. Enzim urease tertekan dan amonia mudah larut ke perakaran jagung. Lakukan penaburan pupuk sekarang.';

    if (avriScore > 80) {
      category = 'bahaya';
      statusColor = '#DC2626';
      bgBadge = 'bg-red-100 text-red-800 border-red-300';
      title = 'BAHAYA : DILARANG MENABUR PUPUK UREA';
      prescriptionText =
        'Tanah sangat panas dan kering kerontang dengan pH basa. Lebih dari 80% nitrogen akan lenyap menguap dalam 12 jam. Tunda aplikasi pupuk.';
    } else if (avriScore > 60) {
      category = 'kritis';
      statusColor = '#EA580C';
      bgBadge = 'bg-orange-100 text-orange-800 border-orange-300';
      title = 'KRITIS : TUNDA APLIKASI ATAU SIRAM PRA-TEBAR';
      prescriptionText =
        'Risiko penguapan tinggi (61-80%). Tunda penaburan hingga jendela aman besok pagi atau berikan irigasi pra-aplikasi minimal 2 mm.';
    } else if (avriScore > 30) {
      category = 'waspada';
      statusColor = '#CA8A04';
      bgBadge = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      title = 'WASPADA : BUTUH METODE BENAM / TUGAL';
      prescriptionText =
        'Kondisi sedang berisiko penguapan sedang. Disarankan aplikasi dengan metode tugal sedalam 5-7 cm di samping rumpun lalu tutup tanah.';
    }

    // Jika FastAPI mengembalikan preskripsi resmi, terapkan
    if (backendPrediction?.prescription) {
      if (backendPrediction.risk_category) {
        category = backendPrediction.risk_category;
        if (category === 'bahaya') {
          statusColor = '#DC2626';
          bgBadge = 'bg-red-100 text-red-800 border-red-300';
        } else if (category === 'kritis') {
          statusColor = '#EA580C';
          bgBadge = 'bg-orange-100 text-orange-800 border-orange-300';
        } else if (category === 'waspada') {
          statusColor = '#CA8A04';
          bgBadge = 'bg-yellow-100 text-yellow-800 border-yellow-300';
        } else {
          statusColor = '#16A34A';
          bgBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        }
      }
      if (backendPrediction.prescription.title) {
        title = backendPrediction.prescription.title;
      }
      if (backendPrediction.prescription.immediate_guidance) {
        prescriptionText = backendPrediction.prescription.immediate_guidance;
      }
    }

    // TreeSHAP Feature Attribution Percentages
    const totalImpact = tempDelta + moisturePenalty + phPenalty + (rain6h > 0 ? rainDiscount : 5);
    const shapTemp = Math.round((tempDelta / Math.max(1, totalImpact)) * 100);
    const shapMoisture = Math.round((moisturePenalty / Math.max(1, totalImpact)) * 100);
    const shapPh = Math.round((phPenalty / Math.max(1, totalImpact)) * 100);
    const shapRain = Math.max(0, 100 - shapTemp - shapMoisture - shapPh);

    return {
      avriScore,
      category,
      statusColor,
      bgBadge,
      title,
      prescriptionText,
      shap: {
        temp: shapTemp,
        moisture: shapMoisture,
        ph: shapPh,
        rain: shapRain,
      },
    };
  }, [params, backendPrediction]);

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setParams(preset.params);
    setActivePreset(preset.id);
    setToastMessage(`Skenario "${preset.title}" diterapkan ke simulator.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = () => {
    setParams({
      soilTemp: 28.0,
      soilMoisture: 35.0,
      soilPh: 6.9,
      rain6h: 5.0,
    });
    setActivePreset(null);
    setToastMessage('Parameter dikembalikan ke kondisi seimbang.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Jumlah segmen radial aktif (0 s.d. 14) proporsional terhadap skor AVRI
  const activeSegmentsCount = Math.min(
    SEGMENTS_COUNT,
    Math.max(
      calculation.avriScore > 0 ? 1 : 0,
      Math.round((calculation.avriScore / 100) * SEGMENTS_COUNT)
    )
  );

  return (
    <div className="space-y-6">
      {/* Title & Introduction Banner */}
      <div className="bg-[#FAF4E6] border border-[#E4D9BC] rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#5E9E49] text-white flex items-center justify-center shrink-0 shadow-md">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Simulator Risiko What-If (Demo Juri)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Physics-Informed ML
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${backendPrediction ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                  {isSyncingBackend ? 'Menghitung di FastAPI...' : backendPrediction ? `FastAPI Live (${backendPrediction.model_meta.version})` : 'FastAPI Standby'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Uji responsivitas model hibrida Arrhenius-LightGBM secara real-time saat juri menggeser parameter lingkungan tanah.
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all shrink-0 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Default</span>
          </button>
        </div>

        {/* 4 Preset Skenario Demo Juri (Aman, Waspada, Kritis, Bahaya) */}
        <div className="mt-5 pt-4 border-t border-[#E4D9BC]/80">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Pintasan Skenario Pengujian 1-Klik untuk 4 Tingkat Risiko :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_SCENARIOS.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-white border-[#5E9E49] shadow-md ring-2 ring-[#5E9E49]/20'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${preset.badgeClass}`}
                    >
                      {preset.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#5E9E49]" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {preset.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Gauge & SHAP on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4 Interactive Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#5E9E49]" />
              Kontrol Slider Parameter Tanah & Mikroklimat
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">
              Debounce 0 ms · Live
            </span>
          </div>

          {/* Slider 1: Suhu Tanah */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Suhu Tanah Permukaan
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-extrabold text-sm">
                {params.soilTemp.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min="15.0"
              max="45.0"
              step="0.5"
              value={params.soilTemp}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, soilTemp: parseFloat(e.target.value) });
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#C25E26]"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>15.0°C (Dingin)</span>
              <span className="text-orange-600 font-semibold">Ambang Urease 30°C</span>
              <span>45.0°C (Terik Ekstrem)</span>
            </div>
          </div>

          {/* Slider 2: Kelembaban Tanah */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                Kelembapan Tanah
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-extrabold text-sm">
                {params.soilMoisture.toFixed(1)} % VWC
              </span>
            </div>
            <input
              type="range"
              min="5.0"
              max="80.0"
              step="1.0"
              value={params.soilMoisture}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, soilMoisture: parseFloat(e.target.value) });
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span className="text-red-500 font-semibold">5% (Kering Kerontang)</span>
              <span className="text-slate-600">Ambang Kritis 25%</span>
              <span className="text-emerald-600 font-semibold">80% (Kapasitas Lapang)</span>
            </div>
          </div>

          {/* Slider 3: Derajat Keasaman pH */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <TestTube2 className="w-4 h-4 text-emerald-600" />
                Derajat Keasaman pH Tanah
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-sm">
                {params.soilPh.toFixed(2)} pH
              </span>
            </div>
            <input
              type="range"
              min="4.0"
              max="9.5"
              step="0.05"
              value={params.soilPh}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, soilPh: parseFloat(e.target.value) });
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>4.0 (Sangat Asam)</span>
              <span className="text-emerald-700 font-semibold">Netral 7.0</span>
              <span className="text-amber-700 font-semibold">9.5 (Kapur Solokuro / Basa)</span>
            </div>
          </div>

          {/* Slider 4: Curah Hujan 6 Jam */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-teal-600" />
                Prakiraan Curah Hujan 6 Jam ke Depan
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-sm">
                {params.rain6h.toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="50.0"
              step="1.0"
              value={params.rain6h}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, rain6h: parseFloat(e.target.value) });
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0 mm (Kering Panas)</span>
              <span className="text-teal-700 font-semibold">15 mm (Hujan Efektif)</span>
              <span>50 mm (Lebat / Genangan)</span>
            </div>
          </div>

          {/* Guidance note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              Setiap kali slider digeser, formula kinetika kimia enzim urease tanah menghitung laju hidrolisis urea dan LightGBM merevisi skor probabilitas penguapan seketika.
            </p>
          </div>
        </div>

        {/* Right Column: Live Gauge Speedometer, Status Banner & SHAP (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Gauge Meter Speedometer Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Indeks Volatilisasi Amonia Terkalkulasi
            </span>

            {/* Custom SVG Segmented Radial Arc Gauge (14 Blok Tile Semicircle Tanpa Jarum) */}
            <div className="w-full max-w-[280px] h-44 my-1 flex items-center justify-center">
              <svg viewBox="0 0 260 145" className="w-full h-full overflow-visible">
                {/* 14 Blok Segmen Busur Radial */}
                {RADIAL_SEGMENTS.map((seg, idx) => {
                  const isActive = idx < activeSegmentsCount;
                  return (
                    <path
                      key={seg.id}
                      d={seg.pathD}
                      fill={isActive ? seg.activeColor : '#F1F5F9'}
                      stroke={isActive ? seg.activeStroke : '#CBD5E1'}
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={isActive ? 1 : 0.45}
                      className="transition-all duration-300"
                    />
                  );
                })}

                {/* Angka Persentase Skor Utama & Subtitle di Tengah Kubah (Persis Referensi) */}
                <text
                  x={GAUGE_CX}
                  y={GAUGE_CY - 22}
                  textAnchor="middle"
                  fill={calculation.statusColor}
                  fontSize="34"
                  fontWeight="800"
                  className="font-black tracking-tight"
                >
                  {calculation.avriScore}%
                </text>
                <text
                  x={GAUGE_CX}
                  y={GAUGE_CY - 6}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  SKOR AVRI (12 JAM)
                </text>
              </svg>
            </div>

            {/* Dynamic Status Badge */}
            <div className={`mt-2 px-3.5 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-1.5 ${calculation.bgBadge}`}>
              {calculation.category === 'aman' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : calculation.category === 'waspada' ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : calculation.category === 'kritis' ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-red-600" />
              )}
              <span>Status: {calculation.category}</span>
            </div>

            {/* Legenda Karakteristik Warna VolatiSafe AIoT */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[11px] font-semibold text-slate-500 text-left">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
                Aman (≤30%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CA8A04] shrink-0" />
                Waspada (31-60%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shrink-0" />
                Kritis (61-80%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0" />
                Bahaya (&gt;80%)
              </span>
            </div>

            {/* Recommendation headline and guidance */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left w-full">
              <h2 className="text-xs font-bold text-slate-900 leading-snug">
                {calculation.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {calculation.prescriptionText}
              </p>
            </div>
          </div>

          {/* Mini TreeSHAP Attribution Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Dekomposisi TreeSHAP (Faktor Pemicu)
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                Explainable AI
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Factor 1: Suhu Tanah */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Aktivitas Urease Suhu Panas</span>
                  <span className="font-bold text-orange-700">+{calculation.shap.temp}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculation.shap.temp}%` }}
                  />
                </div>
              </div>

              {/* Factor 2: Kelembaban */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Kekeringan Tanah (VWC)</span>
                  <span className="font-bold text-blue-700">+{calculation.shap.moisture}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculation.shap.moisture}%` }}
                  />
                </div>
              </div>

              {/* Factor 3: pH */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Alkalinitas / pH Basa</span>
                  <span className="font-bold text-emerald-700">+{calculation.shap.ph}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculation.shap.ph}%` }}
                  />
                </div>
              </div>

              {/* Factor 4: Hujan */}
              {calculation.shap.rain > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">Peredaman Air Hujan</span>
                    <span className="font-bold text-teal-700">-{calculation.shap.rain}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculation.shap.rain}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
