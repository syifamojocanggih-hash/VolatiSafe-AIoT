'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { BedengParcel, ParcelMapSummary } from '@/types/parcel';
import { initialParcels, initialMapSummary } from '@/mocks/parcelsMock';
import { CockpitTopBar } from './CockpitTopBar';
import { FieldListPanel } from './FieldListPanel';
import { FieldDetailPanel, ForecastPoint } from './FieldDetailPanel';
import { CockpitLayerConfig, SandboxParams } from './FloatingLeftControls';
import { FieldWorkOrderModal } from './FieldWorkOrderModal';
import { EmergencyAlertBanner } from './EmergencyAlertBanner';
import { JuryPresentationTour } from './JuryPresentationTour';
import { getDigitalTwinTelemetry, DigitalTwin15Telemetry } from '@/services/api';

interface LoRaPacket {
  time: string;
  nodeId: string;
  bytes: number;
  rssi: number;
  snr: number;
  temp: number;
  moist: number;
}

// Dynamic import with ssr: false for Leaflet map component to prevent SSR window reference error
const CockpitFieldMap = dynamic(() => import('./CockpitFieldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[550px] lg:min-h-[700px] rounded-3xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 gap-3 border border-slate-200">
      <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-700">
        Menginisialisasi Citra Satelit HD Solokuro & Kontur Kadastral...
      </span>
    </div>
  ),
});

interface CockpitDashboardViewProps {
  onOpenSettings?: () => void;
  onOpenSimulator?: () => void;
}

