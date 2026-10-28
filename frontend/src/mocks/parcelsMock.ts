import { BedengParcel, ParcelMapSummary, SurroundingParcel } from '@/types/parcel';

export const bluriOuterBoundary: [number, number][] = [
  [
    -6.902387490913456,
    112.428935093651
  ],
  [
    -6.902638978521811,
    112.4291244946952
  ],
  [
    -6.902744049584672,
    112.4293768160748
  ],
  [
    -6.902907635012112,
    112.4294517492886
  ],
  [
    -6.903149780853113,
    112.429514930166
  ],
  [
    -6.903466934368924,
    112.4298258820072
  ],
  [
    -6.903716732812466,
    112.4302433304525
  ],
  [
    -6.903795039808048,
    112.4304124543082
  ],
  [
    -6.903622454232885,
    112.4306109109733
  ],
  [
    -6.903493158575122,
    112.4306511649024
  ],
  [
    -6.903711249454332,
    112.4311932510838
  ],
  [
    -6.903215597781196,
    112.4314230651987
  ],
  [
    -6.903108414307278,
    112.431159560912
  ],
  [
    -6.903084822033064,
    112.430988870536
  ],
  [
    -6.903385440109569,
    112.4308769974687
  ],
  [
    -6.903315784148513,
    112.4306769893992
  ],
  [
    -6.90297688386421,
    112.430812203819
  ],
  [
    -6.902788215165149,
    112.430856619753
  ],
  [
    -6.902560045565461,
    112.4309862951754
  ],
  [
    -6.902316929149552,
    112.4309973253622
  ],
  [
    -6.902239214894442,
    112.4309258463116
  ],
  [
    -6.902130413826646,
    112.4306957744132
  ],
  [
    -6.902013015186149,
    112.430627619055
  ],
  [
    -6.901841349186837,
    112.4306960177925
  ],
  [
    -6.901786581768945,
    112.4304273225166
  ],
  [
    -6.901878471909425,
    112.4303342850708
  ],
  [
    -6.90195547771863,
    112.4302884377435
  ],
  [
    -6.902092345073013,
    112.430238389349
  ],
  [
    -6.902085268373915,
    112.4303373580679
  ],
  [
    -6.902277291778615,
    112.4301880678766
  ],
  [
    -6.902552390981873,
    112.4300712294296
  ],
  [
    -6.902590188562644,
    112.4299788659321
  ],
  [
    -6.902457562636589,
    112.4296401434008
  ],
  [
    -6.902586809925737,
    112.4295836515694
  ],
  [
    -6.902326825027706,
    112.4296425742987
  ],
  [
    -6.902371848108495,
    112.4294862153869
  ],
  [
    -6.902443845246498,
    112.4292277182406
  ],
  [
    -6.902352408368766,
    112.4291560518406
  ],
  [
    -6.902276639515416,
    112.4290195824858
  ],
  [
    -6.902387490913456,
    112.428935093651
  ]
];

export const bluriSurroundingParcels: SurroundingParcel[] = [];

export const initialMapSummary: ParcelMapSummary = {
  coordinatesText: '6°54\'10"S 112°25\'49"E',
  soilTypeText: 'Hamparan Lahan Pertanian Jagung (4 Kuadran Poligon KML · Aluvial Karst Subur pH 7.4)',
  gatewayDistanceKm: 0.08,
  totalAreaHa: 2.70,
  centerCoordinates: [-6.902683, 112.430223],
  gatewayCoordinates: [-6.90185, 112.4305],
  outerBoundary: bluriOuterBoundary,
  surroundingParcels: [],
  satelliteMetadata: {
    source: 'Google Earth KML 4-Zone Partition & Sentinel-2 MultiSpectral',
    resolution: '0.3m GSD High-Resolution Aerial Orthophoto',
    crs: 'EPSG:4326 (WGS84)',
    lastCapture: '2026-10-25T08:45:00Z',
    ndviMean: 0.74,
    ndwiMean: 0.31,
    cloudCoverPct: 1.8,
    spectralBands: ['B2 (Blue)', 'B3 (Green)', 'B4 (Red)', 'B8 (NIR)', 'B11 (SWIR)'],
  },
};

