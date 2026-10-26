import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { BedengParcel, ActiveLayer, ParcelMapSummary } from '@/types/parcel';
import { initialParcels, initialMapSummary } from '@/mocks/parcelsMock';
import { RefreshCw, Radio, Map as MapIcon, LayoutGrid, Layers } from 'lucide-react';
import { SchematicFieldDiagram } from './SchematicFieldDiagram';

// Dynamic import with ssr: false for Leaflet map component
const LeafletFieldMap = dynamic(() => import('./LeafletFieldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] sm:h-[450px] rounded-2xl bg-[#F4EFE6] flex flex-col items-center justify-center text-slate-500 gap-3 border border-[#E5DEC7]">
      <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-700">Memuat Peta Leaflet & Tile OpenStreetMap...</span>
    </div>
  ),
});

interface ParcelRiskMapProps {
  onBackToDashboard?: () => void;
}

export const ParcelRiskMap: React.FC<ParcelRiskMapProps> = () => {
  const [parcels, setParcels] = useState<BedengParcel[]>(initialParcels);
  const [selectedId, setSelectedId] = useState<string>('A1');
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('avri');
  const [mapViewMode, setMapViewMode] = useState<'leaflet' | 'schematic'>('leaflet');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedParcel = parcels.find((p) => p.id === selectedId) || parcels[0];
  const summary: ParcelMapSummary = initialMapSummary;

  // Handler for Digital Twin Failover Simulation
  const handleToggleFailover = () => {
    setParcels((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          const isCurrentlySimulated = p.status === 'simulated';
          const newStatus = isCurrentlySimulated ? 'online' : 'simulated';
          const newMode = isCurrentlySimulated ? 'LoRa Live Stream' : '[Est-Simulated] FAO-56';
          const msg = isCurrentlySimulated
            ? `Node ${p.nodeId} terhubung kembali ke jaringan LoRa.`
            : `Simulasi Dropout aktif! Digital Twin FAO-56 mengambil alih imputasi data ${p.nodeId}.`;
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3500);

          return {
            ...p,
            status: newStatus,
            telemetryMode: newMode,
          };
        }
        return p;
      })
    );
  };

  // Helper styling for polygons based on active layer
  const getParcelStyle = (p: BedengParcel) => {
    if (activeLayer === 'battery') {
      if (p.batteryPct > 80) {
        return {
          bg: 'bg-[#DCFCE7]',
          border: 'border-[#16A34A]',
          text: 'text-[#16A34A]',
          label: `${p.batteryPct}% (${p.batteryV}V)`,
        };
      }
      return {
        bg: 'bg-[#FEF9C3]',
        border: 'border-[#CA8A04] border-dashed',
        text: 'text-[#CA8A04]',
        label: `${p.batteryPct}% (${p.batteryV}V)`,
      };
    }

    if (activeLayer === 'lora') {
      if (p.status === 'online') {
        return {
          bg: 'bg-[#DCFCE7]',
          border: 'border-[#16A34A]',
          text: 'text-[#16A34A]',
          label: 'LoRa 433MHz Live',
        };
      }
      return {
        bg: 'bg-[#FEF9C3]',
        border: 'border-[#CA8A04] border-dashed',
        text: 'text-[#CA8A04]',
        label: '[Est-Simulated] FAO-56',
      };
    }

    // Default: Layer Risiko AVRI
    if (p.avriCategory === 'aman') {
      return {
        bg: 'bg-[#DCFCE7]',
        border: 'border-[#16A34A]',
        text: 'text-[#16A34A]',
        label: `AVRI ${p.avriScore}% (Aman)`,
      };
    }
    if (p.avriCategory === 'waspada' || p.status === 'simulated') {
      return {
        bg: 'bg-[#FEF9C3]',
        border: 'border-[#CA8A04] border-dashed',
        text: 'text-[#CA8A04]',
        label: p.status === 'simulated' ? '[Est-Simulated] FAO-56' : `AVRI ${p.avriScore}% (Waspada)`,
      };
    }
    if (p.avriCategory === 'kritis') {
      return {
        bg: 'bg-[#FCDCD4]',
        border: 'border-[#EA580C]',
        text: 'text-[#EA580C]',
        label: `AVRI ${p.avriScore}% (Kritis)`,
      };
    }
    // Bahaya
    return {
      bg: 'bg-[#FEE2E2]',
      border: 'border-[#DC2626]',
      text: 'text-[#DC2626]',
      label: `AVRI ${p.avriScore}% (Bahaya)`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Peta Zonasi Risiko Volatilisasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Klik poligon bedeng untuk melihat telemetri node LoRa · Total Luas Kawasan {summary.totalAreaHa.toFixed(1).replace('.', ',')} ha ({parcels.length + (summary.surroundingParcels?.length || 0)} Persil Kadastral)
          </p>
        </div>

        {/* Layer Filter Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveLayer('avri')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'avri'
                ? 'bg-[#236B32] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Layer Risiko AVRI
          </button>
          <button
            onClick={() => setActiveLayer('battery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'battery'
                ? 'bg-[#236B32] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Status Baterai
          </button>
          <button
            onClick={() => setActiveLayer('lora')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'lora'
                ? 'bg-[#236B32] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Koneksi LoRa
          </button>
        </div>
      </div>

      {/* ================= 1. FULL-WIDTH MAP CANVAS (Tarik ke Kanan Full) ================= */}
      <div className="w-full bg-[#FAF4E6] rounded-3xl p-5 sm:p-6 border border-[#E5DEC7] shadow-sm relative overflow-hidden">
        {/* Top Info inside Map Canvas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-2xs sm:text-xs text-slate-600 font-medium pb-4 border-b border-[#EADFC7]/60 mb-5">
          <div>
            <span className="font-semibold text-slate-800">Koordinat Hamparan:</span> {summary.coordinatesText} · {summary.soilTypeText}
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gateway Basecamp Aktif ({summary.gatewayDistanceKm.toString().replace('.', ',')} km)</span>
            </div>
          </div>

          {/* View Mode Toggle: Leaflet Map vs Schematic Grid */}
          <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-[#E5DEC7] shadow-2xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setMapViewMode('leaflet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapViewMode === 'leaflet'
                  ? 'bg-[#236B32] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta Spasial & Satelit</span>
            </button>
            <button
              onClick={() => setMapViewMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapViewMode === 'schematic'
                  ? 'bg-[#236B32] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Diagram Hamparan</span>
            </button>
          </div>
        </div>

        {/* Map Content: Leaflet OSM Map or Schematic Grid */}
        {mapViewMode === 'leaflet' ? (
          <div className="space-y-3">
            <LeafletFieldMap
              parcels={parcels}
              selectedId={selectedId}
              activeLayer={activeLayer}
              summary={summary}
              onSelectParcel={(id) => setSelectedId(id)}
            />
            <p className="text-3xs sm:text-2xs text-slate-500 italic text-center">
              * Klik langsung poligon bedeng di peta untuk menyorot telemetri node LoRa secara real-time.
            </p>
          </div>
        ) : (
          /* Real Vector Schematic Diagram of Agricultural Topography & IoT Nodes */
          <div className="space-y-3">
            <SchematicFieldDiagram
              parcels={parcels}
              selectedId={selectedId}
              activeLayer={activeLayer}
              summary={summary}
              onSelectParcel={(id) => setSelectedId(id)}
            />
          </div>
        )}

        {/* Bottom Map Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 mt-6 pt-4 border-t border-[#EADFC7]/60 text-xs text-slate-700 font-medium">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#16A34A]" />
              <span>Aman (0–30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#CA8A04]" />
              <span>Waspada (31–60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
              <span>Kritis / Bahaya (&gt;60%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-3 h-1 border-t-2 border-dashed border-[#CA8A04]" />
              <span>Simulasi Digital Twin FAO-56</span>
            </div>
          </div>

          <div className="text-2xs text-slate-500 font-semibold">
            Kawasan Tegal Kapur Desa Bluri · {summary.totalAreaHa.toFixed(1).replace('.', ',')} Ha
          </div>
        </div>
      </div>

      {/* ================= 2. SELECTED BEDENG DETAIL CARD (Ditaruh di Bawah Map) ================= */}
      <div className="w-full bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        {/* Header: Node ID + Name + AVRI Badge + Failover Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md">
                Node ID: {selectedParcel.nodeId}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-2xs font-bold ${
                selectedParcel.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedParcel.status === 'online' ? '● Online Radio LoRa 433 MHz' : '⚠ Digital Twin Mode'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              {selectedParcel.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <span
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold shadow-2xs ${
                selectedParcel.avriCategory === 'aman'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : selectedParcel.avriCategory === 'waspada'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              AVRI {selectedParcel.avriScore}% ({selectedParcel.avriCategory.toUpperCase()})
            </span>

            {/* Action: Failover Simulation Button */}
            <button
              onClick={handleToggleFailover}
              className="py-2 px-3.5 rounded-xl border border-amber-600/60 bg-amber-50/60 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-all flex items-center gap-2 shadow-2xs active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {selectedParcel.status === 'simulated'
                  ? 'Pulihkan Koneksi Node Fisik'
                  : 'Simulasikan Node Putus (Uji Digital Twin)'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Info Parameter Tiles (Wide 4-Column Responsive Layout) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 text-xs">
          {/* Tile 1: Varietas & Luas */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">Varietas & Luas</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block">
              {selectedParcel.cropVariety} ({selectedParcel.areaHa.toString().replace('.', ',')} Ha)
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">Komoditas Jagung Hibrida</span>
          </div>

          {/* Tile 2: Mode Telemetri */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">Mode Telemetri</span>
            <span
              className={`text-sm sm:text-base font-bold mt-1 block ${
                selectedParcel.status === 'online' ? 'text-emerald-700' : 'text-amber-600'
              }`}
            >
              {selectedParcel.telemetryMode}
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">
              Sinyal: {selectedParcel.loraSignalDbm} dBm (Transceiver 433 MHz)
            </span>
          </div>

          {/* Tile 3: Kelembaban & Suhu */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">Kelembaban & Suhu</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block">
              {selectedParcel.moisturePct.toString().replace('.', ',')}% · {selectedParcel.soilTempC.toString().replace('.', ',')}°C
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">Sensor Kapasitif FDR & NTC</span>
          </div>

          {/* Tile 4: pH & Baterai */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">pH Tanah & Baterai</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block">
              pH {selectedParcel.ph.toString().replace('.', ',')} · {selectedParcel.batteryV.toString().replace('.', ',')}V ({selectedParcel.batteryPct}%)
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">Alkalin Kapur · Panel Surya LiFePO4</span>
          </div>
        </div>

        {/* Prescription Box (Full Width Callout) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <p className="text-xs sm:text-sm font-bold text-emerald-950">
              Rekomendasi Preskripsi Bedeng {selectedParcel.id} (Keputusan Agronomis Real-Time):
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pl-4.5">
            {selectedParcel.prescription}
          </p>
        </div>
      </div>

      {/* ================= BOTTOM TABLE: RINGKASAN SEMUA BEDENG ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs overflow-hidden">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-4">
          Ringkasan Semua Bedeng
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Bedeng</th>
                <th className="py-2.5 px-3">Node</th>
                <th className="py-2.5 px-3">θ / T / pH</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">AVRI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parcels.map((p) => {
                const isSelected = p.id === selectedId;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {p.shortName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {p.nodeId}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {p.moisturePct.toString().replace('.', ',')}% / {p.soilTempC.toString().replace('.', ',')}°C / {p.ph.toString().replace('.', ',')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-semibold ${
                          p.status === 'online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Radio className="w-2.5 h-2.5" />
                        {p.status === 'online' ? 'Online' : '[Est-Simulated]'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold ${
                          p.avriCategory === 'aman'
                            ? 'text-emerald-700'
                            : p.avriCategory === 'waspada'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {p.avriScore}% {p.avriCategory.charAt(0).toUpperCase() + p.avriCategory.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
