'use client';

import React from 'react';
import { X, Cpu, Wifi, Battery, MapPin, SlidersHorizontal } from 'lucide-react';
import { FieldInfo } from '@/types/dashboard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldInfo;
  isSimulatedCritical: boolean;
  onToggleScenario: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  field,
  isSimulatedCritical,
  onToggleScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup pengaturan"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Pengaturan Petak & Node IoT
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Informasi perangkat keras fisik dan simulasi data
        </p>

        {/* Node Status Info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-600" />
              ID Node Sensor:
            </span>
            <span className="font-bold text-slate-800">VS-A1-003</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-slate-600" />
              Koneksi LoRa Mesh:
            </span>
            <span className="font-semibold text-emerald-700">433 MHz (Aktif - SF7)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-2">
              <Battery className="w-4 h-4 text-slate-600" />
              Baterai LiFePO4:
            </span>
            <span className="font-bold text-slate-800">{field.batteryPct}% (3.91V)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600" />
              Lokasi Petak:
            </span>
            <span className="font-semibold text-slate-800">{field.location}</span>
          </div>
        </div>

        {/* Demo Scenario Switcher for Hackathon Judges */}
        <div className="border border-emerald-200/80 bg-emerald-50/50 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E6124] uppercase tracking-wider mb-2">
            <SlidersHorizontal className="w-4 h-4" />
            Simulator Skenario Demo Juri
          </div>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Pilih skenario pengujian untuk melihat respon instan perubahan warna risiko pada seluruh kartu dan grafik:
          </p>

          <button
            onClick={onToggleScenario}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isSimulatedCritical
                ? 'bg-[#DC2626] text-white hover:bg-red-700'
                : 'bg-[#236B32] text-white hover:bg-emerald-800'
            }`}
          >
            {isSimulatedCritical
              ? '🔴 Aktif: Skenario Terik Ekstrem (AVRI 74% - Kritis)'
              : '🟢 Aktif: Skenario Aman Presipitasi (AVRI 4% - Sesuai Desain)'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all"
        >
          Selesai
        </button>
      </div>
    </div>
  );
};
