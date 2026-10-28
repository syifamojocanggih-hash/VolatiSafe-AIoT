'use client';

import React from 'react';
import { RefreshCw, BatteryMedium, Settings } from 'lucide-react';
import { FieldInfo } from '@/types/dashboard';
import { WebSocketConnectionStatus } from '@/types/websocket';

interface FieldHeaderProps {
  field: FieldInfo;
  onOpenSettings: () => void;
  wsStatus?: WebSocketConnectionStatus;
}

export const FieldHeader: React.FC<FieldHeaderProps> = ({
  field,
  onOpenSettings,
  wsStatus = 'connected',
}) => {
  return (
    <div className="bg-white px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between border-b border-slate-100 shadow-sm">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {field.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
          <span>
            {field.block} - {field.areaHa.toString().replace('.', ',')} ha - {field.datDays} HST ({field.phaseName})
          </span>
          <span className="inline-flex items-center gap-1 lg:hidden text-2xs font-semibold">
            {wsStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live WS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Polling
              </span>
            )}
          </span>
        </p>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Badges */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* WebSocket Connection Status Badge */}
          {wsStatus === 'connected' ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-50 text-emerald-800 text-xs font-semibold shadow-2xs"
              title="Terhubung langsung via WebSocket real-time (/ws/v1/live)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live WebSocket</span>
            </div>
          ) : wsStatus === 'connecting' || wsStatus === 'reconnecting' ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400 bg-amber-50 text-amber-800 text-xs font-semibold shadow-2xs"
              title="Menghubungkan ke server stream..."
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Menyambungkan WS...</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600 text-xs font-semibold shadow-2xs"
              title="Mode cadangan: HTTP Polling 30 detik"
            >
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              <span>Polling HTTP (30s)</span>
            </div>
          )}

          {/* Last Updated Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300/80 bg-white text-slate-700 text-xs font-semibold shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Update {field.lastUpdatedMinutesAgo} Menit Lalu</span>
          </div>

          {/* Battery Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-50/50 text-emerald-800 text-xs font-semibold shadow-2xs">
            <BatteryMedium className="w-4 h-4 text-emerald-700" />
            <span>Baterai {field.batteryPct}%</span>
          </div>
        </div>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          title="Pengaturan Petak & Sensor"
          aria-label="Pengaturan Petak & Sensor"
          className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

