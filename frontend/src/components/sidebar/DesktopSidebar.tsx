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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Petak', icon: LayoutDashboard },
    { id: 'map', label: 'Peta Risiko Lahan', icon: MapPin },
    { id: 'prescription', label: 'Preskripsi & Kalender', icon: CalendarDays },
    { id: 'admin', label: 'Admin & Node', icon: Wrench },
    { id: 'report', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#5E9E49] text-white min-h-screen p-5 shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 pt-2 pb-6 px-1">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <Image
            src="/logo.png"
            alt="Logo Resmi VolatiSafe AIoT"
            width={40}
            height={40}
            className="w-full h-full object-contain filter drop-shadow-md"
            priority
          />
        </div>
        <div>
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm block leading-none">
            VolatiSafe
          </span>
          <span className="text-[10px] font-bold text-emerald-100 tracking-wider uppercase block mt-1">
            AIoT Precision
          </span>
        </div>
      </div>

      {/* Nav Section Label */}
      <div className="text-xs font-semibold text-emerald-100 tracking-wider uppercase mt-4 mb-2 px-3">
        Petak Saya
      </div>

      {/* Nav List */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left ${
                isActive
                  ? 'bg-white/25 text-white shadow-sm backdrop-blur-sm'
                  : 'text-emerald-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0 opacity-95" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Card at Bottom */}
      <div className="mt-auto pt-4 border-t border-white/15">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate leading-tight">
              {farmerName}
            </p>
            <p className="text-xs text-emerald-100 truncate mt-0.5">
              {location}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
