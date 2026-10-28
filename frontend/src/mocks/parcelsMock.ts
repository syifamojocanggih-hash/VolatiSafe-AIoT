import { BedengParcel, ParcelMapSummary, SurroundingParcel } from '@/types/parcel';

export const bluriOuterBoundary: [number, number][] = [
  [
    -6.91175,
    112.3452
  ],
  [
    -6.91175,
    112.34616
  ],
  [
    -6.91296,
    112.34616
  ],
  [
    -6.91296,
    112.3452
  ]
];

export const bluriSurroundingParcels: SurroundingParcel[] = [
  {
    "id": "C01",
    "name": "Lahan Sawah Solokuro Lor (Blok 1B)",
    "areaHa": 0.45,
    "center": [
      -6.91145,
      112.34568
    ],
    "polygon": [
      [
        -6.91115,
        112.3452
      ],
      [
        -6.91115,
        112.34616
      ],
      [
        -6.91175,
        112.34616
      ],
      [
        -6.91175,
        112.3452
      ]
    ]
  },
  {
    "id": "C02",
    "name": "Lahan Pertanian Kulon (Arah Solokuro Kulon)",
    "areaHa": 0.62,
    "center": [
      -6.912355,
      112.34475
    ],
    "polygon": [
      [
        -6.91175,
        112.3443
      ],
      [
        -6.91175,
        112.3452
      ],
      [
        -6.91296,
        112.3452
      ],
      [
        -6.91296,
        112.3443
      ]
    ]
  },
  {
    "id": "C03",
    "name": "Lahan Sawah Solokuro Kidul (Arah Banyubang)",
    "areaHa": 0.58,
    "center": [
      -6.91325,
      112.34568
    ],
    "polygon": [
      [
        -6.91296,
        112.3452
      ],
      [
        -6.91296,
        112.34616
      ],
      [
        -6.91355,
        112.34616
      ],
      [
        -6.91355,
        112.3452
      ]
    ]
  },
  {
    "id": "C04",
    "name": "Persil Sawah Wetan (Seberang Jalan Usaha Tani)",
    "areaHa": 0.52,
    "center": [
      -6.912355,
      112.3466
    ],
    "polygon": [
      [
        -6.91175,
        112.3462
      ],
      [
        -6.91175,
        112.347
      ],
      [
        -6.91296,
        112.347
      ],
      [
        -6.91296,
        112.3462
      ]
    ]
  }
];

