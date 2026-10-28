'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  }> = [
    { key: 'showAvriHeatmap', label: 'Heatmap Risiko (AVRI)' },
    { key: 'showMoistureContour', label: 'Kontur Kadar Air' },
    { key: 'showLoraNodes', label: 'Titik Sensor LoRa' },
    { key: 'showCadastralBorders', label: 'Batas Bidang Petak' },
    { key: 'autoFailover', label: 'Imputasi Otomatis (Failover)' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-slate-900/90 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 shadow-2xl hover:bg-slate-800 transition-all text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5"
        title="Pengaturan Lapisan Peta"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Lapisan Peta</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-64 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-3 z-30 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-100 select-none text-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-semibold text-white text-xs">Lapisan Spasial</span>
            <span className="text-[11px] text-slate-400 font-mono">Google Earth View</span>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-1">
            {layerItems.map((item) => {
              const isActive = Boolean(layers[item.key]);
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleLayer(item.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-medium'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <span className="text-xs leading-normal">{item.label}</span>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-emerald-500 text-white' : 'border border-white/20'
                    }`}
                  >
                    {isActive && (
                      <span className="text-[10px] leading-none font-bold">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Opacity Slider */}
          {onUpdateOpacity && layers.showAvriHeatmap && (
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Opasitas Heatmap</span>
                <span className="font-semibold text-emerald-400">
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
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLayersPopover;
