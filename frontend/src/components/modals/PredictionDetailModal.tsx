'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Thermometer, Droplet, Activity } from 'lucide-react';
import { StatusBannerData, MetricItem } from '@/types/dashboard';

interface PredictionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusBanner: StatusBannerData;
  metrics: MetricItem[];
}

export const PredictionDetailModal: React.FC<PredictionDetailModalProps> = ({
  isOpen,
  onClose,
  statusBanner,
  metrics,
}) => {
  if (!isOpen) return null;

  const isAman = statusBanner.category === 'aman';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isAman ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isAman ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Detail Prediksi Risiko AVRI
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Analisis Model Physics-Informed ML & Arrhenius Kinetics
            </p>
          </div>
        </div>

        {/* Status Score Card */}
        <div
          className={`rounded-2xl p-4 mb-4 border ${
            isAman ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide">
              Indeks Volatilisasi (AVRI)
            </span>
            <span className="text-2xl font-extrabold">{statusBanner.avriScore}%</span>
          </div>
          <p className="text-xs mt-1 text-slate-600 font-medium leading-relaxed">
            {statusBanner.title}. {statusBanner.openDurationText}
          </p>
        </div>

        {/* Breakdown Factors (SHAP TreeSHAP Attribution) */}
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Faktor Penentu Kondisi Tanah
        </h4>
        <div className="space-y-2.5 mb-5">
          {metrics
            .filter((m) => !m.isAvriCard)
            .map((m) => {
              let Icon = Droplet;
              if (m.id === 'temp') Icon = Thermometer;
              if (m.id === 'ph') Icon = Activity;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      {m.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {m.value}
                    </span>
                    <span className="text-2xs text-emerald-600 font-medium ml-2">
                      (Optimal)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Agronomy Field Action Recommendation */}
        <div className="p-4 rounded-2xl bg-slate-100 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Rekomendasi Preskripsi Lapangan:
          </p>
          <p className="text-slate-600 leading-relaxed">
            Tanah berada dalam kelembaban optimal ({'>'}40%). Lakukan pemupukan Urea dengan teknik benam samping tanaman (7–10 cm dari pangkal batang) untuk memastikan efisiensi penyerapan nitrogen mencapai maksimal.
          </p>
        </div>

        {/* Modal Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white font-bold text-sm transition-all shadow-sm active:scale-[0.98]"
        >
          Mengerti & Tutup
        </button>
      </div>
    </div>
  );
};
