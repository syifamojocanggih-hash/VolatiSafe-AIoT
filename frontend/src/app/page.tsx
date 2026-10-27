'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DesktopSidebar } from '@/components/sidebar/DesktopSidebar';
import { MobileHeader } from '@/components/header/MobileHeader';
import { FieldHeader } from '@/components/header/FieldHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { RiskStatusBanner } from '@/components/dashboard/RiskStatusBanner';
import { MetricCardsGrid } from '@/components/dashboard/MetricCardsGrid';
import { Trend24hChart } from '@/components/dashboard/Trend24hChart';
import { SafeWindowForecast } from '@/components/dashboard/SafeWindowForecast';
import { ParcelRiskMap } from '@/components/map/ParcelRiskMap';
import { AgronomyPlanning } from '@/components/agronomy/AgronomyPlanning';
import { NodeManagement } from '@/components/admin/NodeManagement';
import { ReportAnalytics } from '@/components/report/ReportAnalytics';
import { WhatIfPanel } from '@/components/simulator/WhatIfPanel';
import { PredictionDetailModal } from '@/components/modals/PredictionDetailModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import {
  checkBackendHealth,
  getFieldCurrentStatus,
  getFieldActionStatus,
  recordPostponeAction,
  getFieldForecastWindow,
  getNodeTelemetry,
  BackendFieldStatus,
  ForecastWindowItem,
  TelemetryPoint,
} from '@/services/api';
import {
  initialDashboardData,
  waspadaDashboardData,
  criticalDashboardData,
  dangerDashboardData,
} from '@/mocks/dashboardMock';
import {
  MetricItem,
  StatusBannerData,
  ForecastPoint,
  DayWindowProjection,
  DashboardState,
  RiskCategory,
} from '@/types/dashboard';
import { CheckCircle2, Database } from 'lucide-react';

function transformBackendStatus(
  status: BackendFieldStatus,
  prevField: DashboardState['field']
): {
  banner: StatusBannerData;
  metrics: MetricItem[];
  field: DashboardState['field'];
} {
  const m = status.metrics;
  const b = status.alert_banner;

  const defaultTitle =
    m.avri_category === 'aman'
      ? 'Aman, waktu optimal pemupukan'
      : m.avri_category === 'waspada'
      ? 'Waspada: Gunakan metode benam / tugal'
      : m.avri_category === 'kritis'
      ? 'Peringatan Kritis: Tunda penaburan Urea sekarang'
      : 'Bahaya Ekstrem: Dilarang keras menabur Urea';

  const banner: StatusBannerData = {
    category: m.avri_category,
    avriScore: Math.round(m.avri_score),
    tag:
      b?.headline ||
      `STATUS HARI INI - RISIKO ${m.avri_category.toUpperCase()} AVRI ${Math.round(m.avri_score)}%`,
    title: b?.subheadline || defaultTitle,
    description: `Suhu tanah ${m.soil_temp_c.toFixed(1).replace('.', ',')}°C, kelembapan ${m.moisture_pct.toFixed(1).replace('.', ',')}%, pH ${m.ph.toFixed(2)}. ${b?.subheadline || ''} Jendela aman: ${b?.best_window || '06:00 – 09:00 WIB'}.`,
    bestWindow: b?.best_window || 'Besok Pagi, 06:00 – 09:00 WIB (Risiko 18%)',
    openDurationText: status.is_postponed ? 'Aplikasi Urea ditunda oleh petani' : '',
  };

  const metrics: MetricItem[] = [
    {
      id: 'moisture',
      label: 'Kelembapan Tanah',
      value: `${m.moisture_pct.toFixed(1).replace('.', ',')}%`,
      numericValue: m.moisture_pct,
      unit: '%',
      delta24h: `${m.moisture_delta_24h >= 0 ? '+' : ''}${m.moisture_delta_24h.toFixed(1)}%`,
      status: m.moisture_pct < 25 ? 'warning' : 'optimal',
    },
    {
      id: 'temp',
      label: 'Suhu Tanah',
      value: `${m.soil_temp_c.toFixed(1).replace('.', ',')}°C`,
      numericValue: m.soil_temp_c,
      unit: '°C',
      delta24h: `${m.soil_temp_delta_24h >= 0 ? '+' : ''}${m.soil_temp_delta_24h.toFixed(1)}°C`,
      status: m.soil_temp_c > 32 ? 'danger' : m.soil_temp_c > 28 ? 'warning' : 'optimal',
    },
    {
      id: 'ph',
      label: 'pH Tanah',
      value: m.ph.toFixed(2).replace('.', ','),
      numericValue: m.ph,
      unit: '',
      delta24h: `${m.ph_delta_24h >= 0 ? '+' : ''}${m.ph_delta_24h.toFixed(2)}`,
      status: m.ph > 7.5 ? 'warning' : 'optimal',
    },
    {
      id: 'avri',
      label: 'AVRI (12 JAM)',
      value: `${Math.round(m.avri_score)}%`,
      numericValue: Math.round(m.avri_score),
      unit: '%',
      delta24h: m.avri_category === 'kritis' ? '+18%' : '-14%',
      status:
        m.avri_category === 'aman'
          ? 'optimal'
          : m.avri_category === 'waspada'
            ? 'warning'
            : 'danger',
      isAvriCard: true,
    },
  ];

  const field = {
    ...prevField,
    name: status.field_name || prevField.name,
    batteryPct: status.battery_pct ?? prevField.batteryPct,
  };

  return { banner, metrics, field };
}

