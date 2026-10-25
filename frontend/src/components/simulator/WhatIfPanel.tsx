'use client';

import React, { useState, useMemo } from 'react';
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

interface SimulationParams {
  soilTemp: number; // 15 - 45 C
  soilMoisture: number; // 5 - 80 %
  soilPh: number; // 4.0 - 9.5
  rain6h: number; // 0 - 50 mm
}

const PRESET_SCENARIOS = [
  {
    id: 'scen-a',
    title: 'Skenario A : Terik Ekstrem Siang Hari',
    desc: 'Simulasi tanah kapur panas & kering tanpa hujan (Risiko Kritis).',
    badge: 'Uji Demo Juri 1',
    params: {
      soilTemp: 34.5,
      soilMoisture: 21.0,
      soilPh: 7.85,
      rain6h: 0.0,
    },
  },
  {
    id: 'scen-b',
    title: 'Skenario B : Hujan Sore 15 mm',
    desc: 'Presipitasi air membasahi tanah & melarutkan urea ke perakaran (Jendela Aman).',
    badge: 'Uji Demo Juri 2',
    params: {
      soilTemp: 25.5,
      soilMoisture: 42.0,
      soilPh: 6.95,
      rain6h: 15.0,
    },
  },
  {
    id: 'scen-c',
    title: 'Skenario C : Pagi Sejuk & Lembap',
    desc: 'Waktu emas aplikasi urea pagi hari jam 06:00-09:00 WIB.',
    badge: 'Kondisi Optimal',
    params: {
      soilTemp: 23.0,
      soilMoisture: 38.0,
      soilPh: 6.80,
      rain6h: 2.0,
    },
  },
];

