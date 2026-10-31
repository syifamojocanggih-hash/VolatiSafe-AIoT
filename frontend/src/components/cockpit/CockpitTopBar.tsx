'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEarthAmericas,
  faMagnifyingGlass,
  faArrowLeft,
  faLocationDot,
  faSliders,
  faClockRotateLeft,
  faClock,
  faCloudSun,
  faExpand,
  faCompress,
  faGear,
  faCircleUser,
  faFileLines,
  faRoute,
  faChevronDown,
  faTriangleExclamation,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

interface CockpitTopBarProps {
  fieldName?: string;
  location?: string;
  isSimulatedCritical: boolean;
  onToggleScenario: () => void;
  onOpenSpkModal?: () => void;
  onOpenJuryTour?: () => void;
  onOpenSandbox?: () => void;
  onOpenParcels?: () => void;
  onOpen72h?: () => void;
  criticalCount?: number;
  warningCount?: number;
  safeCount?: number;
  bmkgWeather?: string;
  provenanceSha?: string;
  isFullScreenMap?: boolean;
  onToggleFullScreenMap?: () => void;
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
  onOpen72h,
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
    <div className="w-full flex flex-col select-none shrink-0 z-30 transition-all">
      {/* 1. GOOGLE EARTH SUBTLE TOP MENU BAR */}
      <div className="w-full h-7 bg-slate-950/95 border-b border-white/10 px-3.5 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-white font-bold hover:text-emerald-400 transition-colors"
            title="VolatiSafe Digital Twin Home"
          >
            <FontAwesomeIcon icon={faEarthAmericas} className="text-sky-400 text-xs" />
            <span className="tracking-wide">VolatiSafe Earth</span>
          </a>

          <div className="hidden md:flex items-center gap-3 text-slate-400 text-[11px]">
            <a href="/" className="hover:text-white transition-colors">File</a>
            <button onClick={onOpenSandbox} className="hover:text-white transition-colors">Edit</button>
            <button onClick={onToggleFullScreenMap} className="hover:text-white transition-colors">View</button>
            <button onClick={onOpenJuryTour} className="hover:text-white transition-colors">Tools</button>
            <button onClick={onOpenSpkModal} className="hover:text-white transition-colors">SPK</button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Digital Twin Pro
          </span>

          {onOpenJuryTour && (
            <button
              onClick={onOpenJuryTour}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Tur Panduan Sistem"
            >
              <FontAwesomeIcon icon={faRoute} className="text-xs" />
            </button>
          )}

          {onOpenSandbox && (
            <button
              onClick={onOpenSandbox}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Pengaturan Simulasi"
            >
              <FontAwesomeIcon icon={faGear} className="text-xs" />
            </button>
          )}

          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
            <FontAwesomeIcon icon={faCircleUser} className="text-xs" />
          </div>
        </div>
      </div>

