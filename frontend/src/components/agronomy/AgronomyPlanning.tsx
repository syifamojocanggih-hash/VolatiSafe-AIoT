'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initialAgronomyData } from '@/mocks/agronomyMock';
import { ApplicationLog, CropCycleResponse, GanttPhase } from '@/types/agronomy';
import {
  calculateFertilizerBlend,
  BlendCalculationResponse,
  getFertilizerLogs,
  getCropCycle,
  updateCropCycle,
} from '@/services/api';
import { WhatsAppPreviewModal } from '@/components/modals/WhatsAppPreviewModal';
import { RecordFertilizerModal } from '@/components/modals/RecordFertilizerModal';
import {
  Mail,
  Plus,
  CheckCircle2,
  Package,
  Layers,
  ChevronRight,
  Bell,
  Check,
} from 'lucide-react';

export const AgronomyPlanning: React.FC = () => {
  // Input States
  const [plantingDate, setPlantingDate] = useState(initialAgronomyData.plantingDate);
  const [seedVariety, setSeedVariety] = useState(initialAgronomyData.seedVariety);
  const [areaHa, setAreaHa] = useState<number>(initialAgronomyData.areaHa);
  const [targetYield, setTargetYield] = useState<number>(initialAgronomyData.targetYieldTonHa);

  // Backend Real-time Data
  const [cropCycle, setCropCycle] = useState<CropCycleResponse | null>(null);
  const [, setIsSyncing] = useState<boolean>(false);
  const [, setLastSyncTime] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApplicationLog[]>(initialAgronomyData.applicationLogs);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>('v8');

  // Modals & Feedback
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendBlend, setBackendBlend] = useState<BlendCalculationResponse | null>(null);
  const [, setIsCalculatingBackend] = useState(false);

  // Safe numeric fallbacks
  const safeArea = Math.max(0.01, areaHa || 0.75);
  const safeYield = Math.max(1, targetYield || 8.0);

  // Dynamic DAT Calculation (Days After Transplanting) fallback
  const calculateFallbackDat = (pDateStr: string) => {
    try {
      const plantTime = new Date(pDateStr).getTime();
      const nowTime = new Date().getTime();
      const diffDays = Math.max(0, Math.floor((nowTime - plantTime) / (1000 * 60 * 60 * 24)));
      return diffDays;
    } catch {
      return 30;
    }
  };

  const currentHst = cropCycle?.current_dat ?? calculateFallbackDat(plantingDate);
  const totalDuration = cropCycle?.total_duration_days ?? 105;
  const seasonProgressPct = Math.min(100, Math.max(0, Math.round((currentHst / totalDuration) * 100)));

  // 1. Initial Load: Fetch active crop cycle & fertilizer logs from backend TimescaleDB
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsSyncing(true);
        const [cycleRes, logRes] = await Promise.all([
          getCropCycle('BLOK-A'),
          getFertilizerLogs('BLOK-A'),
        ]);

        if (isMounted && cycleRes) {
          setCropCycle(cycleRes);
          setPlantingDate(cycleRes.planting_date);
          setSeedVariety(cycleRes.seed_variety || 'Hibrida Bisi-18');
          setAreaHa(cycleRes.field_area_ha || 0.75);
          setTargetYield(cycleRes.target_yield_ton_ha || 8.0);
          setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          // Auto select active phase
          const active = cycleRes.gantt_phases.find((p) => p.status === 'active');
          if (active) setSelectedPhaseId(active.id);
        }

        if (isMounted && logRes && logRes.length > 0) {
          const mapped: ApplicationLog[] = logRes.map((d) => ({
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
      } catch (err) {
        console.warn('Failed to load initial agronomy data:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-Time Auto Adjustment: When user modifies planting date, seed variety, area, or target yield
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const updated = await updateCropCycle({
          field_id: 'BLOK-A',
          planting_date: plantingDate,
          seed_variety: seedVariety,
          field_area_ha: safeArea,
          target_yield_ton_ha: safeYield,
        });

        if (updated && !isCancelled) {
          setCropCycle(updated);
          setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) {
        console.warn('Real-time crop cycle update failed:', err);
      } finally {
        if (!isCancelled) setIsSyncing(false);
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [plantingDate, seedVariety, safeArea, safeYield]);

  // 3. Dynamic Fertilizer Scaling Factor
  const scaling = (safeArea / 0.75) * (safeYield / 8.0);

  // Phase I (10–14 HST)
  const phonska1 = Math.round(112 * scaling);
  const urea1 = Math.round(38 * scaling);
  const za1 = Math.round(38 * scaling);
  const totalPhase1 = phonska1 + urea1 + za1;
  const sacksPhase1 = (totalPhase1 / 50).toFixed(1).replace('.', ',');
  const bucketsPhase1 = Math.round(totalPhase1 / 8);

  // Phase II (30–35 HST)
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
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [safeArea, safeYield, currentHst]);

  const handleAddLog = (newLog: ApplicationLog) => {
    setLogs((prev) => [newLog, ...prev]);
    setToastMessage('✓ Catatan pemupukan berhasil disinkronkan ke Digital Twin (F_log) & TimescaleDB.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper date formatter
  const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper date short (day & month)
  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate ticks for Gantt Timeline header
  const ganttTicks = useMemo(() => {
    const ticks = [0, 15, 30, 45, 60, 75, 90, totalDuration];
    const base = new Date(plantingDate);
    return ticks.map((hst) => {
      const tickDate = new Date(base.getTime() + hst * 24 * 60 * 60 * 1000);
      return {
        hst,
        pct: Math.min(100, Math.max(0, (hst / totalDuration) * 100)),
        dateStr: tickDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      };
    });
  }, [plantingDate, totalDuration]);

  // Selected phase detail object
  const activePhase = cropCycle?.gantt_phases.find((p) => p.status === 'active') || cropCycle?.gantt_phases[2];
  const selectedPhase = cropCycle?.gantt_phases.find((p) => p.id === selectedPhaseId) || activePhase;

  // Milestone for H-3 WhatsApp preview
  const upcomingMilestone = cropCycle?.milestones?.find((m) => m.target_dat >= currentHst) || cropCycle?.milestones?.[1];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Preskripsi, Kalender Tanam & Kalkulator Pupuk
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pusat perencanaan agronomi untuk Blok A · {seedVariety} · {areaHa.toString().replace('.', ',')} ha · Model Gantt Fenologi Real-Time
        </p>
      </div>

      {/* ================= FITUR A: GANTT CHART FENOLOGI REAL-TIME ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
        {/* Top Header: Title & Inputs separated by Vertical Divider */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          {/* Sisi Kiri: Judul & Keterangan */}
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Kalender Siklus Tanam Dinamis
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-xl">
              Sebagai Pusat perencanaan untuk menyesuaikan progress dan gambaran apa yang harus dilakukan kedepannya
            </p>
          </div>

          {/* Sisi Kanan: Input Tanggal Tanam & Varietas (dengan Pembatas Garis Vertikal) */}
          <div className="flex items-center gap-6 shrink-0 lg:border-l lg:border-slate-200 lg:pl-6">
            {/* Tanggal Tanam */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tanggal tanam
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Varietas Benih Jagung */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Varietas Benih jagung
              </label>
              <select
                value={seedVariety}
                onChange={(e) => setSeedVariety(e.target.value)}
                className="text-xs font-semibold text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="Hibrida Bisi-18">Hibrida Bisi-18 (105 Hari)</option>
                <option value="NK-212">NK-212 (100 Hari)</option>
                <option value="Pioneer P27">Pioneer P27 (110 Hari)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Garis Pembatas Horizontal */}
        <hr className="border-t border-slate-200 my-4" />

        {/* Progres Saat ini */}
        <div className="space-y-2">
          <div className="text-xs sm:text-sm font-bold text-slate-800">
            Progress Saat ini : <span className="text-[#65A30D] font-extrabold">{seasonProgressPct}%</span>
          </div>
          <div className="w-full h-7 rounded-xl border border-[#84CC16] bg-white p-0.5 overflow-hidden relative">
            <div
              className="h-full bg-[#84CC16]/90 rounded-lg transition-all duration-700 ease-out"
              style={{ width: `${seasonProgressPct}%` }}
            />
          </div>
        </div>

        {/* ================= GANTT CHART TIMELINE CONTAINER ================= */}
        <div className="pt-2">
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="min-w-[880px] bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
              {/* Header: Title on Left, Timeline Ticks on Right (Aligned Row per User Wireframe) */}
              <div className="grid grid-cols-12 gap-4 items-end pb-3 border-b border-slate-200">
                <div className="col-span-4 pl-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Fase Pertumbuhan Aksi
                  </h4>
                </div>
                <div className="col-span-8 relative h-8">
                  {ganttTicks.map((tick, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === ganttTicks.length - 1;
                    return (
                      <div
                        key={idx}
                        className={`absolute flex flex-col whitespace-nowrap ${
                          isFirst
                            ? 'left-0 items-start'
                            : isLast
                            ? 'right-0 items-end text-right'
                            : '-translate-x-1/2 items-center text-center'
                        }`}
                        style={!isFirst && !isLast ? { left: `${tick.pct}%` } : undefined}
                      >
                        <span className="font-bold text-slate-900 text-xs">{tick.hst} HST</span>
                        <span className="text-3xs text-slate-500 font-medium">{tick.dateStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6 Dynamic Phase Rows matching user mockup with grey background track */}
              <div className="space-y-2.5">
                {(cropCycle?.gantt_phases || []).map((phase: GanttPhase) => {
                  const isSelected = selectedPhaseId === phase.id;
                  const isActive = phase.status === 'active';
                  const isCompleted = phase.status === 'completed';

                  // Calculate left and width percentage relative to total duration
                  const leftPct = Math.max(0, Math.min(100, (phase.start_hst / totalDuration) * 100));
                  const widthPct = Math.max(3, Math.min(100 - leftPct, (phase.duration_days / totalDuration) * 100));

                  // Clean display name per mockup
                  const cleanName =
                    phase.id === 've'
                      ? 'Perkecambahan'
                      : phase.id === 'v3'
                      ? 'Fase Daun Tiga'
                      : phase.id === 'v8'
                      ? 'Fase Pertumbuhan Cepat (V8)'
                      : phase.id === 'v12'
                      ? 'Fase Bunting & Malai (V12)'
                      : phase.id === 'r3'
                      ? 'Fase Pengisian Biji & Pembuahan (R3)'
                      : phase.id === 'r6'
                      ? 'Fase Masak Fisiologis & Panen Raya (R6)'
                      : phase.name.split('·')[0].trim();

                  const dateRangeStr = `${formatDateShort(phase.start_date)} - ${formatDateShort(phase.end_date)}`;

                  return (
                    <div
                      key={phase.id}
                      onClick={() => setSelectedPhaseId(phase.id)}
                      className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-50/40 border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/30'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Phase Title & Dates formatted as "0-7 HST & 1 Nov - 8 Nov" */}
                      <div className="col-span-4 pl-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">{cleanName}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              Aktif
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center text-emerald-600" title="Selesai">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium mt-0.5 block truncate">
                          {phase.start_hst} - {phase.end_hst} HST &amp; {dateRangeStr}
                        </span>
                      </div>

                      {/* Right: Grey Rounded Track matching mockup */}
                      <div className="col-span-8 relative h-9 bg-[#E2E8F0]/80 rounded-lg p-0.5 border border-slate-200/60 overflow-hidden flex items-center">
                        {/* Subtle tick grid markers */}
                        {ganttTicks.slice(1, -1).map((t, i) => (
                          <div
                            key={i}
                            className="absolute inset-y-0 w-px bg-slate-300/40 pointer-events-none"
                            style={{ left: `${t.pct}%` }}
                          />
                        ))}

                        {/* Phase Bar positioned at its active HST window */}
                        <div
                          className={`absolute top-0.5 bottom-0.5 rounded-md transition-all duration-500 flex items-center px-2.5 shadow-xs overflow-hidden ${
                            isActive
                              ? 'bg-linear-to-r from-[#236B32] to-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                              : isCompleted
                              ? 'bg-[#236B32] text-white opacity-95'
                              : 'bg-white/95 border border-slate-300 text-slate-700'
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                        >
                          {/* Inner Progress for Active Phase */}
                          {isActive && (
                            <div
                              className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-500 pointer-events-none"
                              style={{ width: `${phase.progress_pct}%` }}
                            />
                          )}

                          <span className="relative z-10 text-3xs font-bold whitespace-nowrap truncate">
                            {isActive
                              ? `● Aktif (${currentHst} HST) · ${phase.fertilizer_action ? phase.fertilizer_action.split('·')[0] : 'Monitoring'}`
                              : isCompleted
                              ? `✓ Selesai · ${phase.duration_days} Hari`
                              : phase.fertilizer_action
                              ? phase.fertilizer_action.split('·')[0]
                              : phase.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Phase Detail Accordion / Card */}
          {selectedPhase && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {selectedPhase.id.toUpperCase()}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedPhase.name}
                    </h4>
                    <p className="text-3xs text-slate-500">
                      Rentang Umur: <strong className="text-emerald-900">{selectedPhase.subtitle}</strong> · Tanggal Kalender: <strong className="text-slate-800">{formatDateIndo(selectedPhase.start_date)}</strong> s/d <strong className="text-slate-800">{formatDateIndo(selectedPhase.end_date)}</strong> ({selectedPhase.duration_days} hari)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-3xs font-bold px-2.5 py-1 rounded-full border ${
                      selectedPhase.status === 'active'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : selectedPhase.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    Status: {selectedPhase.status === 'active' ? `⚡ Aktif (${selectedPhase.progress_pct}%)` : selectedPhase.status === 'completed' ? '✓ Selesai' : 'Mendatang'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Aksi Pemupukan */}
                <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-1">
                  <span className="text-3xs font-bold text-emerald-800 uppercase tracking-wide block">
                    REKOMENDASI AKSI LAPANGAN
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedPhase.fertilizer_action || 'Monitoring rutin kondisi tanah & kelembaban'}
                  </p>
                </div>

                {/* Deskripsi Agronomis */}
                <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-1">
                  <span className="text-3xs font-bold text-emerald-800 uppercase tracking-wide block">
                    DINAMIKA FENOLOGI & FISIKA TANAH
                  </span>
                  <p className="text-slate-600 text-3xs leading-relaxed">
                    {selectedPhase.description}
                  </p>
                </div>

                {/* Early Warning Logistik Date */}
                <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-1">
                  <span className="text-3xs font-bold text-blue-800 uppercase tracking-wide block flex items-center gap-1">
                    <Bell className="w-3 h-3 text-blue-600" />
                    PENGINGAT LOGISTIK H-3 KIOS
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedPhase.h3_reminder_date
                      ? formatDateIndo(selectedPhase.h3_reminder_date)
                      : 'Tidak ada pengingat tebus pupuk di fase ini'}
                  </p>
                  <p className="text-3xs text-slate-400">
                    Notifikasi otomatis terkirim via WhatsApp Gateway
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Early-Warning Logistik Card (H-3 WhatsApp) */}
        <div className="bg-[#F0F7FF] rounded-2xl p-4 sm:p-5 border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold text-blue-800 tracking-wider uppercase block">
                  EARLY–WARNING LOGISTIK PUPUK (PENGINGAT H-3 OTOMATIS)
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Halo Pak Suparman, 3 hari lagi tanaman jagung Anda memasuki {upcomingMilestone?.phase_name || 'fase V8'} ({currentHst} HST). Segera siapkan/tebus {sacksPhase2} karung pupuk campuran di Kios Pupuk Desa. VolatiSafe sedang memantau cuaca & jam terbaik untuk hari penaburan.&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs transition-all shrink-0 active:scale-95 shadow-xs flex items-center gap-1.5"
          >
            <span>Lihat di HP Petani</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ================= LOWER SECTION: CALCULATOR (LEFT) + LOGS (RIGHT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= FITUR B: MULTI-FERTILIZER BLENDER (7 cols on lg) ================= */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div>
              <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase block">
                FITUR B · PERMENTAN NO. 40/2007 & BALITBANGTAN
              </span>
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
        messageText={`Halo Pak Suparman, 3 hari lagi tanaman jagung Anda memasuki ${upcomingMilestone?.phase_name || 'fase V8'} (${currentHst} HST). Segera siapkan/tebus ${sacksPhase2} karung pupuk campuran di Kios Pupuk Desa. VolatiSafe sedang memantau cuaca & jam terbaik untuk hari penaburan.`}
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