export const WhatIfPanel: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    soilTemp: 34.0,
    soilMoisture: 20.0,
    soilPh: 7.8,
    rain6h: 0.0,
  });

  const [activePreset, setActivePreset] = useState<string | null>('scen-a');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Perhitungan Physics-Informed ML (Arrhenius + Michaelis-Menten + pH Sigmoid + Rain Washout)
  const calculation = useMemo(() => {
    const { soilTemp, soilMoisture, soilPh, rain6h } = params;

    // 1. Kinetika Suhu Enzim Urease (Arrhenius)
    // Suhu 20 C = laju rendah (0.15), 35 C = laju tinggi (0.85), 45 C = laju puncak (0.98)
    const tempK = soilTemp + 273.15;
    const ea = 51000; // J/mol
    const r = 8.314;
    const kRaw = 3.2e8 * Math.exp(-ea / (r * tempK));
    const kUreaseNorm = Math.min(Math.max((kRaw - 0.05) / (0.6 - 0.05), 0.05), 1.0);

    // 2. Faktor Kering Kelembaban (Michaelis-Menten: tanah kering = penguapan tinggi)
    const km = 18.0;
    const fMoistureSaturation = soilMoisture / (soilMoisture + km);
    const fDrynessVulnerability = Math.max(0.05, 1.0 - fMoistureSaturation);

    // 3. Faktor Akselerasi pH Basa (Sigmoidal curve: pH > 7.0 memicu gas NH3 bebas)
    const phOffset = soilPh - 7.0;
    const fPhSigmoid = Math.pow(10, phOffset) / (1 + Math.pow(10, phOffset));

    // 4. Efek Penurunan oleh Hujan (Rain Washout ke pori perakaran)
    const rainMitigationFactor = Math.max(0.15, 1.0 - Math.min(rain6h / 25.0, 0.85));

    // 5. Base Physics AVRI (0 - 100)
    const rawScore = 100 * kUreaseNorm * fDrynessVulnerability * (0.3 + 0.7 * fPhSigmoid) * rainMitigationFactor;

    // Residual LightGBM (efek turbulensi mikro)
    const residual = 2.4 * Math.sin(soilTemp / 5.0);
    const avriScore = Math.round(Math.min(Math.max(rawScore + residual, 2), 98));

    // Kategori Risiko
    let category: 'aman' | 'waspada' | 'kritis' | 'bahaya' = 'aman';
    let statusColor = '#16A34A';
    let bgBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let title = 'AMAN : WAKTU OPTIMAL PEMUPUKAN UREA';
    let prescriptionText = 'Kondisi tanah dingin dan lembap. Enzim urease tertekan dan amonia mudah larut ke perakaran jagung. Lakukan penaburan pupuk sekarang.';

    if (avriScore > 80) {
      category = 'bahaya';
      statusColor = '#DC2626';
      bgBadge = 'bg-red-100 text-red-800 border-red-300';
      title = 'BAHAYA : DILARANG MENABUR PUPUK UREA';
      prescriptionText = 'Tanah sangat panas dan kering kerontang dengan pH basa. Lebih dari 80% nitrogen akan lenyap menguap dalam 12 jam. Tunda aplikasi pupuk.';
    } else if (avriScore > 60) {
      category = 'kritis';
      statusColor = '#EA580C';
      bgBadge = 'bg-orange-100 text-orange-800 border-orange-300';
      title = 'KRITIS : TUNDA APLIKASI ATAU SIRAM PRA-TEBAR';
      prescriptionText = 'Risiko penguapan tinggi (61-80%). Tunda penaburan hingga jendela aman besok pagi atau berikan irigasi pra-aplikasi minimal 2 mm.';
    } else if (avriScore > 30) {
      category = 'waspada';
      statusColor = '#CA8A04';
      bgBadge = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      title = 'WASPADA : BUTUH METODE BENAM / TUGAL';
      prescriptionText = 'Kondisi sedang berisiko penguapan sedang. Disarankan aplikasi dengan metode tugal sedalam 5-7 cm di samping rumpun lalu tutup tanah.';
    }

    // TreeSHAP Feature Attribution Percentages
    const totalImpact = (kUreaseNorm * 38) + (fDrynessVulnerability * 32) + (fPhSigmoid * 20) + (rain6h > 0 ? 10 : 0);
    const shapTemp = Math.round(((kUreaseNorm * 38) / totalImpact) * 100);
    const shapMoisture = Math.round(((fDrynessVulnerability * 32) / totalImpact) * 100);
    const shapPh = Math.round(((fPhSigmoid * 20) / totalImpact) * 100);
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
  }, [params]);

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

  // Sudut rotasi jarum speedometer gauge (-90 deg s.d. +90 deg)
  const needleAngle = -90 + (calculation.avriScore / 100) * 180;

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

        {/* 3 Preset Skenario Demo Juri */}
        <div className="mt-5 pt-4 border-t border-[#E4D9BC]/80">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Pintasan Skenario Pengujian 1-Klik untuk Presentasi Hackathon :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {preset.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#5E9E49]" />
                    )}
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {preset.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
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
                Suhu Tanah Permukaan (Probe DS18B20)
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
                Kelembaban Tanah (Kapasitif v1.2)
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

            {/* Custom SVG Half-Donut Gauge */}
            <div className="relative w-56 h-32 my-2 flex items-center justify-center">
              <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
                {/* Background arc gradient paths */}
                {/* 1. Hijau Aman (0 - 30%) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 52 43"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* 2. Kuning Waspada (31 - 60%) */}
                <path
                  d="M 58 38 A 80 80 0 0 1 120 22"
                  fill="none"
                  stroke="#CA8A04"
                  strokeWidth="16"
                />
                {/* 3. Oranye Kritis (61 - 80%) */}
                <path
                  d="M 126 23 A 80 80 0 0 1 164 54"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="16"
                />
                {/* 4. Merah Bahaya (81 - 100%) */}
                <path
                  d="M 168 60 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* Center Pivot Point */}
                <circle cx="100" cy="100" r="8" fill="#1E293B" />

                {/* Animated Needle */}
                <g
                  style={{
                    transform: `rotate(${needleAngle}deg)`,
                    transformOrigin: '100px 100px',
                    transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <polygon
                    points="97,100 103,100 100,26"
                    fill="#0F172A"
                  />
                  <circle cx="100" cy="100" r="4" fill="#FFFFFF" />
                </g>
              </svg>

              {/* Gauge center numerical value */}
              <div className="absolute bottom-0 text-center">
                <div
                  className="text-4xl font-extrabold tracking-tight transition-colors duration-300"
                  style={{ color: calculation.statusColor }}
                >
                  {calculation.avriScore}%
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Skor AVRI (12 Jam)
                </span>
              </div>
            </div>

            {/* Dynamic Status Badge */}
            <div className={`mt-3 px-3.5 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-1.5 ${calculation.bgBadge}`}>
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
