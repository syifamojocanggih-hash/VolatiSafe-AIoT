'use client';

import React, { useState, useEffect } from 'react';
import { initialAgronomyData } from '@/mocks/agronomyMock';
import { ApplicationLog } from '@/types/agronomy';
import { calculateFertilizerBlend, BlendCalculationResponse, getFertilizerLogs } from '@/services/api';
import { WhatsAppPreviewModal } from '@/components/modals/WhatsAppPreviewModal';
import { RecordFertilizerModal } from '@/components/modals/RecordFertilizerModal';
import {
  Mail,
  Plus,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';

export const AgronomyPlanning: React.FC = () => {
  const [plantingDate, setPlantingDate] = useState(initialAgronomyData.plantingDate);
  const [seedVariety, setSeedVariety] = useState(initialAgronomyData.seedVariety);
  const [areaHa, setAreaHa] = useState<number>(initialAgronomyData.areaHa);
  const [targetYield, setTargetYield] = useState<number>(initialAgronomyData.targetYieldTonHa);
  const [logs, setLogs] = useState<ApplicationLog[]>(initialAgronomyData.applicationLogs);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendBlend, setBackendBlend] = useState<BlendCalculationResponse | null>(null);
  const [isCalculatingBackend, setIsCalculatingBackend] = useState(false);

  // Dynamic DAT Calculation (Days After Transplanting)
  const calculateDat = () => {
    try {
      const plantTime = new Date(plantingDate).getTime();
      const nowTime = new Date('2026-10-25').getTime(); // Synced with mock system date
      const diffDays = Math.max(0, Math.floor((nowTime - plantTime) / (1000 * 60 * 60 * 24)));
      return diffDays;
    } catch {
      return 30;
    }
  };

  const currentHst = calculateDat();

  // Dynamic Fertilizer Scaling Factor based on user typed inputs
  // Baseline: 0.75 Ha with 8.0 Ton/Ha target yield
  const safeArea = Math.max(0.01, areaHa || 0.75);
  const safeYield = Math.max(1, targetYield || 8.0);
  const scaling = (safeArea / 0.75) * (safeYield / 8.0);

  // Phase I Calculation (10–14 HST)
  const phonska1 = Math.round(112 * scaling);
  const urea1 = Math.round(38 * scaling);
  const za1 = Math.round(38 * scaling);
  const totalPhase1 = phonska1 + urea1 + za1;
  const sacksPhase1 = (totalPhase1 / 50).toFixed(1).replace('.', ',');
  const bucketsPhase1 = Math.round(totalPhase1 / 8);

  // Phase II Calculation (30–35 HST)
  const urea2 = Math.round(105 * scaling);
  const phonska2 = Math.round(40 * scaling);
  const totalPhase2 = urea2 + phonska2;
  const sacksPhase2 = (totalPhase2 / 50).toFixed(1).replace('.', ',');
  const bucketsPhase2 = Math.round(totalPhase2 / 8);

  // Sync calculation with FastAPI Backend
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsCalculatingBackend(true);
      try {
        const res = await calculateFertilizerBlend({
          field_area_ha: safeArea,
          crop_phase_dat: currentHst,
          target_yield_ton_ha: safeYield,
          soil_type: 'clay_alkaline',
        });
        if (res && !isCancelled) {
          setBackendBlend(res);
        }
      } catch (err) {
        console.warn('Blend calculation API call failed:', err);
      } finally {
        if (!isCancelled) setIsCalculatingBackend(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [safeArea, safeYield, currentHst]);

  // Load real fertilization history from TimescaleDB on mount
  useEffect(() => {
    let isMounted = true;
    getFertilizerLogs('BLOK-A').then((data) => {
      if (isMounted && data && data.length > 0) {
        const mapped: ApplicationLog[] = data.map((d) => ({
          id: d.log_id,
          stageName: d.stage_name,
          hst: d.hst,
          dateStr: d.date_str,
          mixtureSummary: d.mixture_summary,
          avriAtApplication: d.avri_at_time,
          statusText: d.status_text,
        }));
        setLogs(mapped);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddLog = (newLog: ApplicationLog) => {
    setLogs((prev) => [newLog, ...prev]);
    setToastMessage('✓ Catatan pemupukan berhasil disinkronkan ke Digital Twin (F_log) & TimescaleDB.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Preskripsi, Kalender Tanam & Kalkulator Pupuk
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pusat perencanaan agronomi untuk Blok A · Hibrida Bisi-18 · {areaHa.toString().replace('.', ',')} ha
        </p>
      </div>

      {/* ================= FITUR A: DYNAMIC DAT TRACKER ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
        {/* Top Controls: Title & Inputs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
              FITUR A · DYNAMIC DAT TRACKER
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              Kalender Siklus Tanam Otomatis & Early–Warning Logistik
            </h3>
          </div>

          {/* Form Inputs (Date, Variety, Age) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tanggal Tanam */}
            <div>
              <label className="block text-3xs font-semibold text-slate-500 mb-1">
                Tanggal Tanam
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Varietas Jagung */}
            <div>
              <label className="block text-3xs font-semibold text-slate-500 mb-1">
                Varietas Jagung
              </label>
              <select
                value={seedVariety}
                onChange={(e) => setSeedVariety(e.target.value)}
                className="text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="Hibrida Bisi-18">Hibrida Bisi-18</option>
                <option value="NK-212">NK-212</option>
                <option value="Pioneer P27">Pioneer P27</option>
              </select>
            </div>

            {/* Umur Tanaman Card */}
            <div className="bg-[#EDF8EE] border border-[#C6E7C9] rounded-xl px-4 py-1.5 text-center shrink-0">
              <span className="text-3xs font-bold text-[#276A32] uppercase tracking-wider block">
                UMUR TANAMAN
              </span>
              <span className="text-base font-extrabold text-[#1A5323] block leading-tight">
                {currentHst} HST
              </span>
            </div>
          </div>
        </div>

        {/* 5 Phenology Timeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {initialAgronomyData.stages.map((stage) => {
            const isActive = stage.id === 'v8'; // Active phase in screenshot
            return (
              <div
                key={stage.id}
                className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative ${
                  isActive
                    ? 'bg-[#F2F9F3] border-[#16A34A] shadow-xs ring-2 ring-[#16A34A]/20'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2.5 right-3 bg-[#1A5323] text-white text-3xs font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    Fase Aktif
                  </span>
                )}
                <div>
                  <span className="text-3xs font-bold text-slate-400 block mb-0.5">
                    {stage.hstRange}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {stage.name}
                  </h4>
                </div>
                <p className="text-3xs sm:text-2xs text-slate-500 mt-2 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Early-Warning Logistik Card (H-3 WhatsApp) */}
        <div className="bg-[#F0F7FF] rounded-2xl p-4 sm:p-5 border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-2xs font-bold text-blue-800 tracking-wider uppercase block">
                EARLY–WARNING LOGISTIK PUPUK (PENGINGAT H-3)
              </span>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Halo Pak Suparman, 3 hari lagi tanaman jagung Anda memasuki fase V8 ({currentHst} HST). Segera siapkan/tebus {sacksPhase2} karung pupuk campuran di Kios Pupuk Desa. VolatiSafe sedang memantau cuaca & jam terbaik untuk hari penaburan.&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs transition-all shrink-0 active:scale-95 shadow-xs"
          >
            Lihat di HP Petani
          </button>
        </div>
      </section>

      {/* ================= LOWER SECTION: CALCULATOR (LEFT) + LOGS (RIGHT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= FITUR B: MULTI-FERTILIZER BLENDER (7 cols on lg) ================= */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                FITUR B · PERMENTAN NO. 40/2007 & BALITBANGTAN
              </span>
              {backendBlend && (
                <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isCalculatingBackend ? 'Menghitung...' : 'AI Backend Sync'}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              Kalkulator Campuran Pupuk Majemuk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Konversi kg laboratorium ke takaran fisik lapangan: 1 karung = 50 kg, 1 ember takar = 8 kg.
              {backendBlend?.application_stage ? ` (${backendBlend.application_stage})` : ''}
            </p>
          </div>

          {/* USER INSTRUCTION: TYPED NUMERIC INPUTS (Input-an Ketik) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: Luas Lahan Garapan (Ketik) */}
            <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-emerald-100 flex flex-col justify-between">
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                Luas Lahan Garapan
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="100"
                  value={areaHa}
                  onChange={(e) => setAreaHa(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg sm:text-xl font-extrabold text-[#1B6633] px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <span className="text-xs font-bold text-slate-600 px-3 py-2 rounded-xl bg-slate-200 shrink-0">
                  Ha
                </span>
              </div>
              <span className="text-3xs text-slate-400 mt-1 block">
                Setara {(areaHa * 10000).toLocaleString('id-ID')} m²
              </span>
            </div>

            {/* Input 2: Target Tonase Panen (Ketik) */}
            <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-emerald-100 flex flex-col justify-between">
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                Target Tonase Panen
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={targetYield}
                  onChange={(e) => setTargetYield(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg sm:text-xl font-extrabold text-[#1B6633] px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <span className="text-xs font-bold text-slate-600 px-3 py-2 rounded-xl bg-slate-200 shrink-0">
                  Ton/Ha
                </span>
              </div>
              <span className="text-3xs text-slate-400 mt-1 block">
                Estimasi {(areaHa * targetYield).toFixed(1).replace('.', ',')} ton pipilan kering
              </span>
            </div>
          </div>

          {/* Output Preskripsi Racikan Dua Kolom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Pemupukan I (10–14 HST) */}
            <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-sky-800 uppercase tracking-wide">
                    PEMUPUKAN I (10–14 HST)
                  </span>
                  <span className="text-3xs font-semibold text-slate-400">
                    Total {totalPhase1} kg
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  <p>NPK Phonska (15-15-15): <strong className="text-slate-900">{phonska1} kg</strong></p>
                  <p>Pupuk Urea (46% N): <strong className="text-slate-900">{urea1} kg</strong></p>
                  <p>Pupuk ZA (21% N, 24% S): <strong className="text-slate-900">{za1} kg</strong></p>
                </div>
              </div>

              {/* Physical Badges: Karung & Ember */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  {sacksPhase1} Karung
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  {bucketsPhase1} Ember
                </span>
              </div>
            </div>

            {/* Box 2: Pemupukan II (30–35 HST) */}
            <div className="rounded-2xl p-4 bg-[#F2F9F3] border border-emerald-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-emerald-800 uppercase tracking-wide">
                    PEMUPUKAN II (30–35 HST)
                  </span>
                  <span className="text-3xs font-semibold text-slate-400">
                    Total {totalPhase2} kg
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  <p>Pupuk Urea (Fokus N): <strong className="text-slate-900">{urea2} kg</strong></p>
                  <p>NPK Phonska: <strong className="text-slate-900">{phonska2} kg</strong></p>
                  <p className="text-3xs text-emerald-700 font-semibold italic mt-1">
                    *Wajib ditebar saat AVRI &le; 30%
                  </p>
                </div>
              </div>

              {/* Physical Badges: Karung & Ember */}
              <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/80">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  {sacksPhase2} Karung
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  {bucketsPhase2} Ember
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATATAN APLIKASI AKTUAL (5 cols on lg) ================= */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Catatan Aplikasi Aktual
              </h3>
              <p className="text-3xs text-slate-400 font-medium">
                Sinkron ke Digital Twin (F_log)
              </p>
            </div>
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Pemupukan</span>
            </button>
          </div>

          {/* List of Logs */}
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    {log.stageName} · {log.hst} HST
                  </span>
                  <span className="text-3xs text-slate-400 font-mono">
                    {log.dateStr}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {log.mixtureSummary}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-2xs text-slate-500 font-medium">
                    AVRI saat tebar: <strong>{log.avriAtApplication}%</strong>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-3xs font-bold">
                    {log.statusText}
                  </span>
                </div>
              </div>
            ))}

            {/* Pending Log Placeholder Card */}
            <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-1">
              <p>Belum ada log pemupukan II: jendela aman berikutnya akan diberi tahu lewat WhatsApp.</p>
            </div>
          </div>

          {/* Technical Info Box */}
          <p className="text-3xs text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
            Setiap pencatatan memperbarui <code>last_urea_kg</code> dan koreksi pengasaman lambat <code>pH(t+1) = pH(t) - 0.002 * N_applied</code> pada Digital Twin.
          </p>
        </section>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppPreviewModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        fieldId="BLOK-A"
        defaultAlertType="h_minus_3"
        messageText={`Halo Pak Suparman, 3 hari lagi tanaman jagung Anda memasuki fase V8 (${currentHst} HST). Segera siapkan/tebus ${sacksPhase2} karung pupuk campuran di Kios Pupuk Desa. VolatiSafe sedang memantau cuaca & jam terbaik untuk hari penaburan.`}
      />

      {/* Record Modal */}
      <RecordFertilizerModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleAddLog}
        currentHst={currentHst}
        fieldId="BLOK-A"
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