export const CockpitDashboardView: React.FC<CockpitDashboardViewProps> = () => {
  const [parcels, setParcels] = useState<BedengParcel[]>(initialParcels);
  const [selectedId, setSelectedId] = useState<string>('A1');
  const [isSimulatedCritical, setIsSimulatedCritical] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dtTelemetry, setDtTelemetry] = useState<DigitalTwin15Telemetry | null>(null);
  const [isFullScreenMap, setIsFullScreenMap] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [leftPanelTab, setLeftPanelTab] = useState<'parcels' | 'sandbox' | 'fertilizer'>('parcels');

  useEffect(() => {
    let mounted = true;
    const loadTelemetry = async () => {
      try {
        const data = await getDigitalTwinTelemetry('BLOK-A');
        if (data && mounted) {
          setDtTelemetry(data);
          setParcels((current) =>
            current.map((p) => {
              if (p.id === 'A1') {
                return {
                  ...p,
                  moisturePct: data.soil_biophysics_dynamic.moisture_pct,
                  soilTempC: data.soil_biophysics_dynamic.soil_temp_c,
                  ph: data.soil_biophysics_dynamic.ph,
                  telemetryMode: data.soil_biophysics_dynamic.is_simulated_failover
                    ? '[Est-Simulated] FAO-56'
                    : 'LoRa Live Stream',
                  status: data.soil_biophysics_dynamic.is_simulated_failover ? 'simulated' : 'online',
                };
              }
              return p;
            })
          );
          setLatestPacket((prev) => ({
            ...prev,
            time: new Date().toLocaleTimeString('id-ID'),
            temp: data.soil_biophysics_dynamic.soil_temp_c,
            moist: data.soil_biophysics_dynamic.moisture_pct,
          }));
        }
      } catch {
        // Fallback anggap normal
      }
    };

    loadTelemetry();
    const interval = setInterval(loadTelemetry, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Phase 5: Modal & Alert State
  const [showSpkModal, setShowSpkModal] = useState<boolean>(false);
  const [showJuryTour, setShowJuryTour] = useState<boolean>(false);
  const [dismissedEmergency, setDismissedEmergency] = useState<boolean>(false);

  // Phase 6: Live LoRa Stream & Telemetry Heartbeat
  const [isLiveStreaming] = useState<boolean>(true);
  const [latestPacket, setLatestPacket] = useState<LoRaPacket>({
    time: '12:00:15',
    nodeId: 'VS-A1-003',
    bytes: 48,
    rssi: -82,
    snr: 9.5,
    temp: 34.1,
    moist: 22.4,
  });

  // Layer toggles configuration
  const [layers, setLayers] = useState<CockpitLayerConfig>({
    showAvriHeatmap: true,
    showMoistureContour: false,
    showLoraNodes: true,
    showCadastralBorders: true,
    autoFailover: true,
    heatmapOpacity: 0.52,
  });

  // What-If Sandbox parameters
  const [sandboxParams, setSandboxParams] = useState<SandboxParams>({
    soilTempC: 34.1,
    moisturePct: 22.4,
    ph: 7.83,
    irrigationMm: 0,
  });

  const selectedParcel = parcels.find((p) => p.id === selectedId) || parcels[0];
  const summary: ParcelMapSummary = initialMapSummary;

  // Toggle layer helper
  const handleToggleLayer = (layerKey: keyof CockpitLayerConfig) => {
    setLayers((prev) => {
      if (typeof prev[layerKey] !== 'boolean') return prev;
      const nextVal = !prev[layerKey];
      // Jika nyalakan kontur kelembaban, matikan heatmap AVRI agar tidak tumpang tindih
      if (layerKey === 'showMoistureContour' && nextVal) {
        return { ...prev, showMoistureContour: true, showAvriHeatmap: false };
      }
      if (layerKey === 'showAvriHeatmap' && nextVal) {
        return { ...prev, showAvriHeatmap: true, showMoistureContour: false };
      }
      return { ...prev, [layerKey]: nextVal };
    });
  };

  // Toggle Skenario Simulasi Juri (Terik Kritis vs Aman)
  const handleToggleScenario = () => {
    setIsSimulatedCritical((prev) => {
      const next = !prev;
      setParcels((current) =>
        current.map((p) => {
          if (p.id === 'A1') {
            return {
              ...p,
              avriScore: next ? 74 : 18,
              avriCategory: next ? 'kritis' : 'aman',
              soilTempC: next ? 34.5 : 25.2,
              moisturePct: next ? 18.2 : 36.4,
              prescription: next
                ? 'TUNDA PENABURAN UREA! Suhu tanah 34.5°C melebihi ambang batas kinetika enzim urease.'
                : 'JENDELA AMAN TERBUKA: Kelembaban optimal 36.4%, lakukan penaburan pupuk jam 06:00–09:00 WIB.',
            };
          }
          return p;
        })
      );

      const msg = next
        ? '⚠️ Mode Pengujian Terik Kritis (AVRI 74%) Diaktifkan'
        : '✓ Kembali ke Skenario Normal Lapangan (AVRI 18% Aman)';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);

      return next;
    });
  };

  // Toggle Failover Imputation
  const handleToggleFailover = () => {
    setParcels((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          const isCurrentlySimulated = p.status === 'simulated';
          const newStatus = isCurrentlySimulated ? 'online' : 'simulated';
          const newMode = isCurrentlySimulated ? 'LoRa Live Stream' : '[Est-Simulated] FAO-56';
          const msg = isCurrentlySimulated
            ? `Node ${p.nodeId} terhubung kembali ke gateway LoRa.`
            : `Simulasi Dropout: Digital Twin FAO-56 mengambil alih imputasi data ${p.nodeId}.`;
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

  // Update Opacity Layer
  const handleUpdateOpacity = (val: number) => {
    setLayers((prev) => ({ ...prev, heatmapOpacity: val }));
  };

  // What-If Sandbox Update: Live kinetics model for soil temp, moisture, pH, and irrigation
  const handleUpdateSandbox = (newParams: Partial<SandboxParams>) => {
    setIsSimulatedCritical(false);
    setSandboxParams((prev: SandboxParams) => {
      const updated = { ...prev, ...newParams };
      // Model kinetika AVRI berbasis suhu tanah, kelembaban, pH, dan irigasi tambahan
      const effMoist = Math.min(50, updated.moisturePct + updated.irrigationMm * 0.8);
      const tempFactor = Math.max(0, (updated.soilTempC - 20) / 22);
      const moistPenalty = Math.max(0, (36 - effMoist) / 24);
      const phFactor = Math.max(0, (updated.ph - 6.5) / 2.0);
      const calculatedAvri = Math.min(
        95,
        Math.max(5, Math.round(15 + tempFactor * 45 + moistPenalty * 30 + phFactor * 15))
      );
      const category: 'kritis' | 'waspada' | 'aman' =
        calculatedAvri >= 70 ? 'kritis' : calculatedAvri >= 30 ? 'waspada' : 'aman';

      setParcels((current) =>
        current.map((p) => {
          if (p.id === selectedId) {
            return {
              ...p,
              soilTempC: updated.soilTempC,
              moisturePct: updated.moisturePct,
              ph: updated.ph,
              avriScore: calculatedAvri,
              avriCategory: category,
              prescription:
                category === 'kritis'
                  ? 'TUNDA PENABURAN UREA! Simulasi What-If menunjukkan potensi penguapan amonia tinggi.'
                  : category === 'waspada'
                  ? 'Gunakan metode tugal/benam 4 cm untuk memitigasi penguapan pada kondisi ini.'
                  : 'JENDELA AMAN TERBUKA: Kondisi tanah optimal menyerap pupuk Urea secara maksimal.',
            };
          }
          return p;
        })
      );
      return updated;
    });
  };

  // Preset Demonstrasi Juri (Skenario A, B, C)
  const handleApplyPreset = (preset: 'A' | 'B' | 'C') => {
    if (preset === 'A') {
      setIsSimulatedCritical(true);
      handleUpdateSandbox({ soilTempC: 34.5, moisturePct: 18.0, ph: 7.85, irrigationMm: 0 });
      setToastMessage('☀️ Skenario A: Siang Terik Kritis (AVRI 74% - Emisi Tinggi)');
    } else if (preset === 'B') {
      setIsSimulatedCritical(false);
      handleUpdateSandbox({ soilTempC: 25.0, moisturePct: 38.0, ph: 7.4, irrigationMm: 5 });
      setToastMessage('🌧️ Skenario B: Pagi Hari Optimal (AVRI 18% - Penyerapan Maksimal)');
    } else if (preset === 'C') {
      handleToggleFailover();
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset Sandbox ke kondisi telemetri aktual
  const handleResetSandbox = () => {
    setIsSimulatedCritical(false);
    handleUpdateSandbox({ soilTempC: 34.1, moisturePct: 22.4, ph: 7.83, irrigationMm: 0 });
    setToastMessage('✓ Nilai Simulator Direset ke Telemetri Lapangan');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Phase 5: Sinkronisasi waktu dari Time-Lapse Player 72 Jam ke peta spasial
  const handleTimelinePointSelect = (point: ForecastPoint) => {
    setIsSimulatedCritical(false);
    setParcels((current) =>
      current.map((p) => {
        if (p.id === selectedId) {
          const category: 'kritis' | 'waspada' | 'aman' =
            point.avri >= 70 ? 'kritis' : point.avri >= 30 ? 'waspada' : 'aman';
          return {
            ...p,
            avriScore: point.avri,
            avriCategory: category,
            soilTempC: point.temp,
            moisturePct: point.moisture,
            prescription: point.isSafe
              ? `JENDELA AMAN TERBUKA (${point.label}): Tanah sejuk ${point.temp}°C, penyerapan pupuk optimal.`
              : `TUNDA PEMUPUKAN (${point.label}): Risiko penguapan amonia ${point.avri}% akibat terik matahari.`,
          };
        }
        return p;
      })
    );
  };

  // Phase 5: Aksi Penundaan Pemupukan dari Banner Kritis
  const handlePostponeAction = () => {
    setToastMessage('✋ Aplikasi Urea hari ini resmi ditunda hingga Jendela Aman Besok Pagi 06:00 WIB.');
    setDismissedEmergency(true);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Phase 5: Intervensi Irigasi Penyejuk Cepat
  const handleInterveneIrrigation = () => {
    handleUpdateSandbox({ irrigationMm: 15 });
    setToastMessage('💧 Intervensi Irigasi 15 mm Diterapkan: Suhu tanah turun dan AVRI kini berada di zona aman!');
    setDismissedEmergency(true);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Phase 6: Live LoRa Telemetry Heartbeat Stream Simulator (Setiap 5 detik)
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const tempDelta = Number(((Math.random() - 0.5) * 0.3).toFixed(1));
      const moistDelta = Number(((Math.random() - 0.5) * 0.2).toFixed(1));
      const rssi = Math.round(-80 - Math.random() * 6);

      setLatestPacket((prev) => ({
        ...prev,
        time: timeStr,
        nodeId: selectedParcel.nodeId || 'VS-A1-003',
        bytes: 48,
        rssi,
        temp: Number((selectedParcel.soilTempC + tempDelta).toFixed(1)),
        moist: Number((selectedParcel.moisturePct + moistDelta).toFixed(1)),
      }));

      // Fluktuasi mikro data live sesuai transmisi LoRa fisik (dengan batas fisis aman)
      setParcels((current) =>
        current.map((p) => {
          if (p.id === selectedId && p.status === 'online') {
            const clampedTemp = Math.min(50, Math.max(10, Number((p.soilTempC + tempDelta).toFixed(1))));
            const clampedMoist = Math.min(60, Math.max(5, Number((p.moisturePct + moistDelta).toFixed(1))));
            return {
              ...p,
              soilTempC: clampedTemp,
              moisturePct: clampedMoist,
              signalRssi: `${rssi} dBm`,
            };
          }
          return p;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedId, selectedParcel.nodeId, selectedParcel.soilTempC, selectedParcel.moisturePct]);

  // Phase 6: Mission-Control Keyboard Shortcuts (P: SPK, T: Tour, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'p' || e.key === 'P') {
        setShowSpkModal(true);
      } else if (e.key === 't' || e.key === 'T') {
        setShowJuryTour(true);
      } else if (e.key === 'Escape') {
        setShowSpkModal(false);
        setShowJuryTour(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When parcel selection changes
  const handleSelectParcel = (id: string) => {
    setSelectedId(id);
    setDismissedEmergency(false);
  };

  const isCurrentCritical = (selectedParcel.avriScore >= 70 || isSimulatedCritical);

  // Toggle handlers for navbar buttons
  const handleToggleParcels = () => {
    if (isLeftPanelOpen && leftPanelTab === 'parcels') {
      setIsLeftPanelOpen(false);
    } else {
      setIsFullScreenMap(false);
      setIsLeftPanelOpen(true);
      setLeftPanelTab('parcels');
    }
  };

  const handleToggleSandbox = () => {
    if (isLeftPanelOpen && leftPanelTab === 'sandbox') {
      setIsLeftPanelOpen(false);
    } else {
      setIsFullScreenMap(false);
      setIsLeftPanelOpen(true);
      setLeftPanelTab('sandbox');
    }
  };

  const handleToggleFertilizer = () => {
    if (isLeftPanelOpen && leftPanelTab === 'fertilizer') {
      setIsLeftPanelOpen(false);
    } else {
      setIsFullScreenMap(false);
      setIsLeftPanelOpen(true);
      setLeftPanelTab('fertilizer');
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col bg-slate-50 select-none overflow-hidden">
      {/* 1. TOP BAR COCKPIT (Google Earth Style with Direct Navbar Controls) */}
      <CockpitTopBar
        isSimulatedCritical={isSimulatedCritical}
        onToggleScenario={handleToggleScenario}
        onOpenSpkModal={() => setShowSpkModal(true)}
        onOpenJuryTour={() => setShowJuryTour(true)}
        onOpenParcels={handleToggleParcels}
        onOpenSandbox={handleToggleSandbox}
        onOpenFertilizer={handleToggleFertilizer}
        onToggleRightPanel={() => {
          setIsFullScreenMap(false);
          setIsRightPanelOpen((prev) => !prev);
        }}
        isRightPanelOpen={!isFullScreenMap && isRightPanelOpen}
        activeLeftTab={leftPanelTab}
        isLeftPanelOpen={!isFullScreenMap && isLeftPanelOpen}
        bmkgWeather={
          dtTelemetry
            ? `${dtTelemetry.atmosphere_bmkg.air_temp_c}°C · RH ${dtTelemetry.atmosphere_bmkg.humidity_rh}%`
            : undefined
        }
        provenanceSha={dtTelemetry?.data_provenance?.checksum_sha256}
        isFullScreenMap={isFullScreenMap}
        onToggleFullScreenMap={() => setIsFullScreenMap((prev) => !prev)}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onUpdateOpacity={handleUpdateOpacity}
        cropPhase="V8 (DAT 32)"
        kcValue={dtTelemetry?.crop_and_kinetics?.kc_coefficient ?? 0.74}
        efficiencyUrea="+24.5% Urea"
        latestNodeId={latestPacket.nodeId}
        latestRssiDbm={latestPacket.rssi}
      />

      {/* EMERGENCY ALERT BANNER (Kritis Volatilisasi Suhu Ekstrem) */}
      {isCurrentCritical && !dismissedEmergency && (
        <div className="w-full px-3 pb-1 z-30">
          <EmergencyAlertBanner
            avriScore={isSimulatedCritical ? 74 : selectedParcel.avriScore}
            soilTempC={isSimulatedCritical ? 34.5 : selectedParcel.soilTempC}
            onPostpone={handlePostponeAction}
            onInterveneIrrigation={handleInterveneIrrigation}
            onDismiss={() => setDismissedEmergency(true)}
          />
        </div>
      )}

      {/* 2. FULL-SCREEN IMMERSIVE DIGITAL TWIN VIEWPORT */}
      <div className="relative flex-1 w-full h-[calc(100vh-56px)] overflow-hidden">
        {/* ZONA TENGAH: Peta Leaflet Layar Penuh (Edge-to-Edge Canvas) */}
        <div className="absolute inset-0 w-full h-full bg-slate-100 z-0">
          <CockpitFieldMap
            parcels={parcels}
            selectedId={selectedId}
            layers={layers}
            summary={summary}
            onSelectParcel={handleSelectParcel}
            isSimulatedCritical={isSimulatedCritical}
          />
        </div>

        {/* ZONA KIRI: 320px Floating Side Card dengan Animasi Slide Halus */}
        <div
          className={`hidden lg:block absolute top-3 bottom-20 left-3 w-[320px] z-20 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#DCE5EE] shadow-[0_10px_35px_rgba(16,36,58,0.08)] ring-1 ring-slate-900/5 overflow-hidden transition-all duration-300 ease-in-out ${
            !isFullScreenMap && isLeftPanelOpen
              ? 'translate-x-0 opacity-100 pointer-events-auto'
              : '-translate-x-[calc(100%+24px)] opacity-0 pointer-events-none'
          }`}
        >
          <FieldListPanel
            parcels={parcels}
            selectedId={selectedId}
            onSelectParcel={handleSelectParcel}
            isCollapsed={false}
            onToggleCollapse={() => setIsLeftPanelOpen(false)}
            sandboxParams={sandboxParams}
            onUpdateSandbox={handleUpdateSandbox}
            onApplyPreset={handleApplyPreset}
            onResetSandbox={handleResetSandbox}
            isSimulatedCritical={isSimulatedCritical}
            activeTab={leftPanelTab}
            onTabChange={setLeftPanelTab}
          />
        </div>

        {/* ZONA KANAN: 370px Floating Side Card dengan Animasi Slide Halus */}
        <div
          className={`hidden xl:block absolute top-3 bottom-20 right-3 w-[370px] z-20 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#DCE5EE] shadow-[0_10px_35px_rgba(16,36,58,0.08)] ring-1 ring-slate-900/5 overflow-hidden transition-all duration-300 ease-in-out ${
            !isFullScreenMap && isRightPanelOpen
              ? 'translate-x-0 opacity-100 pointer-events-auto'
              : 'translate-x-[calc(100%+24px)] opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative w-full h-full">
            {/* Tombol Tutup Panel Kanan */}
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="absolute top-3.5 right-3.5 z-30 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all duration-150 text-xs"
              title="Tutup Detail Petak"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <FieldDetailPanel
              parcel={selectedParcel}
              isSimulatedCritical={isSimulatedCritical}
              onOpenSpkModal={() => setShowSpkModal(true)}
              onTimelinePointSelect={handleTimelinePointSelect}
              dtTelemetry={dtTelemetry}
            />
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET DRAWER (<1280px): Tampilkan Detail Panel sebagai tab/drawer */}
      <div className="xl:hidden p-4 space-y-4 bg-[#F7F9FC] text-[#172B3A]">
        <FieldDetailPanel
          parcel={selectedParcel}
          isSimulatedCritical={isSimulatedCritical}
          onOpenSpkModal={() => setShowSpkModal(true)}
          onTimelinePointSelect={handleTimelinePointSelect}
          dtTelemetry={dtTelemetry}
        />
        <FieldListPanel
          parcels={parcels}
          selectedId={selectedId}
          onSelectParcel={handleSelectParcel}
        />
      </div>

      {/* 4. MODALS (Surat Perintah Kerja & Tur Presentasi Juri) */}
      <FieldWorkOrderModal
        isOpen={showSpkModal}
        onClose={() => setShowSpkModal(false)}
        parcel={selectedParcel}
      />

      <JuryPresentationTour
        isOpen={showJuryTour}
        onClose={() => setShowJuryTour(false)}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 shadow-xl ring-1 ring-slate-900/5 text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-600 text-xs" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CockpitDashboardView;
