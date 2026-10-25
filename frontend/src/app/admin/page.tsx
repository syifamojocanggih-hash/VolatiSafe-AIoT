'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopSidebar } from '@/components/sidebar/DesktopSidebar';
import { MobileHeader } from '@/components/header/MobileHeader';
import { NodeManagement } from '@/components/admin/NodeManagement';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { initialDashboardData } from '@/mocks/dashboardMock';

export default function AdminPage() {
  const router = useRouter();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSimulatedCritical, setIsSimulatedCritical] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        activeTab="admin"
        onTabChange={(tab) => {
          if (tab === 'dashboard') router.push('/');
          else if (tab === 'map') router.push('/map');
          else if (tab === 'prescription') router.push('/prescription');
          else if (tab === 'admin') router.push('/admin');
          else if (tab === 'report') router.push('/report');
          else if (tab === 'simulator') router.push('/simulator');
        }}
        farmerName={initialDashboardData.field.farmerName}
        location={initialDashboardData.field.location}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <NodeManagement />
        </main>
      </div>

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