export const initialMapSummary: ParcelMapSummary = {
  coordinatesText: '6°54\'44"S 112°20\'44"E',
  soilTypeText: 'Hamparan Persawahan Jagung Solokuro (Aluvial Lempung Berpasir pH 7.2)',
  gatewayDistanceKm: 0.065,
  totalAreaHa: 0.96,
  centerCoordinates: [-6.912350, 112.345680],
  gatewayCoordinates: [-6.911850, 112.346150],
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
    "name": "Blok A1 \u00b7 Sawah Solokuro Lor (Utara-Barat)",
    "shortName": "A1 \u00b7 Solokuro Lor Barat",
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
      -6.911985,
      112.345358
    ],
    "polygon": [
      [
        -6.9118,
        112.34525
      ],
      [
        -6.9118,
        112.345465
      ],
      [
        -6.91217,
        112.345465
      ],
      [
        -6.91217,
        112.34525
      ]
    ]
  },
  {
    "id": "A2",
    "nodeId": "VS-A1-002",
    "name": "Blok A2 \u00b7 Sawah Solokuro Lor (Utara-Tengah 1)",
    "shortName": "A2 \u00b7 Solokuro Lor Tengah",
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
      -6.911985,
      112.345573
    ],
    "polygon": [
      [
        -6.9118,
        112.345465
      ],
      [
        -6.9118,
        112.34568
      ],
      [
        -6.91217,
        112.34568
      ],
      [
        -6.91217,
        112.345465
      ]
    ]
  },
  {
    "id": "A3",
    "nodeId": "VS-A1-003",
    "name": "Blok A3 \u00b7 Sawah Solokuro Lor (Utara-Tengah 2)",
    "shortName": "A3 \u00b7 Solokuro Lor Tengah",
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
      -6.911985,
      112.345788
    ],
    "polygon": [
      [
        -6.9118,
        112.34568
      ],
      [
        -6.9118,
        112.345895
      ],
      [
        -6.91217,
        112.345895
      ],
      [
        -6.91217,
        112.34568
      ]
    ]
  },
  {
    "id": "A4",
    "nodeId": "VS-A1-004",
    "name": "Blok A4 \u00b7 Sawah Solokuro Lor (Utara-Timur Jalan)",
    "shortName": "A4 \u00b7 Solokuro Lor Timur",
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
      -6.911985,
      112.346003
    ],
    "polygon": [
      [
        -6.9118,
        112.345895
      ],
      [
        -6.9118,
        112.34611
      ],
      [
        -6.91217,
        112.34611
      ],
      [
        -6.91217,
        112.345895
      ]
    ]
  },
  {
    "id": "B1",
    "nodeId": "VS-B1-001",
    "name": "Blok B1 \u00b7 Sawah Solokuro Madya (Tengah-Barat)",
    "shortName": "B1 \u00b7 Solokuro Madya Barat",
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
      -6.912355,
      112.345358
    ],
    "polygon": [
      [
        -6.91217,
        112.34525
      ],
      [
        -6.91217,
        112.345465
      ],
      [
        -6.91254,
        112.345465
      ],
      [
        -6.91254,
        112.34525
      ]
    ]
  },
  {
    "id": "B2",
    "nodeId": "VS-B1-002",
    "name": "Blok B2 \u00b7 Sawah Solokuro Madya (Tengah-Inti)",
    "shortName": "B2 \u00b7 Solokuro Madya Inti",
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
      -6.912355,
      112.345573
    ],
    "polygon": [
      [
        -6.91217,
        112.345465
      ],
      [
        -6.91217,
        112.34568
      ],
      [
        -6.91254,
        112.34568
      ],
      [
        -6.91254,
        112.345465
      ]
    ]
  },
  {
    "id": "B3",
    "nodeId": "VS-B1-003",
    "name": "Blok B3 \u00b7 Sawah Solokuro Madya (Tengah-Timur 1)",
    "shortName": "B3 \u00b7 Solokuro Madya Timur",
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
      -6.912355,
      112.345788
    ],
    "polygon": [
      [
        -6.91217,
        112.34568
      ],
      [
        -6.91217,
        112.345895
      ],
      [
        -6.91254,
        112.345895
      ],
      [
        -6.91254,
        112.34568
      ]
    ]
  },
  {
    "id": "B4",
    "nodeId": "VS-B1-004",
    "name": "Blok B4 \u00b7 Sawah Solokuro Madya (Tengah-Sisi Jalan)",
    "shortName": "B4 \u00b7 Solokuro Madya Jalan",
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
      -6.912355,
      112.346003
    ],
    "polygon": [
      [
        -6.91217,
        112.345895
      ],
      [
        -6.91217,
        112.34611
      ],
      [
        -6.91254,
        112.34611
      ],
      [
        -6.91254,
        112.345895
      ]
    ]
  },
  {
    "id": "C1",
    "nodeId": "VS-C1-001",
    "name": "Blok C1 \u00b7 Sawah Solokuro Kidul (Selatan-Barat)",
    "shortName": "C1 \u00b7 Solokuro Kidul Barat",
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
      -6.912725,
      112.345358
    ],
    "polygon": [
      [
        -6.91254,
        112.34525
      ],
      [
        -6.91254,
        112.345465
      ],
      [
        -6.91291,
        112.345465
      ],
      [
        -6.91291,
        112.34525
      ]
    ]
  },
  {
    "id": "C2",
    "nodeId": "VS-C1-002",
    "name": "Blok C2 \u00b7 Sawah Solokuro Kidul (Selatan-Tengah 1)",
    "shortName": "C2 \u00b7 Solokuro Kidul Tengah",
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
      -6.912725,
      112.345573
    ],
    "polygon": [
      [
        -6.91254,
        112.345465
      ],
      [
        -6.91254,
        112.34568
      ],
      [
        -6.91291,
        112.34568
      ],
      [
        -6.91291,
        112.345465
      ]
    ]
  },
  {
    "id": "C3",
    "nodeId": "VS-C1-003",
    "name": "Blok C3 \u00b7 Sawah Solokuro Kidul (Selatan-Tengah 2)",
    "shortName": "C3 \u00b7 Solokuro Kidul Tengah",
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
      -6.912725,
      112.345788
    ],
    "polygon": [
      [
        -6.91254,
        112.34568
      ],
      [
        -6.91254,
        112.345895
      ],
      [
        -6.91291,
        112.345895
      ],
      [
        -6.91291,
        112.34568
      ]
    ]
  },
  {
    "id": "C4",
    "nodeId": "VS-C1-004",
    "name": "Blok C4 \u00b7 Sawah Solokuro Kidul (Selatan-Kelokan Jalan)",
    "shortName": "C4 \u00b7 Solokuro Kidul Kelokan",
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
      -6.912725,
      112.346003
    ],
    "polygon": [
      [
        -6.91254,
        112.345895
      ],
      [
        -6.91254,
        112.34611
      ],
      [
        -6.91291,
        112.34611
      ],
      [
        -6.91291,
        112.345895
      ]
    ]
  }
];
