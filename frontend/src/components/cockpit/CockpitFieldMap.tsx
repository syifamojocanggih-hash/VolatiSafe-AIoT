/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSatellite,
  faMap,
  faMountain,
  faCrosshairs,
  faPlus,
  faMinus,
  faXmark,
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
    () => (summary.centerCoordinates as [number, number]) || [-6.89931, 112.43439],
    [summary.centerCoordinates]
  );
  const [zoomLevel, setZoomLevel] = useState<number>(16.5);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>(defaultCenter);

  // Dynamic Camera Altitude estimation based on standard web Mercator scale:
  const dynamicAltitude = useMemo(() => {
    const alt = Math.round(1047 * Math.pow(2, 16.5 - zoomLevel));
    return alt.toLocaleString('id-ID');
  }, [zoomLevel]);

  // Dynamic Scale bar distance calculation based on current zoom:
  const dynamicScaleMeters = useMemo(() => {
    if (zoomLevel >= 18) return '50 m';
    if (zoomLevel >= 17) return '100 m';
    if (zoomLevel >= 16) return '300 m';
    if (zoomLevel >= 15) return '500 m';
    if (zoomLevel >= 14) return '1 km';
    return '2 km';
  }, [zoomLevel]);

  // Coordinates formatted dynamically in DMS format:
  const formattedDms = useMemo(() => {
    const toDms = (deg: number, isLat: boolean) => {
      const absDeg = Math.abs(deg);
      const d = Math.floor(absDeg);
      const m = Math.floor((absDeg - d) * 60);
      const s = ((absDeg - d - m / 60) * 3600).toFixed(1);
      const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
      return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(4, '0')}"${dir}`;
    };
    return `${toDms(currentCenter[0], true)} ${toDms(currentCenter[1], false)}`;
  }, [currentCenter]);

  // Cycle tile type on click: Satelit -> Peta -> Topo -> Satelit
  const cycleTileType = () => {
    setTileType((prev) => {
      if (prev === 'satellite') return 'streets';
      if (prev === 'streets') return 'topo';
      return 'satellite';
    });
  };
  const gatewayPos = useMemo<[number, number]>(
    () => (summary.gatewayCoordinates as [number, number]) || [-6.8979, 112.4346],
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

  // Precision Geospatial Polygon Color Generator
  const getParcelStyle = useCallback((p: BedengParcel, isSelected: boolean) => {
    const opacity = layersRef.current.heatmapOpacity ?? 0.44;
    const score = isSimulatedCriticalRef.current && p.id === 'A1' ? 74 : p.avriScore;
    const isCritical = score >= 70;
    const isWarning = score >= 30 && score < 70;

    let baseFill = isCritical ? '#EF5350' : isWarning ? '#F5B942' : '#16A085';
    let baseStroke = isCritical ? '#DC2626' : isWarning ? '#D97706' : '#059669';

    if (layersRef.current.showMoistureContour) {
      const isDry = p.moisturePct < 25;
      baseFill = isDry ? '#F59E0B' : '#0284C7';
      baseStroke = isDry ? '#D97706' : '#0369A1';
    } else if (!layersRef.current.showAvriHeatmap) {
      baseFill = '#16A085';
      baseStroke = '#059669';
    }

    if (isSelected) {
      return {
        fillColor: baseFill,
        color: '#FFFFFF',
        weight: 3.5,
        fillOpacity: Math.min(0.55, opacity + 0.12),
      };
    }

    return {
      fillColor: baseFill,
      color: baseStroke,
      weight: 2,
      fillOpacity: Math.max(0.22, opacity - 0.08),
    };
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
          ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60"></span>'
          : ''
      }
      <div class="relative flex items-center justify-center w-6 h-6 rounded-full ${
        isSelected
          ? 'bg-[#10243A] border-2 border-white ring-4 ring-sky-400/50 shadow-xl scale-110'
          : 'bg-[#10243A]/90 border border-white/90 shadow-md'
      } text-white font-mono text-[10px] font-bold transition-all">
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

      // Update screen coordinates & telemetry stats on map move, zoom, or resize
      map.on('move', () => {
        updatePinScreenPos();
        const c = map.getCenter();
        setCurrentCenter([c.lat, c.lng]);
      });
      map.on('zoom', () => {
        updatePinScreenPos();
        setZoomLevel(map.getZoom());
      });
      map.on('resize', updatePinScreenPos);

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
    <div className="relative w-full h-full min-h-full overflow-hidden bg-slate-100 select-none">
      {/* Absolute Container Leaflet Asli (100% Flat Standard 2D) */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* FLOATING MAP TILE TOGGLE (Pojok Kiri Bawah - Light Mode Square Toggle) */}
      <div className="absolute bottom-4 left-4 z-[40] select-none">
        <button
          onClick={cycleTileType}
          className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 hover:border-emerald-500 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-0.5 text-emerald-700 hover:bg-slate-50 active:scale-90 transition-all duration-200 ring-1 ring-slate-900/5 group"
          title={`Mode Peta: ${
            tileType === 'satellite' ? 'Citra Satelit' : tileType === 'streets' ? 'Peta Jalan' : 'Kontur Topografi'
          } (Klik untuk beralih mode)`}
        >
          <FontAwesomeIcon
            icon={tileType === 'satellite' ? faSatellite : tileType === 'streets' ? faMap : faMountain}
            className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
          />
          <span className="text-[8px] font-bold uppercase tracking-tight font-mono text-slate-700">
            {tileType === 'satellite' ? 'Sat' : tileType === 'streets' ? 'Peta' : 'Topo'}
          </span>
        </button>
      </div>

      {/* GOOGLE EARTH NAVIGATION & TELEMETRY CLUSTER (Pojok Kanan Bawah - Light Mode) */}
      <div className="absolute bottom-4 right-4 z-[40] flex items-center gap-2 select-none">
        {/* Scale, Dynamic Coordinates & Altitude Tag */}
        <div className="hidden md:flex items-center gap-2.5 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-200/90 text-[#172B3A] text-[11px] font-mono shadow-xs border border-[#DCE5EE] ring-1 ring-slate-900/5">
          <div className="flex items-center gap-1.5">
            <span className="w-7 border-b-2 border-slate-700 inline-block -mt-1" />
            <span className="text-[10px] text-slate-900 font-bold">{dynamicScaleMeters}</span>
          </div>
          <span className="text-slate-400 font-bold">·</span>
          <span className="text-slate-800 font-semibold">Alt: {dynamicAltitude} m</span>
          <span className="text-slate-400 font-bold">·</span>
          <span className="text-slate-800 font-semibold">{formattedDms}</span>
          <span className="text-slate-400 font-bold">·</span>
          <span className="text-emerald-700 font-bold font-mono">{Math.round((zoomLevel / 16.5) * 100)}%</span>
        </div>

        {/* Crosshairs Re-center / Fokus Button */}
        <button
          onClick={handleResetCenter}
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 text-sky-600 flex items-center justify-center shadow-md hover:bg-slate-50 hover:border-slate-300 active:scale-90 transition-all duration-150"
          title="Fokus / Pusatkan ke Lahan Solokuro"
        >
          <FontAwesomeIcon icon={faCrosshairs} className="w-4 h-4" />
        </button>

        {/* Zoom Capsule */}
        <div className="flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-md overflow-hidden divide-y divide-slate-200">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-90 transition-all duration-150 text-xs font-semibold"
            title="Perbesar Peta (+)"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-90 transition-all duration-150 text-xs font-semibold"
            title="Perkecil Peta (-)"
          >
            <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* POPUP INFO PERSIL TETANGGA (Saat Persil Tetangga Diklik) */}
      {selectedSurrounding && (
        <div className="absolute bottom-20 left-4 z-[410] w-64 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 text-slate-800 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <span className="text-xs font-bold text-emerald-700">Persil Tetangga</span>
            <button
              onClick={() => setSelectedSurrounding(null)}
              className="text-slate-400 hover:text-slate-800 active:scale-90 transition-all duration-150 text-xs px-1"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-900">{selectedSurrounding.name}</p>
          <div className="mt-1 flex items-center justify-between text-2xs text-slate-500 font-mono">
            <span>Luas: {selectedSurrounding.areaHa} ha</span>
            <span className="text-emerald-700 font-bold">Mesh Neighbor</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CockpitFieldMap;
