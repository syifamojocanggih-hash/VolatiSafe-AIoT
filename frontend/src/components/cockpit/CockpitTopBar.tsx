'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faLocationDot,
  faSliders,
  faSeedling,
  faChartLine,
  faClock,
  faCloudSun,
  faExpand,
  faCompress,
  faFileLines,
  faRoute,
  faBars,
  faTriangleExclamation,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { CockpitLayerConfig } from './FloatingLeftControls';
import { MapLayersPopover } from './MapLayersPopover';

interface CockpitTopBarProps {
  fieldName?: string;
  location?: string;
  isSimulatedCritical: boolean;
  onToggleScenario: () => void;
  onOpenSpkModal?: () => void;
  onOpenJuryTour?: () => void;
  onOpenSandbox?: () => void;
  onOpenParcels?: () => void;
  onOpenFertilizer?: () => void;
  onOpen72h?: () => void;
  onToggleRightPanel?: () => void;
  isRightPanelOpen?: boolean;
  activeLeftTab?: 'parcels' | 'sandbox' | 'fertilizer';
  isLeftPanelOpen?: boolean;
  criticalCount?: number;
  warningCount?: number;
  safeCount?: number;
  bmkgWeather?: string;
  provenanceSha?: string;
  isFullScreenMap?: boolean;
  onToggleFullScreenMap?: () => void;
  // Lapisan Peta Popover
  layers?: CockpitLayerConfig;
  onToggleLayer?: (layerKey: keyof CockpitLayerConfig) => void;
  onUpdateOpacity?: (val: number) => void;
  // Agro-climatic telemetry for center navbar capsule
  cropPhase?: string;
  kcValue?: number;
  efficiencyUrea?: string;
  latestNodeId?: string;
  latestRssiDbm?: number;
}

