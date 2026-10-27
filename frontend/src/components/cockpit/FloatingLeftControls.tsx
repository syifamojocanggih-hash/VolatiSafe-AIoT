'use client';

import React, { useState } from 'react';
import {
  Layers,
  Droplets,
  Radio,
  Cpu,
  MapPin,
  Flame,
  Info,
  Sliders,
  Calculator,
  RefreshCw,
  Sun,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { BedengParcel } from '@/types/parcel';

export interface CockpitLayerConfig {
  showAvriHeatmap: boolean;
  showMoistureContour: boolean;
  showLoraNodes: boolean;
  showCadastralBorders: boolean;
  autoFailover: boolean;
  heatmapOpacity: number; // 0.2 to 0.8
}

export interface SandboxParams {
  soilTempC: number;
  moisturePct: number;
  ph: number;
  irrigationMm: number;
}

interface FloatingLeftControlsProps {
  layers: CockpitLayerConfig;
  onToggleLayer: (layerKey: keyof CockpitLayerConfig) => void;
  onUpdateOpacity?: (val: number) => void;
  parcels: BedengParcel[];
  selectedId: string;
  onSelectParcel: (id: string) => void;
  onApplyPreset?: (scenario: 'A' | 'B' | 'C') => void;
  sandboxParams?: SandboxParams;
  onUpdateSandbox?: (params: Partial<SandboxParams>) => void;
  onResetSandbox?: () => void;
}

export const FloatingLeftControls: React.FC<FloatingLeftControlsProps> = ({
  layers,
  onToggleLayer,
  onUpdateOpacity,
  parcels,
  selectedId,
  onSelectParcel,
  onApplyPreset,
  sandboxParams = { soilTempC: 34.1, moisturePct: 22.4, ph: 7.83, irrigationMm: 0 },
  onUpdateSandbox,
  onResetSandbox,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'sandbox' | 'blender'>('layers');
  const [riskFilter, setRiskFilter] = useState<'all' | 'kritis' | 'waspada' | 'aman'>('all');

  const selectedParcel = parcels.find((p) => p.id === selectedId) || parcels[0];

  // Kalkulator pupuk praktis (ADR 008: Karung 50 kg & Ember 8 kg)
  const areaHa = selectedParcel?.areaHa || 0.45;
  const ureaSacks = (areaHa * 2.5).toFixed(1);
  const npkSacks = (areaHa * 2.0).toFixed(1);
  const buckets = Math.round(areaHa * 24);

  // Filter parcels based on risk
  const filteredParcels = parcels.filter((p) => {
    if (riskFilter === 'all') return true;
    return p.avriCategory === riskFilter;
  });

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-800 group pointer-events-auto select-none"
        title="Buka Panel Kontrol & Sandbox"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <span>Kontrol Lahan</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  return (
    <div className="w-72 sm:w-76 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-3.5 text-slate-800 space-y-3 select-none animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar">
      {/* 1. Header Panel & Navigation Tabs */}
      <div className="border-b border-slate-100 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Kontrol Lahan & Sandbox</h3>
              <span className="text-[10px] text-slate-500">Digital Twin Cockpit · Lamongan</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Perkecil Panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'layers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Lapisan
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'sandbox'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sandbox</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </button>
          <button
            onClick={() => setActiveTab('blender')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'blender'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pupuk
          </button>
        </div>
      </div>

      {/* 2. TAB 1: LAPISAN SPASIAL & FILTER PETAK */}
      {activeTab === 'layers' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Switch Toggles List (Gaya Gambar 1: Industrial Toggles) */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Lapisan Mikroklimat & AI
            </div>

            {/* 1. Heatmap AVRI */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-slate-700">Heatmap Risiko AVRI</span>
              </div>
              <button
                onClick={() => onToggleLayer('showAvriHeatmap')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  layers.showAvriHeatmap ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Opasitas Heatmap Slider (Jika AVRI aktif) */}
            {layers.showAvriHeatmap && (
              <div className="px-2 py-1.5 bg-slate-50/60 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Kepekatan Warna Heatmap</span>
                  <span className="font-mono font-bold text-slate-700">
                    {Math.round(layers.heatmapOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={Math.round(layers.heatmapOpacity * 100)}
                  onChange={(e) => onUpdateOpacity && onUpdateOpacity(Number(e.target.value) / 100)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            )}

            {/* 2. Kontur Kelembaban FAO-56 */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-slate-700">Neraca Air FAO-56</span>
              </div>
              <button
                onClick={() => onToggleLayer('showMoistureContour')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  layers.showMoistureContour ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* 3. Node Sensor Fisik LoRa */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">Titik Sensor & Beams</span>
              </div>
              <button
                onClick={() => onToggleLayer('showLoraNodes')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  layers.showLoraNodes ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* 4. Batas Kadastral Persil */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-700">Batas Persil Sawah</span>
              </div>
              <button
                onClick={() => onToggleLayer('showCadastralBorders')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  layers.showCadastralBorders ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* 5. Mesin Imputasi Failover */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 block leading-none">Auto-Failover</span>
                  <span className="text-[9px] text-slate-400">Digital Twin Imputer</span>
                </div>
              </div>
              <button
                onClick={() => onToggleLayer('autoFailover')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  layers.autoFailover ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Filter Status Risiko & Selector Cepat Petak */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Filter Petak Sawah
              </span>
              <div className="flex gap-1 text-[9px] font-bold">
                <button
                  onClick={() => setRiskFilter('all')}
                  className={`px-1.5 py-0.5 rounded ${
                    riskFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setRiskFilter('kritis')}
                  className={`px-1.5 py-0.5 rounded ${
                    riskFilter === 'kritis' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
                  }`}
                >
                  Kritis
                </button>
                <button
                  onClick={() => setRiskFilter('aman')}
                  className={`px-1.5 py-0.5 rounded ${
                    riskFilter === 'aman' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  Aman
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {filteredParcels.map((p) => {
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectParcel(p.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{p.shortName}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.avriCategory === 'kritis'
                          ? 'bg-red-400'
                          : p.avriCategory === 'waspada'
                          ? 'bg-amber-400'
                          : 'bg-emerald-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: SANDBOX DEMO JURI (WHAT-IF INTERACTIVE SLIDERS) */}
      {activeTab === 'sandbox' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Quick Presets Skenario Juri (Sesuai PRD / LAB_VALIDATION_PROTOCOL) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Preset Uji Dewan Juri (3 Skenario)
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => onApplyPreset && onApplyPreset('A')}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-center transition-all"
                title="Suhu 34.5°C, Kelembaban 18% (AVRI 74%)"
              >
                <Sun className="w-3.5 h-3.5 text-red-600 mx-auto mb-0.5" />
                <span className="text-[10px] font-black text-red-700 block leading-tight">Skenario A</span>
                <span className="text-[8px] text-red-500">Terik Kritis</span>
              </button>

              <button
                onClick={() => onApplyPreset && onApplyPreset('B')}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition-all"
                title="Suhu 25.0°C, Kelembaban 38% (AVRI 18%)"
              >
                <Droplets className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
                <span className="text-[10px] font-black text-emerald-700 block leading-tight">Skenario B</span>
                <span className="text-[8px] text-emerald-500">Pagi Optimal</span>
              </button>

              <button
                onClick={() => onApplyPreset && onApplyPreset('C')}
                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center transition-all"
                title="Simulasi Sensor Dropout / Failover Imputer"
              >
                <Cpu className="w-3.5 h-3.5 text-amber-600 mx-auto mb-0.5" />
                <span className="text-[10px] font-black text-amber-700 block leading-tight">Skenario C</span>
                <span className="text-[8px] text-amber-500">Failover</span>
              </button>
            </div>
          </div>

          {/* Interactive Sliders Form */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                Simulator Parameter Bebas
              </span>
              {onResetSandbox && (
                <button
                  onClick={onResetSandbox}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Reset ke Nilai Live"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Slider 1: Suhu Tanah */}
            <div className="space-y-1">
              <div className="flex justify-between text-2xs font-semibold">
                <span className="text-slate-600">Suhu Permukaan Tanah:</span>
                <b className="font-mono text-red-600">{sandboxParams.soilTempC.toFixed(1)}°C</b>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            {/* Slider 2: Kelembaban Tanah */}
            <div className="space-y-1">
              <div className="flex justify-between text-2xs font-semibold">
                <span className="text-slate-600">Kadar Air Tanah (VWC):</span>
                <b className="font-mono text-blue-600">{sandboxParams.moisturePct.toFixed(1)}%</b>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Slider 3: pH Tanah */}
            <div className="space-y-1">
              <div className="flex justify-between text-2xs font-semibold">
                <span className="text-slate-600">pH Tanah Ruah:</span>
                <b className="font-mono text-purple-600">{sandboxParams.ph.toFixed(2)}</b>
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Slider 4: Siram / Presipitasi */}
            <div className="space-y-1">
              <div className="flex justify-between text-2xs font-semibold">
                <span className="text-slate-600">Simulasi Penyiraman:</span>
                <b className="font-mono text-emerald-600">{sandboxParams.irrigationMm} mm</b>
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
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 3: KALKULATOR DOSIS PUPUK PRAKTIS (ADR 008) */}
      {activeTab === 'blender' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                Takaran Praktis Lapangan
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                Fase V8
              </span>
            </div>

            <p className="text-2xs text-slate-500">
              Konversi takaran kilogram laboratorium menjadi karung & ember cat (8 kg) agar petani tidak salah takar:
            </p>

            {/* Output Karung & Ember */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 bg-white rounded-xl border border-slate-200/80 text-center">
                <Package className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block">Urea (46% N)</span>
                <b className="text-sm text-slate-900">{ureaSacks} Karung</b>
                <span className="text-[9px] text-slate-400 block">@ 50 kg</span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200/80 text-center">
                <Package className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block">Phonska 15-15-15</span>
                <b className="text-sm text-slate-900">{npkSacks} Karung</b>
                <span className="text-[9px] text-slate-400 block">@ 50 kg</span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/60 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block">
                Total Takaran Ember di Kebun:
              </span>
              <b className="text-base text-emerald-900 font-black">
                {buckets} Ember Takar (8 kg)
              </b>
              <p className="text-[9px] text-emerald-700 mt-0.5">
                Tabur di samping rumpun jagung berjarak 7–10 cm dari pangkal batang.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Tagline di Bawah */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-2xs text-emerald-800">
        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Kawasan Tegal Kapur Bluri · Solokuro (Kadar Liat 38%, pH 7.85)</span>
      </div>
    </div>
  );
};

export default FloatingLeftControls;