      {/* 2. GOOGLE EARTH FLOATING CAPSULE TOOLBAR */}
      <header className="w-full h-12 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between gap-3 text-white shadow-xl">
        {/* KIRI: Search Capsule & Quick Tool Buttons */}
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="/"
            className="text-xs font-medium text-slate-300 hover:text-white transition-all shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
            title="Kembali ke Beranda"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px] text-slate-400" />
            <span className="hidden sm:inline">Beranda</span>
          </a>

          {/* Search Box Style Field Indicator */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 px-3 py-1 rounded-full text-xs shadow-inner max-w-[260px] sm:max-w-xs">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400 text-xs shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold text-white tracking-wide leading-tight">
                {fieldName}
              </span>
              <span className="text-[9px] text-slate-400 font-mono truncate leading-none">
                {location}
              </span>
            </div>
          </div>

          <div className="hidden md:block h-4 w-px bg-white/15 mx-0.5" />

          {/* Quick Tool Icons (FontAwesome) */}
          <div className="hidden md:flex items-center gap-1">
            {onOpenParcels && (
              <button
                onClick={onOpenParcels}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all"
                title="Buka Daftar Petak"
              >
                <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
              </button>
            )}

            {onOpenSandbox && (
              <button
                onClick={onOpenSandbox}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all"
                title="Buka Simulasi Parameter Kondisi (What-If)"
              >
                <FontAwesomeIcon icon={faSliders} className="text-xs" />
              </button>
            )}

            {onOpen72h && (
              <button
                onClick={onOpen72h}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all"
                title="Buka Simulasi Waktu 72 Jam"
              >
                <FontAwesomeIcon icon={faClockRotateLeft} className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* TENGAH: Status Risiko Pill */}
        <div className="hidden lg:flex items-center bg-slate-900/90 border border-white/10 rounded-full px-3.5 py-1 gap-3 text-xs shadow-lg backdrop-blur-md">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/40 animate-pulse" />
            {criticalCount} Kritis
          </span>
          <span className="text-white/20">·</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {warningCount} Waspada
          </span>
          <span className="text-white/20">·</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
            {safeCount} Aman
          </span>
        </div>

        {/* KANAN: Clock + Weather + Actions */}
        <div className="flex items-center gap-2">
          {/* Live Digital Clock */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-slate-200 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <FontAwesomeIcon icon={faClock} className="text-emerald-400 text-xs" />
            <span className="font-semibold tracking-wider">{currentTimeStr || '12:00:00 WIB'}</span>
          </div>

          {/* Cuaca BMKG */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-300 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <FontAwesomeIcon icon={faCloudSun} className="text-amber-400 text-xs" />
            <span className="font-medium">
              {bmkgWeather ? `BMKG: ${bmkgWeather}` : 'BMKG: 25°C · RH 95%'}
            </span>
          </div>

          {/* Fullscreen Map Toggle */}
          {onToggleFullScreenMap && (
            <button
              onClick={onToggleFullScreenMap}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shadow-sm flex items-center gap-1.5 ${
                isFullScreenMap
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20 hover:text-white'
              }`}
              title={isFullScreenMap ? 'Kembalikan Tampilan Panel Samping' : 'Tampilkan Map di Layar Penuh'}
            >
              <FontAwesomeIcon icon={isFullScreenMap ? faCompress : faExpand} className="text-[11px]" />
              <span className="hidden sm:inline">{isFullScreenMap ? 'Buka Panel' : 'Peta Penuh'}</span>
            </button>
          )}

          {/* Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="px-3 py-1 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-100 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Menu</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-[9px] text-slate-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 text-slate-200">
                {/* Opsi Tur Juri */}
                {onOpenJuryTour && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenJuryTour();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-slate-100 font-medium text-left transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faRoute} className="text-emerald-400 text-xs" />
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
                    className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-slate-100 font-medium text-left transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileLines} className="text-sky-400 text-xs" />
                      <span>Surat Perintah Kerja (SPK)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">P</span>
                  </button>
                )}

                {/* Opsi Toggle Skenario Terik (Juri Demo) */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleScenario();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-slate-100 font-medium text-left transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={isSimulatedCritical ? faCircleCheck : faTriangleExclamation}
                    className={isSimulatedCritical ? 'text-emerald-400' : 'text-amber-400'}
                  />
                  <span>
                    {isSimulatedCritical ? 'Reset ke Normal (AVRI 18%)' : 'Uji Skenario Terik (AVRI 74%)'}
                  </span>
                </button>

                <div className="my-1.5 border-t border-white/10" />

                {/* Menu Navigasi Modul */}
                <div className="space-y-0.5">
                  <a
                    href="/"
                    className="block px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Dashboard Petak
                  </a>
                  <a
                    href="/map"
                    className="block px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Peta Risiko Lahan
                  </a>
                  <a
                    href="/prescription"
                    className="block px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Preskripsi & Kalender
                  </a>
                  <a
                    href="/report"
                    className="block px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Laporan Rekapitulasi
                  </a>
                </div>

                <div className="my-1.5 border-t border-white/10" />

                {/* Status LoRa & Provenance Badge */}
                <div className="px-3 py-2 text-[10px] text-slate-400 space-y-0.5 bg-white/5 border border-white/5 rounded-xl font-mono">
                  <div className="font-semibold text-emerald-400">LoRa 433 MHz: Online</div>
                  {provenanceSha && (
                    <div className="truncate text-slate-400">
                      SHA-256: {provenanceSha.substring(0, 12)}...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default CockpitTopBar;
