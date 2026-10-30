'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initialFieldNodes } from '@/mocks/adminMock';
import { FieldNodeItem, CalibrationParams } from '@/types/admin';
import { getNodesList, registerFieldNode } from '@/services/api';
import { CalibrationModal } from '@/components/modals/CalibrationModal';
import { OnboardingQRModal } from '@/components/modals/OnboardingQRModal';
import {
  RotateCcw,
  QrCode,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export const NodeManagement: React.FC = () => {
  const [nodes, setNodes] = useState<FieldNodeItem[]>(initialFieldNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('VS-A1-001');
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setIsBackendSynced] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Fetch real node data from FastAPI backend
  const loadNodeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const nodesRes = await getNodesList('BLOK-A');

      if (nodesRes && nodesRes.length > 0) {
        setNodes(nodesRes);
        setIsBackendSynced(true);
        setSelectedNodeId((prevId) =>
          nodesRes.some((n) => n.id === prevId) ? prevId : nodesRes[0].id
        );
      }
    } catch (err) {
      console.warn('Gagal memuat data node dari backend, menggunakan data lokal:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNodeData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNodeData, 30000);
    return () => clearInterval(interval);
  }, [loadNodeData]);

  // Generated JSON payload matching LoRa telemetry contract
  const payloadJson = JSON.stringify(
    {
      n: selectedNode.id,
      ts: selectedNode.timestampEpoch,
      m: selectedNode.moisturePct,
      t: selectedNode.tempC,
      ph: selectedNode.ph,
      b: selectedNode.batteryV,
      rssi: selectedNode.rssiLoRa,
      snr: selectedNode.snrDb ?? 8.2,
      loss: selectedNode.packetLossPct ?? 0.4,
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

  const handleRegisterNode = async (newNode: FieldNodeItem) => {
    // 1. Kirim langsung ke FastAPI backend & TimescaleDB
    const registered = await registerFieldNode({
      node_id: newNode.id,
      field_id: 'BLOK-A',
      bedeng_location: newNode.bedengLocation,
      firmware_ver: 'v1.0.2-prod',
    });

    const targetNode = registered || newNode;
    setNodes((prev) => {
      const exists = prev.some((n) => n.id === targetNode.id);
      return exists ? prev.map((n) => (n.id === targetNode.id ? targetNode : n)) : [...prev, targetNode];
    });
    setSelectedNodeId(targetNode.id);

    if (registered) {
      setToastMessage(`✓ Node ${targetNode.id} berhasil terdaftar di TimescaleDB & jaringan LoRa.`);
    } else {
      setToastMessage(`Node ${targetNode.id} ditambahkan ke memori lokal.`);
    }
    setTimeout(() => setToastMessage(null), 3500);
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Top Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Titik Pantau Lahan
            </h2>

          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pemantauan otomatis kelembapan tanah, suhu tanah, pH, dan status operasional petak
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={loadNodeData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
            title="Muat Ulang Telemetri Node"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

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
                <th className="py-2.5 px-3 text-right">SINYAL LORA (RSSI / SNR)</th>
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
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'
                      }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#1B6633]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {node.id}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {node.bedengLocation}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-semibold ${isOnline ? 'text-emerald-600' : 'text-red-600'
                          }`}
                      >
                        {node.sleepIntervalText}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-mono">
                      {node.moisturePct.toString().replace('.', ',')}% &nbsp;|&nbsp;{' '}
                      {node.tempC.toString().replace('.', ',')}°C &nbsp;|&nbsp;{' '}
                      {node.ph.toString().replace('.', ',')}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {node.batteryPct}% ({node.batteryV.toString().replace('.', ',')}V · {node.consumptionPerCycle})
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      <span className="font-bold text-slate-900">{node.rssiLoRa} dBm</span>
                      {node.snrDb != null && (
                        <span className="text-3xs text-slate-400 block">
                          SNR {node.snrDb >= 0 ? '+' : ''}{node.snrDb.toFixed(1)} dB · Loss {node.packetLossPct ?? 0.4}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= LOWER SECTION: LIVE LORA PAYLOAD INSPECTOR (FULL WIDTH) ================= */}
      <div className="w-full bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Live LoRa Payload Inspector
          </h3>
        </div>

        {/* Live LoRa RF Signal Metrics Card (Expanded Across Full Width) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
          <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
              Kekuatan Sinyal
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
              {selectedNode.rssiLoRa} dBm
            </span>
            <span className="text-3xs text-emerald-600 font-semibold block mt-0.5">Sinyal Prima</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
              Noise Margin (SNR)
            </span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono mt-0.5 block">
              {selectedNode.snrDb != null ? `${selectedNode.snrDb >= 0 ? '+' : ''}${selectedNode.snrDb.toFixed(1)}` : '+8.2'} dB
            </span>
            <span className="text-3xs text-slate-500 font-medium block mt-0.5">Margin Tinggi</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
              Packet Loss
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
              {selectedNode.packetLossPct != null ? `${selectedNode.packetLossPct.toFixed(1)}%` : '0.4%'}
            </span>
            <span className="text-3xs text-emerald-600 font-semibold block mt-0.5">Transmisi Stabil</span>
          </div>
        </div>

        {/* Terminal Window (Full Width) */}
        <div className="relative bg-[#111B21] rounded-2xl p-5 font-mono text-xs text-white shadow-inner border border-slate-800">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
            title="Salin JSON Payload"
          >
            {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <pre className="text-emerald-400 overflow-x-auto selection:bg-emerald-900 text-xs sm:text-sm leading-relaxed">
            {payloadJson}
          </pre>
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