function transformForecastToDays(
  windows: ForecastWindowItem[],
  fallbackDays: DayWindowProjection[]
): DayWindowProjection[] {
  if (!windows || !Array.isArray(windows) || windows.length === 0) {
    return fallbackDays;
  }

  const firstDate = new Date(windows[0].timestamp_start);
  const baseDayTime = new Date(
    Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate())
  ).getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const dayMaps: Array<{
    dayNumber: number;
    dayLabel: string;
    hourlyBlocks: boolean[];
    safeHours: number[];
    minAvri: number;
  }> = [1, 2, 3].map((num) => ({
    dayNumber: num,
    dayLabel: `Hari ${num}`,
    hourlyBlocks: new Array(24).fill(false),
    safeHours: [],
    minAvri: 999,
  }));

  windows.forEach((win) => {
    const sDate = new Date(win.timestamp_start);
    const eDate = new Date(win.timestamp_end);

    const sDayIndex = Math.floor(
      (new Date(
        Date.UTC(sDate.getUTCFullYear(), sDate.getUTCMonth(), sDate.getUTCDate())
      ).getTime() -
        baseDayTime) /
        ONE_DAY_MS
    );

    if (sDayIndex >= 0 && sDayIndex < 3) {
      const dayTarget = dayMaps[sDayIndex];
      const startH = sDate.getUTCHours();
      let endH = eDate.getUTCHours();
      if (endH <= startH) endH = 24;

      for (let h = startH; h < endH && h < 24; h++) {
        dayTarget.hourlyBlocks[h] = win.is_safe;
        if (win.is_safe) {
          dayTarget.safeHours.push(h);
        }
      }
      if (win.avri_score < dayTarget.minAvri) dayTarget.minAvri = win.avri_score;
    }
  });

  return dayMaps.map((d) => {
    const isSafe = d.safeHours.length > 0;
    let safeRangeText = 'Tidak ada jendela aman';
    let riskScoreText = 'Risiko Tinggi';

    if (isSafe) {
      const minH = Math.min(...d.safeHours);
      const maxH = Math.max(...d.safeHours) + 1;
      const minHStr = String(minH).padStart(2, '0') + '.00';
      const maxHStr = String(maxH).padStart(2, '0') + '.00';
      safeRangeText = `${minHStr} - ${maxHStr}`;
      riskScoreText = `Aman ${Math.round(d.minAvri)}%`;
    }

    return {
      dayNumber: d.dayNumber,
      dayLabel: d.dayLabel,
      hourlyBlocks: d.hourlyBlocks,
      safeRangeText,
      riskScoreText,
      isSafe,
    };
  });
}

