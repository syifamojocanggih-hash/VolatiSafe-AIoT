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
import { WhatsAppPreviewModal } from '@/components/modals/WhatsAppPreviewModal';
import {
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
  SafeWindowSegment,
  DashboardState,
  RiskCategory,
} from '@/types/dashboard';
import { useVolatiSafeWebSocket } from '@/services/websocket';
import { LiveTelemetryPayload } from '@/types/websocket';
import { CheckCircle2 } from 'lucide-react';

function transformBackendStatus(
  status: BackendFieldStatus,
  prevField: DashboardState['field']
): {
  banner: StatusBannerData;
  metrics: MetricItem[];
  field: DashboardState['field'];
  shapExplanations?: DashboardState['shapExplanations'];
  physicsDiagnostics?: DashboardState['physicsDiagnostics'];
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
      delta24h:
        m.avri_delta_24h != null
          ? `${m.avri_delta_24h >= 0 ? '+' : ''}${Math.round(m.avri_delta_24h)}%`
          : (m.avri_category === 'kritis' ? '+18%' : '-14%'),
      status:
        m.avri_category === 'aman'
          ? 'optimal'
          : m.avri_category === 'waspada'
            ? 'warning'
            : 'danger',
      isAvriCard: true,
    },
  ];

  const minutesAgo = status.last_updated
    ? Math.max(1, Math.round((Date.now() - new Date(status.last_updated).getTime()) / (60 * 1000)))
    : prevField.lastUpdatedMinutesAgo;

  const field: DashboardState['field'] = {
    ...prevField,
    name: status.field_name || prevField.name,
    farmerName: status.farmer_name || prevField.farmerName,
    areaHa: status.area_ha ?? prevField.areaHa,
    block: status.block || prevField.block,
    datDays: status.crop_age_days ?? prevField.datDays,
    phaseName: status.crop_phase || prevField.phaseName,
    batteryPct: status.battery_pct ?? prevField.batteryPct,
    lastUpdatedMinutesAgo:
      !isNaN(minutesAgo) && minutesAgo > 0 && minutesAgo < 1440
        ? minutesAgo
        : prevField.lastUpdatedMinutesAgo,
  };

  return {
    banner,
    metrics,
    field,
    shapExplanations: status.shap_explanations,
    physicsDiagnostics: status.physics_diagnostics,
  };
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
    hourlyCategories: RiskCategory[];
    safeHours: number[];
    minAvri: number;
    bestCategory: RiskCategory;
  }> = [1, 2, 3].map((num) => ({
    dayNumber: num,
    dayLabel: `Hari ${num}`,
    hourlyBlocks: new Array(24).fill(false),
    hourlyCategories: new Array<RiskCategory>(24).fill('kritis'),
    safeHours: [],
    minAvri: 999,
    bestCategory: 'kritis',
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

      const cat: RiskCategory =
        (win.risk_category as RiskCategory) ||
        (win.avri_score <= 30
          ? 'aman'
          : win.avri_score <= 60
            ? 'waspada'
            : win.avri_score <= 80
              ? 'kritis'
              : 'bahaya');

      for (let h = startH; h < endH && h < 24; h++) {
        dayTarget.hourlyBlocks[h] = win.is_safe;
        dayTarget.hourlyCategories[h] = cat;
        if (win.is_safe) {
          dayTarget.safeHours.push(h);
        }
      }
      if (win.avri_score < dayTarget.minAvri) {
        dayTarget.minAvri = win.avri_score;
        dayTarget.bestCategory = cat;
      }
    }
  });

  return dayMaps.map((d) => {
    const isSafe = d.safeHours.length > 0;
    let safeRangeText = 'Tidak ada jendela aman';
    let riskScoreText = 'Risiko Tinggi';
    const safeWindows: SafeWindowSegment[] = [];

    if (isSafe) {
      // Find contiguous clusters of safe hours
      const sortedHours = Array.from(new Set(d.safeHours)).sort((a, b) => a - b);
      const clusters: Array<{ start: number; end: number }> = [];
      let currentCluster: { start: number; end: number } | null = null;

      for (const h of sortedHours) {
        if (!currentCluster) {
          currentCluster = { start: h, end: h + 1 };
        } else if (h === currentCluster.end) {
          currentCluster.end = h + 1;
        } else {
          clusters.push(currentCluster);
          currentCluster = { start: h, end: h + 1 };
        }
      }
      if (currentCluster) {
        clusters.push(currentCluster);
      }

      clusters.forEach((c) => {
        const startStr = String(c.start).padStart(2, '0') + '.00';
        const endStr = String(c.end).padStart(2, '0') + '.00';
        const rangeText = `${startStr} – ${endStr}`;
        let periodLabel = 'Pagi';
        if (c.start >= 11 && c.start < 15) periodLabel = 'Siang';
        else if (c.start >= 15 && c.start < 18) periodLabel = 'Sore';
        else if (c.start >= 18 || c.start < 5) periodLabel = 'Malam';

        safeWindows.push({
          startHour: c.start,
          endHour: c.end,
          rangeText,
          riskScoreText: `${d.bestCategory === 'aman' ? 'Aman' : 'Waspada'} ${Math.round(d.minAvri)}%`,
          category: d.bestCategory,
          periodLabel,
        });
      });

      safeRangeText = safeWindows.map((w) => w.rangeText).join(' & ');
      riskScoreText = `${d.bestCategory === 'aman' ? 'Aman' : 'Waspada'} ${Math.round(d.minAvri)}%`;
    }

    return {
      dayNumber: d.dayNumber,
      dayLabel: d.dayLabel,
      hourlyBlocks: d.hourlyBlocks,
      hourlyCategories: d.hourlyCategories,
      category: isSafe ? d.bestCategory : 'kritis',
      safeRangeText,
      riskScoreText,
      isSafe,
      safeWindows,
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

  // Resample / bin incoming telemetry into 24 uniform hourly points: 00.00 - 23.00
  const hourlyBuckets: { [hour: number]: { moisture: number; temperature: number; ph?: number } } = {};

  series.forEach((pt) => {
    try {
      const d = new Date(pt.timestamp);
      const hour = !isNaN(d.getTime()) ? d.getUTCHours() : parseInt(pt.timestamp.slice(11, 13), 10);
      if (!isNaN(hour) && hour >= 0 && hour <= 23) {
        hourlyBuckets[hour] = {
          moisture: pt.moisture_pct,
          temperature: pt.soil_temp_c,
          ph: pt.ph,
        };
      }
    } catch {
      // ignore parse error
    }
  });

  // Always produce a clean 24-point sequence from 00.00 to 23.00
  return Array.from({ length: 24 }, (_, h) => {
    const timeStr = `${String(h).padStart(2, '0')}.00`;
    const bucket = hourlyBuckets[h];
    const fallback = fallbackTrend[h] || fallbackTrend[fallbackTrend.length - 1];

    return {
      time: timeStr,
      moisture: bucket ? Number(bucket.moisture.toFixed(1)) : (fallback?.moisture ?? 25),
      temperature: bucket ? Number(bucket.temperature.toFixed(1)) : (fallback?.temperature ?? 28),
      threshold: 25,
      ph: bucket?.ph != null ? Number(bucket.ph.toFixed(2)) : (fallback?.ph ?? 7.82),
    };
  });
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSimulatedCritical, setIsSimulatedCritical] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppAlertType, setWhatsAppAlertType] = useState<'critical' | 'h_minus_3' | 'daily_digest'>('critical');
  const [isPostponed, setIsPostponed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial data fallback
  const baseData = isSimulatedCritical ? criticalDashboardData : initialDashboardData;
  const [currentData, setCurrentData] = useState(baseData);

  // Sync with real FastAPI Backend
  const loadBackendData = useCallback(async () => {
    try {
      // Backend is alive, proceed

      // 1. Fetch live field status and overwrite metrics + statusBanner
      const fieldStatus = await getFieldCurrentStatus('BLOK-A');
      if (fieldStatus) {
        setIsPostponed(fieldStatus.is_postponed);
        const { banner, metrics, field, shapExplanations, physicsDiagnostics } = transformBackendStatus(
          fieldStatus,
          initialDashboardData.field
        );

        setCurrentData((prev) => ({
          ...prev,
          field,
          statusBanner: banner,
          metrics,
          shapExplanations,
          physicsDiagnostics,
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

  // Initial load on mount and auto-refresh telemetry every 30 seconds
  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 30000);
    return () => clearInterval(interval);
  }, [loadBackendData]);

  // Update data when toggle scenario changes
  useEffect(() => {
    if (isSimulatedCritical) {
      setCurrentData(criticalDashboardData);
    } else {
      loadBackendData();
    }
  }, [isSimulatedCritical, loadBackendData]);

  // Handle Instantaneous Live WebSocket Telemetry Update (INTERFACES.md §3.3)
  const handleLiveTelemetryUpdate = useCallback((data: LiveTelemetryPayload) => {
    const m = data.moisture_pct;
    const t = data.soil_temp_c;
    const ph = data.ph;
    const avri = Math.round(data.avri_score);
    const cat = data.risk_category;

    setCurrentData((prev) => {
      // 1. Update Metrics Cards
      const updatedMetrics: MetricItem[] = prev.metrics.map((item) => {
        if (item.id === 'moisture') {
          return {
            ...item,
            value: `${m.toFixed(1).replace('.', ',')}%`,
            numericValue: m,
            status: m < 25 ? 'warning' : 'optimal',
          };
        }
        if (item.id === 'temp') {
          return {
            ...item,
            value: `${t.toFixed(1).replace('.', ',')}°C`,
            numericValue: t,
            status: t > 32 ? 'danger' : t > 28 ? 'warning' : 'optimal',
          };
        }
        if (item.id === 'ph') {
          return {
            ...item,
            value: ph.toFixed(2).replace('.', ','),
            numericValue: ph,
            status: ph > 8.0 ? 'danger' : ph > 7.5 ? 'warning' : 'optimal',
          };
        }
        if (item.id === 'avri') {
          return {
            ...item,
            value: `${avri}%`,
            numericValue: avri,
            status: cat === 'aman' ? 'optimal' : cat === 'waspada' ? 'warning' : 'danger',
          };
        }
        return item;
      });

      // 2. Update Status Banner
      const defaultTitle =
        cat === 'aman'
          ? 'Aman, waktu optimal pemupukan'
          : cat === 'waspada'
          ? 'Waspada: Gunakan metode benam / tugal'
          : cat === 'kritis'
          ? 'Peringatan Kritis: Tunda penaburan Urea sekarang'
          : 'Bahaya Ekstrem: Dilarang keras menabur Urea';

      const updatedBanner: StatusBannerData = {
        ...prev.statusBanner,
        category: cat,
        avriScore: avri,
        tag: `LIVE STREAM — RISIKO ${cat.toUpperCase()} AVRI ${avri}%`,
        title: data.prediction?.prescription?.headline || defaultTitle,
        description: `Suhu tanah ${t.toFixed(1).replace('.', ',')}°C, kelembapan ${m.toFixed(1).replace('.', ',')}%, pH ${ph.toFixed(2)}. ${
          data.prediction?.prescription?.recommendation || ''
        }`,
      };

      // 3. Update SHAP Explanations & Physics Diagnostics if present
      const shapExplanations: DashboardState['shapExplanations'] =
        data.prediction?.prescription?.shap_explanations
          ? data.prediction.prescription.shap_explanations.map((s) => ({
              feature: s.feature || s.factor || 'Fitur',
              label: s.label || s.impact_label || s.factor || 'Faktor',
              impact_pct: s.impact_pct ?? (s.attribution_pct != null ? Math.round(s.attribution_pct) : 15),
              direction: s.direction || 'up',
              explanation: s.explanation || s.impact_label,
            }))
          : prev.shapExplanations;

      const physicsDiagnostics: DashboardState['physicsDiagnostics'] =
        data.prediction?.physics_diagnostics
          ? {
              k_urease_per_hour: data.prediction.physics_diagnostics.k_urease_per_hour ?? 0.042,
              hydrolysis_rate: data.prediction.physics_diagnostics.hydrolysis_rate ?? 0.038,
              is_physics_constrained: data.prediction.physics_diagnostics.is_physics_constrained ?? true,
              base_physics_score:
                data.prediction.physics_diagnostics.base_physics_score ??
                data.prediction.physics_diagnostics.arrhenius_kinetics_pct,
              residual_ai_score:
                data.prediction.physics_diagnostics.residual_ai_score ??
                data.prediction.physics_diagnostics.ai_residual_correction_pct,
              confidence_margin_pct:
                data.prediction.physics_diagnostics.confidence_margin_pct ??
                data.prediction.physics_diagnostics.confidence_interval_margin_pct,
            }
          : prev.physicsDiagnostics;

      // 4. Update Field State Metadata
      const updatedField = {
        ...prev.field,
        lastUpdatedMinutesAgo: 0,
      };

      return {
        ...prev,
        metrics: updatedMetrics,
        statusBanner: updatedBanner,
        shapExplanations,
        physicsDiagnostics,
        field: updatedField,
      };
    });

    // Quick toast banner
    setToastMessage(
      `📡 Live Telemetri Baru [${data.node_id}]: AVRI ${Math.round(data.avri_score)}% (${data.risk_category.toUpperCase()})`
    );
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Hook into WebSocket live stream
  const { status: wsStatus } = useVolatiSafeWebSocket({
    enabled: true,
    clientId: 'dashboard-cockpit',
    onTelemetryUpdate: handleLiveTelemetryUpdate,
    onAlertTriggered: (alertData: unknown) => {
      const alertObj = alertData as Record<string, unknown> | undefined;
      setToastMessage(
        `🚨 PERINGATAN KRITIS: ${(alertObj?.headline as string) || 'Risiko volatilisasi melonjak ke zona kritis!'}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Real Farmer Action Handler connected to FastAPI /api/v1/fields/BLOK-A/postpone-action
  const handlePostpone = async () => {
    const nextAction = isPostponed ? 'cancel' : 'postpone';

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
            wsStatus={wsStatus}
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

              {/* Status Banner */}
              <RiskStatusBanner
                banner={currentData.statusBanner}
                onOpenDetails={() => setIsDetailModalOpen(true)}
                onPostponeAction={handlePostpone}
                isPostponed={isPostponed}
                onOpenWhatsApp={() => {
                  setWhatsAppAlertType(currentData.statusBanner.category === 'aman' ? 'daily_digest' : 'critical');
                  setIsWhatsAppModalOpen(true);
                }}
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
        shapExplanations={currentData.shapExplanations}
        physicsDiagnostics={currentData.physicsDiagnostics}
        trend24h={currentData.trend24h}
        onOpenSimulator={() => {
          setIsDetailModalOpen(false);
          setActiveTab('simulator');
        }}
        onOpenWhatsApp={() => {
          setIsDetailModalOpen(false);
          setWhatsAppAlertType('critical');
          setIsWhatsAppModalOpen(true);
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

      {/* WhatsApp Petani Notification Preview & Simulation Modal */}
      <WhatsAppPreviewModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        fieldId={currentData.field.id}
        defaultAlertType={whatsAppAlertType}
        onNavigateWindow={() => {
          setActiveTab('dashboard');
        }}
        onNavigateCalculator={() => {
          setActiveTab('agronomy');
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
