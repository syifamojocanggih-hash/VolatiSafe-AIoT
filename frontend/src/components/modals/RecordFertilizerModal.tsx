'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Database } from 'lucide-react';
import { ApplicationLog } from '@/types/agronomy';

interface RecordFertilizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newLog: ApplicationLog) => void;
  currentHst: number;
}

export const RecordFertilizerModal: React.FC<RecordFertilizerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentHst,
}) => {
  const [stageName, setStageName] = useState('Fase V8 (Pemupukan Susulan I)');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [mixture, setMixture] = useState('105 kg Urea + 40 kg NPK Phonska (19 Ember)');
  const [avriScore, setAvriScore] = useState(18);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = dateStr.split('-').reverse().join('/');
    const statusText = avriScore <= 30 ? 'Optimal (Aman)' : avriScore <= 60 ? 'Waspada' : 'Kritis';

    const newLog: ApplicationLog = {
      id: `log-${Date.now()}`,
      stageName,
      hst: currentHst,
      dateStr: formattedDate,
      mixtureSummary: mixture,
      avriAtApplication: avriScore,
      statusText,
    };

    onSave(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup form"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          <Database className="w-4 h-4 text-emerald-600" />
          Log Digital Twin (F_log)
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Catat Pemupukan Selesai
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Simpan data takaran nyata untuk kalibrasi neraca hara dan pengasaman tanah
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fase Pertumbuhan Tanaman
            </label>
            <select
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Fase V3 (Pemupukan Dasar)">Fase V3 (Pemupukan Dasar) · 10–14 HST</option>
              <option value="Fase V8 (Pemupukan Susulan I)">Fase V8 (Pemupukan Susulan I) · 30–35 HST</option>
              <option value="Fase V12 (Pemupukan Susulan II)">Fase V12 (Pemupukan Susulan II) · 45–50 HST</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Penaburan
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Takaran Campuran yang Ditebar
            </label>
            <input
              type="text"
              value={mixture}
              onChange={(e) => setMixture(e.target.value)}
              placeholder="Contoh: 105 kg Urea + 40 kg NPK Phonska (19 Ember)"
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Skor AVRI Saat Penaburan (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={avriScore}
              onChange={(e) => setAvriScore(Number(e.target.value))}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Catatan ke Digital Twin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