export const CockpitTopBar: React.FC<CockpitTopBarProps> = ({
  fieldName = 'Kebun Jagung Solokuro · Blok A',
  location = 'Solokuro, Lamongan',
  isSimulatedCritical,
  onToggleScenario,
  onOpenSpkModal,
  onOpenJuryTour,
  criticalCount = isSimulatedCritical ? 3 : 1,
  warningCount = 2,
  safeCount = 7,
  bmkgWeather,
  provenanceSha,
  isFullScreenMap = false,
  onToggleFullScreenMap,
  onOpenSandbox,
  onOpenParcels,
  onOpenFertilizer,
  onToggleRightPanel,
  isRightPanelOpen = false,
  activeLeftTab,
  isLeftPanelOpen = false,
  layers,
  onToggleLayer,
  onUpdateOpacity,
  cropPhase = 'V8 (DAT 32)',
  kcValue = 0.74,
  efficiencyUrea = '+24.5% Urea',
  latestNodeId = 'VS-A1-001',
  latestRssiDbm = -80,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative w-full h-14 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-4 flex items-center justify-between gap-3 text-slate-800 shadow-xs z-30 select-none">
      {/* KIRI: Home, Field Indicator & Navigation Buttons (Petak, Kondisi, Pupuk, Detail Petak, Lapisan Peta) */}
      <div className="flex items-center gap-2 min-w-0">
        <a
          href="/"
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 duration-150 border border-slate-200 text-slate-600 hover:text-slate-900 shrink-0 shadow-xs"
          title="Kembali ke Beranda"
        >
          <FontAwesomeIcon icon={faHouse} className="w-3.5 h-3.5" />
        </a>

        {/* Futuristic Field Indicator with Location Icon (Light Mode) */}
        <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200 px-3 py-1 rounded-xl text-xs max-w-[210px] sm:max-w-xs shrink-0 shadow-xs">
          <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-bold text-slate-900 tracking-wide leading-tight">
              {fieldName}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate leading-none mt-0.5">
              {location}
            </span>
          </div>
        </div>

        <div className="hidden md:block h-5 w-px bg-slate-200 mx-0.5 shrink-0" />

        {/* Dedicated Navbar Buttons: Petak, Kondisi, Pupuk, Detail Petak & Lapisan Peta (Light Mode) */}
        <div className="hidden md:flex items-center gap-1.5">
          {onOpenParcels && (
            <button
              onClick={onOpenParcels}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 text-xs font-semibold ${
                isLeftPanelOpen && activeLeftTab === 'parcels'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
              title="Daftar Petak Lahan"
            >
              <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          )}

          {onOpenSandbox && (
            <button
              onClick={onOpenSandbox}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 text-xs font-semibold ${
                isLeftPanelOpen && activeLeftTab === 'sandbox'
                  ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs ring-1 ring-sky-500/20'
                  : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
              title="Simulasi Parameter Kondisi (What-If)"
            >
              <FontAwesomeIcon icon={faSliders} className="w-3.5 h-3.5 text-sky-600" />
            </button>
          )}

          {onOpenFertilizer && (
            <button
              onClick={onOpenFertilizer}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 text-xs font-semibold ${
                isLeftPanelOpen && activeLeftTab === 'fertilizer'
                  ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs ring-1 ring-amber-500/20'
                  : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
              title="Estimasi Dosis Pupuk (ADR 008)"
            >
              <FontAwesomeIcon icon={faSeedling} className="w-3.5 h-3.5 text-amber-600" />
            </button>
          )}

          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 text-xs font-semibold ${
                isRightPanelOpen
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
              title="Detail Petak & Proyeksi 72 Jam"
            >
              <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          )}

          {/* Lapisan Peta Popover Langsung di Navbar */}
          {layers && onToggleLayer && (
            <MapLayersPopover
              layers={layers}
              onToggleLayer={onToggleLayer}
              onUpdateOpacity={onUpdateOpacity}
            />
          )}
        </div>
      </div>

      {/* TENGAH: Status Risiko & Poni Telemetri Fase yang Menyatu Rapi di Dalam Navbar */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-1 shrink-0">
        {/* Baris Atas: Kapsul Status Risiko (Kritis, Waspada, Aman) */}
        <div className="flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl px-3.5 py-0.5 gap-3 text-xs shadow-xs">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-400/30 animate-pulse" />
            {criticalCount} Kritis
          </span>
          <span className="text-slate-300 font-bold">·</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {warningCount} Waspada
          </span>
          <span className="text-slate-300 font-bold">·</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30" />
            {safeCount} Aman
          </span>
        </div>

        {/* Poni Fase: Terintegrasi Langsung Di Bawah Risiko Tanpa Menimpa */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono leading-none">
          <span className="whitespace-nowrap flex items-center gap-1">
            <span className="text-slate-400">Fase:</span>
            <strong className="text-slate-800 font-sans font-bold">{cropPhase}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="whitespace-nowrap flex items-center gap-1">
            <span className="text-slate-400">FAO-56:</span>
            <strong className="text-slate-700 font-semibold">Kc {kcValue}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="whitespace-nowrap text-emerald-600 font-bold">
            {efficiencyUrea}
          </span>
          {latestNodeId && (
            <>
              <span className="text-slate-300">·</span>
              <span className="whitespace-nowrap text-slate-500 font-mono font-medium">
                {latestNodeId} ({latestRssiDbm} dBm)
              </span>
            </>
          )}
        </div>
      </div>

      {/* KANAN: Clock + Weather + Actions (Light Mode) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Live Digital Clock */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-800 font-bold px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 shadow-xs">
          <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-emerald-600" />
          <span className="tracking-wider">{currentTimeStr || '12:00:00 WIB'}</span>
        </div>

        {/* Cuaca BMKG */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-800 font-semibold px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 shadow-xs">
          <FontAwesomeIcon icon={faCloudSun} className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {bmkgWeather ? `BMKG: ${bmkgWeather}` : 'BMKG: 27°C · RH 90%'}
          </span>
        </div>

        {/* Fullscreen Map Toggle */}
        {onToggleFullScreenMap && (
          <button
            onClick={onToggleFullScreenMap}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 shadow-xs ${
              isFullScreenMap
                ? 'bg-emerald-50 text-emerald-700 border-emerald-400 hover:bg-emerald-100'
                : 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={isFullScreenMap ? 'Kembalikan Tampilan Panel Samping' : 'Tampilkan Map di Layar Penuh'}
          >
            <FontAwesomeIcon icon={isFullScreenMap ? faCompress : faExpand} className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-100/90 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all duration-150 shadow-xs"
            title="Menu Opsi Navigasi"
          >
            <FontAwesomeIcon icon={faBars} className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 text-slate-800">
              {/* Opsi Tur Juri */}
              {onOpenJuryTour && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenJuryTour();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 font-medium text-left transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faRoute} className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tur Panduan Sistem</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">T</span>
                </button>
              )}

              {/* Opsi Cetak SPK */}
              {onOpenSpkModal && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenSpkModal();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 font-medium text-left transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5 text-sky-600" />
                    <span>Cetak SPK Pemupukan</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">P</span>
                </button>
              )}

              {/* Toggle Skenario Kritis Simulasi Juri */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onToggleScenario();
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 font-medium text-left transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={isSimulatedCritical ? faCircleCheck : faTriangleExclamation}
                    className={`w-3.5 h-3.5 ${isSimulatedCritical ? 'text-emerald-600' : 'text-rose-600'}`}
                  />
                  <span>{isSimulatedCritical ? 'Reset Kondisi Aman' : 'Simulasi Terik Kritis'}</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isSimulatedCritical
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  DEMO
                </span>
              </button>

              <div className="my-1.5 border-t border-slate-100" />

              {/* Link Cepat ke Modul Lain */}
              <div className="px-1 py-1 space-y-0.5">
                <a
                  href="/simulator"
                  className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Simulator Sains Biofisika
                </a>
                <a
                  href="/prescription"
                  className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Preskripsi Urea Presisi
                </a>
                <a
                  href="/report"
                  className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Laporan Rekapitulasi
                </a>
              </div>

              <div className="my-1.5 border-t border-slate-100" />

              {/* Status LoRa & Provenance Badge */}
              <div className="px-3 py-2 text-[10px] text-slate-500 space-y-0.5 bg-slate-50 border border-slate-100 rounded-xl font-mono">
                <div className="font-semibold text-emerald-700">LoRa 433 MHz: Online</div>
                {provenanceSha && (
                  <div className="truncate text-slate-500">
                    SHA-256: {provenanceSha.substring(0, 12)}...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CockpitTopBar;