export const initialBedengParcels: BedengParcel[] = [
  {
    id: "A1",
    nodeId: "VS-A1-001",
    name: "Sektor 1 · Barat Laut (Zona Barat)",
    shortName: "Node 1 (A1)",
    areaHa: 0.75,
    cropVariety: "Bisi-18",
    moisturePct: 34.5,
    soilTempC: 28.4,
    ph: 7.22,
    batteryV: 4.12,
    batteryPct: 96,
    loraSignalDbm: -68,
    avriScore: 28,
    avriCategory: "aman",
    status: "online",
    telemetryMode: "LoRa Live Stream",
    prescription: "Kondisi Aman! Kelembaban optimal mendukung penyerapan urea ke perakaran.",
    center: [-6.902575, 112.429808],
    polygon: [
      [
        -6.902744,
        112.429377
      ],
      [
        -6.902639,
        112.429124
      ],
      [
        -6.902387,
        112.428935
      ],
      [
        -6.902277,
        112.42902
      ],
      [
        -6.902352,
        112.429156
      ],
      [
        -6.902444,
        112.429228
      ],
      [
        -6.902372,
        112.429486
      ],
      [
        -6.902327,
        112.429643
      ],
      [
        -6.902587,
        112.429584
      ],
      [
        -6.902458,
        112.42964
      ],
      [
        -6.90259,
        112.429979
      ],
      [
        -6.902552,
        112.430071
      ],
      [
        -6.902277,
        112.430188
      ],
      [
        -6.902085,
        112.430337
      ],
      [
        -6.902092,
        112.430238
      ],
      [
        -6.901955,
        112.430288
      ],
      [
        -6.901878,
        112.430334
      ],
      [
        -6.901826,
        112.430388
      ],
      [
        -6.902883,
        112.430388
      ],
      [
        -6.902883,
        112.429441
      ]
    ],
  },
  {
    id: "A2",
    nodeId: "VS-A1-002",
    name: "Sektor 2 · Timur Laut (Zona Utara)",
    shortName: "Node 2 (A2)",
    areaHa: 0.6,
    cropVariety: "Bisi-18",
    moisturePct: 26.1,
    soilTempC: 31.8,
    ph: 7.55,
    batteryV: 3.98,
    batteryPct: 88,
    loraSignalDbm: -71,
    avriScore: 52,
    avriCategory: "waspada",
    status: "online",
    telemetryMode: "LoRa Live Stream",
    prescription: "Waspada! Suhu tanah meningkat. Disarankan pemupukan sore hari atau dengan pembumbunan.",
    center: [-6.902409, 112.430636],
    polygon: [
      [
        -6.901787,
        112.430427
      ],
      [
        -6.901841,
        112.430696
      ],
      [
        -6.902013,
        112.430628
      ],
      [
        -6.90213,
        112.430696
      ],
      [
        -6.902239,
        112.430926
      ],
      [
        -6.902317,
        112.430997
      ],
      [
        -6.90256,
        112.430986
      ],
      [
        -6.902788,
        112.430857
      ],
      [
        -6.902883,
        112.430834
      ],
      [
        -6.902883,
        112.430388
      ],
      [
        -6.901826,
        112.430388
      ]
    ],
  },
  {
    id: "B1",
    nodeId: "VS-A1-003",
    name: "Sektor 3 · Barat Daya (Zona Selatan)",
    shortName: "Node 3 (B1)",
    areaHa: 0.69,
    cropVariety: "Bisi-18",
    moisturePct: 22.4,
    soilTempC: 34.1,
    ph: 7.83,
    batteryV: 3.92,
    batteryPct: 84,
    loraSignalDbm: -74,
    avriScore: 78,
    avriCategory: "kritis",
    status: "online",
    telemetryMode: "LoRa Live Stream",
    prescription: "KRITIS! Suhu terik & kelembaban rendah memicu penguapan amonia kilat. Tunda pemupukan!",
    center: [-6.903222, 112.430014],
    polygon: [
      [
        -6.903717,
        112.430243
      ],
      [
        -6.903467,
        112.429826
      ],
      [
        -6.90315,
        112.429515
      ],
      [
        -6.902908,
        112.429452
      ],
      [
        -6.902883,
        112.429441
      ],
      [
        -6.902883,
        112.430388
      ],
      [
        -6.903784,
        112.430388
      ]
    ],
  },
  {
    id: "B2",
    nodeId: "VS-A1-004",
    name: "Sektor 4 · Tenggara (Zona Timur)",
    shortName: "Node 4 (B2)",
    areaHa: 0.65,
    cropVariety: "Bisi-18",
    moisturePct: 36.2,
    soilTempC: 27.8,
    ph: 7.18,
    batteryV: 4.15,
    batteryPct: 98,
    loraSignalDbm: -65,
    avriScore: 22,
    avriCategory: "aman",
    status: "online",
    telemetryMode: "LoRa Live Stream",
    prescription: "Kondisi Ideal! Lembab cukup dan suhu sejuk. Waktu aplikasi pupuk sangat direkomendasikan.",
    center: [-6.903319, 112.430809],
    polygon: [
      [
        -6.902977,
        112.430812
      ],
      [
        -6.903316,
        112.430677
      ],
      [
        -6.903385,
        112.430877
      ],
      [
        -6.903085,
        112.430989
      ],
      [
        -6.903108,
        112.43116
      ],
      [
        -6.903216,
        112.431423
      ],
      [
        -6.903711,
        112.431193
      ],
      [
        -6.903493,
        112.430651
      ],
      [
        -6.903622,
        112.430611
      ],
      [
        -6.903795,
        112.430412
      ],
      [
        -6.903784,
        112.430388
      ],
      [
        -6.902883,
        112.430388
      ],
      [
        -6.902883,
        112.430834
      ]
    ],
  },
];

export const initialParcels = initialBedengParcels;
