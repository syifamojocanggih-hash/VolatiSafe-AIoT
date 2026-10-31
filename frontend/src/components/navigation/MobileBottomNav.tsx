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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#5E9E49] text-white rounded-t-[28px] shadow-[0_-4px_24px_rgba(0,0,0,0.18)] border-t border-white/20 select-none px-2 pt-2.5 pb-3 sm:pb-4"
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
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
                isActive
                  ? 'text-white scale-105 opacity-100 font-extrabold'
                  : 'text-white/85 hover:text-white hover:opacity-100 active:scale-95'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[2] shrink-0" />
              <span className="text-xs font-bold mt-1 text-white tracking-normal leading-tight text-center">
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
