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
  Calendar,
  Clock,
  ChevronRight,
  Bell,
  RefreshCw,
  Check,
  MapPin,
  Flame,
} from 'lucide-react';

export const AgronomyPlanning: React.FC = () => {
  // Input States
  const [plantingDate, setPlantingDate] = useState(initialAgronomyData.plantingDate);
  const [seedVariety, setSeedVariety] = useState(initialAgronomyData.seedVariety);
  const [areaHa, setAreaHa] = useState<number>(initialAgronomyData.areaHa);
  const [targetYield, setTargetYield] = useState<number>(initialAgronomyData.targetYieldTonHa);

  // Backend Real-time Data
  const [cropCycle, setCropCycle] = useState<CropCycleResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApplicationLog[]>(initialAgronomyData.applicationLogs);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>('v8');

  // Modals & Feedback
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendBlend, setBackendBlend] = useState<BlendCalculationResponse | null>(null);
  const [isCalculatingBackend, setIsCalculatingBackend] = useState(false);

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
        {/* Top Controls: Title, Realtime Status & Inputs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                FITUR A · REAL-TIME PHENOLOGY GANTT MODEL
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-semibold transition-all ${
                  isSyncing
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Realtime TimescaleDB Sync'}</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              Kalender Siklus Tanam Dinamis (0–{totalDuration} HST)
            </h3>
            <p className="text-xs text-slate-500">
              Gantt chart otomatis menyesuaikan tanggal kalender & early-warning logistik saat tanggal tanam atau varietas diubah.
              {lastSyncTime && <span className="ml-1 text-slate-400">· Terakhir sync: {lastSyncTime}</span>}
            </p>
          </div>

          {/* Form Inputs (Date, Variety, Age) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tanggal Tanam */}
            <div>
              <label className="block text-3xs font-semibold text-slate-500 mb-1">
                Tanggal Tanam (HST 0)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Varietas Jagung */}
            <div>
              <label className="block text-3xs font-semibold text-slate-500 mb-1">
                Varietas Benih Jagung
              </label>
              <select
                value={seedVariety}
                onChange={(e) => setSeedVariety(e.target.value)}
                className="text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="Hibrida Bisi-18">Hibrida Bisi-18 (105 Hari)</option>
                <option value="NK-212">NK-212 (100 Hari)</option>
                <option value="Pioneer P27">Pioneer P27 (110 Hari)</option>
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

            {/* Estimasi Panen Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-1.5 text-center shrink-0">
              <span className="text-3xs font-bold text-amber-800 uppercase tracking-wider block">
                ESTIMASI PANEN
              </span>
              <span className="text-xs font-extrabold text-amber-900 block leading-tight mt-0.5">
                {formatDateIndo(cropCycle?.harvest_estimate_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Progres Keseluruhan Musim Tanam */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-emerald-900">
              <Clock className="w-4 h-4 text-emerald-600" />
              Progres Siklus Tanam: Hari ke-{currentHst} dari {totalDuration} Hari ({seasonProgressPct}%)
            </span>
            <span className="text-3xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Fase Aktif: {cropCycle?.growth_stage || 'Fase V8 (Vegetatif Aktif)'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
            <div
              className="h-full bg-linear-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${seasonProgressPct}%` }}
            />
          </div>
        </div>

        {/* ================= GANTT CHART TIMELINE CONTAINER ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Gantt Chart Linimasa Fenologi & Pemupukan Jagung
            </span>
            <span className="text-3xs text-slate-400">
              Klik pada bar fase untuk melihat rekomendasi detail
            </span>
          </div>

          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="min-w-[840px] bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-3 relative">
              {/* Timeline Header (HST & Tanggal Markers) */}
              <div className="grid grid-cols-12 gap-2 text-3xs font-bold text-slate-400 border-b border-slate-200/90 pb-2">
                <div className="col-span-4 pl-1 text-slate-600">
                  FASE PERTUMBUHAN & AKSI
                </div>
                <div className="col-span-8 relative h-6">
                  {ganttTicks.map((tick, idx) => (
                    <div
                      key={idx}
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${tick.pct}%` }}
                    >
                      <span className="font-mono text-slate-600 font-bold">{tick.hst} HST</span>
                      <span className="text-3xs text-slate-400 font-normal">{tick.dateStr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Vertical Guide Line (Hari Ini Marker) */}
              <div
                className="absolute top-12 bottom-4 w-0.5 bg-amber-500 z-20 pointer-events-none transition-all duration-500"
                style={{
                  left: `calc(33.333% + (66.666% * ${Math.min(100, Math.max(0, currentHst / totalDuration)) / 100}))`,
                }}
              >
                <div className="absolute -top-7 -translate-x-1/2 bg-amber-600 text-white font-extrabold text-3xs px-2 py-0.5 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 animate-bounce">
                  <MapPin className="w-2.5 h-2.5" />
                  Hari Ini ({currentHst} HST)
                </div>
              </div>

              {/* Gantt Phase Tracks */}
              <div className="space-y-2.5 relative">
                {(cropCycle?.gantt_phases || []).map((phase: GanttPhase) => {
                  const isSelected = selectedPhaseId === phase.id;
                  const isActive = phase.status === 'active';
                  const isCompleted = phase.status === 'completed';

                  // Calculate left and width percentage relative to total duration
                  const leftPct = Math.max(0, Math.min(100, (phase.start_hst / totalDuration) * 100));
                  const widthPct = Math.max(2, Math.min(100 - leftPct, (phase.duration_days / totalDuration) * 100));

                  // Color themes mapping
                  const themeStyles = {
                    emerald: {
                      bgActive: 'from-emerald-500 to-teal-600 text-white shadow-emerald-200',
                      bgCompleted: 'bg-emerald-600 text-white',
                      bgUpcoming: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
                      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    },
                    amber: {
                      bgActive: 'from-amber-500 to-orange-600 text-white shadow-amber-200',
                      bgCompleted: 'bg-amber-600 text-white',
                      bgUpcoming: 'bg-amber-50/70 border-amber-200 text-amber-900',
                      badge: 'bg-amber-100 text-amber-800 border-amber-200',
                    },
                    purple: {
                      bgActive: 'from-purple-500 to-indigo-600 text-white shadow-purple-200',
                      bgCompleted: 'bg-purple-600 text-white',
                      bgUpcoming: 'bg-purple-50/70 border-purple-200 text-purple-900',
                      badge: 'bg-purple-100 text-purple-800 border-purple-200',
                    },
                    teal: {
                      bgActive: 'from-teal-500 to-cyan-600 text-white shadow-teal-200',
                      bgCompleted: 'bg-teal-600 text-white',
                      bgUpcoming: 'bg-teal-50/70 border-teal-200 text-teal-900',
                      badge: 'bg-teal-100 text-teal-800 border-teal-200',
                    },
                    rose: {
                      bgActive: 'from-rose-500 to-red-600 text-white shadow-rose-200',
                      bgCompleted: 'bg-rose-600 text-white',
                      bgUpcoming: 'bg-rose-50/70 border-rose-200 text-rose-900',
                      badge: 'bg-rose-100 text-rose-800 border-rose-200',
                    },
                    blue: {
                      bgActive: 'from-blue-500 to-sky-600 text-white shadow-blue-200',
                      bgCompleted: 'bg-blue-600 text-white',
                      bgUpcoming: 'bg-blue-50/70 border-blue-200 text-blue-900',
                      badge: 'bg-blue-100 text-blue-800 border-blue-200',
                    },
                  }[phase.color_theme] || {
                    bgActive: 'from-emerald-500 to-teal-600 text-white shadow-emerald-200',
                    bgCompleted: 'bg-emerald-600 text-white',
                    bgUpcoming: 'bg-slate-100 border-slate-300 text-slate-800',
                    badge: 'bg-slate-100 text-slate-800 border-slate-200',
                  };

                  return (
                    <div
                      key={phase.id}
                      onClick={() => setSelectedPhaseId(phase.id)}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-white border-emerald-500/80 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white/70 border-slate-200/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Phase Title, Code & Dates */}
                      <div className="col-span-4 flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            isActive
                              ? 'bg-amber-500 text-white shadow-xs'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {phase.id.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {phase.name.split('·')[0]}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                Aktif
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center text-emerald-600">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-3xs text-slate-400">
                            <span className="font-semibold text-slate-600">{phase.subtitle}</span>
                            <span>·</span>
                            <span>{formatDateShort(phase.start_date)} – {formatDateShort(phase.end_date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Track (Spanning Timeline) */}
                      <div className="col-span-8 relative h-9 bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/60 overflow-hidden flex items-center">
                        {/* The Phase Bar */}
                        <div
                          className={`absolute top-1 bottom-1 rounded-md transition-all duration-500 flex items-center px-2.5 shadow-xs overflow-hidden ${
                            isActive
                              ? `bg-linear-to-r ${themeStyles.bgActive} ring-2 ring-amber-400/50 shadow-md`
                              : isCompleted
                              ? `${themeStyles.bgCompleted} opacity-95`
                              : `${themeStyles.bgUpcoming} border border-dashed`
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

                          {/* Phase Label & Action inside Bar */}
                          <div className="relative z-10 flex items-center justify-between w-full min-w-0 text-3xs font-bold">
                            <span className="truncate flex items-center gap-1">
                              {isActive && <Flame className="w-3 h-3 text-yellow-300 animate-pulse shrink-0" />}
                              {phase.fertilizer_action ? phase.fertilizer_action.split('·')[0] : phase.name}
                            </span>
                            <span className="shrink-0 ml-1.5 opacity-90 font-mono text-3xs">
                              {isCompleted ? '100%' : isActive ? `${phase.progress_pct}%` : `${phase.duration_days}h`}
                            </span>
                          </div>
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
                <span className="text-3xs font-semibold px-2 py-0.2 rounded-full bg-blue-200/70 text-blue-900">
                  Target: {upcomingMilestone?.phase_name || 'Fase V8'}
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
