'use client';

import React from 'react';
import {
  FileText,
  Printer,
  Share2,
  X,
  Calendar,
  Clock,
  Layers,
  MapPin,
  Scale,
  Sparkles,
} from 'lucide-react';
import { BedengParcel } from '@/types/parcel';

interface FieldWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: BedengParcel;
}

export const FieldWorkOrderModal: React.FC<FieldWorkOrderModalProps> = ({
  isOpen,
  onClose,
  parcel,
}) => {
  if (!isOpen) return null;

  const areaHa = parcel.areaHa || 0.45;
  const ureaKg = Math.round(areaHa * 125); // Standar 125 kg/ha Urea rekomendasi presisi
  const npkKg = Math.round(areaHa * 100);  // Standar 100 kg/ha NPK Phonska
  const ureaSacks = (ureaKg / 50).toFixed(1);
  const npkSacks = (npkKg / 50).toFixed(1);
  const bucketCount = Math.round(ureaKg / 8); // Ember takar 8 kg (ADR 008)

  const isCritical = parcel.avriCategory === 'kritis';
  const spkNumber = `SPK/2026/VS-SLK-${parcel.id}-084`;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `*SURAT PERINTAH KERJA (SPK) PEMUPUKAN VOLATISAFE AIoT*\nNomor: ${spkNumber}\nPetak: ${parcel.name} (${areaHa} ha)\nStatus AVRI: ${parcel.avriScore}% (${parcel.avriCategory.toUpperCase()})\nRekomendasi Waktu: Besok Pagi 06:00 - 09:00 WIB\nDosis: ${ureaKg} kg Urea (${ureaSacks} karung) / ${bucketCount} ember (8 kg/ember).\nMetode: Tugal kedalaman 4 cm.`;
    navigator.clipboard.writeText(text);
    alert('Salinan teks SPK berhasil disalin ke clipboard untuk dikirim ke WhatsApp Mandor!');
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-8">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                Official Work Order · FoodTech 2026
              </span>
              <span className="text-2xs font-mono text-emerald-300">
                {spkNumber}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Surat Perintah Kerja (SPK) Pemupukan Presisi
            </h2>
            <p className="text-xs text-emerald-100/80">
              Sistem Pengambilan Keputusan Agronomi Terpadu Berbasis Digital Twin VolatiSafe
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Dokumen SPK */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Identitas Petak & Agroklimat Karst */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Hamparan Petak
              </span>
              <b className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {parcel.name}
              </b>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Luas Lahan
              </span>
              <b className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                {areaHa} Hektar ({Math.round(areaHa * 10000)} m²)
              </b>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Komoditas / Fase
              </span>
              <b className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Jagung Hibrida · V8 (DAT 32)
              </b>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Tanah / pH
              </span>
              <b className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                Karst Alkalis · pH {parcel.ph.toFixed(2)}
              </b>
            </div>
          </div>

          {/* Status Kinetika Volatilisasi AIoT */}
          <div
            className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isCritical
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full font-black text-2xs uppercase tracking-wider ${
                    isCritical
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  Status AI: {parcel.avriCategory.toUpperCase()} (AVRI {parcel.avriScore}%)
                </span>
                <span className="text-slate-500 text-2xs">
                  Suhu Tanah: {parcel.soilTempC.toFixed(1)}°C · Lembab: {parcel.moisturePct.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {parcel.prescription}
              </p>
            </div>
            <div className="text-right sm:border-l sm:pl-4 border-slate-200 shrink-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Penghematan N
              </span>
              <span className="text-base font-black text-emerald-600">
                +24.5% Urea
              </span>
            </div>
          </div>

          {/* Rekomendasi Jendela Waktu Aplikasi Pupuk */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-black block uppercase tracking-wider">
                  Jendela Aplikasi Aman Optimal
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  Besok Pagi, 06:00 – 09:00 WIB
                </span>
                <span className="text-2xs text-slate-400 block">
                  Suhu tanah sejuk 24.8°C · Kelembaban 26.5% · Emisi amonia minimal (&lt; 18%)
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
              JENDELA DIBUKA
            </span>
          </div>

          {/* Rincian Dosis Fisik (ADR 008: Karung & Ember) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              Rincian Dosis Pupuk Fisik Sesuai Luas Lahan ({areaHa} Ha)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Urea */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    1. Pupuk Urea (N 46%)
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {ureaKg} <span className="text-xs font-normal">kg</span>
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 mt-2 text-2xs text-slate-600">
                  Setara <b>{ureaSacks} Karung</b> (sak 50 kg)
                </div>
              </div>

              {/* NPK Phonska */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    2. NPK Phonska (15-15-15)
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {npkKg} <span className="text-xs font-normal">kg</span>
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 mt-2 text-2xs text-slate-600">
                  Setara <b>{npkSacks} Karung</b> (sak 50 kg)
                </div>
              </div>

              {/* Takaran Ember 8 kg */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                    3. Takaran Aplikator Lapangan
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {bucketCount} <span className="text-xs font-normal">Ember</span>
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200 mt-2 text-2xs text-emerald-800">
                  Ember standar <b>8 kg</b> per bedengan
                </div>
              </div>
            </div>
          </div>

          {/* Standar Operasional Prosedur (SOP) Lapangan */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <b className="font-bold block text-amber-900 uppercase tracking-wide text-2xs">
              ⚠️ SOP Penaburan Pupuk di Lahan Karst Solokuro:
            </b>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-2xs leading-relaxed">
              <li>
                <b>Metode Tugal/Benam Wajib:</b> Buat lubang tugal sedalam <b>4 cm</b> di samping perakaran jagung (jarak 7–10 cm), lalu tutup kembali dengan tanah remah untuk mencegah kontak langsung urea dengan udara panas.
              </li>
              <li>
                <b>Batasan Waktu:</b> Hentikan aplikasi jika waktu telah melewati pukul <b>09:30 WIB</b> karena radiasi surya memicu lonjakan suhu tanah di atas 30°C.
              </li>
              <li>
                <b>Mitigasi Tanah Kering:</b> Jika kelembaban tanah &lt; 20%, lakukan penyiraman ringan (irigasi 10–15 mm) sebelum pemupukan.
              </li>
            </ul>
          </div>

          {/* Form Pengesahan Tanda Tangan */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center text-slate-600">
            <div className="space-y-12">
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Penyuluh Pertanian Lapangan (PPL)
              </span>
              <div className="border-b border-slate-300 w-36 mx-auto"></div>
              <span className="block font-bold text-slate-900 text-2xs">
                Ir. Bambang Triyono, S.P.
              </span>
            </div>

            <div className="space-y-12">
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Petani Penggarap / Mandor
              </span>
              <div className="border-b border-slate-300 w-36 mx-auto"></div>
              <span className="block font-bold text-slate-900 text-2xs">
                Pak Suparman (Poktan Karya Makmur)
              </span>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Diterbitkan: 27 Oktober 2026 · VolatiSafe AIoT v2.4</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan WA/Mandor</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldWorkOrderModal;
