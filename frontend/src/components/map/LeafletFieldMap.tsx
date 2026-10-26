'use client';

import React, { useEffect, useRef } from 'react';
import { BedengParcel, ActiveLayer, ParcelMapSummary } from '@/types/parcel';
import 'leaflet/dist/leaflet.css';

interface LeafletFieldMapProps {
  parcels: BedengParcel[];
  selectedId: string;
  activeLayer: ActiveLayer;
  summary: ParcelMapSummary;
  onSelectParcel: (id: string) => void;
}

export const LeafletFieldMap: React.FC<LeafletFieldMapProps> = ({
  parcels,
  selectedId,
  activeLayer,
  summary,
  onSelectParcel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  // Center coordinates (Desa Banyubang, Solokuro, Lamongan)
  const defaultCenter = summary.centerCoordinates || [-6.9295, 112.3540];
  const gatewayPos = summary.gatewayCoordinates || [-6.9272, 112.3548];

  // Helper colors based on active layer
  const getParcelColor = (p: BedengParcel) => {
    if (activeLayer === 'battery') {
      if (p.batteryPct > 80) return { fill: '#16A34A', stroke: '#15803D', dash: '' };
      if (p.batteryPct > 50) return { fill: '#CA8A04', stroke: '#A16207', dash: '4, 4' };
      return { fill: '#DC2626', stroke: '#B91C1C', dash: '' };
    }

    if (activeLayer === 'lora') {
      if (p.status === 'online') return { fill: '#16A34A', stroke: '#15803D', dash: '' };
      return { fill: '#CA8A04', stroke: '#A16207', dash: '5, 5' };
    }

    // Default: AVRI
    if (p.avriCategory === 'aman') return { fill: '#16A34A', stroke: '#15803D', dash: '' };
    if (p.avriCategory === 'waspada' || p.status === 'simulated') {
      return {
        fill: '#CA8A04',
        stroke: '#A16207',
        dash: p.status === 'simulated' ? '6, 6' : '',
      };
    }
    if (p.avriCategory === 'kritis') return { fill: '#EA580C', stroke: '#C2410C', dash: '' };
    return { fill: '#DC2626', stroke: '#991B1B', dash: '' };
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

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 17,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Dividing Road & Drainage ditch line
      const roadLine = L.polyline(
        [
          [-6.92935, 112.3525],
          [-6.92935, 112.3563],
        ],
        {
          color: '#0284C7',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.85,
        }
      ).addTo(map);

      roadLine.bindTooltip('Alur Drainase & Jalan Usaha Tani', {
        permanent: false,
        direction: 'top',
        className: 'bg-sky-900 text-white text-xs px-2 py-1 rounded shadow',
      });

      // Gateway Basecamp Marker with custom SVG icon
      const gatewayIcon = L.divIcon({
        className: 'custom-gateway-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60"></span>
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

      // Add Parcels Polygons & Node Markers
      layersRef.current = [];

      parcels.forEach((p) => {
        if (!p.polygon) return;

        const isSelected = p.id === selectedId;
        const color = getParcelColor(p);

        // Polygon
        const polygon = L.polygon(p.polygon, {
          color: isSelected ? '#1E3A8A' : color.stroke,
          weight: isSelected ? 4 : 2,
          fillColor: color.fill,
          fillOpacity: isSelected ? 0.65 : 0.45,
          dashArray: color.dash,
        }).addTo(map);

        // Click handler
        polygon.on('click', () => {
          onSelectParcel(p.id);
        });

        // Hover tooltip
        polygon.bindTooltip(
          `<div class="font-sans text-xs font-semibold"><b>${p.id}</b> · ${p.nodeId}<br><span class="text-slate-600">AVRI: ${p.avriScore}% (${p.avriCategory.toUpperCase()})</span></div>`,
          {
            sticky: true,
            className: 'bg-white text-slate-800 border border-slate-200 px-2 py-1 rounded shadow-md',
          }
        );

        // Popup
        polygon.bindPopup(`
          <div class="p-1.5 font-sans min-w-[180px]">
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
                  isSelected ? 'bg-blue-700 ring-4 ring-blue-300' : 'bg-slate-800 hover:bg-slate-900'
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

        layersRef.current.push(polygon);
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

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] rounded-2xl overflow-hidden border border-[#E5DEC7] shadow-inner bg-[#F4EFE6]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Info Overlay on Map */}
      <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs text-2xs sm:text-xs text-slate-700 font-medium flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Leaflet + OpenStreetMap · Tegal Kapur Banyubang, Solokuro</span>
      </div>
    </div>
  );
};

export default LeafletFieldMap;
