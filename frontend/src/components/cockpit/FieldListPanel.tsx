'use client';

import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faSliders,
  faSeedling,
  faFilter,
  faRotateLeft,
  faXmark,
  faTemperatureHalf,
  faDroplet,
  faFlask,
  faCloudRain,
  faSun,
  faCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { BedengParcel } from '@/types/parcel';
import { SandboxParams } from './FloatingLeftControls';

interface FieldListPanelProps {
  parcels: BedengParcel[];
  selectedId: string;
  onSelectParcel: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  sandboxParams?: SandboxParams;
  onUpdateSandbox?: (params: Partial<SandboxParams>) => void;
  onApplyPreset?: (scenario: 'A' | 'B' | 'C') => void;
  onResetSandbox?: () => void;
  isSimulatedCritical?: boolean;
  activeTab?: 'parcels' | 'sandbox' | 'fertilizer';
  onTabChange?: (tab: 'parcels' | 'sandbox' | 'fertilizer') => void;
}

export const FieldListPanel: React.FC<FieldListPanelProps> = ({
  parcels,
  selectedId,
  onSelectParcel,
  isCollapsed = false,
  onToggleCollapse,
  sandboxParams = { soilTempC: 34.1, moisturePct: 22.4, ph: 7.83, irrigationMm: 0 },
  onUpdateSandbox,
  onApplyPreset,
  onResetSandbox,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'parcels' | 'sandbox' | 'fertilizer'>('parcels');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: 'parcels' | 'sandbox' | 'fertilizer') => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const [filter, setFilter] = useState<'all' | 'kritis' | 'aman'>('all');

  const selectedParcel = parcels.find((p) => p.id === selectedId) || parcels[0];

  // Kalkulasi pupuk praktis (ADR 008: Karung 50 kg & Ember 8 kg)
  const areaHa = selectedParcel?.areaHa || 0.45;
  const ureaSacks = (areaHa * 2.5).toFixed(1);
  const npkSacks = (areaHa * 2.0).toFixed(1);
  const buckets = Math.round(areaHa * 24);

  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      if (filter === 'kritis' && p.avriScore < 50) return false;
      if (filter === 'aman' && p.avriScore > 25) return false;
      return true;
    });
  }, [parcels, filter]);

  if (isCollapsed) {
    return (
      <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 select-none">
        <button
          onClick={onToggleCollapse}
          className="bg-slate-900/90 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 shadow-2xl hover:bg-slate-800 transition-all text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5"
          title="Buka Panel Lahan"
        >
          <FontAwesomeIcon icon={faLocationDot} className="text-emerald-400 text-xs" />
          <span>Petak ({parcels.length})</span>
        </button>

        <button
          onClick={() => {
            if (onToggleCollapse) onToggleCollapse();
            setActiveTab('sandbox');
          }}
          className="bg-slate-900/90 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 shadow-2xl hover:bg-slate-800 transition-all text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5"
          title="Buka Simulasi Kondisi"
        >
          <FontAwesomeIcon icon={faSliders} className="text-sky-400 text-xs" />
          <span>Kondisi</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[300px] bg-slate-950/90 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full shrink-0 select-none z-20 text-slate-200">
      {/* 1. Header Panel & Segmented Tab */}
      <div className="p-3 border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={
                activeTab === 'parcels'
                  ? faLocationDot
                  : activeTab === 'sandbox'
                  ? faSliders
                  : faSeedling
              }
              className={`text-xs ${
                activeTab === 'parcels'
                  ? 'text-emerald-400'
                  : activeTab === 'sandbox'
                  ? 'text-sky-400'
                  : 'text-amber-400'
              }`}
            />
            <span className="text-xs font-bold text-white tracking-wide">
              {activeTab === 'parcels'
                ? 'Daftar Petak Lahan'
                : activeTab === 'sandbox'
                ? 'Simulasi Kondisi'
                : 'Estimasi Dosis Pupuk'}
            </span>
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
              title="Tutup Panel"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        {/* Segmented Control (Google Earth Dark Pill Switcher) */}
        <div className="grid grid-cols-3 bg-slate-900/80 border border-white/10 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('parcels')}
            className={`py-1 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'parcels'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={faLocationDot} className="text-[10px] opacity-80" />
            <span>Petak</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-1 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={faSliders} className="text-[10px] opacity-80" />
            <span>Kondisi</span>
          </button>
          <button
            onClick={() => setActiveTab('fertilizer')}
            className={`py-1 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fertilizer'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={faSeedling} className="text-[10px] opacity-80" />
            <span>Pupuk</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: DAFTAR PETAK */}
      {activeTab === 'parcels' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter Status Sederhana */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-slate-500 mr-0.5">
              <FontAwesomeIcon icon={faFilter} />
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-0.5 rounded-full text-xs transition-all ${
                filter === 'all'
                  ? 'bg-white/15 text-white font-semibold border border-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Semua ({parcels.length})
            </button>
            <button
              onClick={() => setFilter('kritis')}
              className={`px-2.5 py-0.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                filter === 'kritis'
                  ? 'bg-rose-500/25 text-rose-300 font-semibold border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
              <span>Kritis</span>
            </button>
            <button
              onClick={() => setFilter('aman')}
              className={`px-2.5 py-0.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                filter === 'aman'
                  ? 'bg-emerald-500/25 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />
              <span>Aman</span>
            </button>
          </div>

          {/* List Petak */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredParcels.map((parcel) => {
              const isSelected = parcel.id === selectedId;
              const isCritical = parcel.avriScore >= 70;
              const isWarning = parcel.avriScore >= 30 && parcel.avriScore < 70;

              const dotColor = isCritical
                ? 'bg-rose-500 ring-2 ring-rose-500/40'
                : isWarning
                ? 'bg-amber-400 ring-2 ring-amber-400/40'
                : 'bg-emerald-400 ring-2 ring-emerald-400/40';

              const scoreColor = isCritical
                ? 'text-rose-400'
                : isWarning
                ? 'text-amber-300'
                : 'text-emerald-400';

              return (
                <button
                  key={parcel.id}
                  onClick={() => onSelectParcel(parcel.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-white/10 text-white border-white/20 shadow-md font-medium'
                      : 'border-transparent hover:bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight font-bold text-white">{parcel.name}</p>
                        <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                          {parcel.cropVariety} · {parcel.areaHa} ha
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-mono font-black ${scoreColor}`}>
                        {parcel.avriScore}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Dynamic Bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, parcel.avriScore))}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {filteredParcels.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Tidak ada data petak.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB 2: SIMULASI KONDISI */}
      {activeTab === 'sandbox' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-slate-200 text-xs">
          {/* Konteks Petak */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="text-slate-400">Petak Aktif</span>
            <span className="font-semibold text-white">{selectedParcel.name}</span>
          </div>

          {/* Skenario Uji Cepat */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 block">
              Skenario Pengujian
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onApplyPreset && onApplyPreset('A')}
                className="py-1.5 px-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center transition-all group"
              >
                <FontAwesomeIcon icon={faSun} className="text-rose-400 text-[11px] block mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white block leading-tight">Terik Kritis</span>
                <span className="text-[10px] text-rose-400 block pt-0.5 font-mono">AVRI 74%</span>
              </button>

              <button
                onClick={() => onApplyPreset && onApplyPreset('B')}
                className="py-1.5 px-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center transition-all group"
              >
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400 text-[11px] block mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white block leading-tight">Pagi Optimal</span>
                <span className="text-[10px] text-emerald-400 block pt-0.5 font-mono">AVRI 18%</span>
              </button>

              <button
                onClick={() => onApplyPreset && onApplyPreset('C')}
                className="py-1.5 px-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center transition-all group"
              >
                <FontAwesomeIcon icon={faSliders} className="text-amber-300 text-[11px] block mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white block leading-tight">Failover</span>
                <span className="text-[10px] text-amber-300 block pt-0.5 font-mono">Imputasi</span>
              </button>
            </div>
          </div>

          {/* Slider Parameter Biofisika */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                Parameter Tanah
              </span>
              {onResetSandbox && (
                <button
                  onClick={onResetSandbox}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Slider 1: Suhu Tanah */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-xs flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTemperatureHalf} className="text-amber-400 text-xs" />
                  <span>Suhu Tanah</span>
                </span>
                <span className="font-semibold text-white text-xs font-mono">{sandboxParams.soilTempC.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min="20"
                max="42"
                step="0.5"
                value={sandboxParams.soilTempC}
                onChange={(e) =>
                  onUpdateSandbox && onUpdateSandbox({ soilTempC: Number(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>20°C</span>
                <span>42°C</span>
              </div>
            </div>

            {/* Slider 2: Kelembaban Tanah */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-xs flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faDroplet} className="text-sky-400 text-xs" />
                  <span>Kadar Air Tanah</span>
                </span>
                <span className="font-semibold text-white text-xs font-mono">{sandboxParams.moisturePct.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="12"
                max="50"
                step="0.5"
                value={sandboxParams.moisturePct}
                onChange={(e) =>
                  onUpdateSandbox && onUpdateSandbox({ moisturePct: Number(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>12%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Slider 3: pH Tanah */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-xs flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFlask} className="text-purple-400 text-xs" />
                  <span>pH Tanah</span>
                </span>
                <span className="font-semibold text-white text-xs font-mono">{sandboxParams.ph.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="6.0"
                max="9.0"
                step="0.05"
                value={sandboxParams.ph}
                onChange={(e) =>
                  onUpdateSandbox && onUpdateSandbox({ ph: Number(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>6.0</span>
                <span>9.0</span>
              </div>
            </div>

            {/* Slider 4: Simulasi Penyiraman */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-xs flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCloudRain} className="text-teal-400 text-xs" />
                  <span>Simulasi Penyiraman</span>
                </span>
                <span className="font-semibold text-white text-xs font-mono">{sandboxParams.irrigationMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={sandboxParams.irrigationMm}
                onChange={(e) =>
                  onUpdateSandbox && onUpdateSandbox({ irrigationMm: Number(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 mm</span>
                <span>30 mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 3: ESTIMASI DOSIS PUPUK */}
      {activeTab === 'fertilizer' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-slate-200 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="text-slate-400">Petak Acuan</span>
            <span className="font-semibold text-white">{selectedParcel.name} ({areaHa} ha)</span>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-400 block">
              Dosis Susulan (Fase V8)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center">
                <FontAwesomeIcon icon={faSeedling} className="text-emerald-400 text-sm mb-1 block mx-auto" />
                <span className="text-[10px] text-slate-400 block">Urea (46% N)</span>
                <span className="text-sm font-bold text-white block mt-0.5">{ureaSacks} Karung</span>
                <span className="text-[10px] text-slate-500">@ 50 kg</span>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center">
                <FontAwesomeIcon icon={faFlask} className="text-amber-400 text-sm mb-1 block mx-auto" />
                <span className="text-[10px] text-slate-400 block">Phonska 15-15-15</span>
                <span className="text-sm font-bold text-white block mt-0.5">{npkSacks} Karung</span>
                <span className="text-[10px] text-slate-500">@ 50 kg</span>
              </div>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block">Takaran Lapangan</span>
              <span className="text-base font-bold text-emerald-400 block mt-0.5">{buckets} Ember</span>
              <span className="text-[10px] text-slate-500">Ember takar 8 kg</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Aplikasi pupuk dilakukan dengan metode tugal sedalam 4–5 cm di samping perakaran saat jendela aman terbuka.
          </p>
        </div>
      )}
    </aside>
  );
};

export default FieldListPanel;
