'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, QrCode, CheckCircle } from 'lucide-react';
import { FieldNodeItem } from '@/types/admin';

interface OnboardingQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newNode: FieldNodeItem) => void;
}

export const OnboardingQRModal: React.FC<OnboardingQRModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [nodeId, setNodeId] = useState('VS-B3-006');
  const [location, setLocation] = useState('Blok B3 (Timur Selatan)');

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newNode: FieldNodeItem = {
      id: nodeId,
      bedengLocation: location,
      transmissionStatus: 'online',
      sleepIntervalText: 'Online · Sleep 15m',
      moisturePct: 35.0,
      tempC: 27.5,
      ph: 7.10,
      batteryPct: 98,
      batteryV: 4.15,
      consumptionPerCycle: '0,067 mAh/siklus',
      rssiLoRa: -65,
      timestampEpoch: Math.floor(Date.now() / 1000),
    };

    onRegister(newNode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup form onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="VolatiSafe" width={30} height={30} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-2xs font-bold text-emerald-800 uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Field Node Registration
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Onboarding Node Baru (QR Code)
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Pindai kode QR fisik pada stiker enclosure IP65 atau ketik ID node
        </p>

        {/* Simulated Camera Viewfinder */}
        <div className="relative w-full h-44 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-emerald-500/50 mb-4">
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

          {/* Scanning line animation */}
          <div className="w-48 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_#34D399] animate-pulse" />

          <div className="absolute bottom-2 text-center text-3xs text-emerald-300 font-mono">
            [Kamera Siap: Arahkan ke Kode QR Node]
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ID Node Sensor (Berdasarkan QR)
            </label>
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full font-mono text-xs font-bold text-slate-800 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alokasi Lokasi Bedeng Lahan
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Daftarkan & Inisialisasi Transmisi LoRa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
