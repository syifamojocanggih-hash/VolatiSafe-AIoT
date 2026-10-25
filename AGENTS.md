# AGENTS.md — Permanent Guidelines for VolatiSafe AIoT

> Permanent memory and mandatory rules for AI assistants and human developers working in the `VolatiSafe-AIoT` repository.

---

## 1. Git & Commit Message Conventions

- **Language:** **ENGLISH ONLY** for all Git commit messages. Do NOT use Indonesian in commit messages.
- **Format:** Conventional Commits standard:
  ```
  <type>(<scope>): <short imperative description>
  ```
  Examples:
  - `feat(ai): train residual lightgbm model with monotone constraints`
  - `fix(dt): resolve thermal lag calculation edge case`
  - `docs(universal): update API response envelope in INTERFACES.md`
  - `refactor(be): simplify ingestion message queue handler`
  - `test(ai): add unit test for zero time-series leakage`
- **Granularity:** One task = one logical commit. Do not bundle unrelated changes together.
- **Commit Trigger:** Commit only when the user explicitly requests or confirms a task is done.

---

## 2. Branching Strategy (Role-Based)

The repository uses a simple **1 Role = 1 Dedicated Branch** strategy:
- `main`: Protected production / final competition submission.
- `Development`: Staging integration branch where all role branches meet.
- `ai`: AI Engine, PIML LightGBM, TreeSHAP, Universal docs (PIC: Aris).
- `digittal-twin`: Soil biophysical modeling, FAO-56, BMKG replay (PIC: Andharu).
- `full-stack`: Backend FastAPI, TimescaleDB, Next.js PWA, Leaflet UI (PIC: Syifa).
- `iot`: ESP32 firmware, LoRa 433 MHz, Wokwi virtual testbed (PIC: Hafiiz).

---

## 3. Environment & Toolchain

- **Virtual Environment:** `./.venv/bin/python` (Python 3.11).
- **Test Suite:** `./.venv/bin/pytest` (configured in `pytest.ini` with `pythonpath = .`).
- **Installed Packages:** `numpy`, `pandas`, `scikit-learn`, `lightgbm`, `shap`, `matplotlib`, `pytest`.
- **Database (Local):** PostgreSQL 16 + TimescaleDB extension via Docker (`docker/docker-compose.yml`).
- **MQTT Broker:** Eclipse Mosquitto on port `1883`.
- **Frontend Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, PWA.

---

## 4. Single Source of Truth & Boundary Rules

- **API & Data Contracts:** `docs/universal/INTERFACES.md` is the **absolute single source of truth**. No developer or AI agent may modify contracts unilaterally in feature branches without an RFC.
- **Decision Records:** Every architectural choice must align with `docs/universal/DECISIONS.md` (ADR 001 - ADR 008).
- **Zero Cross-Domain Mutation:**
  - AI developer does NOT write direct database queries or firmware code.
  - IoT developer does NOT write Next.js frontend code or machine learning models.
  - Fullstack developer does NOT alter Arrhenius chemical kinetics or AI formulas.
  - Digital Twin developer does NOT modify the LightGBM ML booster.
- **Changelogs:** Technical task progression for the AI domain must be logged in `docs/ai/CHANGELOG.md`.

---

## 5. Communication

- Explanations and user chat: **Bahasa Indonesia** (per user profile).
- Code identifiers, variable names, and Git commit messages: **English**.
