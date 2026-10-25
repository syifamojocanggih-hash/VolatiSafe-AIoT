'use client';

import React, { useState } from 'react';
import { X, Sliders, CheckCircle } from 'lucide-react';
import { CalibrationParams } from '@/types/admin';
import { initialCalibrationParams } from '@/mocks/adminMock';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: CalibrationParams) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [params, setParams] = useState<CalibrationParams>(initialCalibrationParams);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup kalibrasi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          <Sliders className="w-4 h-4 text-emerald-600" />
          Hardware Firmware Calibration
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Kalibrasi Sensor 2-Titik
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Sesuaikan nilai konversi ADC ke besaran fisik tanah untuk mencegah bias pembacaan
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Target Node
            </label>
            <select
              value={params.nodeId}
              onChange={(e) => setParams({ ...params, nodeId: e.target.value })}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="VS-A1-001">VS-A1-001 (Blok A1 Utara Atas)</option>
              <option value="VS-A2-002">VS-A2-002 (Blok A2 Tengah Lembah)</option>
              <option value="VS-A3-003">VS-A3-003 (Blok A3 Timur Kapur)</option>
              <option value="VS-B1-004">VS-B1-004 (Blok B1 Selatan Irigasi)</option>
              <option value="VS-B2-005">VS-B2-005 (Blok B2 Lereng Selatan)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              1. Sensor Kelembaban Kapasitif (GPIO34)
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  Udara Kering (Dry ADC)
                </label>
                <input
                  type="number"
                  value={params.dryAdc}
                  onChange={(e) => setParams({ ...params, dryAdc: Number(e.target.value) })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  Air Jenuh (Wet ADC)
                </label>
                <input
                  type="number"
                  value={params.wetAdc}
                  onChange={(e) => setParams({ ...params, wetAdc: Number(e.target.value) })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              2. Probe pH Tanah (GPIO32)
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  Buffer pH 4.01 ADC
                </label>
                <input
                  type="number"
                  value={params.ph4BufferAdc}
                  onChange={(e) => setParams({ ...params, ph4BufferAdc: Number(e.target.value) })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  Buffer pH 6.86 ADC
                </label>
                <input
                  type="number"
                  value={params.ph7BufferAdc}
                  onChange={(e) => setParams({ ...params, ph7BufferAdc: Number(e.target.value) })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Parameter ke Node</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
