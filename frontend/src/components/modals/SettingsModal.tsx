'use client';

import React from 'react';
import Image from 'next/image';
import { X, Cpu, Wifi, Battery, MapPin, SlidersHorizontal } from 'lucide-react';
import { FieldInfo, RiskCategory } from '@/types/dashboard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldInfo;
  currentRiskCategory?: RiskCategory;
  onSelectRiskCategory?: (category: RiskCategory) => void;
  isSimulatedCritical?: boolean;
  onToggleScenario?: () => void;
  onOpenWhatIf?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  field,
  currentRiskCategory = 'aman',
  onSelectRiskCategory,
  isSimulatedCritical = false,
  onToggleScenario,
  onOpenWhatIf,
}) => {
  if (!isOpen) return null;

  const activeCategory: RiskCategory =
    currentRiskCategory || (isSimulatedCritical ? 'kritis' : 'aman');

  const SCENARIOS: Array<{
    id: RiskCategory;
    name: string;
    scoreText: string;
    badgeText: string;
    sublabel: string;
    color: string;
    activeBorder: string;
    activeBg: string;
    dotColor: string;
  }> = [
    {
      id: 'aman',
      name: 'Aman',
      scoreText: '4%',
      badgeText: 'Optimal',
      sublabel: 'Penaburan Optimal',
      color: 'text-[#16A34A]',
      activeBorder: 'border-[#16A34A] ring-2 ring-[#16A34A]/20',
      activeBg: 'bg-emerald-50',
      dotColor: 'bg-[#16A34A]',
    },
    {
      id: 'waspada',
      name: 'Waspada',
      scoreText: '48%',
      badgeText: 'Tugal',
      sublabel: 'Metode Benam / Tugal',
      color: 'text-[#D97706]',
      activeBorder: 'border-[#D97706] ring-2 ring-[#D97706]/20',
      activeBg: 'bg-amber-50',
      dotColor: 'bg-[#D97706]',
    },
    {
      id: 'kritis',
      name: 'Kritis',
      scoreText: '74%',
      badgeText: 'Tunda',
      sublabel: 'Tunda Penaburan',
      color: 'text-[#EA580C]',
      activeBorder: 'border-[#EA580C] ring-2 ring-[#EA580C]/20',
      activeBg: 'bg-orange-50',
      dotColor: 'bg-[#EA580C]',
    },
    {
      id: 'bahaya',
      name: 'Bahaya',
      scoreText: '88%',
      badgeText: 'Stop',
      sublabel: 'Dilarang Tabur Urea',
      color: 'text-[#DC2626]',
      activeBorder: 'border-[#DC2626] ring-2 ring-[#DC2626]/20',
      activeBg: 'bg-red-50',
      dotColor: 'bg-[#DC2626]',
    },
  ];

  const handleSelect = (category: RiskCategory) => {
    if (onSelectRiskCategory) {
      onSelectRiskCategory(category);
    } else if (onToggleScenario) {
      onToggleScenario();
    }
  };

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

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="VolatiSafe" width={24} height={24} className="w-full h-full object-contain" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            Pengaturan Petak & Node IoT
          </h3>
        </div>
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

          {/* 4 Pilihan Jenis Status Peringatan Risiko */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {SCENARIOS.map((scen) => {
              const isSelected = activeCategory === scen.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => handleSelect(scen.id)}
                  type="button"
                  className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? `${scen.activeBg} ${scen.activeBorder} shadow-2xs`
                      : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className={`w-2 h-2 rounded-full ${scen.dotColor}`} />
                      {scen.name}
                    </span>
                    <span className={`text-[10px] font-black ${scen.color}`}>
                      {scen.scoreText}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight truncate">
                    {scen.sublabel}
                  </span>
                </button>
              );
            })}
          </div>

          {onOpenWhatIf && (
            <button
              onClick={onOpenWhatIf}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span>Buka What-If Simulator Interaktif (4 Slider) →</span>
            </button>
          )}
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
