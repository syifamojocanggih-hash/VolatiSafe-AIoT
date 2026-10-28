/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSatellite,
  faLayerGroup,
  faMountain,
  faCrosshairs,
  faPerson,
  faCompass,
  faPlus,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { BedengParcel, ParcelMapSummary, SurroundingParcel } from '@/types/parcel';
import { bluriOuterBoundary, bluriSurroundingParcels } from '@/mocks/parcelsMock';
import { CockpitLayerConfig } from './FloatingLeftControls';
import 'leaflet/dist/leaflet.css';

interface CockpitFieldMapProps {
  parcels: BedengParcel[];
  selectedId: string;
  layers: CockpitLayerConfig;
  summary: ParcelMapSummary;
  onSelectParcel: (id: string) => void;
  isSimulatedCritical?: boolean;
  onPinScreenPosChange?: (pos: { x: number; y: number } | null) => void;
}

type TileType = 'satellite' | 'streets' | 'topo';

export const CockpitFieldMap: React.FC<CockpitFieldMapProps> = ({
  parcels,
  selectedId,
  layers,
  summary,
  onSelectParcel,
  isSimulatedCritical = false,
  onPinScreenPosChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const currentTileLayerRef = useRef<any>(null);
  const polygonLayersRef = useRef<{ [id: string]: any }>({});
  const markerLayersRef = useRef<{ [id: string]: any }>({});
  const beamLayersRef = useRef<any[]>([]);
  const surroundingLayersRef = useRef<any[]>([]);
  const boundaryLayerRef = useRef<any>(null);

  const onSelectParcelRef = useRef(onSelectParcel);
  onSelectParcelRef.current = onSelectParcel;

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const prevSelectedIdRef = useRef<string>(selectedId);

  const layersRef = useRef(layers);
  layersRef.current = layers;

  const parcelsRef = useRef(parcels);
  parcelsRef.current = parcels;

  const isSimulatedCriticalRef = useRef(isSimulatedCritical);
  isSimulatedCriticalRef.current = isSimulatedCritical;

  const onPinScreenPosChangeRef = useRef(onPinScreenPosChange);
  onPinScreenPosChangeRef.current = onPinScreenPosChange;

  const [tileType, setTileType] = useState<TileType>('satellite');
  const [selectedSurrounding, setSelectedSurrounding] = useState<SurroundingParcel | null>(null);

  const defaultCenter = useMemo<[number, number]>(
    () => (summary.centerCoordinates as [number, number]) || [-6.902683, 112.430223],
    [summary.centerCoordinates]
  );
  const gatewayPos = useMemo<[number, number]>(
    () => (summary.gatewayCoordinates as [number, number]) || [-6.901850, 112.430500],
    [summary.gatewayCoordinates]
  );
  const outerBoundary = summary.outerBoundary || bluriOuterBoundary;
  const surroundingParcels = summary.surroundingParcels || bluriSurroundingParcels;

  // Layer URL definition (Esri World Imagery: pure ultra-clean satellite without POI/restaurant/business icons)
  const getTileUrl = (type: TileType) => {
    switch (type) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileOptions = (type: TileType) => {
    switch (type) {
      case 'satellite':
        return {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics & VolatiSafe AIoT',
          maxZoom: 19,
          maxNativeZoom: 18,
        };
      case 'topo':
        return {
          attribution: '&copy; OpenTopoMap contributors',
          maxZoom: 18,
          maxNativeZoom: 16,
        };
      case 'streets':
      default:
        return {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        };
    }
  };

  // Color generator
  const getParcelStyle = useCallback((p: BedengParcel, isSelected: boolean) => {
    if (isSelected) {
      return {
        fillColor: '#818CF8',
        color: '#4F46E5',
        weight: 4,
        fillOpacity: 0.6,
      };
    }

    if (!layersRef.current.showAvriHeatmap && !layersRef.current.showMoistureContour) {
      return {
        fillColor: '#FFFFFF',
        color: '#10B981',
        weight: 1.8,
        fillOpacity: 0.15,
      };
    }

    if (layersRef.current.showMoistureContour) {
      const isDry = p.moisturePct < 25;
      return {
        fillColor: isDry ? '#F59E0B' : '#0284C7',
        color: isDry ? '#D97706' : '#0369A1',
        weight: 2,
        fillOpacity: 0.52,
      };
    }

    // Default: AVRI Heatmap
    const opacity = layersRef.current.heatmapOpacity ?? 0.52;
    const score = isSimulatedCriticalRef.current && p.id === 'A1' ? 74 : p.avriScore;
    if (score >= 70) {
      return {
        fillColor: '#EF4444',
        color: '#B91C1C',
        weight: 2.4,
        fillOpacity: opacity,
      };
    } else if (score >= 30) {
      return {
        fillColor: '#F59E0B',
        color: '#D97706',
        weight: 2.2,
        fillOpacity: Math.max(0.25, opacity - 0.05),
      };
    } else {
      return {
        fillColor: '#10B981',
        color: '#047857',
        weight: 2.2,
        fillOpacity: Math.max(0.25, opacity - 0.05),
      };
    }
  }, []);

  // Recalculate screen pixel position of selected node pin
  const updatePinScreenPos = useCallback(() => {
    if (!mapInstanceRef.current || !onPinScreenPosChangeRef.current) return;
    const currentSelected = parcelsRef.current.find((p) => p.id === selectedIdRef.current);
    if (currentSelected?.center) {
      try {
        const point = mapInstanceRef.current.latLngToContainerPoint(currentSelected.center);
        onPinScreenPosChangeRef.current({ x: point.x, y: point.y });
      } catch {
        // Map might be resizing or zooming
      }
    } else {
      onPinScreenPosChangeRef.current(null);
    }
  }, []);

  // Helper to build node marker HTML
  const createPinHtml = (pId: string, isSelected: boolean) => `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
      ${
        isSelected
          ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-80"></span>'
          : ''
      }
      <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${
        isSelected
          ? 'bg-indigo-600 border-2 border-white ring-4 ring-indigo-300 shadow-2xl scale-110'
          : 'bg-slate-900 border border-white/80 shadow-lg'
      } text-white font-mono text-[10px] font-black transition-all">
        ${pId}
      </div>
    </div>
  `;

  // ================= 1. INITIALIZE MAP ONCE ON MOUNT =================
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16.5,
        minZoom: 14,
        maxZoom: 20,
        zoomControl: false,
        attributionControl: false,
      });

      // Native Google Earth navigation controls rendered in JSX overlay

      // Base Tile Layer (Google Hybrid Satellite)
      const baseLayer = L.tileLayer(
        getTileUrl('satellite'),
        getTileOptions('satellite')
      ).addTo(map);
      currentTileLayerRef.current = baseLayer;

      // Outer Boundary (Dashed Blue/Cyan)
      if (outerBoundary && outerBoundary.length > 0) {
        boundaryLayerRef.current = L.polyline(outerBoundary as any, {
          color: '#38BDF8',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.85,
        }).addTo(map);
      }

      // Surrounding Cadastral Parcels
      if (surroundingParcels && surroundingParcels.length > 0) {
        surroundingParcels.forEach((sp) => {
          if (!sp.polygon) return;
          const poly = L.polygon(sp.polygon as any, {
            color: '#7DD3FC',
            weight: 1.2,
            fillColor: '#BAE6FD',
            fillOpacity: 0.16,
          }).addTo(map);

          poly.bindTooltip(
            `<b>${sp.name}</b><br/><span style="color:#64748b">Luas: ${sp.areaHa} ha · Tetangga</span>`,
            {
              permanent: false,
              direction: 'center',
              className: 'custom-parcel-tooltip',
            }
          );

          poly.on('click', () => {
            setSelectedSurrounding(sp);
          });

          surroundingLayersRef.current.push(poly);
        });
      }

      // LoRa Gateway Marker (Clean radar beacon without emoji)
      const gatewayIcon = L.divIcon({
        className: 'custom-gateway-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
            <div class="relative flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-md">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker(gatewayPos as any, { icon: gatewayIcon })
        .addTo(map)
        .bindTooltip('<b>LoRa Gateway Basecamp 433 MHz</b><br/>Status: Online · Uptime 99.8%', {
          direction: 'top',
          offset: [0, -12],
          className: 'custom-parcel-tooltip',
        });

      // Bedeng Parcels (Polygons & Pulsing Node Markers)
      parcelsRef.current.forEach((p) => {
        if (!p.polygon) return;

        const isSelected = p.id === selectedIdRef.current;
        const style = getParcelStyle(p, isSelected);

        const poly = L.polygon(p.polygon as any, {
          fillColor: style.fillColor,
          color: style.color,
          weight: style.weight,
          fillOpacity: style.fillOpacity,
        }).addTo(map);

        poly.bindTooltip(
          `<b>${p.name}</b><br/>` +
            `<span style="color:${
              p.avriCategory === 'kritis' ? '#EF4444' : p.avriCategory === 'waspada' ? '#F59E0B' : '#10B981'
            }">AVRI ${p.avriScore}% (${p.avriCategory.toUpperCase()})</span><br/>` +
            `Suhu: ${p.soilTempC.toFixed(1)}°C · Lembab: ${p.moisturePct.toFixed(1)}%`,
          {
            direction: 'top',
            sticky: true,
            className: 'custom-parcel-tooltip',
          }
        );

        poly.on('mouseover', () => {
          poly.setStyle({ weight: 4.5, fillOpacity: 0.7 });
        });
        poly.on('mouseout', () => {
          const selected = p.id === selectedIdRef.current;
          poly.setStyle(getParcelStyle(p, selected));
        });

        poly.on('click', () => {
          onSelectParcelRef.current(p.id);
          if (p.center) {
            map.flyTo(p.center, 17, { animate: true, duration: 0.8 });
          }
        });

        polygonLayersRef.current[p.id] = poly;

        // Custom Marker Pin
        if (p.center) {
          const pinIcon = L.divIcon({
            className: 'custom-node-pin',
            html: createPinHtml(p.id, isSelected),
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker(p.center as any, { icon: pinIcon }).addTo(map);
          marker.on('click', () => {
            onSelectParcelRef.current(p.id);
            if (p.center) {
              map.flyTo(p.center, 17, { animate: true, duration: 0.8 });
            }
          });

          markerLayersRef.current[p.id] = marker;

          // Draw Animated LoRa Beam from Node to Gateway
          const beamLine = L.polyline([p.center, gatewayPos] as any, {
            color: '#34D399',
            weight: 1.8,
            opacity: 0.65,
            className: 'lora-beam-line',
          }).addTo(map);
          beamLayersRef.current.push(beamLine);
        }
      });

      // Update screen coordinates on map move, zoom, or resize
      map.on('move', updatePinScreenPos);
      map.on('zoom', updatePinScreenPos);
      map.on('resize', updatePinScreenPos);

      // Hide circular badges when zoomed out (< 16) to prevent cluttering/clumping
      const updateMarkersVisibility = () => {
        const currentZoom = map.getZoom();
        const shouldShow = currentZoom >= 16;
        Object.values(markerLayersRef.current).forEach((m: any) => {
          if (m && m._icon) {
            m._icon.style.display = shouldShow ? 'flex' : 'none';
          }
        });
      };
      map.on('zoomend', updateMarkersVisibility);
      updateMarkersVisibility();

      // Force layout calculation
      map.invalidateSize();
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          updatePinScreenPos();
        }
      }, 150);
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          updatePinScreenPos();
        }
      }, 500);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            updatePinScreenPos();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          updatePinScreenPos();
        }
      };
      window.addEventListener('resize', handleResize);

      mapInstanceRef.current = map;

      return () => {
        isMounted = false;
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    });
  }, []); // Run ONCE on mount

  // ================= 2. REACTIVE TILE SWITCHER =================
  useEffect(() => {
    if (!mapInstanceRef.current || !currentTileLayerRef.current) return;
    import('leaflet').then((L) => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
      const newLayer = L.tileLayer(getTileUrl(tileType), getTileOptions(tileType)).addTo(
        mapInstanceRef.current
      );
      currentTileLayerRef.current = newLayer;
      mapInstanceRef.current.invalidateSize();
    });
  }, [tileType]);

  // ================= 3. REACTIVE SELECTION & STYLE UPDATER =================
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    parcels.forEach((p) => {
      const poly = polygonLayersRef.current[p.id];
      if (poly) {
        const isSelected = p.id === selectedId;
        const style = getParcelStyle(p, isSelected);
        poly.setStyle({
          fillColor: style.fillColor,
          color: style.color,
          weight: style.weight,
          fillOpacity: style.fillOpacity,
        });
      }

      const marker = markerLayersRef.current[p.id];
      if (marker) {
        import('leaflet').then((L) => {
          const isSelected = p.id === selectedId;
          const updatedIcon = L.divIcon({
            className: 'custom-node-pin',
            html: createPinHtml(p.id, isSelected),
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          marker.setIcon(updatedIcon);

          if (layers.showLoraNodes) {
            if (!mapInstanceRef.current.hasLayer(marker)) {
              marker.addTo(mapInstanceRef.current);
            }
          } else {
            if (mapInstanceRef.current.hasLayer(marker)) {
              mapInstanceRef.current.removeLayer(marker);
            }
          }
        });
      }
    });

    // Toggle LoRa Beams
    beamLayersRef.current.forEach((beam) => {
      if (layers.showLoraNodes) {
        if (!mapInstanceRef.current.hasLayer(beam)) {
          beam.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(beam)) {
          mapInstanceRef.current.removeLayer(beam);
        }
      }
    });

    // Toggle Cadastral Surrounding Parcels
    surroundingLayersRef.current.forEach((poly) => {
      if (layers.showCadastralBorders) {
        if (!mapInstanceRef.current.hasLayer(poly)) {
          poly.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(poly)) {
          mapInstanceRef.current.removeLayer(poly);
        }
      }
    });

    // Smooth flyTo selected parcel when selection changes
    if (prevSelectedIdRef.current !== selectedId) {
      prevSelectedIdRef.current = selectedId;
      const activeSelected = parcels.find((p) => p.id === selectedId);
      if (activeSelected?.center) {
        mapInstanceRef.current.flyTo(activeSelected.center, 17, { animate: true, duration: 0.8 });
      }
    }

    setTimeout(updatePinScreenPos, 200);
  }, [selectedId, layers, parcels, isSimulatedCritical, getParcelStyle, updatePinScreenPos]);

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, 16.5, { animate: true });
      setTimeout(updatePinScreenPos, 300);
    }
  };

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-slate-900 select-none">
      {/* Absolute Container Leaflet Asli */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* FLOATING MAP TILE SWITCHER & MINIMAP (Pojok Kiri Bawah - Google Earth Style) */}
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 select-none">
        {/* Google Earth Style Minimap Preview Thumbnail */}
        <button
          onClick={handleResetCenter}
          className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950 group hover:border-emerald-400 transition-all shrink-0"
          title="Pratinjau Regional Lahan Solokuro (Klik untuk Pusatkan)"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/60 to-slate-900/90 flex items-center justify-center">
            <FontAwesomeIcon icon={faCrosshairs} className="text-white/70 group-hover:text-emerald-400 text-xs transition-colors" />
          </div>
          <span className="absolute bottom-0.5 inset-x-0 text-[8px] font-mono text-center text-slate-300 font-semibold bg-black/50">
            Lamongan
          </span>
        </button>

        {/* Tile Capsule */}
        <div className="flex items-center bg-slate-950/85 backdrop-blur-xl p-1 rounded-full border border-white/15 shadow-2xl text-xs">
          <button
            onClick={() => setTileType('satellite')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              tileType === 'satellite'
                ? 'bg-white/20 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FontAwesomeIcon icon={faSatellite} className="text-[10px]" />
            <span>Satelit</span>
          </button>
          <button
            onClick={() => setTileType('streets')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              tileType === 'streets'
                ? 'bg-white/20 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FontAwesomeIcon icon={faLayerGroup} className="text-[10px]" />
            <span>Peta</span>
          </button>
          <button
            onClick={() => setTileType('topo')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              tileType === 'topo'
                ? 'bg-white/20 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FontAwesomeIcon icon={faMountain} className="text-[10px]" />
            <span>Topografi</span>
          </button>

          <div className="w-px h-3.5 bg-white/15 mx-1" />

          <button
            onClick={handleResetCenter}
            className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium transition-all flex items-center gap-1"
            title="Pusatkan Peta ke Blok Utama"
          >
            <FontAwesomeIcon icon={faCrosshairs} className="text-[10px]" />
            <span>Pusatkan</span>
          </button>
        </div>
      </div>

      {/* GOOGLE EARTH AUTHENTIC NAVIGATION CLUSTER (Pojok Kanan Bawah) */}
      <div className="absolute bottom-4 right-4 z-[400] flex items-center gap-2 select-none">
        {/* Scale, Coordinates & Altitude Tag (Google Earth Status Line) */}
        <div className="hidden md:flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 text-slate-300 text-[11px] font-mono shadow-2xl">
          <div className="flex items-center gap-1">
            <span className="w-8 border-b-2 border-white/60 inline-block -mt-1" />
            <span className="text-[10px] text-slate-400">300 m</span>
          </div>
          <span className="text-white/15">·</span>
          <span>Alt: 1,047 m</span>
          <span className="text-white/15">·</span>
          <span>7°06&apos;55.9&quot;S 112°25&apos;40.2&quot;E</span>
          <span className="text-white/15">·</span>
          <span className="text-emerald-400 font-semibold">100%</span>
        </div>

        {/* Pegman / Street View Icon */}
        <button
          onClick={handleResetCenter}
          className="w-9 h-9 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/15 text-amber-300 flex items-center justify-center shadow-2xl hover:bg-white/15 transition-all"
          title="Tampilan Lapangan Jagung"
        >
          <FontAwesomeIcon icon={faPerson} className="text-sm" />
        </button>

        {/* Crosshairs Re-center Button */}
        <button
          onClick={handleResetCenter}
          className="w-9 h-9 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/15 text-sky-400 flex items-center justify-center shadow-2xl hover:bg-white/15 transition-all"
          title="Pusatkan ke Lahan Solokuro"
        >
          <FontAwesomeIcon icon={faCrosshairs} className="text-sm" />
        </button>

        {/* 2D / 3D Mode Pill */}
        <button
          onClick={handleResetCenter}
          className="w-9 h-9 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/15 text-white text-xs font-bold shadow-2xl hover:bg-white/15 transition-all flex items-center justify-center"
          title="Mode Tampilan 2D"
        >
          2D
        </button>

        {/* Compass Button */}
        <button
          onClick={handleResetCenter}
          className="w-9 h-9 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center shadow-2xl hover:bg-white/15 transition-all"
          title="Reset Orientasi ke Utara"
        >
          <FontAwesomeIcon icon={faCompass} className="text-sm text-rose-400" />
        </button>

        {/* Zoom Capsule */}
        <div className="flex flex-col bg-slate-950/85 backdrop-blur-xl rounded-full border border-white/15 shadow-2xl overflow-hidden divide-y divide-white/10">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 transition-all text-xs font-semibold"
            title="Perbesar Peta (+)"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 transition-all text-xs font-semibold"
            title="Perkecil Peta (-)"
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
        </div>
      </div>

      {/* POPUP INFO PERSIL TETANGGA (Saat Persil Tetangga Diklik) */}
      {selectedSurrounding && (
        <div className="absolute bottom-16 left-4 z-[410] w-64 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-xs font-bold text-emerald-400">Persil Tetangga</span>
            <button
              onClick={() => setSelectedSurrounding(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-xs font-semibold">{selectedSurrounding.name}</p>
          <div className="mt-1 flex items-center justify-between text-2xs text-slate-400">
            <span>Luas: {selectedSurrounding.areaHa} ha</span>
            <span className="text-emerald-300">Mesh Neighbor</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CockpitFieldMap;
