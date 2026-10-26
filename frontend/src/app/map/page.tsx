'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopSidebar } from '@/components/sidebar/DesktopSidebar';
import { MobileHeader } from '@/components/header/MobileHeader';
import { FieldHeader } from '@/components/header/FieldHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { ParcelRiskMap } from '@/components/map/ParcelRiskMap';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { initialDashboardData } from '@/mocks/dashboardMock';

export default function MapPage() {
  const router = useRouter();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSimulatedCritical, setIsSimulatedCritical] = useState(false);

  const handleNav = (tab: string) => {
    if (tab === 'dashboard') router.push('/');
    else if (tab === 'map') router.push('/map');
    else if (tab === 'prescription') router.push('/prescription');
    else if (tab === 'admin') router.push('/admin');
    else if (tab === 'report') router.push('/report');
    else if (tab === 'simulator') router.push('/simulator');
  };

  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        activeTab="map"
        onTabChange={handleNav}
        farmerName={initialDashboardData.field.farmerName}
        location={initialDashboardData.field.location}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <FieldHeader
          field={initialDashboardData.field}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          <ParcelRiskMap onBackToDashboard={() => router.push('/')} />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab="map"
        onTabChange={handleNav}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        field={initialDashboardData.field}
        isSimulatedCritical={isSimulatedCritical}
        onToggleScenario={() => setIsSimulatedCritical((prev) => !prev)}
      />
    </div>
  );
}
