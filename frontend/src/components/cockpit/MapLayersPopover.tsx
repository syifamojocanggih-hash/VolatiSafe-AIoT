'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faFire,
  faDroplet,
  faTowerBroadcast,
  faDrawPolygon,
  faMicrochip,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { CockpitLayerConfig } from './FloatingLeftControls';

interface MapLayersPopoverProps {
  layers: CockpitLayerConfig;
  onToggleLayer: (layerKey: keyof CockpitLayerConfig) => void;
  onUpdateOpacity?: (val: number) => void;
}

export const MapLayersPopover: React.FC<MapLayersPopoverProps> = ({
  layers,
  onToggleLayer,
  onUpdateOpacity,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const layerItems: Array<{
    key: keyof CockpitLayerConfig;
    label: string;
    icon: typeof faFire;
    color: string;
  }> = [
    { key: 'showAvriHeatmap', label: 'Heatmap Risiko (AVRI)', icon: faFire, color: 'text-rose-600' },
    { key: 'showMoistureContour', label: 'Kontur Kadar Air', icon: faDroplet, color: 'text-sky-600' },
    { key: 'showLoraNodes', label: 'Titik Sensor LoRa', icon: faTowerBroadcast, color: 'text-emerald-600' },
    { key: 'showCadastralBorders', label: 'Batas Bidang Petak', icon: faDrawPolygon, color: 'text-amber-600' },
    { key: 'autoFailover', label: 'Imputasi Otomatis (FAO-56)', icon: faMicrochip, color: 'text-indigo-600' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 text-xs font-semibold ${
          isOpen
            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
            : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
        }`}
        title="Pengaturan Lapisan Spasial Peta"
      >
        <FontAwesomeIcon icon={faLayerGroup} className="w-3.5 h-3.5 text-emerald-600" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-3xl rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-3.5 z-50 space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-150 select-none text-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-500/20">
                <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" />
              </div>
              <span>Lapisan Spasial</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Digital Twin</span>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-1">
            {layerItems.map((item) => {
              const isActive = Boolean(layers[item.key]);
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleLayer(item.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 active:scale-98 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400/20'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs leading-normal flex items-center gap-2.5">
                    <FontAwesomeIcon icon={item.icon} className={`w-3.5 h-3.5 ${item.color}`} />
                    <span>{item.label}</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-emerald-600 text-white shadow-xs' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isActive && (
                      <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Opacity Slider */}
          {onUpdateOpacity && layers.showAvriHeatmap && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Opasitas Heatmap</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {Math.round(layers.heatmapOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={layers.heatmapOpacity}
                onChange={(e) => onUpdateOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLayersPopover;
