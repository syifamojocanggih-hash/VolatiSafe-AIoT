'use client';

import React from 'react';
import { DesktopSidebar } from '@/components/sidebar/DesktopSidebar';
import { MobileHeader } from '@/components/header/MobileHeader';
import { FieldHeader } from '@/components/header/FieldHeader';
import { WhatIfPanel } from '@/components/simulator/WhatIfPanel';
import { initialDashboardData } from '@/mocks/dashboardMock';
import { useRouter } from 'next/navigation';

export default function SimulatorPage() {
  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') router.push('/');
    else if (tabId === 'map') router.push('/map');
    else if (tabId === 'prescription') router.push('/prescription');
    else if (tabId === 'admin') router.push('/admin');
    else if (tabId === 'report') router.push('/report');
    else if (tabId === 'simulator') router.push('/simulator');
  };

  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      <DesktopSidebar
        activeTab="simulator"
        onTabChange={handleTabChange}
        farmerName={initialDashboardData.field.farmerName}
        location={initialDashboardData.field.location}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <FieldHeader
          field={initialDashboardData.field}
          onOpenSettings={() => {}}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <WhatIfPanel />
        </main>
      </div>
    </div>
  );
}
