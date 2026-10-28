import { BedengParcel, ParcelMapSummary, SurroundingParcel } from '@/types/parcel';

export const bluriOuterBoundary: [number, number][] = [
  [
    -6.915584,
    112.421808
  ],
  [
    -6.915584,
    112.422699
  ],
  [
    -6.915989,
    112.422688
  ],
  [
    -6.916399,
    112.422634
  ],
  [
    -6.916841,
    112.422742
  ],
  [
    -6.916841,
    112.421808
  ]
];

export const bluriSurroundingParcels: SurroundingParcel[] = [
  {
    "id": "C01",
    "name": "Lahan Sawah Tegal Bluri Utara (Blok 1B)",
    "areaHa": 0.45,
    "center": [
      -6.91535,
      112.42225
    ],
    "polygon": [
      [
        -6.91515,
        112.421808
      ],
      [
        -6.91515,
        112.422742
      ],
      [
        -6.915584,
        112.422699
      ],
      [
        -6.915584,
        112.421808
      ]
    ]
  },
  {
    "id": "C02",
    "name": "Lahan Pertanian Barat (Arah Balai Desa Bluri)",
    "areaHa": 0.62,
    "center": [
      -6.9161,
      112.4214
    ],
    "polygon": [
      [
        -6.915584,
        112.421
      ],
      [
        -6.915584,
        112.421808
      ],
      [
        -6.916841,
        112.421808
      ],
      [
        -6.916841,
        112.421
      ]
    ]
  },
  {
    "id": "C03",
    "name": "Lahan Sawah Tegal Bluri Kidul (Arah Banyubang)",
    "areaHa": 0.58,
    "center": [
      -6.91715,
      112.42225
    ],
    "polygon": [
      [
        -6.916841,
        112.421808
      ],
      [
        -6.916841,
        112.422742
      ],
      [
        -6.91745,
        112.42285
      ],
      [
        -6.91745,
        112.421808
      ]
    ]
  },
  {
    "id": "C04",
    "name": "Persil Sawah Timur (Seberang Jalan Usaha Tani)",
    "areaHa": 0.52,
    "center": [
      -6.9161,
      112.4231
    ],
    "polygon": [
      [
        -6.915521,
        112.42278
      ],
      [
        -6.915521,
        112.4234
      ],
      [
        -6.916884,
        112.4234
      ],
      [
        -6.916884,
        112.42295
      ]
    ]
  }
];

export const initialMapSummary: ParcelMapSummary = {
  coordinatesText: '6??54\'58"S 112??25\'20"E',
  soilTypeText: 'Hamparan Sawah Tegal Jagung Bluri, Solokuro (Aluvial Lempung Kapur pH 7.8)',
  gatewayDistanceKm: 0.08,
  totalAreaHa: 0.96,
  centerCoordinates: [-6.916213, 112.422270],
  gatewayCoordinates: [-6.915650, 112.422720],
  outerBoundary: bluriOuterBoundary,
  surroundingParcels: bluriSurroundingParcels,
  satelliteMetadata: {
    source: 'Sentinel-2 MultiSpectral (Copernicus) & UAV Orthomosaic',
    resolution: '0.2m GSD High-Resolution / 10m Multi-Band',
    crs: 'EPSG:4326 (WGS84)',
    lastCapture: '2026-10-24T08:45:00Z',
    ndviMean: 0.74,
    ndwiMean: 0.31,
    cloudCoverPct: 0.0,
    spectralBands: ['B2 (Blue)', 'B3 (Green)', 'B4 (Red)', 'B8 (NIR)', 'B11 (SWIR)'],
  },
};

