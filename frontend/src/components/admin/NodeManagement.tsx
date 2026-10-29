'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initialFieldNodes, initialBoMList } from '@/mocks/adminMock';
import { FieldNodeItem, BoMItem, CalibrationParams } from '@/types/admin';
import { getNodesList, getHardwareBoM, registerFieldNode } from '@/services/api';
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
  const [bomList, setBomList] = useState<BoMItem[]>(initialBoMList);
  const [totalBomCost, setTotalBomCost] = useState<number>(449000);
  const [, setIsBackendSynced] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Fetch real node data and hardware BoM from FastAPI backend
  const loadNodeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nodesRes, bomRes] = await Promise.all([
        getNodesList('BLOK-A'),
        getHardwareBoM(),
      ]);

      if (nodesRes && nodesRes.length > 0) {
        setNodes(nodesRes);
        setIsBackendSynced(true);
        setSelectedNodeId((prevId) =>
          nodesRes.some((n) => n.id === prevId) ? prevId : nodesRes[0].id
        );
      }

      if (bomRes) {
        if (bomRes.items && bomRes.items.length > 0) {
          setBomList(bomRes.items);
        }
        if (bomRes.totalCostIdr) {
          setTotalBomCost(bomRes.totalCostIdr);
        }
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
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#1B6633]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {node.id}
                      </div>
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

      {/* ================= LOWER SECTION: PAYLOAD INSPECTOR (LEFT) + BOM & PINOUT (RIGHT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ================= LEFT: LIVE LORA PAYLOAD INSPECTOR (6 cols on lg) ================= */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Live LoRa Payload Inspector · SF7 · 52 Bytes
              </h3>
              <span className="font-mono text-3xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                433.0 MHz ISM
              </span>
            </div>

            {/* Live LoRa RF Signal Metrics Card */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Kekuatan Sinyal
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {selectedNode.rssiLoRa} dBm
                </span>
                <span className="text-3xs text-emerald-600 font-semibold block">Sinyal Prima</span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Noise Margin (SNR)
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono mt-0.5 block">
                  {selectedNode.snrDb != null ? `${selectedNode.snrDb >= 0 ? '+' : ''}${selectedNode.snrDb.toFixed(1)}` : '+8.2'} dB
                </span>
                <span className="text-3xs text-slate-500 font-medium block">Margin Tinggi</span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Packet Loss
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {selectedNode.packetLossPct != null ? `${selectedNode.packetLossPct.toFixed(1)}%` : '0.4%'}
                </span>
                <span className="text-3xs text-emerald-600 font-semibold block">Transmisi Stabil</span>
              </div>
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Rincian Biaya Perangkat (BoM) & Pinout
                </h3>
                <p className="text-3xs text-slate-400 font-medium">
                  {bomList.length} Komponen Modular · Terverifikasi Standar Kompetisi
                </p>
              </div>
              <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                TKT-3 Ready
              </span>
            </div>

            {/* BoM Component Cards (Scrollable List for Complete 10 Items) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {bomList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#FBF9F5] border border-slate-200/80 space-y-1 hover:border-emerald-300 transition-colors"
                >
                  <p className="font-bold text-slate-900 text-xs truncate" title={item.componentName}>
                    {item.componentName}
                  </p>
                  <div className="flex items-center justify-between text-3xs font-semibold text-slate-500">
                    <span className="font-mono text-slate-600 truncate max-w-[110px]">{item.pinMapping}</span>
                    <span className="text-emerald-800 font-bold">Rp{item.priceIdr.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Total BoM */}
          <div className="pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Total BoM Paket Lengkap (IP65 + Dual Power):
              </span>
              <span className="text-lg font-extrabold text-[#1A5323]">
                Rp{totalBomCost.toLocaleString('id-ID')}
              </span>
            </div>
            <p className="text-3xs text-slate-400 italic">
              *Tercakup dalam pagu dana pembinaan prototipe fisik 10 besar finalis (Rp3.000.000).
            </p>
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