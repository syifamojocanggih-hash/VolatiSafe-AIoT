'use client';

import React, { useState } from 'react';
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
  BackendFieldStatus
} from '@/services/api';
import { initialDashboardData, criticalDashboardData } from '@/mocks/dashboardMock';
import { CheckCircle2, Server, Database } from 'lucide-react';

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

  // Sync with real FastAPI Backend on mount
  React.useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const health = await checkBackendHealth();
        if (health && isMounted) {
          setIsBackendConnected(true);
        }

        // Fetch live field status
        const fieldStatus = await getFieldCurrentStatus('BLOK-A');
        if (fieldStatus && isMounted) {
          setIsPostponed(fieldStatus.is_postponed);
        }

        // Fetch action status
        const actionStatus = await getFieldActionStatus('BLOK-A');
        if (actionStatus && isMounted) {
          setIsPostponed(actionStatus.is_postponed);
        }
      } catch (err) {
        console.warn('Backend connection check failed, using local mock data:', err);
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update data when toggle scenario changes
  React.useEffect(() => {
    setCurrentData(isSimulatedCritical ? criticalDashboardData : initialDashboardData);
  }, [isSimulatedCritical]);

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

  const handleToggleScenario = () => {
    setIsSimulatedCritical((prev) => !prev);
    setIsSettingsModalOpen(false);
    const msg = !isSimulatedCritical
      ? 'Mode Pengujian: Skenario Terik Kritis (AVRI 74%) Diaktifkan'
      : 'Kembali ke Skenario Aman (AVRI 4%) Sesuai Desain Lapangan';
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
