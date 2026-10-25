import { DashboardState } from '@/types/dashboard';

// Skenario Utama (Sesuai Screenshot Desain yang Diberikan Pengguna)
export const initialDashboardData: DashboardState = {
  field: {
    id: 'BLOK-A',
    name: 'Kebun Jagung pak suparman',
    farmerName: 'Pak Suparman',
    location: 'Solokuro Lamongan',
    block: 'Blok A',
    areaHa: 0.75,
    datDays: 32,
    phaseName: 'Fase 8',
    batteryPct: 84,
    lastUpdatedMinutesAgo: 12,
  },
  statusBanner: {
    category: 'aman',
    avriScore: 4,
    tag: 'STATUS HARI INI - RISIKO AMAN AVRI 4%',
    title: 'Aman, waktu optimal pemupukan',
    description:
      'Suhu tanah 26,0°C, kelembapan 42,0%, pH 7,10. Tanah cukup untuk mengikat nitrogen ke zona perakaran. Jendela aman terdekat : Sekarang, Jendela terbuka sekitar 4 jam ke depan.',
    bestWindow: 'Sekarang (06:00 – 10:00 WIB)',
    openDurationText: 'Jendela terbuka sekitar 4 jam ke depan.',
  },
  metrics: [
    {
      id: 'moisture',
      label: 'Kelembapan Tanah',
      value: '42,0%',
      numericValue: 42.0,
      unit: '%',
      delta24h: '+3.4%',
      status: 'optimal',
    },
    {
      id: 'temp',
      label: 'Suhu Tanah',
      value: '26,0°C',
      numericValue: 26.0,
      unit: '°C',
      delta24h: '-1.2°C',
      status: 'optimal',
    },
    {
      id: 'ph',
      label: 'pH Tanah',
      value: '7,10',
      numericValue: 7.1,
      unit: '',
      delta24h: '0.00',
      status: 'optimal',
    },
    {
      id: 'avri',
      label: 'AVRI (12 JAM)',
      value: '4%',
      numericValue: 4,
      unit: '%',
      delta24h: '-14%',
      status: 'optimal',
      isAvriCard: true,
    },
  ],
  trend24h: [
    { time: '00.00', moisture: 39, temperature: 22.5, threshold: 25 },
    { time: '08.00', moisture: 26.5, temperature: 28.5, threshold: 25 },
    { time: '16.00', moisture: 24.2, temperature: 30.0, threshold: 25 },
    { time: '23.00', moisture: 38.5, temperature: 23.0, threshold: 25 },
  ],
  forecast72h: [
    {
      dayNumber: 1,
      dayLabel: 'Hari 1',
      // 24 jam (00-23 WIB): jam 6, 7, 8 aman (hijau)
      hourlyBlocks: [
        false, false, false, false, false, false,
        true, true, true, false, false, false,
        false, false, false, false, false, false,
        false, false, false, false, false, false,
      ],
      safeRangeText: '06.00 - 09.00',
      riskScoreText: 'Aman 18%',
      isSafe: true,
    },
    {
      dayNumber: 2,
      dayLabel: 'Hari 2',
      // jam 17, 18 aman (hijau)
      hourlyBlocks: [
        false, false, false, false, false, false,
        false, false, false, false, false, false,
        false, false, false, false, false, true,
        true, false, false, false, false, false,
      ],
      safeRangeText: '17.00 - 19.00',
      riskScoreText: 'Aman 26%',
      isSafe: true,
    },
    {
      dayNumber: 3,
      dayLabel: 'Hari 3',
      // semua terik / tidak ada jendela aman
      hourlyBlocks: new Array(24).fill(false),
      safeRangeText: 'Tidak ada jendela aman',
      riskScoreText: 'Risiko Tinggi',
      isSafe: false,
    },
  ],
};

// Skenario Pembanding: Terik Kritis (untuk demo pengujian juri PRD Seksi 3)
export const criticalDashboardData: DashboardState = {
  ...initialDashboardData,
  statusBanner: {
    category: 'kritis',
    avriScore: 74,
    tag: 'STATUS HARI INI - RISIKO KRITIS AVRI 74%',
    title: 'Peringatan: Tunda penaburan Urea sekarang',
    description:
      'Suhu tanah 34,1°C, kelembapan 22,4%, pH 7,83. Suhu terik memicu penguraian enzimatik cepat amonia ke udara. Jendela aman terdekat: Besok pagi 06:00 WIB.',
    bestWindow: 'Besok Pagi (06:00 – 09:00 WIB)',
    openDurationText: 'Kondisi terik diperkirakan hingga 17:30 WIB.',
  },
  metrics: [
    {
      id: 'moisture',
      label: 'Kelembapan Tanah',
      value: '22,4%',
      numericValue: 22.4,
      unit: '%',
      delta24h: '-3.2%',
      status: 'danger',
    },
    {
      id: 'temp',
      label: 'Suhu Tanah',
      value: '34,1°C',
      numericValue: 34.1,
      unit: '°C',
      delta24h: '+1.8°C',
      status: 'danger',
    },
    {
      id: 'ph',
      label: 'pH Tanah',
      value: '7,83',
      numericValue: 7.83,
      unit: '',
      delta24h: '+0.02',
      status: 'warning',
    },
    {
      id: 'avri',
      label: 'AVRI (12 JAM)',
      value: '74%',
      numericValue: 74,
      unit: '%',
      delta24h: '+18%',
      status: 'danger',
      isAvriCard: true,
    },
  ],
};
