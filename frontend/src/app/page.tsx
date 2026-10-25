'use client';

import React, { useState } from 'react';
import { DesktopSidebar } from '@/components/sidebar/DesktopSidebar';
import { MobileHeader } from '@/components/header/MobileHeader';
import { FieldHeader } from '@/components/header/FieldHeader';
import { RiskStatusBanner } from '@/components/dashboard/RiskStatusBanner';
import { MetricCardsGrid } from '@/components/dashboard/MetricCardsGrid';
import { Trend24hChart } from '@/components/dashboard/Trend24hChart';
import { SafeWindowForecast } from '@/components/dashboard/SafeWindowForecast';
import { ParcelRiskMap } from '@/components/map/ParcelRiskMap';
import { PredictionDetailModal } from '@/components/modals/PredictionDetailModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { initialDashboardData, criticalDashboardData } from '@/mocks/dashboardMock';
import { CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSimulatedCritical, setIsSimulatedCritical] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPostponed, setIsPostponed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data skenario (Aman sesuai mockup atau Terik Kritis)
  const currentData = isSimulatedCritical ? criticalDashboardData : initialDashboardData;

  const handlePostpone = () => {
    setIsPostponed((prev) => !prev);
    const msg = !isPostponed
      ? 'Aplikasi Urea berhasil ditunda. Sistem akan mengirim notifikasi saat jendela aman terbuka.'
      : 'Penundaan dibatalkan.';
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'dashboard' && tab !== 'map') {
            setToastMessage(`Modul "${tab}" sedang disiapkan untuk tahap selanjutnya.`);
            setTimeout(() => setToastMessage(null), 2500);
          }
        }}
        farmerName={currentData.field.farmerName}
        location={currentData.field.location}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Banner */}
        <MobileHeader />

        {/* Field Title & Node Status Header */}
        <FieldHeader
          field={currentData.field}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Canvas View Switcher */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'map' ? (
            /* Layar 2: Peta Zonasi Risiko Volatilisasi Lahan */
            <ParcelRiskMap onBackToDashboard={() => setActiveTab('dashboard')} />
          ) : (
            /* Layar 1: Dashboard Utama Petak */
            <div className="space-y-4 sm:space-y-5">
              {/* Status Banner */}
              <RiskStatusBanner
                banner={currentData.statusBanner}
                onOpenDetails={() => setIsDetailModalOpen(true)}
                onPostponeAction={handlePostpone}
                isPostponed={isPostponed}
              />

              {/* 4 Metric Telemetry Cards */}
              <MetricCardsGrid metrics={currentData.metrics} />

              {/* 24-Hour Forecast Trend Chart */}
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
      />

      {/* Settings & Hardware Info Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        field={currentData.field}
        isSimulatedCritical={isSimulatedCritical}
        onToggleScenario={handleToggleScenario}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
