import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BedengParcel, ActiveLayer, ParcelMapSummary } from '@/types/parcel';
import { initialParcels, initialMapSummary } from '@/mocks/parcelsMock';
import { getFieldParcels } from '@/services/api';
import { Map as MapIcon, LayoutGrid, MapPin } from 'lucide-react';
import { SchematicFieldDiagram } from './SchematicFieldDiagram';

// Dynamic import with ssr: false for Leaflet map component
const LeafletFieldMap = dynamic(() => import('./LeafletFieldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] sm:h-[450px] rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-3 border border-slate-200">
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
  const [summary, setSummary] = useState<ParcelMapSummary>(initialMapSummary);
  const [selectedId, setSelectedId] = useState<string>('A1');
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('avri');
  const [mapViewMode, setMapViewMode] = useState<'leaflet' | 'schematic'>('leaflet');
  const [toastMessage] = useState<string | null>(null);
  

  const selectedParcel = parcels.find((p) => p.id === selectedId) || parcels[0];

  // Fetch real parcels & high-precision satellite/UAV polygon boundaries from backend
  useEffect(() => {
    let isMounted = true;
    async function loadParcels() {
      try {
        const res = await getFieldParcels('BLOK-A');
        if (res && res.parcels && isMounted) {
          const mappedParcels: BedengParcel[] = res.parcels.map((p) => ({
            id: p.id,
            nodeId: p.node_id,
            name: p.name,
            shortName: p.short_name,
            areaHa: p.area_ha,
            cropVariety: p.crop_variety,
            moisturePct: p.moisture_pct,
            soilTempC: p.soil_temp_c,
            ph: p.ph,
            batteryV: p.battery_v,
            batteryPct: p.battery_pct,
            loraSignalDbm: p.lora_signal_dbm,
            avriScore: p.avri_score,
            avriCategory: p.avri_category,
            status: p.status,
            telemetryMode: p.telemetry_mode,
            prescription: p.prescription,
            center: p.center,
            polygon: p.polygon,
          }));

          setParcels(mappedParcels);

          if (res.summary) {
            setSummary({
              coordinatesText: res.summary.coordinates_text,
              soilTypeText: res.summary.soil_type_text,
              gatewayDistanceKm: res.summary.gateway_distance_km,
              totalAreaHa: res.summary.total_area_ha,
              centerCoordinates: res.summary.center_coordinates,
              gatewayCoordinates: res.summary.gateway_coordinates,
              outerBoundary: res.summary.outer_boundary,
              surroundingParcels: res.summary.surrounding_parcels.map((sp) => ({
                id: sp.id,
                name: sp.name,
                areaHa: sp.area_ha,
                center: sp.center,
                polygon: sp.polygon,
              })),
              satelliteMetadata: res.summary.satellite_metadata
                ? {
                    source: res.summary.satellite_metadata.source,
                    resolution: res.summary.satellite_metadata.resolution,
                    crs: res.summary.satellite_metadata.crs,
                    lastCapture: res.summary.satellite_metadata.last_capture,
                    ndviMean: res.summary.satellite_metadata.ndvi_mean,
                    ndwiMean: res.summary.satellite_metadata.ndwi_mean,
                    cloudCoverPct: res.summary.satellite_metadata.cloud_cover_pct,
                    spectralBands: res.summary.satellite_metadata.spectral_bands,
                  }
                : undefined,
            });
          }
        }
      } catch (err) {
        console.warn('Backend parcels fetch failed, using local mock fallback:', err);
      }
    }
    loadParcels();
    return () => {
      isMounted = false;
    };
  }, []);

  

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Peta Zonasi Risiko Volatilisasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Klik poligon bedeng untuk melihat rincian kondisi petak · Total Luas Kawasan {summary.totalAreaHa.toFixed(1).replace('.', ',')} ha ({parcels.length + (summary.surroundingParcels?.length || 0)} Persil Kadastral)
          </p>
        </div>

        {/* Layer Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveLayer('avri')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
              activeLayer === 'avri'
                ? 'bg-[#236B32] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Layer AVRI
          </button>
          <button
            onClick={() => setActiveLayer('battery')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
              activeLayer === 'battery'
                ? 'bg-[#236B32] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Baterai
          </button>
          <button
            onClick={() => setActiveLayer('lora')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
              activeLayer === 'lora'
                ? 'bg-[#236B32] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sinyal LoRa
          </button>
        </div>
      </div>

      {/* ================= 1. FULL-WIDTH MAP CANVAS (Tarik ke Kanan Full) ================= */}
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-200/90 shadow-sm relative min-w-0 overflow-hidden">
        {/* Top Info inside Map Canvas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-2xs sm:text-xs text-slate-600 font-medium pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#236B32] shrink-0" />
                <span className="text-slate-500 font-medium">Koordinat:</span>
              </div>
              <span className="font-bold text-slate-900 font-mono text-2xs sm:text-xs">{summary.coordinatesText}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Hamparan Solokuro · {parcels.length} Node</span>
            </div>
          </div>

          {/* View Mode Toggle: Leaflet Map vs Schematic Grid */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setMapViewMode('leaflet')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapViewMode === 'leaflet'
                  ? 'bg-[#236B32] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Peta Spasial</span>
            </button>
            <button
              onClick={() => setMapViewMode('schematic')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapViewMode === 'schematic'
                  ? 'bg-[#236B32] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Diagram</span>
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
        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
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
              <span className="w-3 h-3 rounded-full bg-[#EA580C]" />
              <span>Kritis (61–80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
              <span>Bahaya (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#CA8A04]" />
              <span>Estimasi Cadangan (Digital Twin)</span>
            </div>
          </div>

          <div className="text-2xs text-slate-500 font-semibold">
            Kawasan Tegal Kapur Desa Bluri · {summary.totalAreaHa.toFixed(1).replace('.', ',')} Ha · {parcels.length} petak bedeng aktif
          </div>
        </div>
      </div>

      {/* ================= 2. SELECTED BEDENG DETAIL CARD (Ditaruh di Bawah Map) ================= */}
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 sm:space-y-5 min-w-0">
        {/* Header: Name */}
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {selectedParcel.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas Sensor IoT: <span className="font-mono font-bold text-slate-800">{selectedParcel.nodeId}</span> · Transmisi {selectedParcel.telemetryMode}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
            selectedParcel.status === 'online' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${selectedParcel.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {selectedParcel.status === 'online' ? 'Online' : 'Digital Twin Failover'}
          </span>
        </div>

        {/* 4 Info Parameter Tiles (Wide 4-Column Responsive Layout) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-xs min-w-0">
          {/* Tile 1: Varietas & Luas */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">Varietas & Luas</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block">
              {selectedParcel.cropVariety} ({selectedParcel.areaHa.toString().replace('.', ',')} Ha)
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">Komoditas Jagung Hibrida</span>
          </div>

          {/* Tile 2: Indeks Risiko (AVRI) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">Indeks Risiko (AVRI)</span>
            <span
              className={`text-sm sm:text-base font-bold mt-1 block ${
                selectedParcel.avriCategory === 'aman'
                  ? 'text-emerald-700'
                  : selectedParcel.avriCategory === 'waspada'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}
            >
              {selectedParcel.avriScore}% ({selectedParcel.avriCategory.toUpperCase()})
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">
              {selectedParcel.avriCategory === 'aman' ? 'Kondisi Optimal Pemupukan' : 'Perlu Penyesuaian Jadwal'}
            </span>
          </div>

          {/* Tile 3: Kelembaban & Suhu */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">Kelembaban & Suhu</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block">
              {selectedParcel.moisturePct.toString().replace('.', ',')}% · {selectedParcel.soilTempC.toString().replace('.', ',')}°C
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">Kondisi Lapangan Stabil</span>
          </div>

          {/* Tile 4: pH & Baterai */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <span className="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">pH Tanah & Daya</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block">
              pH {selectedParcel.ph.toString().replace('.', ',')} · {selectedParcel.batteryPct}%
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">Status Operasional Normal</span>
          </div>
        </div>

        {/* Prescription Box (Dynamic Risk Alert Callout) */}
        {(() => {
          const isKritis = selectedParcel.avriCategory === 'kritis' || selectedParcel.avriCategory === 'bahaya';
          const isWaspada = selectedParcel.avriCategory === 'waspada';

          const theme = isKritis
            ? {
                bg: 'bg-rose-50 border-rose-200',
                dot: 'bg-rose-600 animate-pulse',
                title: 'text-rose-950',
                text: 'text-rose-900 font-semibold',
                badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
                label: 'PERINGATAN KRITIS',
              }
            : isWaspada
            ? {
                bg: 'bg-amber-50 border-amber-200',
                dot: 'bg-amber-500',
                title: 'text-amber-950',
                text: 'text-amber-950 font-medium',
                badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
                label: 'ZONA WASPADA',
              }
            : {
                bg: 'bg-emerald-50 border-emerald-200',
                dot: 'bg-emerald-500',
                title: 'text-emerald-950',
                text: 'text-emerald-950 font-medium',
                badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                label: 'KONDISI OPTIMAL',
              };

          return (
            <div className={`p-4 sm:p-5 rounded-2xl border ${theme.bg} space-y-2 shadow-2xs transition-all`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.dot}`} />
                  <p className={`text-xs sm:text-sm font-bold ${theme.title}`}>
                    Rekomendasi Preskripsi Bedeng {selectedParcel.id} (Keputusan Agronomis Real-Time):
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider border ${theme.badgeBg}`}>
                  {theme.label} · AVRI {selectedParcel.avriScore}%
                </span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed pl-4.5 ${theme.text}`}>
                {selectedParcel.prescription}
              </p>
            </div>
          );
        })()}
      </div>

      {/* ================= BOTTOM TABLE: RINGKASAN SEMUA BEDENG ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs min-w-0 overflow-hidden">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-4">
          Ringkasan Semua Bedeng
        </h4>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Bedeng</th>
                <th className="py-2.5 px-3">Luas</th>
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
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{p.shortName}</div>
                      <div className="text-3xs font-mono text-slate-500 font-medium">{p.nodeId}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{p.areaHa.toString().replace('.', ',')} Ha</td>
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
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
