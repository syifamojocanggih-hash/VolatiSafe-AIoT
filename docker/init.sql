-- =========================================================================
-- DATABASE INITIALIZATION SCRIPT FOR VOLATISAFE AIOT
-- Reference: docs/backend/DATABASE_SCHEMA.md
-- =========================================================================

-- 1. Enable TimescaleDB Extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Create Master Tables
CREATE TABLE IF NOT EXISTS fields (
    field_id        VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(128) NOT NULL,
    owner_name      VARCHAR(128) NOT NULL,
    owner_phone     VARCHAR(32) NOT NULL,
    village         VARCHAR(64) NOT NULL,
    latitude        NUMERIC(10, 7) NOT NULL,
    longitude       NUMERIC(10, 7) NOT NULL,
    area_ha         NUMERIC(5, 2) NOT NULL,
    soil_type       VARCHAR(64) DEFAULT 'clay_alkaline',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nodes (
    node_id         VARCHAR(32) PRIMARY KEY,
    field_id        VARCHAR(32) REFERENCES fields(field_id) ON DELETE SET NULL,
    firmware_ver    VARCHAR(32) NOT NULL,
    battery_v       NUMERIC(4, 2),
    installed_at    TIMESTAMPTZ DEFAULT NOW(),
    last_seen       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS field_state (
    field_id        VARCHAR(32) PRIMARY KEY REFERENCES fields(field_id),
    updated_at      TIMESTAMPTZ NOT NULL,
    theta           NUMERIC(5, 2) NOT NULL,
    t_soil          NUMERIC(4, 1) NOT NULL,
    ph              NUMERIC(3, 2) NOT NULL,
    et0_today       NUMERIC(5, 2) DEFAULT 0.0,
    dat             INTEGER DEFAULT 0,
    last_urea_kg    NUMERIC(6, 2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS crop_cycles (
    cycle_id            VARCHAR(36) PRIMARY KEY,
    field_id            VARCHAR(32) REFERENCES fields(field_id),
    planting_date       DATE NOT NULL,
    corn_variety        VARCHAR(64) NOT NULL,
    target_yield_ton_ha NUMERIC(4, 2) DEFAULT 8.0,
    status              VARCHAR(24) DEFAULT 'active',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fertilization_logs (
    log_id          VARCHAR(36) PRIMARY KEY,
    field_id        VARCHAR(32) REFERENCES fields(field_id),
    applied_at      TIMESTAMPTZ NOT NULL,
    stage_name      VARCHAR(32) NOT NULL,
    urea_kg         NUMERIC(6, 2) NOT NULL,
    npk_phonska_kg  NUMERIC(6, 2) NOT NULL,
    za_kg           NUMERIC(6, 2) DEFAULT 0.0,
    avri_at_time    NUMERIC(5, 2),
    notes           TEXT
);

-- 3. Create Hypertables (TimescaleDB)
CREATE TABLE IF NOT EXISTS telemetry (
    ts              TIMESTAMPTZ NOT NULL,
    node_id         VARCHAR(32) NOT NULL,
    moisture        NUMERIC(5, 2),
    soil_temp       NUMERIC(4, 1),
    ph              NUMERIC(3, 2),
    battery_v       NUMERIC(4, 2),
    rssi_dbm        INTEGER,
    is_predicted    BOOLEAN DEFAULT FALSE
);

SELECT create_hypertable('telemetry', 'ts', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_telemetry_node_ts ON telemetry (node_id, ts DESC);

CREATE TABLE IF NOT EXISTS predictions (
    ts              TIMESTAMPTZ NOT NULL,
    field_id        VARCHAR(32) NOT NULL,
    avri_score      NUMERIC(5, 2) NOT NULL,
    risk_class      VARCHAR(16) NOT NULL,
    shap_values     JSONB,
    model_version   VARCHAR(32) NOT NULL
);

SELECT create_hypertable('predictions', 'ts', chunk_time_interval => INTERVAL '14 days', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_predictions_field_ts ON predictions (field_id, ts DESC);

-- 4. Audit & Provenance Table
CREATE TABLE IF NOT EXISTS data_provenance (
    dataset_id      VARCHAR(64) PRIMARY KEY,
    source_name     VARCHAR(128) NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    row_count       INTEGER NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    ingested_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. SEED INITIAL DATA (MOCK_DATA.md & INTERFACES.md)
-- =========================================================================

-- Seed Fields
INSERT INTO fields (field_id, name, owner_name, owner_phone, village, latitude, longitude, area_ha, soil_type)
VALUES 
    ('BLOK-A', 'Kebun Jagung Pak Suparman · Blok A', 'Pak Suparman', '+6281234567890', 'Solokuro, Lamongan', -6.9123456, 112.3456789, 0.75, 'clay_alkaline'),
    ('BLOK-B', 'Kebun Jagung Pak Kasno · Blok B', 'Pak Kasno', '+6281234567891', 'Solokuro, Lamongan', -6.9130000, 112.3460000, 1.20, 'clay_alkaline')
ON CONFLICT (field_id) DO NOTHING;

-- Seed Nodes
INSERT INTO nodes (node_id, field_id, firmware_ver, battery_v, last_seen)
VALUES 
    ('VS-A1-003', 'BLOK-A', 'v1.0.2-prod', 3.87, '2026-10-24 16:00:00Z'),
    ('VS-A2-001', 'BLOK-B', 'v1.0.2-prod', 3.95, '2026-10-24 16:00:00Z')
ON CONFLICT (node_id) DO NOTHING;

-- Seed Field State
INSERT INTO field_state (field_id, updated_at, theta, t_soil, ph, et0_today, dat, last_urea_kg)
VALUES 
    ('BLOK-A', '2026-10-24 16:00:00Z', 22.4, 34.1, 7.83, 0.0, 32, 0.0)
ON CONFLICT (field_id) DO NOTHING;

-- Seed Crop Cycle
INSERT INTO crop_cycles (cycle_id, field_id, planting_date, corn_variety, target_yield_ton_ha, status)
VALUES 
    ('CYC-2026-001', 'BLOK-A', '2026-09-22', 'BISI-18', 8.0, 'active')
ON CONFLICT (cycle_id) DO NOTHING;

-- Seed Historical Telemetry (24h)
INSERT INTO telemetry (ts, node_id, moisture, soil_temp, ph, battery_v, is_predicted)
VALUES
    ('2026-10-24 00:00:00Z', 'VS-A1-003', 25.1, 26.2, 7.81, 3.90, FALSE),
    ('2026-10-24 03:00:00Z', 'VS-A1-003', 24.8, 25.4, 7.81, 3.89, FALSE),
    ('2026-10-24 06:00:00Z', 'VS-A1-003', 24.5, 26.8, 7.82, 3.89, FALSE),
    ('2026-10-24 09:00:00Z', 'VS-A1-003', 23.7, 31.0, 7.82, 3.92, FALSE),
    ('2026-10-24 12:00:00Z', 'VS-A1-003', 22.8, 34.6, 7.83, 3.94, FALSE),
    ('2026-10-24 14:00:00Z', 'VS-A1-003', 22.5, 34.8, 7.83, 3.91, FALSE),
    ('2026-10-24 15:00:00Z', 'VS-A1-003', 22.4, 34.3, 7.83, 3.88, FALSE),
    ('2026-10-24 16:00:00Z', 'VS-A1-003', 22.4, 34.1, 7.83, 3.87, FALSE)
ON CONFLICT DO NOTHING;

-- Seed Prediction History
INSERT INTO predictions (ts, field_id, avri_score, risk_class, shap_values, model_version)
VALUES
    ('2026-10-24 16:00:00Z', 'BLOK-A', 74.0, 'kritis', 
     '[{"feature": "soil_temp_c", "impact_pct": 38.5, "direction": "increases_risk"}, {"feature": "moisture_pct", "impact_pct": 26.0, "direction": "increases_risk"}, {"feature": "ph", "impact_pct": 9.7, "direction": "increases_risk"}]'::jsonb,
     'piml-lgbm-v1.2')
ON CONFLICT DO NOTHING;

-- Seed Data Provenance
INSERT INTO data_provenance (dataset_id, source_name, period_start, period_end, row_count, checksum_sha256)
VALUES 
    ('BMKG-LAMPUNG-2026-10', 'BMKG Stasiun Klimatologi Lampung', '2026-10-01', '2026-10-24', 2304, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
ON CONFLICT (dataset_id) DO NOTHING;
