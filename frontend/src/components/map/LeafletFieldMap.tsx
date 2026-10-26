'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BedengParcel, ActiveLayer, ParcelMapSummary } from '@/types/parcel';
import { bluriOuterBoundary, bluriSurroundingParcels } from '@/mocks/parcelsMock';
import 'leaflet/dist/leaflet.css';

interface LeafletFieldMapProps {
  parcels: BedengParcel[];
  selectedId: string;
  activeLayer: ActiveLayer;
  summary: ParcelMapSummary;
  onSelectParcel: (id: string) => void;
}

type TileType = 'satellite' | 'streets' | 'topo';

export const LeafletFieldMap: React.FC<LeafletFieldMapProps> = ({
  parcels,
  selectedId,
  activeLayer,
  summary,
  onSelectParcel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const currentTileLayerRef = useRef<any>(null);
  const polygonLayersRef = useRef<{ [id: string]: any }>({});
  
  const [tileType, setTileType] = useState<TileType>('satellite');
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Center coordinates (Desa Bluri, Solokuro, Lamongan: 4C2M+7QC)
  const defaultCenter = summary.centerCoordinates || [-6.89931, 112.43439];
  const gatewayPos = summary.gatewayCoordinates || [-6.89790, 112.43460];
  const outerBoundary = summary.outerBoundary || bluriOuterBoundary;
  const surroundingParcels = summary.surroundingParcels || bluriSurroundingParcels;

  // Helper colors based on active layer
  const getParcelColor = (p: BedengParcel, isSelected: boolean) => {
    // If selected, highlight with prominent violet/indigo matching the user's cadastral reference
    if (isSelected) {
      return {
        fill: '#818CF8',
        stroke: '#4F46E5',
        weight: 4,
        fillOpacity: 0.55,
        dash: '',
      };
    }

    if (activeLayer === 'battery') {
      if (p.batteryPct > 80) return { fill: '#16A34A', stroke: '#15803D', weight: 2, fillOpacity: 0.45, dash: '' };
      if (p.batteryPct > 50) return { fill: '#CA8A04', stroke: '#A16207', weight: 2, fillOpacity: 0.45, dash: '4, 4' };
      return { fill: '#DC2626', stroke: '#B91C1C', weight: 2, fillOpacity: 0.5, dash: '' };
    }

    if (activeLayer === 'lora') {
      if (p.status === 'online') return { fill: '#16A34A', stroke: '#15803D', weight: 2, fillOpacity: 0.45, dash: '' };
      return { fill: '#CA8A04', stroke: '#A16207', weight: 2, fillOpacity: 0.45, dash: '5, 5' };
    }

    // Default: AVRI Layer
    if (p.avriCategory === 'aman') {
      return { fill: '#10B981', stroke: '#059669', weight: 2, fillOpacity: 0.45, dash: '' };
    }
    if (p.avriCategory === 'waspada' || p.status === 'simulated') {
      return {
        fill: '#F59E0B',
        stroke: '#D97706',
        weight: 2,
        fillOpacity: 0.45,
        dash: p.status === 'simulated' ? '5, 5' : '',
      };
    }
    if (p.avriCategory === 'kritis') {
      return { fill: '#F97316', stroke: '#EA580C', weight: 2.5, fillOpacity: 0.5, dash: '' };
    }
    return { fill: '#EF4444', stroke: '#DC2626', weight: 2.5, fillOpacity: 0.55, dash: '' };
  };

  // Switch Tile Layer smoothly without re-rendering the whole map
  const switchTileLayer = (type: TileType, L: any, map: any) => {
    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let newTileLayer;
    if (type === 'satellite') {
      // High-resolution Google Hybrid Satellite (crystal clear real aerial photo with vegetation, roads, fields)
      newTileLayer = L.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Satellite Imagery & VolatiSafe AIoT',
          maxZoom: 21,
          maxNativeZoom: 19,
        }
      );
    } else if (type === 'topo') {
      // OpenTopoMap (altitude contour lines and topography of karst hills)
      newTileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap contributors',
        maxZoom: 18,
        maxNativeZoom: 16,
      });
    } else {
      // OpenStreetMap standard street and village vector
      newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
    }

    newTileLayer.addTo(map);
    currentTileLayerRef.current = newTileLayer;
    setTileType(type);
  };

  useEffect(() => {
    let isMounted = true;

    // Dynamically load leaflet on client side to avoid SSR issues
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map with realistic zoom
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: false, // We'll render custom top-quality controls
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Default Tile Layer: High-Resolution Satellite
      switchTileLayer(tileType, L, map);

      // 1. OUTER DELIMITATION BOUNDARY: Blue Dashed Polyline (Like the user's reference image)
      if (outerBoundary && outerBoundary.length > 0) {
        const outerPolygon = L.polygon(outerBoundary, {
          color: '#2563EB', // Blue dashed line
          weight: 2.5,
          dashArray: '8, 8',
          fillColor: '#3B82F6',
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(map);

        outerPolygon.bindTooltip('Batas Kawasan Tegal Kapur Desa Bluri', {
          permanent: false,
          direction: 'center',
          className: 'bg-blue-900/90 text-white text-xs px-2.5 py-1 rounded-md shadow-md border border-blue-400 font-medium',
        });
      }

      // 2. SURROUNDING CADASTRAL PARCELS (Tessellation Mosaic covering the whole territory)
      surroundingParcels.forEach((cp) => {
        const sPoly = L.polygon(cp.polygon, {
          color: '#38BDF8', // Light blue cadastral border
          weight: 1.5,
          fillColor: '#BAE6FD',
          fillOpacity: 0.22,
          opacity: 0.85,
        }).addTo(map);

        sPoly.on('mouseover', () => {
          sPoly.setStyle({ weight: 2.5, color: '#0284C7', fillOpacity: 0.4 });
        });

        sPoly.on('mouseout', () => {
          sPoly.setStyle({ weight: 1.5, color: '#38BDF8', fillOpacity: 0.22 });
        });

        sPoly.bindTooltip(
          `<div class="font-sans text-xs"><b>${cp.id}</b> · ${cp.name}<br><span class="text-slate-500 font-medium">Luas: ${cp.areaHa} Ha (Estimasi Spasial)</span></div>`,
          {
            sticky: true,
            className: 'bg-white text-slate-800 border border-slate-200 px-2 py-1 rounded shadow-md text-xs',
          }
        );

        sPoly.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-slate-900 text-sm mb-1">${cp.name}</p>
            <p class="text-slate-600">Kode Persil: <b>${cp.id}</b></p>
            <p class="text-slate-600">Luas: <b>${cp.areaHa} Hektar</b></p>
            <p class="text-slate-500 mt-1 italic">Zona Tegal Kapur Bluri Sekitar (Model Spasial Tanah & Cuaca)</p>
          </div>
        `);
      });

      // 3. DIVIDING ROAD & DRAINAGE DITCH (Jalan Usaha Tani Desa Bluri)
      const roadLine = L.polyline(
        [
          [-6.89995, 112.43230],
          [-6.89955, 112.43320],
          [-6.89928, 112.43410],
          [-6.89932, 112.43505],
          [-6.89945, 112.43610],
          [-6.89960, 112.43680],
        ],
        {
          color: '#38BDF8',
          weight: 3.5,
          dashArray: '6, 6',
          opacity: 0.95,
        }
      ).addTo(map);

      roadLine.bindTooltip('Saluran Drainase & Jalan Usaha Tani Desa Bluri', {
        permanent: false,
        direction: 'top',
        className: 'bg-sky-950 text-white text-xs px-2.5 py-1 rounded shadow-md font-medium',
      });

      // 4. GATEWAY BASECAMP LORA MARKER
      const gatewayIcon = L.divIcon({
        className: 'custom-gateway-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-60"></span>
            <div class="relative w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const gatewayMarker = L.marker(gatewayPos, { icon: gatewayIcon }).addTo(map);
      gatewayMarker.bindPopup(`
        <div class="p-1 font-sans">
          <div class="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gateway Basecamp LoRa
          </div>
          <p class="text-xs text-slate-600 mt-1">Transceiver ESP32-LoRa 433 MHz</p>
          <p class="text-xs text-slate-500 mt-0.5">Jarak ke Hamparan: <b>${summary.gatewayDistanceKm.toString().replace('.', ',')} km</b></p>
          <span class="inline-block mt-2 px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">Status Aktif</span>
        </div>
      `);

      // 5. CORE BEDENG PARCELS (A1..B2) with Active Sensors & Multi-Vertex Highlight
      polygonLayersRef.current = {};

      parcels.forEach((p) => {
        if (!p.polygon) return;

        const isSelected = p.id === selectedId;
        const color = getParcelColor(p, isSelected);

        const polygon = L.polygon(p.polygon, {
          color: color.stroke,
          weight: color.weight,
          fillColor: color.fill,
          fillOpacity: color.fillOpacity,
          dashArray: color.dash,
        }).addTo(map);

        if (isSelected) {
          polygon.bringToFront();
        }

        polygonLayersRef.current[p.id] = polygon;

        // Click handler to select parcel
        polygon.on('click', () => {
          onSelectParcel(p.id);
        });

        // Hover tooltip
        polygon.bindTooltip(
          `<div class="font-sans text-xs">
            <b>${p.id}</b> · ${p.name}<br>
            <span class="text-slate-600 font-medium">Node: ${p.nodeId} | AVRI: <b>${p.avriScore}%</b> (${p.avriCategory.toUpperCase()})</span>
          </div>`,
          {
            sticky: true,
            className: 'bg-white text-slate-900 border border-slate-300 px-2 py-1 rounded shadow-lg text-xs font-semibold',
          }
        );

        // Detailed Popup
        polygon.bindPopup(`
          <div class="p-1.5 font-sans min-w-[200px]">
            <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
              <span class="font-bold text-sm text-slate-900">${p.id} · ${p.name}</span>
              <span class="px-2 py-0.5 rounded text-2xs font-bold ${
                p.avriCategory === 'aman'
                  ? 'bg-emerald-100 text-emerald-800'
                  : p.avriCategory === 'waspada'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }">AVRI ${p.avriScore}%</span>
            </div>
            <div class="space-y-1 text-xs text-slate-600">
              <p>Node ID: <b>${p.nodeId}</b></p>
              <p>Luas Lahan: <b>${p.areaHa} Hektar</b></p>
              <p>Kelembaban (θ): <b>${p.moisturePct.toString().replace('.', ',')}%</b></p>
              <p>Suhu Tanah (T): <b>${p.soilTempC.toString().replace('.', ',')}°C</b></p>
              <p>pH Tanah: <b>${p.ph.toString().replace('.', ',')}</b></p>
              <p>Baterai: <b>${p.batteryPct}% (${p.batteryV}V)</b></p>
              <p>Mode: <span class="font-semibold text-slate-800">${p.telemetryMode}</span></p>
            </div>
          </div>
        `);

        // Node Pin Marker
        if (p.center) {
          const nodeIcon = L.divIcon({
            className: 'custom-node-icon',
            html: `
              <div class="relative flex items-center justify-center cursor-pointer">
                <div class="w-6 h-6 rounded-full ${
                  isSelected ? 'bg-indigo-600 ring-4 ring-indigo-300' : 'bg-slate-900 hover:bg-black'
                } border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-3xs transition-transform hover:scale-110">
                  ${p.id}
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const nodeMarker = L.marker(p.center, { icon: nodeIcon }).addTo(map);
          nodeMarker.on('click', () => {
            onSelectParcel(p.id);
            polygon.openPopup();
          });
        }
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [parcels, selectedId, activeLayer]);

  // Handle Layer Switcher via UI buttons
  const handleLayerClick = (type: TileType) => {
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        switchTileLayer(type, L, mapInstanceRef.current);
      }
    });
  };

  // Center on Hamparan
  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, 16);
    }
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[500px] rounded-2xl overflow-hidden border border-[#E5DEC7] shadow-lg bg-slate-900">
      {/* Map Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* TOP HEADER CONTROLS (Mirip screenshot pengguna: Info Chip + Tombol Legenda + Layer Switcher) */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Location & Project Chip */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs font-semibold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="truncate max-w-[160px] sm:max-w-none">4C2M+7QC · Desa Bluri, Solokuro</span>
          <span className="hidden sm:inline-block text-slate-300">|</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-2xs bg-blue-50 text-blue-700 font-bold border border-blue-200">
            17 Persil Lahan (13.8 Ha)
          </span>
        </div>

        {/* Right: Tombol Legenda & Layer Switcher */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Tombol Legenda Dropdown */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-md transition-all ${
              showLegend
                ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M21 9H3"/><path d="M21 15H3"/><path d="M9 3v18"/></svg>
            <span>Legenda</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className={`transition-transform duration-200 ${showLegend ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
          </button>

          {/* Layer Switcher (Citra Satelit vs Peta Jalan vs Topo) */}
          <div className="flex items-center bg-white/95 backdrop-blur-md p-0.5 rounded-xl border border-slate-200 shadow-md">
            <button
              onClick={() => handleLayerClick('satellite')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-colors ${
                tileType === 'satellite'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Citra Satelit Beresolusi Tinggi (Esri World Imagery)"
            >
              🛰️ Satelit
            </button>
            <button
              onClick={() => handleLayerClick('streets')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-colors ${
                tileType === 'streets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Peta Jalan Standar OpenStreetMap"
            >
              🗺️ Jalan
            </button>
            <button
              onClick={() => handleLayerClick('topo')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-colors ${
                tileType === 'topo'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Peta Kontur & Topografi Lereng Kapur"
            >
              ⛰️ Topo
            </button>
          </div>

          {/* Reset View Button */}
          <button
            onClick={handleResetCenter}
            className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-md transition-colors"
            title="Pusatkan ke Hamparan Bluri"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
          </button>
        </div>
      </div>

      {/* POPUP / MODAL LEGENDA (Muncul saat tombol Legenda ditekan) */}
      {showLegend && (
        <div className="absolute top-14 right-3 z-[410] w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3.5 text-xs font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>Legenda Peta Kadastral Bluri</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-2xs sm:text-xs">
            {/* Batas Kawasan */}
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-3 rounded border-2 border-dashed border-blue-600 bg-blue-100/60 inline-block"></span>
              <span className="text-slate-700"><b>Batas Kawasan Desa Bluri</b> (Garis Putus Biru)</span>
            </div>

            {/* Persil Terpilih */}
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-3 rounded border-2 border-indigo-600 bg-indigo-300/80 inline-block"></span>
              <span className="text-slate-700"><b>Persil Terpilih</b> (Highlight Ungu Aktif)</span>
            </div>

            {/* Status AVRI */}
            <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
              <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Status Risiko Volatilisasi (AVRI)</div>
              
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-700 inline-block"></span>
                <span className="text-slate-700">Zona Aman (AVRI &lt; 30%) · Aman pupuk</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-700 inline-block"></span>
                <span className="text-slate-700">Zona Waspada (AVRI 30–70%) · Metode benam/tugal</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-700 inline-block"></span>
                <span className="text-slate-700">Zona Kritis / Bahaya (AVRI &gt; 70%) · Tunda tabur!</span>
              </div>
            </div>

            {/* Persil Cadastral Sekitar */}
            <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-3 rounded border border-sky-400 bg-sky-100/50 inline-block"></span>
                <span className="text-slate-700">Persil Tegal Kapur Sekitar (12 Plot Pendamping)</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-6 h-1 border-t-2 border-dashed border-sky-400 inline-block"></span>
                <span className="text-slate-700">Saluran Air & Jalan Usaha Tani</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shadow-xs inline-block"></span>
                <span className="text-slate-700">Gateway Basecamp LoRa (433 MHz)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FLOATING BADGE (Mode Telemetri & Tile Indicator) */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg text-2xs text-white font-medium flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
        <span>
          Lapisan:{' '}
          <b className="text-emerald-400 capitalize">
            {tileType === 'satellite' ? 'Citra Satelit HD' : tileType === 'topo' ? 'OpenTopoMap Kontur' : 'OpenStreetMap'}
          </b>{' '}
          · Hamparan Tegal Kapur Bluri
        </span>
      </div>
    </div>
  );
};

export default LeafletFieldMap;
