'use client';

import React from 'react';
import {
  LayoutGrid,
  Map,
  CalendarDays,
  Wrench,
  FileText,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'map', label: 'Peta', icon: Map },
    { id: 'prescription', label: 'Kalender', icon: CalendarDays },
    { id: 'admin', label: 'Admin', icon: Wrench },
    { id: 'report', label: 'Laporan', icon: FileText },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#5E9E49] text-white rounded-t-[28px] shadow-[0_-4px_24px_rgba(0,0,0,0.18)] border-t border-white/20 select-none px-3 pt-2.5 pb-3 sm:pb-3"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 min-h-[46px] ${
                isActive
                  ? 'bg-white/25 text-white shadow-xs scale-105'
                  : 'text-white/85 hover:text-white hover:bg-white/10 active:scale-95'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[2.2] shrink-0" />
              <span
                className={`text-[9.5px] font-bold mt-1 tracking-tight leading-none ${
                  isActive ? 'text-white' : 'text-white/80'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
