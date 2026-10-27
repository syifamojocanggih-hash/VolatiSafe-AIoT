'use client';

import React from 'react';
import { CockpitDashboardView } from '@/components/cockpit/CockpitDashboardView';

export default function DigitalTwinCockpitPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-900 select-none">
      <CockpitDashboardView />
    </main>
  );
}

