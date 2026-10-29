'use client';

import React from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
  Wrench,
  FileSpreadsheet,
  User,
} from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  farmerName: string;
  location: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  farmerName,
  location,
}) => {
  const [isCollapsed] = React.useState<boolean>(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Petak', icon: LayoutDashboard },
    { id: 'cockpit', label: 'Digital Twin', icon: MapPin },
    { id: 'prescription', label: 'Preskripsi & Kalender', icon: CalendarDays },
    { id: 'admin', label: 'Admin & Node', icon: Wrench },
    { id: 'report', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 text-slate-800 min-h-screen transition-all duration-200 shrink-0 select-none ${
        isCollapsed ? 'w-[72px] p-3' : 'w-[220px] p-4'
      }`}
    >
      {/* Brand & Logo Header */}
      <div className={`flex items-center gap-3 pt-1 pb-5 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <Image
            src="/logo.png"
            alt="Logo Resmi VolatiSafe AIoT"
            width={36}
            height={36}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-none">
              VolatiSafe
            </span>
            <span className="text-[10px] font-medium text-emerald-600 tracking-wider uppercase block mt-1">
              AIoT Precision
            </span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left ${
                isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card at Bottom */}
      <div className="mt-auto pt-3 border-t border-slate-100">
        <div
          className={`flex items-center gap-2.5 rounded-xl p-2 bg-slate-50 border border-slate-200/60 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-xs">
            <User className="w-4 h-4 text-emerald-700" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {farmerName}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {location}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
