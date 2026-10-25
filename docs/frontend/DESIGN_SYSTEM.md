# DESIGN_SYSTEM.md — Sistem Desain & Token Visual VolatiSafe AIoT

---

## 1. Filosofi Desain: *High-Contrast Agritech*

Antarmuka VolatiSafe dirancang khusus untuk kondisi penggunaan nyata di lapangan:
- **Keterbacaan di Bawah Terik Matahari (*Outdoor Readability*):** Menggunakan kontras warna tinggi (rasio kontras WCAG AAA ≥ 7:1) agar layar tetap terbaca saat petani berdiri di ladang jagung.
- **Ukuran Sentuh Ergonomis (*Farmer Ergonomics*):** Target sentuh tombol minimal **44 × 44 px** dengan jarak antar-elemen yang cukup agar mudah ditekan saat tangan petani berdebu atau basah.
- **Kejelasan Status Seketika (*Instant Cognitive Clarity*):** Menggunakan warna universal rambu bahaya agar petani dapat memahami status risiko dalam waktu kurang dari 3 detik.

---

## 2. Token Warna Status Risiko AVRI (Core Semantic Tokens)

Empat status risiko volatilisasi menggunakan palet warna terstandar di seluruh UI:

| Status Risiko | Rentang AVRI | Warna Utama (Hex) | Background Kartu | Warna Border | Tailwind Class |
|---|---|---|---|---|---|
| **Aman** | 0 – 30% | `#16A34A` (Emerald 600) | `#DCFCE7` (Emerald 100) | `#86EFAC` | `bg-emerald-50 text-emerald-800 border-emerald-300` |
| **Waspada** | 31 – 60% | `#CA8A04` (Yellow 600) | `#FEF9C3` (Yellow 100) | `#FDE047` | `bg-yellow-50 text-yellow-800 border-yellow-300` |
| **Kritis** | 61 – 80% | `#EA580C` (Orange 600) | `#FFEDD5` (Orange 100) | `#FDBA74` | `bg-orange-50 text-orange-800 border-orange-300` |
| **Bahaya** | 81 – 100% | `#DC2626` (Red 600) | `#FEE2E2` (Red 100) | `#FCA5A5` | `bg-red-50 text-red-800 border-red-300` |

---

## 3. Palet Warna Netral & Brand

```css
:root {
  /* Brand Primary: Hijau Daun Jagung Sehat */
  --color-primary-50: #ECFDF5;
  --color-primary-500: #10B981;
  --color-primary-700: #047857;

  /* Background & Surface */
  --color-bg-app: #F8FAFC;        /* Slate 50 */
  --color-surface-card: #FFFFFF;  /* Pure White */
  --color-surface-muted: #F1F5F9; /* Slate 100 */

  /* Text Typography */
  --color-text-main: #0F172A;     /* Slate 900 (High Contrast) */
  --color-text-muted: #475569;    /* Slate 600 */
}
```

---

## 4. Tipografi

- **Font Keluarga Utama:** `Plus Jakarta Sans` atau `Inter` (sans-serif modern, terbaca jelas di resolusi rendah).
- **Skala Ukuran Teks:**
  - `Hero Metric / Skor AVRI`: 48px – 64px (Font-weight: 800 ExtraBold).
  - `Judul Layanan / H1`: 24px – 28px (Font-weight: 700 Bold).
  - `Subjudul / H2`: 18px – 20px (Font-weight: 600 SemiBold).
  - `Teks Isi / Panduan`: 15px – 16px (Font-weight: 400 Regular / Line-height: 1.5).
  - `Keterangan / Badge`: 12px – 13px (Font-weight: 600 SemiBold).

---

## 5. Komponen Status Badge & Banner

Setiap kali skor AVRI ditampilkan, wajib menyertakan:
1. Ikon penanda visual (🟢, 🟡, 🟠, 🔴) untuk penderita buta warna.
2. Label teks tegas (AMAN, WASPADA, KRITIS, BAHAYA).
3. Angka persentase skor AVRI.
