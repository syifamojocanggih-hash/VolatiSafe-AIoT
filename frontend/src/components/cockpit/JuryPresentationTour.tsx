'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Map,
  Activity,
  Sliders,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface JuryPresentationTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JuryPresentationTour: React.FC<JuryPresentationTourProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      step: 1,
      badge: 'Pilar 1: Spasial & Komunikasi IoT',
      icon: Map,
      title: 'Citra Satelit Solokuro HD & Jaringan LoRa Mesh 433 MHz',
      summary:
        'Panggung utama cockpit menyajikan peta kadastral persil sawah jagung Solokuro, Lamongan yang diproyeksikan langsung di atas Citra Satelit Esri HD.',
      points: [
        'Setiap petak bedeng dimonitor oleh probe sensor tanah ESP32 (suhu DS18B20, kelembaban kapasitif, & elektroda pH).',
        'Garis berkas radio (LoRa beam flow) menggambarkan komunikasi nirkabel jarak jauh (2–5 km) dari probe ke Gateway Basecamp Bluri.',
        'Marker node memiliki animasi radar pulse dan floating pin card dengan mini sparkline 24 jam.',
      ],
      tag: 'TKT 3 Software Testbed',
    },
    {
      step: 2,
      badge: 'Pilar 2: Explainable AI (XAI)',
      icon: Activity,
      title: 'TreeSHAP: Transparansi Pembentukan Risiko AVRI',
      summary:
        'VolatiSafe tidak menggunakan model black-box. Melalui TreeSHAP, juri dan agronomis dapat melihat atribusi kuantitatif tiap parameter terhadap volatilisasi amonia.',
      points: [
        'Suhu Tanah (+38.5%): Pemicu utama lonjakan laju hidrolisis enzim urease di atas 30°C.',
        'Kelembaban Tanah (+26.0%): Menghambat difusi urea ke perakaran jika tanah terlalu kering (< 25%).',
        'pH Tanah Karst (+9.7%): Tanah alkalis Solokuro (pH 7.85) menggeser kesetimbangan kimia ke arah gas NH3 bebas yang mudah menguap.',
      ],
      tag: 'Physics-Informed ML (PIML)',
    },
    {
      step: 3,
      badge: 'Pilar 3: Digital Twin & Resilience',
      icon: Sliders,
      title: 'What-If Sandbox Kinetika & Auto-Failover Imputasi',
      summary:
        'Uji simulasi interaktif untuk skenario iklim ekstrem serta ketahanan sistem terhadap kegagalan hardware di lapangan.',
      points: [
        'Slider What-If: Juri dapat memanipulasi suhu tanah, kelembaban, dan irigasi untuk melihat respon perubahan warna poligon peta secara instan.',
        'Auto-Failover FAO-56: Jika node sensor mengalami dropout/kehabisan baterai, Digital Twin neraca air FAO-56 otomatis mengisi data tanpa kehilangan pemantauan.',
        'Preset Demonstrasi: 1-klik untuk beralih antara Skenario Terik Kritis (AVRI 74%) vs Skenario Pagi Optimal (AVRI 18%).',
      ],
      tag: 'Resilience & Simulation',
    },
    {
      step: 4,
      badge: 'Pilar 4: Aksi Agronomi Presisi',
      icon: FileCheck,
      title: 'Proyeksi Jendela Aman 72 Jam & SPK Lapangan',
      summary:
        'Menerjemahkan data ilmiah biofisika menjadi instruksi kerja yang mudah dipahami dan dieksekusi oleh petani lokal.',
      points: [
        'Horizon Scrubber 72 Jam: Menemukan waktu penaburan pupuk terbaik (Besok Pagi, 06:00 – 09:00 WIB saat AVRI < 20%).',
        'Kalkulator Satuan Petani (ADR 008): Konversi dosis ilmiah ke jumlah karung sak 50 kg dan takaran ember 8 kg per bedeng.',
        'Surat Perintah Kerja (SPK): Fitur cetak dokumen resmi untuk mandor dan petani penggarap dengan SOP metode tugal benam 4 cm.',
      ],
      tag: 'Penghematan Pupuk +24.5%',
    },
  ];

  const current = tourSteps[currentStep];
  const Icon = current.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                Panduan Demonstrasi Juri · DeepTech FoodTech 2026
              </span>
              <h3 className="text-sm sm:text-base font-black text-white">
                Tur Arsitektur Digital Twin Cockpit
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar 4 Langkah */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 border-b border-slate-200">
          {tourSteps.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-emerald-600 shadow-xs'
                  : idx < currentStep
                  ? 'bg-emerald-400'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Konten Langkah */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-2xs font-black uppercase tracking-wider">
              {current.badge}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              Langkah {current.step} dari {tourSteps.length}
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
              <Icon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {current.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {current.summary}
              </p>
            </div>
          </div>

          {/* List Poin Keunggulan */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {current.points.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{pt}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 text-2xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Radio className="w-3 h-3 text-emerald-600" />
              {current.tag}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
          >
            <span>{currentStep === tourSteps.length - 1 ? 'Selesai & Mulai Demo' : 'Selanjutnya'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JuryPresentationTour;