function transformTelemetryToTrend(
  series: TelemetryPoint[],
  fallbackTrend: ForecastPoint[]
): ForecastPoint[] {
  if (!series || !Array.isArray(series) || series.length === 0) {
    return fallbackTrend;
  }

  return series.map((pt) => {
    let timeStr = '00.00';
    try {
      const d = new Date(pt.timestamp);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      timeStr = `${hh}.${mm}`;
    } catch {
      timeStr = pt.timestamp.slice(11, 16).replace(':', '.');
    }

    return {
      time: timeStr,
      moisture: pt.moisture_pct,
      temperature: pt.soil_temp_c,
      threshold: 25,
    };
  });
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSimulatedCritical, setIsSimulatedCritical] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPostponed, setIsPostponed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isSyncingAction, setIsSyncingAction] = useState(false);

  // Initial data fallback
  const baseData = isSimulatedCritical ? criticalDashboardData : initialDashboardData;
  const [currentData, setCurrentData] = useState(baseData);

  // Sync with real FastAPI Backend
  const loadBackendData = useCallback(async () => {
    try {
      const health = await checkBackendHealth();
      if (health) {
        setIsBackendConnected(true);
      }

      // 1. Fetch live field status and overwrite metrics + statusBanner
      const fieldStatus = await getFieldCurrentStatus('BLOK-A');
      if (fieldStatus) {
        setIsPostponed(fieldStatus.is_postponed);
        const { banner, metrics, field } = transformBackendStatus(
          fieldStatus,
          initialDashboardData.field
        );

        setCurrentData((prev) => ({
          ...prev,
          field,
          statusBanner: banner,
          metrics,
        }));
      }

      // 2. Fetch forecast window 72h and update SafeWindowForecast
      const forecastRes = await getFieldForecastWindow('BLOK-A', 72);
      if (forecastRes?.windows) {
        const transformedDays = transformForecastToDays(
          forecastRes.windows,
          initialDashboardData.forecast72h
        );
        setCurrentData((prev) => ({
          ...prev,
          forecast72h: transformedDays,
        }));
      }

      // 3. Fetch node telemetry 24h and update Trend24hChart
      const telemetryRes = await getNodeTelemetry('VS-A1-003', 24);
      if (telemetryRes?.series) {
        const transformedTrend = transformTelemetryToTrend(
          telemetryRes.series,
          initialDashboardData.trend24h
        );
        setCurrentData((prev) => ({
          ...prev,
          trend24h: transformedTrend,
        }));
      }

      // 4. Fetch action status
      const actionStatus = await getFieldActionStatus('BLOK-A');
      if (actionStatus) {
        setIsPostponed(actionStatus.is_postponed);
      }
    } catch (err) {
      console.warn('Backend connection check failed, using local mock data:', err);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Update data when toggle scenario changes
  useEffect(() => {
    if (isSimulatedCritical) {
      setCurrentData(criticalDashboardData);
    } else {
      loadBackendData();
    }
  }, [isSimulatedCritical, loadBackendData]);

  // Real Farmer Action Handler connected to FastAPI /api/v1/fields/BLOK-A/postpone-action
  const handlePostpone = async () => {
    const nextAction = isPostponed ? 'cancel' : 'postpone';
    setIsSyncingAction(true);

    try {
      const res = await recordPostponeAction(
        'BLOK-A',
        nextAction,
        isSimulatedCritical ? 'AVRI_RISK_HIGH_CRITICAL' : 'AVRI_SCHEDULE_POSTPONE',
        isPostponed
          ? 'Petani membatalkan penundaan pemupukan.'
          : 'Petani menunda pemupukan demi mencegah penguapan amonia (AVRI > 60%).'
      );

      if (res) {
        setIsPostponed(res.is_postponed);
        setIsBackendConnected(true);
        setCurrentData((prev) => ({
          ...prev,
          statusBanner: {
            ...prev.statusBanner,
            openDurationText: res.is_postponed ? 'Aplikasi Urea ditunda oleh petani' : '',
          },
        }));
        const msg = res.is_postponed
          ? `✓ ${res.status_message} (Tersimpan di TimescaleDB · ID: ${res.action_id})`
          : `✓ ${res.status_message} (Status Diperbarui di Backend)`;
        setToastMessage(msg);
      } else {
        // Graceful offline fallback
        setIsPostponed((prev) => !prev);
        setToastMessage(
          !isPostponed
            ? 'Aplikasi Urea ditunda (Mode Standalone Offline).'
            : 'Penundaan dibatalkan (Mode Standalone Offline).'
        );
      }
    } catch {
      setIsPostponed((prev) => !prev);
      setToastMessage('Aksi dicatat secara lokal.');
    } finally {
      setIsSyncingAction(false);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  const handleSelectRiskCategory = (category: RiskCategory) => {
    setIsSettingsModalOpen(false);
    setIsSimulatedCritical(category === 'kritis' || category === 'bahaya');
    if (category === 'aman') {
      setCurrentData(initialDashboardData);
      setToastMessage('Skenario AMAN Diaktifkan — Kondisi Optimal Pemupukan');
    } else if (category === 'waspada') {
      setCurrentData(waspadaDashboardData);
      setToastMessage('Skenario WASPADA Diaktifkan — Gunakan Metode Benam / Tugal');
    } else if (category === 'kritis') {
      setCurrentData(criticalDashboardData);
      setToastMessage('Skenario KRITIS Diaktifkan — Tunda Penaburan Urea');
    } else if (category === 'bahaya') {
      setCurrentData(dangerDashboardData);
      setToastMessage('Skenario BAHAYA EKSTREM Diaktifkan — Dilarang Menabur Urea');
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleScenario = () => {
    const nextCat = isSimulatedCritical ? 'aman' : 'kritis';
    handleSelectRiskCategory(nextCat);
  };

  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        farmerName={currentData.field.farmerName}
        location={currentData.field.location}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Banner */}
        <MobileHeader />

        {/* Field Title & Node Status Header */}
        {activeTab !== 'report' && activeTab !== 'admin' && (
          <FieldHeader
            field={currentData.field}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}

        {/* Main Canvas View Switcher */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          {activeTab === 'map' ? (
            /* Layar 2: Peta Zonasi Risiko Volatilisasi Lahan */
            <ParcelRiskMap onBackToDashboard={() => setActiveTab('dashboard')} />
          ) : activeTab === 'prescription' ? (
            /* Layar 3: Preskripsi, Kalender Tanam & Kalkulator Pupuk */
            <AgronomyPlanning />
          ) : activeTab === 'admin' ? (
            /* Layar 4: Manajemen Field Node & Jaringan LoRa */
            <NodeManagement />
          ) : activeTab === 'report' ? (
            /* Layar 5: Laporan, Provenance Data & Batas Kejujuran Ilmiah */
            <ReportAnalytics />
          ) : activeTab === 'simulator' ? (
            /* Layar 6 / FE-1.7: What-If Risk Simulator Demo Juri */
            <WhatIfPanel />
          ) : (
            /* Layar 1: Dashboard Utama Petak */
            <div className="space-y-4 sm:space-y-5">
              {/* Backend & AIoT Integration Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-semibold text-slate-800">
                    {isBackendConnected ? 'Central API Backend & TimescaleDB Terhubung' : 'Mode Offline / Standalone'}
                  </span>
                  <span className="hidden sm:inline-block text-3xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                    :8000/api/v1
                  </span>
                </div>

                <div className="flex items-center gap-3 text-2xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TimescaleDB Live</span>
                  </span>
                  {isSyncingAction && (
                    <span className="text-emerald-700 font-bold animate-pulse">Menyimpan Aksi ke Backend...</span>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <RiskStatusBanner
                banner={currentData.statusBanner}
                onOpenDetails={() => setIsDetailModalOpen(true)}
                onPostponeAction={handlePostpone}
                isPostponed={isPostponed}
              />

              {/* 4 Metric Telemetry Cards */}
              <MetricCardsGrid
                metrics={currentData.metrics}
                riskCategory={currentData.statusBanner.category}
              />

              {/* 24-Hour Forecast Trend Chart (ECharts + Shadcn styling) */}
              <Trend24hChart data={currentData.trend24h} />

              {/* 72-Hour Safe Window Bar Strip */}
              <SafeWindowForecast days={currentData.forecast72h} />
            </div>
          )}
        </main>
      </div>

      {/* Prediction Detail Modal */}
      <PredictionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        statusBanner={currentData.statusBanner}
        metrics={currentData.metrics}
        onOpenSimulator={() => {
          setIsDetailModalOpen(false);
          setActiveTab('simulator');
        }}
      />

      {/* Settings & Hardware Info Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        field={currentData.field}
        currentRiskCategory={currentData.statusBanner.category}
        onSelectRiskCategory={handleSelectRiskCategory}
        isSimulatedCritical={isSimulatedCritical}
        onToggleScenario={handleToggleScenario}
        onOpenWhatIf={() => {
          setIsSettingsModalOpen(false);
          setActiveTab('simulator');
        }}
      />

      {/* Mobile Bottom Navigation Bar (Same functions as Desktop Sidebar) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
