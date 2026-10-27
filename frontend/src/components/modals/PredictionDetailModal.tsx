'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  Layers,
  Sparkles,
  Clock,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { StatusBannerData, MetricItem, RiskCategory } from '@/types/dashboard';

interface PredictionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusBanner: StatusBannerData;
  metrics: MetricItem[];
  onOpenSimulator?: () => void;
}

export const PredictionDetailModal: React.FC<PredictionDetailModalProps> = ({
  isOpen,
  onClose,
  statusBanner,
  metrics,
  onOpenSimulator,
}) => {
  if (!isOpen) return null;

  const category: RiskCategory = statusBanner.category || 'aman';
  const isAman = category === 'aman';
  const score = statusBanner.avriScore;

  // Baca nilai aktual dari metrik sensor jika tersedia
  const currentTemp = metrics.find((m) => m.id === 'temp')?.value || '26,0°C';
  const currentMoisture = metrics.find((m) => m.id === 'moisture')?.value || '42,0%';
  const currentPh = metrics.find((m) => m.id === 'ph')?.value || '7,10';

  // Nilai Komposit Physics-Informed ML sesuai 4 tingkat risiko
  const basePhysics =
    category === 'aman' ? 2.8 : category === 'waspada' ? 38.6 : category === 'kritis' ? 61.4 : 72.8;
  const residualAI =
    category === 'aman' ? 1.2 : category === 'waspada' ? 9.4 : category === 'kritis' ? 12.6 : 15.2;
  const confidenceMargin =
    category === 'aman' ? '±1,2%' : category === 'waspada' ? '±1,8%' : '±2,4%';

  // Dynamic composite styling
  let compositeBg = 'bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-200';
  let scoreColor = 'text-emerald-700';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (category === 'bahaya') {
    compositeBg = 'bg-gradient-to-br from-red-50 to-red-100/40 border-red-200';
    scoreColor = 'text-red-700';
    badgeClass = 'bg-red-100 text-red-800 border-red-300';
  } else if (category === 'kritis') {
    compositeBg = 'bg-gradient-to-br from-orange-50 to-orange-100/40 border-orange-200';
    scoreColor = 'text-orange-700';
    badgeClass = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (category === 'waspada') {
    compositeBg = 'bg-gradient-to-br from-amber-50 to-amber-100/40 border-amber-200';
    scoreColor = 'text-amber-700';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  // Data atribusi TreeSHAP Explainable AI sesuai docs/ai/EXPLAINABILITY_SHAP.md
  const shapFactors = isAman
    ? [
        {
          id: 'moisture',
          name: 'Kelembaban Tanah (VWC 42,0%)',
          valueText: '42,0% VWC',
          shapValue: -32,
          impactType: 'damping', // menekan risiko
          impactLabel: '-32% Menekan Risiko',
          badge: 'Optimal (Difusi Cepat)',
          narrative:
            'Kadar air optimal (>25%) melarutkan urea langsung ke zona perakaran tanpa kristalisasi.',
        },
        {
          id: 'temp',
          name: 'Suhu Tanah Permukaan (26,0°C)',
          valueText: '26,0°C',
          shapValue: -18,
          impactType: 'damping',
          impactLabel: '-18% Menekan Risiko',
          badge: 'Sejuk (Enzim Tertekan)',
          narrative:
            'Suhu sejuk di bawah 28°C menekan laju hidrolisis enzim urease hingga 70%.',
        },
        {
          id: 'ph',
          name: 'Derajat Keasaman pH Tanah (7,10)',
          valueText: 'pH 7,10',
          shapValue: 4,
          impactType: 'neutral',
          impactLabel: '+4% Netral Stabil',
          badge: 'Netral (Kesetimbangan Stabil)',
          narrative:
            'pH netral 7,10 menjaga stabilitas ionik sehingga pembentukan gas amonia sangat minim.',
        },
        {
          id: 'wind_weather',
          name: 'Prakiraan Curah Hujan & Angin',
          valueText: 'Angin 1,2 m/s · Hujan 2 mm',
          shapValue: -8,
          impactType: 'damping',
          impactLabel: '-8% Meredam Pelepasan',
          badge: 'Tenang & Lembap',
          narrative:
            'Angin tenang 1,2 m/s mempertahankan lapisan gas mikro tanpa memicu pelepasan amonia.',
        },
      ]
    : [
        {
          id: 'temp',
          name: 'Suhu Tanah Permukaan (34,2°C)',
          valueText: '34,2°C',
          shapValue: 45,
          impactType: 'increasing', // menaikkan risiko
          impactLabel: '+45% Memicu Penguapan',
          badge: 'Kritis (Aktivasi Termal)',
          narrative:
            'Suhu terik 34,2°C mengakselerasi enzim urease secara eksponensial memicu pelepasan gas.',
        },
        {
          id: 'moisture',
          name: 'Kelembaban Tanah Kering (22,4%)',
          valueText: '22,4% VWC',
          shapValue: 26,
          impactType: 'increasing',
          impactLabel: '+26% Kering Kerontang',
          badge: 'Defisit Air Kritis',
          narrative:
            'Kadar air kritis <25% mengkristalisasi butiran urea dan menyebabkan penguapan bebas.',
        },
        {
          id: 'ph',
          name: 'Alkalinitas Tanah Basa (pH 7,80)',
          valueText: 'pH 7,80',
          shapValue: 18,
          impactType: 'increasing',
          impactLabel: '+18% Tanah Berkapur',
          badge: 'Alkalin Tinggi',
          narrative:
            'Alkalinitas tinggi pH 7,80 menggeser kesetimbangan ionik langsung menjadi gas amonia.',
        },
        {
          id: 'wind_weather',
          name: 'Radiasi Matahari & Turbulensi Angin',
          valueText: 'Angin 2,8 m/s · Terik',
          shapValue: 11,
          impactType: 'increasing',
          impactLabel: '+11% Sapuan Angin',
          badge: 'Turbulensi Kuat',
          narrative:
            'Turbulensi angin 2,8 m/s menyapu lapisan batas gas amonia di atas permukaan bedeng.',
        },
      ];

  // Proyeksi kinetika volatilisasi 12 jam ke depan
  const trajectorySlots = isAman
    ? [
        { time: '06:00 - 09:00', score: '4%', label: 'Jendela Emas Penaburan', status: 'optimal' },
        { time: '09:00 - 12:00', score: '12%', label: 'Penyerapan Berjalan Aman', status: 'optimal' },
        { time: '12:00 - 15:00', score: '32%', label: 'Waspada Suhu Naik', status: 'warning' },
        { time: '15:00 - 18:00', score: '16%', label: 'Kembali Sejuk', status: 'optimal' },
      ]
    : [
        { time: '06:00 - 09:00', score: '41%', label: 'Suhu Mulai Meningkat', status: 'warning' },
        { time: '09:00 - 12:00', score: '68%', label: 'Terik Kritis Berlangsung', status: 'danger' },
        { time: '12:00 - 15:00', score: '74%', label: 'Puncak Volatilisasi Ekstrem', status: 'danger' },
        { time: '15:00 - 18:00', score: '52%', label: 'Penurunan Bertahap', status: 'warning' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
          aria-label="Tutup modal analisis"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: Logo + Judul (Badge PIML dihapus) */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="VolatiSafe AIoT"
              width={36}
              height={36}
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Detail Analisis Prediksi AVRI
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Dekomposisi Lapisan Fisika Arrhenius, Koreksi Residual LightGBM & TreeSHAP
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10.5px]">
              <span className="font-semibold text-slate-500">Input Telemetri:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                Kelembaban {currentMoisture}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                Suhu {currentTemp}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                pH {currentPh}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Composite Score Card (Physics vs Machine Learning Breakdown) */}
        <div className={`rounded-2xl p-4 sm:p-5 border ${compositeBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block whitespace-nowrap">
                Skor Prediksi AVRI (12 Jam)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5 whitespace-nowrap">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${scoreColor}`}>
                  {score}%
                </span>
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                >
                  {statusBanner.category}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (Keyakinan {confidenceMargin})
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block whitespace-nowrap">
                Jendela Rekomendasi
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 whitespace-nowrap">
                {statusBanner.bestWindow}
              </span>
            </div>
          </div>

          {/* Physics vs ML Sub-Components */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-slate-200/60">
            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#5E9E49]" />
                  Base Physics (Kinetika Urease)
                </span>
                <span className="text-sm font-extrabold text-slate-900">{basePhysics}%</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {isAman
                  ? 'Persamaan Arrhenius tertekan suhu sejuk (26°C) + difusi pori tanah lancar (VWC 42%).'
                  : 'Suhu tanah 34,2°C mengaktifkan eksponensial hidrolisis enzimatik urease tanah.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Koreksi Residual LightGBM
                </span>
                <span className="text-sm font-extrabold text-slate-900">+{residualAI}%</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {isAman
                  ? 'Penyesuaian fluks angin tenang (1,2 m/s) dan kelembaban udara ambien BMKG.'
                  : 'Koreksi interaksi turbulensi angin konveksi dan selisih suhu permukaan-udara.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. TreeSHAP Feature Attribution */}
        <div>
          <div className="mb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Dekomposisi TreeSHAP (Faktor Penentu Penguapan)
            </h3>
          </div>

          <div className="space-y-2.5">
            {shapFactors.map((f) => {
              const isDamping = f.impactType === 'damping';
              const isIncreasing = f.impactType === 'increasing';

              return (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{f.name}</span>

                    {/* Teks dampak langsung tanpa kotak / pill capsule */}
                    <span
                      className={`text-xs font-bold flex items-center gap-1 shrink-0 ${
                        isDamping
                          ? 'text-emerald-700'
                          : isIncreasing
                          ? 'text-red-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {isDamping ? (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isIncreasing ? (
                        <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                      ) : null}
                      <span>{f.impactLabel}</span>
                    </span>
                  </div>

                  <p className="text-[11.5px] text-slate-600 leading-relaxed truncate">
                    {f.narrative}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Traktori Kinetika 12 Jam (Hourly Trajectory) */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            Proyeksi Traktori Kinetika 12 Jam Hari Ini
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {trajectorySlots.map((slot, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-center ${
                  slot.status === 'optimal'
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : slot.status === 'warning'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                    : 'bg-red-50/60 border-red-200 text-red-950'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-500 block">
                  {slot.time}
                </span>
                <span
                  className={`text-lg font-black block mt-0.5 ${
                    slot.status === 'optimal'
                      ? 'text-emerald-700'
                      : slot.status === 'warning'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {slot.score}
                </span>
                <span className="text-[10px] font-bold line-clamp-1 mt-0.5">{slot.label}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span>Buka What-If Simulator (Uji 4 Slider)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98]"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