export const initialParcels: BedengParcel[] = [
  {
    "id": "A1",
    "nodeId": "VS-A1-001",
    "name": "Blok A1 \u00b7 Tegal Bluri Lor (Utara-Barat)",
    "shortName": "A1 \u00b7 Bluri Lor Barat",
    "areaHa": 0.08,
    "cropVariety": "Bisi-18",
    "moisturePct": 22.4,
    "soilTempC": 34.1,
    "ph": 7.83,
    "batteryV": 3.92,
    "batteryPct": 84,
    "loraSignalDbm": -76,
    "avriScore": 74,
    "avriCategory": "kritis",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Tunda! Suhu tanah terik (34,1\u00b0C) dan kelembapan rendah (22,4%). Tunggu hujan atau siram sebelum pemupukan.",
    "center": [
      -6.915786,
      112.421932
    ],
    "polygon": [
      [
        -6.9156,
        112.42183
      ],
      [
        -6.9156,
        112.422034
      ],
      [
        -6.915973,
        112.422034
      ],
      [
        -6.915973,
        112.42183
      ]
    ]
  },
  {
    "id": "A2",
    "nodeId": "VS-A1-002",
    "name": "Blok A2 \u00b7 Tegal Bluri Lor (Utara-Tengah 1)",
    "shortName": "A2 \u00b7 Bluri Lor Tengah",
    "areaHa": 0.08,
    "cropVariety": "NK-212",
    "moisturePct": 36.8,
    "soilTempC": 26.4,
    "ph": 7.1,
    "batteryV": 4.01,
    "batteryPct": 94,
    "loraSignalDbm": -71,
    "avriScore": 18,
    "avriCategory": "aman",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Aman dipupuk! Suhu tanah sejuk (26,4\u00b0C) dan kelembapan prima (36,8%). Manfaatkan jendela waktu sekarang.",
    "center": [
      -6.915786,
      112.422141
    ],
    "polygon": [
      [
        -6.9156,
        112.422034
      ],
      [
        -6.9156,
        112.422248
      ],
      [
        -6.915973,
        112.422248
      ],
      [
        -6.915973,
        112.422034
      ]
    ]
  },
  {
    "id": "A3",
    "nodeId": "VS-A1-003",
    "name": "Blok A3 \u00b7 Tegal Bluri Lor (Utara-Tengah 2)",
    "shortName": "A3 \u00b7 Bluri Lor Tengah",
    "areaHa": 0.08,
    "cropVariety": "Pioneer P35",
    "moisturePct": 19.2,
    "soilTempC": 36.0,
    "ph": 7.89,
    "batteryV": 3.85,
    "batteryPct": 78,
    "loraSignalDbm": -82,
    "avriScore": 83,
    "avriCategory": "bahaya",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "BAHAYA! Risiko penguapan amonia ekstrem (>80%). Jangan lakukan pemupukan permukaan saat ini.",
    "center": [
      -6.915786,
      112.422355
    ],
    "polygon": [
      [
        -6.9156,
        112.422248
      ],
      [
        -6.9156,
        112.422463
      ],
      [
        -6.915973,
        112.422463
      ],
      [
        -6.915973,
        112.422248
      ]
    ]
  },
  {
    "id": "A4",
    "nodeId": "VS-A1-004",
    "name": "Blok A4 \u00b7 Tegal Bluri Lor (Utara-Timur Jalan)",
    "shortName": "A4 \u00b7 Bluri Lor Timur",
    "areaHa": 0.08,
    "cropVariety": "Bisi-2",
    "moisturePct": 28.1,
    "soilTempC": 29.8,
    "ph": 7.42,
    "batteryV": 3.96,
    "batteryPct": 88,
    "loraSignalDbm": -74,
    "avriScore": 46,
    "avriCategory": "waspada",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Waspada! Gunakan metode benam (tugal kedalaman 5-7 cm) bila terpaksa memupuk hari ini.",
    "center": [
      -6.915786,
      112.422566
    ],
    "polygon": [
      [
        -6.9156,
        112.422463
      ],
      [
        -6.9156,
        112.422677
      ],
      [
        -6.915973,
        112.422661
      ],
      [
        -6.915973,
        112.422463
      ]
    ]
  },
  {
    "id": "B1",
    "nodeId": "VS-B1-001",
    "name": "Blok B1 \u00b7 Tegal Bluri Madya (Tengah-Barat)",
    "shortName": "B1 \u00b7 Bluri Madya Barat",
    "areaHa": 0.08,
    "cropVariety": "Bisi-18",
    "moisturePct": 34.2,
    "soilTempC": 27.1,
    "ph": 7.15,
    "batteryV": 3.9,
    "batteryPct": 82,
    "loraSignalDbm": -78,
    "avriScore": 24,
    "avriCategory": "aman",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Kondisi aman. Kelembapan tanah cukup untuk hidrolisis perlahan tanpa penguapan amonia masif.",
    "center": [
      -6.916186,
      112.421932
    ],
    "polygon": [
      [
        -6.915973,
        112.42183
      ],
      [
        -6.915973,
        112.422034
      ],
      [
        -6.916399,
        112.422034
      ],
      [
        -6.916399,
        112.42183
      ]
    ]
  },
  {
    "id": "B2",
    "nodeId": "VS-B1-002",
    "name": "Blok B2 \u00b7 Tegal Bluri Madya (Tengah-Inti)",
    "shortName": "B2 \u00b7 Bluri Madya Inti",
    "areaHa": 0.08,
    "cropVariety": "NK-212",
    "moisturePct": 26.0,
    "soilTempC": 31.2,
    "ph": 7.55,
    "batteryV": 4.08,
    "batteryPct": 98,
    "loraSignalDbm": -68,
    "avriScore": 52,
    "avriCategory": "waspada",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Waspada: Kelembapan 26.0% mendekati batas kritis 25%. Dianjurkan menunda pemupukan hingga sore hari.",
    "center": [
      -6.916186,
      112.422141
    ],
    "polygon": [
      [
        -6.915973,
        112.422034
      ],
      [
        -6.915973,
        112.422248
      ],
      [
        -6.916399,
        112.422248
      ],
      [
        -6.916399,
        112.422034
      ]
    ]
  },
  {
    "id": "B3",
    "nodeId": "VS-B1-003",
    "name": "Blok B3 \u00b7 Tegal Bluri Madya (Tengah-Timur 1)",
    "shortName": "B3 \u00b7 Bluri Madya Timur",
    "areaHa": 0.08,
    "cropVariety": "Pioneer P35",
    "moisturePct": 23.1,
    "soilTempC": 33.5,
    "ph": 7.75,
    "batteryV": 3.88,
    "batteryPct": 80,
    "loraSignalDbm": -80,
    "avriScore": 68,
    "avriCategory": "kritis",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "KRITIS! Kehilangan nitrogen diperkirakan mencapai 68%. Jangan sebar urea.",
    "center": [
      -6.916186,
      112.422347
    ],
    "polygon": [
      [
        -6.915973,
        112.422248
      ],
      [
        -6.915973,
        112.422447
      ],
      [
        -6.916399,
        112.422447
      ],
      [
        -6.916399,
        112.422248
      ]
    ]
  },
  {
    "id": "B4",
    "nodeId": "VS-B1-004",
    "name": "Blok B4 \u00b7 Tegal Bluri Madya (Tengah-Sisi Jalan)",
    "shortName": "B4 \u00b7 Bluri Madya Jalan",
    "areaHa": 0.08,
    "cropVariety": "Bisi-18",
    "moisturePct": 33.5,
    "soilTempC": 27.6,
    "ph": 7.22,
    "batteryV": 3.98,
    "batteryPct": 90,
    "loraSignalDbm": -73,
    "avriScore": 26,
    "avriCategory": "aman",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Aman: Kanopi tanaman di dekat jalan cukup menaungi tanah, menekan kenaikan suhu permukaan.",
    "center": [
      -6.916186,
      112.422544
    ],
    "polygon": [
      [
        -6.915973,
        112.422447
      ],
      [
        -6.915973,
        112.422661
      ],
      [
        -6.916399,
        112.422608
      ],
      [
        -6.916399,
        112.422447
      ]
    ]
  },
  {
    "id": "C1",
    "nodeId": "VS-C1-001",
    "name": "Blok C1 \u00b7 Tegal Bluri Kidul (Selatan-Barat)",
    "shortName": "C1 \u00b7 Bluri Kidul Barat",
    "areaHa": 0.08,
    "cropVariety": "NK-212",
    "moisturePct": 35.0,
    "soilTempC": 26.8,
    "ph": 7.12,
    "batteryV": 3.95,
    "batteryPct": 88,
    "loraSignalDbm": -75,
    "avriScore": 22,
    "avriCategory": "aman",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Aman dipupuk. Kondisi tanah ideal dengan retensi air optimal.",
    "center": [
      -6.916612,
      112.421932
    ],
    "polygon": [
      [
        -6.916399,
        112.42183
      ],
      [
        -6.916399,
        112.422034
      ],
      [
        -6.916825,
        112.422034
      ],
      [
        -6.916825,
        112.42183
      ]
    ]
  },
  {
    "id": "C2",
    "nodeId": "VS-C1-002",
    "name": "Blok C2 \u00b7 Tegal Bluri Kidul (Selatan-Tengah 1)",
    "shortName": "C2 \u00b7 Bluri Kidul Tengah",
    "areaHa": 0.08,
    "cropVariety": "Bisi-2",
    "moisturePct": 27.5,
    "soilTempC": 30.4,
    "ph": 7.48,
    "batteryV": 3.91,
    "batteryPct": 85,
    "loraSignalDbm": -77,
    "avriScore": 48,
    "avriCategory": "waspada",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "Waspada: Tanah mulai hangat. Jika memupuk, tutup pupuk dengan tanah segera.",
    "center": [
      -6.916612,
      112.422141
    ],
    "polygon": [
      [
        -6.916399,
        112.422034
      ],
      [
        -6.916399,
        112.422248
      ],
      [
        -6.916825,
        112.422248
      ],
      [
        -6.916825,
        112.422034
      ]
    ]
  },
  {
    "id": "C3",
    "nodeId": "VS-C1-003",
    "name": "Blok C3 \u00b7 Tegal Bluri Kidul (Selatan-Tengah 2)",
    "shortName": "C3 \u00b7 Bluri Kidul Tengah",
    "areaHa": 0.08,
    "cropVariety": "Pioneer P35",
    "moisturePct": 21.8,
    "soilTempC": 34.8,
    "ph": 7.82,
    "batteryV": 3.87,
    "batteryPct": 80,
    "loraSignalDbm": -79,
    "avriScore": 75,
    "avriCategory": "kritis",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "KRITIS! Panas terik dan penguapan cepat. Rekomendasi: Tunda pemupukan.",
    "center": [
      -6.916612,
      112.422355
    ],
    "polygon": [
      [
        -6.916399,
        112.422248
      ],
      [
        -6.916399,
        112.422463
      ],
      [
        -6.916825,
        112.422463
      ],
      [
        -6.916825,
        112.422248
      ]
    ]
  },
  {
    "id": "C4",
    "nodeId": "VS-C1-004",
    "name": "Blok C4 \u00b7 Tegal Bluri Kidul (Selatan-Kelokan Jalan)",
    "shortName": "C4 \u00b7 Bluri Kidul Kelokan",
    "areaHa": 0.08,
    "cropVariety": "Bisi-18",
    "moisturePct": 18.5,
    "soilTempC": 36.4,
    "ph": 7.92,
    "batteryV": 3.82,
    "batteryPct": 74,
    "loraSignalDbm": -84,
    "avriScore": 85,
    "avriCategory": "bahaya",
    "status": "online",
    "telemetryMode": "LoRa Live Stream",
    "prescription": "BAHAYA TINGGI! Pupuk urea akan menguap lebih dari 80%. Dilarang keras melakukan pemupukan sebar.",
    "center": [
      -6.916612,
      112.422578
    ],
    "polygon": [
      [
        -6.916399,
        112.422463
      ],
      [
        -6.916399,
        112.422608
      ],
      [
        -6.916825,
        112.422715
      ],
      [
        -6.916825,
        112.422463
      ]
    ]
  }
];
