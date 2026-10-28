import { AgronomyData } from '@/types/agronomy';

export const initialAgronomyData: AgronomyData = {
  plantingDate: '2026-09-25',
  seedVariety: 'Hibrida Bisi-18',
  areaHa: 0.75,
  targetYieldTonHa: 8.0,
  stages: [
    {
      id: 've',
      hstRange: '0–7 HST',
      name: 'Perkecambahan (VE)',
      subtitle: 'Fase Awal',
      description: 'Muncul koleoptil & akar seminal. Jaga kelembaban >30%.',
      isActive: false,
    },
    {
      id: 'v3',
      hstRange: '10–14 HST',
      name: 'V3 · Pupuk Dasar',
      subtitle: 'Aplikasi Awal',
      description: 'Pemupukan I (NPK Phonska + Urea awal) untuk perakaran.',
      isActive: false,
    },
    {
      id: 'v8',
      hstRange: '30–35 HST',
      name: 'V8 · Susulan I (Kritis)',
      subtitle: 'Fase Aktif',
      description: 'Puncak serapan N vegetatif: sangat rentan volatilisasi NH3.',
      isActive: true,
    },
    {
      id: 'v12',
      hstRange: '45–50 HST',
      name: 'V12 / Tasseling',
      subtitle: 'Fase Pembungaan',
      description: 'Pemupukan Susulan II sebelum malai/bunga jantan keluar.',
      isActive: false,
    },
    {
      id: 'harvest',
      hstRange: '95–105 HST',
      name: 'Masak & Panen',
      subtitle: 'Fase Akhir',
      description: 'Kadar air biji turun: estimasi panen pipilan kering.',
      isActive: false,
    },
  ],
  applicationLogs: [
    {
      id: 'log-1',
      stageName: 'Fase V3 (Pemupukan Dasar)',
      hst: 12,
      dateStr: '07/10/2026',
      mixtureSummary: '112 kg Phonska + 38 kg Urea (19 Ember)',
      avriAtApplication: 21,
      statusText: 'Optimal (Aman)',
    },
  ],
};
