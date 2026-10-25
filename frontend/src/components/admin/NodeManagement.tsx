'use client';

import React, { useState } from 'react';
import { initialFieldNodes, initialBoMList } from '@/mocks/adminMock';
import { FieldNodeItem, CalibrationParams } from '@/types/admin';
import { CalibrationModal } from '@/components/modals/CalibrationModal';
import { OnboardingQRModal } from '@/components/modals/OnboardingQRModal';
import {
  RotateCcw,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';

export const NodeManagement: React.FC = () => {
  const [nodes, setNodes] = useState<FieldNodeItem[]>(initialFieldNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('VS-A1-001');
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Generated JSON payload matching LoRa telemetry contract
  const payloadJson = JSON.stringify(
    {
      n: selectedNode.id,
      ts: selectedNode.timestampEpoch,
      m: selectedNode.moisturePct,
      t: selectedNode.tempC,
      ph: selectedNode.ph,
      b: selectedNode.batteryV,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadJson);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSaveCalibration = (params: CalibrationParams) => {
    setToastMessage(`Nilai kalibrasi 2-titik untuk node ${params.nodeId} berhasil diperbarui.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRegisterNode = (newNode: FieldNodeItem) => {
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setToastMessage(`Node ${newNode.id} berhasil terdaftar dan ditambahkan ke jaringan LoRa.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Top Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Field Node & Jaringan LoRa 433 MHz
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ESP32 + Capacitive Moisture v1.2 + DS18B20 + Soil pH + SX1278 Ra-02 (Deep Sleep 15 menit)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setIsCalibrationOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Kalibrasi Sensor 2-Titik</span>
          </button>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#236B32] hover:bg-[#1C5628] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5 text-white" />
            <span>Onboarding Node QR</span>
          </button>
        </div>
      </div>

      {/* ================= UPPER SECTION: NODE STATUS TABLE ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">NODE ID</th>
                <th className="py-2.5 px-3">LOKASI BEDENG</th>
                <th className="py-2.5 px-3">STATUS TRANSMISI</th>
                <th className="py-2.5 px-3">SENSOR LIVE (θ / T / PH)</th>
                <th className="py-2.5 px-3">BATERAI 18650 + SOLAR</th>
                <th className="py-2.5 px-3 text-right">RSSI LORA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const isOnline = node.transmissionStatus === 'online';

                return (
                  <tr
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#1B6633]">
                      {node.id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {node.bedengLocation}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-semibold ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {node.sleepIntervalText}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {node.moisturePct.toString().replace('.', ',')}% &nbsp;|&nbsp;{' '}
                      {node.tempC.toString().replace('.', ',')}°C &nbsp;|&nbsp;{' '}
                      {node.ph.toString().replace('.', ',')}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {node.batteryPct}% ({node.batteryV.toString().replace('.', ',')}V · {node.consumptionPerCycle})
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {node.rssiLoRa} dBm
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= LOWER SECTION: PAYLOAD INSPECTOR (LEFT) + BOM & PINOUT (RIGHT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ================= LEFT: LIVE LORA PAYLOAD INSPECTOR (6 cols on lg) ================= */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Live LoRa Payload Inspector · SF7 · 52 Bytes
              </h3>
              <span className="font-mono text-3xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                433.0 MHz ISM
              </span>
            </div>

            {/* Terminal Window */}
            <div className="relative bg-[#111B21] rounded-2xl p-4 font-mono text-xs text-white shadow-inner border border-slate-800">
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title="Salin JSON Payload"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="text-emerald-400 overflow-x-auto selection:bg-emerald-900">
                {payloadJson}
              </pre>
            </div>
          </div>

          {/* Technical Hardware Footnote */}
          <p className="text-3xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
            Firmware mengeksekusi <strong>MOSFET Gate Control (GPIO25)</strong> untuk memutus arus VCC sensor saat Deep Sleep (10 µA), mencegah elektrolisis probe & menghemat baterai hingga &gt;120 hari.
          </p>
        </div>

        {/* ================= RIGHT: RINGKASAN BOM & PIN MAPPING (6 cols on lg) ================= */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-3">
              Ringkasan BoM & Pin Mapping ESP32
            </h3>

            {/* 4 BoM Component Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {initialBoMList.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-slate-200/80 space-y-1"
                >
                  <p className="font-bold text-slate-900 text-xs truncate">
                    {item.componentName}
                  </p>
                  <p className="text-3xs font-semibold text-slate-500">
                    {item.pinMapping} &nbsp;·&nbsp;{' '}
                    <span className="text-slate-700">Rp{item.priceIdr.toLocaleString('id-ID')}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Total BoM */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              Total BoM per Node (IP65 + Solar lengkap):
            </span>
            <span className="text-lg font-extrabold text-[#1A5323]">
              &plusmn; Rp305.000
            </span>
          </div>
        </div>
      </div>

      {/* Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        onSave={handleSaveCalibration}
      />

      {/* Onboarding QR Modal */}
      <OnboardingQRModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onRegister={handleRegisterNode}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
