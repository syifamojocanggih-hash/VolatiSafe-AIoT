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
  faMicrochip,
  faBagShopping,
  faWeightHanging,
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
  activeTab = 'parcels',
}) => {

  const [filter, setFilter] = useState<'all' | 'kritis' | 'aman'>('all');

  const selectedParcel = parcels.find((p) => p.id === selectedId) || parcels[0];

  // Kalkulasi pupuk praktis (ADR 008: Karung 50 kg & Ember 8 kg)
  const areaHa = selectedParcel?.areaHa || 0.45;
  const ureaSacks = (areaHa * 2.5).toFixed(1);
  const npkSacks = (areaHa * 2.0).toFixed(1);
  const buckets = Math.round(areaHa * 24);

  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      if (filter === 'kritis' && p.avriScore < 70) return false;
      if (filter === 'aman' && p.avriScore >= 30) return false;
      return true;
    });
  }, [parcels, filter]);

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="w-full h-full flex flex-col shrink-0 select-none text-slate-800">
      {/* 1. Header Panel & Segmented Tab */}
      <div className="p-3.5 border-b border-slate-200 space-y-3 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'parcels'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : activeTab === 'sandbox'
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              }`}
            >
              <FontAwesomeIcon
                icon={
                  activeTab === 'parcels'
                    ? faLocationDot
                    : activeTab === 'sandbox'
                    ? faSliders
                    : faSeedling
                }
                className="text-xs"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-wide block leading-tight">
                {activeTab === 'parcels'
                  ? 'Daftar Petak Lahan'
                  : activeTab === 'sandbox'
                  ? 'Simulasi Kondisi'
                  : 'Estimasi Dosis Pupuk'}
              </span>
              <span className="text-[10px] text-slate-500 block leading-none mt-0.5">
                {activeTab === 'parcels'
                  ? 'Mikroklimat & Zonasi AVRI'
                  : activeTab === 'sandbox'
                  ? 'What-If Biofisika & Irigasi'
                  : 'Kebutuhan Urea & NPK'}
              </span>
            </div>
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 active:scale-90 transition-all text-xs"
              title="Tutup Panel"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB 1: DAFTAR PETAK */}
      {activeTab === 'parcels' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter Status Sederhana */}
          <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-1.5 text-xs bg-slate-50/50">
            <span className="text-[10px] text-slate-500 mr-0.5">
              <FontAwesomeIcon icon={faFilter} />
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 ${
                filter === 'all'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Semua ({parcels.length})
            </button>
            <button
              onClick={() => setFilter('kritis')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                filter === 'kritis'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
              <span>Kritis</span>
            </button>
            <button
              onClick={() => setFilter('aman')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                filter === 'aman'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />
              <span>Aman</span>
            </button>
          </div>

          {/* List Petak */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 cockpit-scrollbar">
            {filteredParcels.map((parcel) => {
              const isSelected = parcel.id === selectedId;
              const isCritical = parcel.avriScore >= 70;
              const isWarning = parcel.avriScore >= 30 && parcel.avriScore < 70;

              const riskBadgeClass = isCritical
                ? 'text-rose-700 bg-rose-50 border-rose-300'
                : isWarning
                ? 'text-amber-700 bg-amber-50 border-amber-300'
                : 'text-emerald-700 bg-emerald-50 border-emerald-300';

              const barGradient = isCritical
                ? 'from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : isWarning
                ? 'from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]';

              return (
                <button
                  key={parcel.id}
                  onClick={() => onSelectParcel(parcel.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] border group shadow-xs ${
                    isSelected
                      ? 'bg-emerald-50/90 text-slate-900 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          isCritical
                            ? 'bg-rose-500 ring-4 ring-rose-500/25 animate-pulse'
                            : isWarning
                            ? 'bg-amber-400 ring-4 ring-amber-400/20'
                            : 'bg-emerald-400 ring-4 ring-emerald-400/20'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs truncate font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                          {parcel.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {parcel.cropVariety} · {parcel.areaHa} ha
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border ${riskBadgeClass}`}>
                        {parcel.avriScore}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Dynamic Bar */}
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2.5 overflow-hidden ring-1 ring-slate-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${barGradient}`}
                      style={{ width: `${Math.min(100, Math.max(5, parcel.avriScore))}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {filteredParcels.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada data petak.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB 2: SIMULASI KONDISI */}
      {activeTab === 'sandbox' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-slate-800 text-xs">
          {/* Konteks Petak */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 text-xs font-medium">Petak Aktif</span>
            <span className="font-bold text-slate-900 text-xs">{selectedParcel.name}</span>
          </div>

          {/* Skenario Uji Cepat */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Skenario Pengujian Cepat
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onApplyPreset && onApplyPreset('A')}
                className="p-2 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-50 active:scale-95 text-center transition-all duration-150 group shadow-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-rose-200">
                  <FontAwesomeIcon icon={faSun} className="text-[11px] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Terik Kritis</span>
                <span className="text-[10px] text-rose-700 block pt-0.5 font-mono font-bold">AVRI 74%</span>
              </button>

              <button
                onClick={() => onApplyPreset && onApplyPreset('B')}
                className="p-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50 active:scale-95 text-center transition-all duration-150 group shadow-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-emerald-200">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-[11px] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Pagi Optimal</span>
                <span className="text-[10px] text-emerald-700 block pt-0.5 font-mono font-bold">AVRI 18%</span>
              </button>

              <button
                onClick={() => onApplyPreset && onApplyPreset('C')}
                className="p-2 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 active:scale-95 text-center transition-all duration-150 group shadow-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-amber-200">
                  <FontAwesomeIcon icon={faMicrochip} className="text-[11px] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Failover</span>
                <span className="text-[10px] text-amber-700 block pt-0.5 font-mono font-bold">Imputasi</span>
              </button>
            </div>
          </div>

          {/* Slider Parameter Biofisika */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Parameter Biofisika
              </span>
              {onResetSandbox && (
                <button
                  onClick={onResetSandbox}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 active:scale-95"
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" />
                  <span>Reset Default</span>
                </button>
              )}
            </div>

            {/* Slider 1: Suhu Tanah */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTemperatureHalf} className="text-amber-500 text-xs" />
                  <span>Suhu Tanah</span>
                </span>
                <span className="font-bold text-slate-900 text-xs font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {sandboxParams.soilTempC.toFixed(1)}°C
                </span>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>20°C (Dingin)</span>
                <span>42°C (Ekstrem)</span>
              </div>
            </div>

            {/* Slider 2: Kelembaban Tanah */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faDroplet} className="text-sky-500 text-xs" />
                  <span>Kadar Air (VWC)</span>
                </span>
                <span className="font-bold text-slate-900 text-xs font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {sandboxParams.moisturePct.toFixed(1)}%
                </span>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>12% (Kering)</span>
                <span>50% (Kenyang Air)</span>
              </div>
            </div>

            {/* Slider 3: pH Tanah */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFlask} className="text-purple-500 text-xs" />
                  <span>pH Tanah</span>
                </span>
                <span className="font-bold text-slate-900 text-xs font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {sandboxParams.ph.toFixed(2)}
                </span>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>6.0 (Asam)</span>
                <span>9.0 (Alkalin Kapur)</span>
              </div>
            </div>

            {/* Slider 4: Simulasi Penyiraman */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCloudRain} className="text-teal-500 text-xs" />
                  <span>Simulasi Penyiraman</span>
                </span>
                <span className="font-bold text-emerald-700 text-xs font-mono bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  +{sandboxParams.irrigationMm} mm
                </span>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 mm</span>
                <span>30 mm (Irigasi Penuh)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 3: ESTIMASI DOSIS PUPUK */}
      {activeTab === 'fertilizer' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-slate-800 text-xs cockpit-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 text-xs font-medium">Petak Acuan</span>
            <span className="font-bold text-slate-900 text-xs">{selectedParcel.name} ({areaHa} ha)</span>
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Dosis Rekomendasi (Fase V8)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 text-center transition-all duration-150">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-emerald-500/30">
                  <FontAwesomeIcon icon={faBagShopping} className="text-xs" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">Urea (46% N)</span>
                <span className="text-base font-black text-slate-900 font-mono block mt-0.5">{ureaSacks} Karung</span>
                <span className="text-[10px] text-slate-500">@ 50 kg</span>
              </div>

              <div className="p-3 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 text-center transition-all duration-150">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-amber-200">
                  <FontAwesomeIcon icon={faFlask} className="text-xs" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">Phonska 15-15-15</span>
                <span className="text-base font-black text-slate-900 font-mono block mt-0.5">{npkSacks} Karung</span>
                <span className="text-[10px] text-slate-500">@ 50 kg</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-emerald-500/30">
                <FontAwesomeIcon icon={faWeightHanging} className="text-xs" />
              </div>
              <span className="text-[10px] text-emerald-800 font-semibold block">Takaran Praktis Lapangan</span>
              <span className="text-lg font-black text-emerald-700 font-mono block mt-0.5">{buckets} Ember</span>
              <span className="text-[10px] text-slate-500">Ember takar 8 kg (Metode Tugal 4–5 cm)</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <span className="text-emerald-700 font-bold block mb-1">Pedoman Aplikasi:</span>
            Aplikasi pupuk wajib dengan metode tugal sedalam 4–5 cm di samping perakaran saat jendela aman terbuka. Hindari penaburan permukaan pada siang terik.
          </div>
        </div>
      )}
    </aside>
  );
};

export default FieldListPanel;
