'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle2, RefreshCw, ShieldCheck, Database, Radio, Cpu } from 'lucide-react';
import {
  getReportImpactSummary,
  getProvenanceAudit,
  downloadReportCsv,
  ReportImpactSummary,
  ProvenanceAuditRecord,
} from '@/services/api';

export const ReportAnalytics: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isBackendSynced, setIsBackendSynced] = useState<boolean>(false);
  const [activeTableTab, setActiveTableTab] = useState<'live_audit' | 'scientific_reference'>('live_audit');

  // Dynamic Impact Summary State with initial fallback
  const [impactData, setImpactData] = useState<ReportImpactSummary>({
    field_id: 'BLOK-A',
    urea_efficiency_target: '≥ 20–35%',
    cost_savings_per_ha_idr: 750000,
    nitrogen_loss_reduction: '45% → <15%',
    total_actions_recorded: 1,
    total_urea_saved_kg: 45.0,
    critical_hours_prevented: 14,
    last_audit_iso: '2026-10-28T09:45:00Z',
  });

  // Dynamic Provenance Audit Logs State
  const [auditLogs, setAuditLogs] = useState<ProvenanceAuditRecord[]>([]);
  const [directCount, setDirectCount] = useState<number>(0);
  const [failoverCount, setFailoverCount] = useState<number>(0);

  // Load real impact and provenance audit from FastAPI backend
  const loadReportData = useCallback(async () => {
    try {
      const [impactRes, auditRes] = await Promise.all([
        getReportImpactSummary('BLOK-A'),
        getProvenanceAudit('BLOK-A', 15),
      ]);

      if (impactRes) {
        setImpactData(impactRes);
        setIsBackendSynced(true);
      }

      if (auditRes && auditRes.records && auditRes.records.length > 0) {
        setAuditLogs(auditRes.records);
        setDirectCount(auditRes.direct_telemetry_count);
        setFailoverCount(auditRes.failover_imputed_count);
        setIsBackendSynced(true);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic report analytics:', err);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Real Server-Side Dynamic CSV Download (TimescaleDB Telemetry Stream)
  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    try {
      const success = await downloadReportCsv('BLOK-A', 168);
      if (success) {
        setToastMessage('✓ File CSV Audit Telemetri 100% data nyata dari TimescaleDB berhasil diunduh.');
      } else {
        setToastMessage('Gagal mengunduh CSV dari backend, memeriksa koneksi...');
      }
    } catch {
      setToastMessage('Terjadi kendala saat mengunduh CSV.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan, Provenance Data &amp; Batas Kejujuran Ilmiah
            </h2>
            {isBackendSynced && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-3xs font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Backend Live Sync
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Ringkasan dampak, audit log telemetri deret waktu, dan batas klaim sistem — untuk audit PPL &amp; dewan juri
          </p>
        </div>

        <button
          onClick={loadReportData}
          title="Sinkronkan data audit dari database"
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Main Sandy Canvas Container matching design */}
      <div className="bg-[#FAF4E6] rounded-3xl p-5 sm:p-6 border border-[#E4D9BC] space-y-6">
        {/* ================= UPPER SECTION: 3 IMPACT CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Target Efisiensi Pupuk Urea */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                TARGET EFISIENSI PUPUK UREA
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1E6B34] mt-2 mb-2 tracking-tight">
                {impactData.urea_efficiency_target}
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setara penghematan <b>Rp {impactData.cost_savings_per_ha_idr.toLocaleString('id-ID')}</b> per hektar per musim dengan estimasi <b>{impactData.total_urea_saved_kg} kg Urea</b> terselamatkan dari penguapan NH₃.
            </p>
          </div>

          {/* Card 2: Penurunan Kehilangan Nitrogen */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                PENURUNAN KEHILANGAN NITROGEN
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] mt-2 mb-2 tracking-tight">
                {impactData.nitrogen_loss_reduction}
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mencegah aplikasi pada tanah panas-kering (&gt;30°C, kelembaban &lt;25%). <b>{impactData.critical_hours_prevented} jam jendela kritis</b> berhasil dihindari melalui <b>{impactData.total_actions_recorded} aksi preskripsi petani</b>.
            </p>
          </div>

          {/* Card 3: Ekspor Data Audit Real-Time */}
          <div className="bg-[#EDF8EE] rounded-2xl p-6 border border-[#C6E7C9] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  EKSPOR DATA AUDIT
                </span>
                <span className="inline-flex items-center gap-1 text-3xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  <Database className="w-2.5 h-2.5" /> TimescaleDB Stream
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
                Unduh log telemetri deret waktu lengkap ({auditLogs.length > 0 ? `${auditLogs.length} titik aktif` : '120+ baris'}) beserta tag provenance (*ESP32 vs FAO-56*) untuk validasi audit.
              </p>
            </div>
            <button
              onClick={handleDownloadCsv}
              disabled={isDownloading}
              className="w-full bg-[#236B32] hover:bg-[#1c5528] disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengambil Data TimescaleDB...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Ekspor CSV Audit Telemetri</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================= LOWER SECTION: PROVENANCE TABLE & THE MOAT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tabel Audit Data Provenance (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Tabel Audit Data Provenance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menghindari &quot;Fake Simulator&quot; dengan pembuktian asal-usul data telemetri nyata vs estimasi failover.
                </p>
              </div>

              {/* Sub-tab Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveTableTab('live_audit')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTableTab === 'live_audit'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Riwayat Log Live ({auditLogs.length})
                </button>
                <button
                  onClick={() => setActiveTableTab('scientific_reference')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTableTab === 'scientific_reference'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Acuan Ilmiah
                </button>
              </div>
            </div>

            {/* TAB 1: Live Audit Log from Backend Database */}
            {activeTableTab === 'live_audit' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2xs text-slate-500 border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-600" />
                    Transmisi Langsung: <b>{directCount} paket</b>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-amber-600" />
                    Failover Digital Twin: <b>{failoverCount} paket</b>
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-400 font-semibold text-3xs uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Waktu (UTC/WIB)</th>
                        <th className="py-2.5 px-3">Node / Bedeng</th>
                        <th className="py-2.5 px-3">θ / T / pH</th>
                        <th className="py-2.5 px-3">AVRI</th>
                        <th className="py-2.5 px-3">Provenance Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            Memuat log audit dari database backend...
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-2xs text-slate-600 whitespace-nowrap">
                              {log.timestamp}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-800 text-2xs block">{log.node_id}</span>
                              <span className="text-3xs text-slate-500">{log.block_name}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-2xs whitespace-nowrap text-slate-700">
                              {log.moisture_pct}% · {log.soil_temp_c}°C · {log.ph}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-3xs font-bold ${
                                log.risk_class === 'AMAN'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.risk_class === 'WASPADA'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {log.avri_score}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {log.is_predicted ? (
                                <span className="inline-flex items-center gap-1 text-3xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                                  <Cpu className="w-2.5 h-2.5 text-amber-600" /> FAO-56 Failover
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-3xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                                  <Radio className="w-2.5 h-2.5 text-emerald-600" /> ESP32 LoRa Direct
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Static Literature Acuan Ilmiah */}
            {activeTableTab === 'scientific_reference' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2 px-3">Dataset / Modul</th>
                      <th className="py-2 px-3">Sumber Referensi</th>
                      <th className="py-2 px-3">Peran di Sistem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        BMKG Historical Weather
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        Stasiun Meteorologi Lampung &amp; Lamongan (WMO 96933)
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        Replay suhu udara, RH, radiasi surya, hujan
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        FAO-56 Penman-Monteith
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        Allen et al. (1998) / FAO Irrigation and Drainage
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        Transisi kelembaban tanah &amp; failover imputasi
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        Urease Kinetics Layer
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        Kissel &amp; Cabrera (2005) / Sommer et al.
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        Persamaan kinetika Arrhenius penguapan NH₃
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        Dosis Pupuk Majemuk
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        Permentan No. 40/2007 &amp; Rekomendasi Balitbangtan
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        Kalkulator takaran praktis karung &amp; ember
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Batas Kejujuran Ilmiah (The Moat) (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-4">
                Batas Kejujuran Ilmiah (The Moat)
              </h3>

              <div className="space-y-3.5">
                {/* Box 1 */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/80 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    1. Menolak Sensor NPK Murah (Gimmick)
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Probe NPK Rp200 ribuan hanya mengalikan konduktivitas listrik (EC) dengan konstanta arbitrer. Kami mengukur Suhu, Kelembaban, dan pH tanah sejati.
                  </p>
                </div>

                {/* Box 2 */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/80 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    2. Fokus Jalur Volatilisasi Amonia
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Model hanya memprediksi penguapan NH₃ 12–72 jam pasca-tabur, tidak mengklaim mengukur pencucian (*leaching*) atau denitrifikasi anaerob.
                  </p>
                </div>

                {/* Box 3 */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/80 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    3. Kejujuran Status Prototipe TKT 3
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sistem beroperasi sebagai simulasi tertutup end-to-end terverifikasi sebelum pencairan dana komponen fisik menuju TKT 6 lapangan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
