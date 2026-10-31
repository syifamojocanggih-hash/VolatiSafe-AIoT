'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Database, Loader2, Scale, Calendar, Info } from 'lucide-react';
import { ApplicationLog } from '@/types/agronomy';
import { recordFertilizerLog } from '@/services/api';

interface RecordFertilizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newLog: ApplicationLog) => void;
  currentHst: number;
  fieldId?: string;
}

export const RecordFertilizerModal: React.FC<RecordFertilizerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentHst,
  fieldId = 'BLOK-A',
}) => {
  const [stageName, setStageName] = useState('Fase V8 (Pemupukan Susulan I)');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [ureaKg, setUreaKg] = useState<number>(105);
  const [npkKg, setNpkKg] = useState<number>(40);
  const [zaKg, setZaKg] = useState<number>(0);
  const [avriScore, setAvriScore] = useState<number>(18);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto calculate bucket equivalents
  const totalKg = Math.round((Number(ureaKg) || 0) + (Number(npkKg) || 0) + (Number(zaKg) || 0));
  const bucketsCount = Math.round(totalKg / 8.0);

  const parts: string[] = [];
  if (ureaKg > 0) parts.push(`${ureaKg} kg Urea`);
  if (npkKg > 0) parts.push(`${npkKg} kg NPK Phonska`);
  if (zaKg > 0) parts.push(`${zaKg} kg ZA`);
  const computedSummary = parts.length > 0 ? `${parts.join(' + ')} (${bucketsCount} Ember)` : '0 kg Pupuk';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formattedDate = dateStr.split('-').reverse().join('/');
    const statusText = avriScore <= 30 ? 'Optimal (Aman)' : avriScore <= 60 ? 'Waspada' : 'Kritis';
    const finalSummary = customNotes.trim() ? customNotes : computedSummary;

    try {
      const res = await recordFertilizerLog({
        field_id: fieldId,
        stage_name: stageName,
        applied_at: dateStr,
        hst: currentHst,
        urea_kg: Number(ureaKg) || 0,
        npk_phonska_kg: Number(npkKg) || 0,
        za_kg: Number(zaKg) || 0,
        avri_at_time: Number(avriScore) || 18,
        notes: finalSummary,
      });

      const newLog: ApplicationLog = {
        id: res?.log_id || `log-${Date.now()}`,
        stageName: res?.stage_name || stageName,
        hst: res?.hst || currentHst,
        dateStr: res?.date_str || formattedDate,
        mixtureSummary: res?.mixture_summary || finalSummary,
        avriAtApplication: res?.avri_at_time ?? avriScore,
        statusText: res?.status_text || statusText,
      };

      onSave(newLog);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan catatan ke backend database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup form"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Log Digital Twin (F_log) & TimescaleDB</span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-1">
          Catat Aplikasi Pupuk Selesai
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Simpan dosis nyata untuk kalibrasi neraca nitrogen, pengasaman tanah, dan persistensi audit database.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Growth Phase */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fase Pertumbuhan Tanaman
            </label>
            <select
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all"
            >
              <option value="Fase V3 (Pemupukan Dasar)">Fase V3 (Pemupukan Dasar) · 10–14 HST</option>
              <option value="Fase V8 (Pemupukan Susulan I)">Fase V8 (Pemupukan Susulan I) · 30–35 HST</option>
              <option value="Fase V12 (Pemupukan Susulan II)">Fase V12 (Pemupukan Susulan II) · 45–50 HST</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Tanggal Penaburan</span>
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all"
            />
          </div>

          {/* Fertilizer Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-2xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rincian Takaran Nyata (kg)</span>
              </label>
              <span className="text-2xs font-bold text-emerald-700">
                Total: {totalKg} kg (± {bucketsCount} Ember)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  Urea (kg)
                </label>
                <input
                  type="number"
                  min={0}
                  value={ureaKg}
                  onChange={(e) => setUreaKg(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  NPK Phonska
                </label>
                <input
                  type="number"
                  min={0}
                  value={npkKg}
                  onChange={(e) => setNpkKg(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  ZA (kg)
                </label>
                <input
                  type="number"
                  min={0}
                  value={zaKg}
                  onChange={(e) => setZaKg(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="text-3xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
              Ringkasan: <strong>{computedSummary}</strong>
            </div>
          </div>

          {/* AVRI Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Skor AVRI Saat Penaburan (%)
              </label>
              <span
                className={`text-2xs font-extrabold px-2 py-0.5 rounded-full ${
                  avriScore <= 30
                    ? 'bg-emerald-100 text-emerald-800'
                    : avriScore <= 60
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {avriScore <= 30 ? 'Aman' : avriScore <= 60 ? 'Waspada' : 'Kritis'} ({avriScore}%)
              </span>
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={avriScore}
              onChange={(e) => setAvriScore(Number(e.target.value))}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Lapangan (Opsional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={`Default: "${computedSummary}"`}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Digital Twin Math Notice */}
          <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-3xs text-emerald-900 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Tindakan ini akan mengupdate nilai <code>last_urea_kg</code> di tabel <code>field_state</code> dan mengkalibrasi model pengasaman tanah: <code>pH(t+1) = pH(t) - 0.002 × N_applied</code>.
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting
                  ? 'bg-slate-400 text-white cursor-wait'
                  : 'bg-[#236B32] hover:bg-[#1C5628] text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke TimescaleDB...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Simpan Catatan ke Digital Twin & Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
