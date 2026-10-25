# DATABASE_SCHEMA.md — Skema Database PostgreSQL & TimescaleDB

> **STATUS:** SUMBER KEBENARAN SKEMA PERSISTENSI BACKEND  
> Skema ini menggunakan PostgreSQL 15+ dengan ekstensi TimescaleDB aktif. Semua tabel dirancang untuk mendukung query deret waktu analitik berkecepatan tinggi serta pencatatan transaksional agronomis.

---

## 1. Diagram Relasi Entitas (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     fields      │◄──────┤      nodes      │       │ data_provenance │
│  (Metadata Lahan│       │(Perangkat Fisik)│       │ (Audit Dataset) │
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         ├─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   crop_cycles   │       │    telemetry    │       │   field_state   │
│ (Siklus Tanam)  │       │ (Hypertable TS) │       │(State Biofisik) │
└────────┬────────┘       └─────────────────┘       └─────────────────┘
         │                                                   │
         ▼                                                   ▼
┌─────────────────┐                                 ┌─────────────────┐
│fertilization_log│                                 │   predictions   │
│ (Catatan Pupuk) │                                 │  (Skor AVRI)    │
└─────────────────┘                                 └─────────────────┘
```

---

## 2. Definisi Tabel Transaksional & Relasional

### 2.1 `fields` (Petak Lahan Jagung)
Menyimpan profil petak lahan pertanian milik kelompok tani/petani binaan:
```sql
CREATE TABLE fields (
    field_id        VARCHAR(32) PRIMARY KEY,       -- contoh: "BLOK-A", "BLOK-B"
    name            VARCHAR(128) NOT NULL,         -- "Kebun Jagung Pak Suparman"
    owner_name      VARCHAR(128) NOT NULL,         -- "Suparman"
    owner_phone     VARCHAR(32) NOT NULL,          -- "+6281234567890" (untuk alert WA)
    village         VARCHAR(64) NOT NULL,          -- "Brondong, Lamongan"
    latitude        NUMERIC(10, 7) NOT NULL,
    longitude       NUMERIC(10, 7) NOT NULL,
    area_ha         NUMERIC(5, 2) NOT NULL,        -- luas dalam hektar
    soil_type       VARCHAR(64) DEFAULT 'clay_alkaline',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 `nodes` (Perangkat IoT Fisik)
Menyimpan data registrasi mikrokontroler ESP32 di lapangan:
```sql
CREATE TABLE nodes (
    node_id         VARCHAR(32) PRIMARY KEY,       -- contoh: "VS-A1-003"
    field_id        VARCHAR(32) REFERENCES fields(field_id) ON DELETE SET NULL,
    firmware_ver    VARCHAR(32) NOT NULL,          -- "v1.0.2-prod"
    battery_v       NUMERIC(4, 2),                 -- tegangan baterai terakhir
    installed_at    TIMESTAMPTZ DEFAULT NOW(),
    last_seen       TIMESTAMPTZ
);
```

### 2.3 `field_state` (State Vektor Digital Twin)
Menyimpan representasi kondisi tanah virtual per petak hasil pembaruan siklus 15 menit:
```sql
CREATE TABLE field_state (
    field_id        VARCHAR(32) PRIMARY KEY REFERENCES fields(field_id),
    updated_at      TIMESTAMPTZ NOT NULL,
    theta           NUMERIC(5, 2) NOT NULL,        -- kelembaban tanah (% VWC)
    t_soil          NUMERIC(4, 1) NOT NULL,        -- suhu tanah (°C)
    ph              NUMERIC(3, 2) NOT NULL,        -- derajat keasaman
    et0_today       NUMERIC(5, 2) DEFAULT 0.0,     -- akumulasi ET0 mm/hari
    dat             INTEGER DEFAULT 0,             -- umur tanaman (hari setelah tanam)
    last_urea_kg    NUMERIC(6, 2) DEFAULT 0.0      -- dosis pemupukan terakhir
);
```

### 2.4 `crop_cycles` (Dynamic DAT Tracker)
Menyimpan data fenologi siklus tanam aktif:
```sql
CREATE TABLE crop_cycles (
    cycle_id            VARCHAR(36) PRIMARY KEY,   -- UUID
    field_id            VARCHAR(32) REFERENCES fields(field_id),
    planting_date       DATE NOT NULL,             -- tanggal tanam awal
    corn_variety        VARCHAR(64) NOT NULL,      -- "Bisi-18", "Pioneer P27"
    target_yield_ton_ha NUMERIC(4, 2) DEFAULT 8.0,
    status              VARCHAR(24) DEFAULT 'active', -- 'active', 'harvested'
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 `fertilization_logs` (Catatan Pemupukan Riil)
Mencatat pelaksanaan aplikasi pupuk nyata di lapangan untuk evaluasi efisiensi:
```sql
CREATE TABLE fertilization_logs (
    log_id          VARCHAR(36) PRIMARY KEY,
    field_id        VARCHAR(32) REFERENCES fields(field_id),
    applied_at      TIMESTAMPTZ NOT NULL,
    stage_name      VARCHAR(32) NOT NULL,          -- 'Dasar (V3)', 'Susulan I (V8)'
    urea_kg         NUMERIC(6, 2) NOT NULL,
    npk_phonska_kg  NUMERIC(6, 2) NOT NULL,
    za_kg           NUMERIC(6, 2) DEFAULT 0.0,
    avri_at_time    NUMERIC(5, 2),                 -- skor AVRI saat penaburan dilakukan
    notes           TEXT
);
```

---

## 3. Hypertable Time-Series (TimescaleDB)

### 3.1 `telemetry` (Data Mentah Sensor)
Menyimpan jutaan baris deret waktu dengan partisi waktu otomatis per 7 hari:
```sql
CREATE TABLE telemetry (
    ts              TIMESTAMPTZ NOT NULL,
    node_id         VARCHAR(32) NOT NULL,
    moisture        NUMERIC(5, 2),                 -- % VWC
    soil_temp       NUMERIC(4, 1),                 -- Celsius
    ph              NUMERIC(3, 2),
    battery_v       NUMERIC(4, 2),
    rssi_dbm        INTEGER,
    is_predicted    BOOLEAN DEFAULT FALSE          -- true jika hasil imputasi failover
);

-- Konversi ke Hypertable TimescaleDB
SELECT create_hypertable('telemetry', 'ts', chunk_time_interval => INTERVAL '7 days');

-- Indeks komposit untuk agregasi cepat per node
CREATE INDEX idx_telemetry_node_ts ON telemetry (node_id, ts DESC);
```

### 3.2 `predictions` (Riwayat Prediksi AI)
```sql
CREATE TABLE predictions (
    ts              TIMESTAMPTZ NOT NULL,
    field_id        VARCHAR(32) NOT NULL,
    avri_score      NUMERIC(5, 2) NOT NULL,
    risk_class      VARCHAR(16) NOT NULL,          -- 'aman', 'waspada', 'kritis', 'bahaya'
    shap_values     JSONB,                         -- kontribusi fitur Explainable AI
    model_version   VARCHAR(32) NOT NULL
);

SELECT create_hypertable('predictions', 'ts', chunk_time_interval => INTERVAL '14 days');
CREATE INDEX idx_predictions_field_ts ON predictions (field_id, ts DESC);
```

---

## 4. Tabel Audit & Provenance

### 4.1 `data_provenance` (Bukti Keaslian Data BMKG untuk Juri)
```sql
CREATE TABLE data_provenance (
    dataset_id      VARCHAR(64) PRIMARY KEY,
    source_name     VARCHAR(128) NOT NULL,         -- "BMKG Stasiun Radin Inten II Lampung"
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    row_count       INTEGER NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,          -- integritas anti-manipulasi
    ingested_at     TIMESTAMPTZ DEFAULT NOW()
);
```
