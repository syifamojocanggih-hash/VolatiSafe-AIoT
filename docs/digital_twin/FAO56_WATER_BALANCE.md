# FAO56_WATER_BALANCE.md — Spesifikasi Neraca Air Tanah FAO-56 Penman-Monteith

> **KOMPONEN INTI DIGITAL TWIN VOLATISAFE AIoT**  
> **Penanggung Jawab:** Andharu Raffi (Andharu) — *Digital Twin Engineer*  
> **Modul Kode:** `digital_twin/water_balance.py`  
> **Standar Agronomi:** FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998)  

---

## 1. Prinsip Dasar & Tujuan
Kadar air tanah perakaran ($\theta$) adalah variabel penentu nomor satu dalam menahan laju penguapan gas amonia ($NH_3$). Jika tanah basah ($\theta \ge 35\%$), butiran Urea akan larut sempurna dan terdifusi ke perakaran jagung. Sebaliknya, jika tanah kering ($\theta \le 20\%$), reaksi hidrolisis enzim urease melepaskan amonia langsung ke udara bebas.

Modul ini memodelkan dinamika kadar air lapisan perakaran jagung ($Z_r$) secara kontinu berbasis neraca energi radiasi surya, aerodinamika hembusan angin, dan evapotranspirasi aktual tanaman.

---

## 2. Formulasi Evapotranspirasi Acuan ($ET_0$)

Persamaan kombinasi **FAO-56 Penman-Monteith** menghitung laju kehilangan air harian dari permukaan rumput acuan standar:

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \left(\frac{900}{T_{mean} + 273}\right) u_2 (e_s - e_a)}{\Delta + \gamma(1 + 0.34 u_2)}$$

### 2.1 Rincian Sub-Variabel:
1. **Tekanan Uap Jenuh ($e_s$):**
   $$e^0(T) = 0.6108 \cdot \exp\left(\frac{17.27 \cdot T}{T + 237.3}\right)$$
   $$e_s = \frac{e^0(T_{max}) + e^0(T_{min})}{2}$$
2. **Tekanan Uap Aktual ($e_a$):**
   $$e_a = e_s \cdot \left(\frac{RH_{mean}}{100}\right)$$
3. **Defisit Tekanan Uap Air (*Vapor Pressure Deficit / VPD*):**
   $$VPD = e_s - e_a \quad (\text{kPa})$$
4. **Kemiringan Kurva Tekanan Uap ($\Delta$):**
   $$\Delta = \frac{4098 \cdot \left[0.6108 \cdot \exp\left(\frac{17.27 \cdot T_{mean}}{T_{mean} + 237.3}\right)\right]}{(T_{mean} + 237.3)^2}$$
5. **Konstanta Psikrometrik ($\gamma$):**
   Untuk dataran rendah Lampung Tengah (ketinggian $z \approx 40\text{ m}$ dpl, tekanan atmosfer $P \approx 100.8\text{ kPa}$):
   $$\gamma = 0.000665 \cdot P \approx 0.0671 \quad (\text{kPa/}^\circ\text{C})$$
6. **Radiasi Netto ($R_n$):**
   Dihitung dari radiasi gelombang pendek surya ($R_s$) dikurangi pantulan albedo ($\alpha \approx 0.23$) dan radiasi gelombang panjang bersih ($R_{nl}$):
   $$R_n \approx 0.77 \cdot R_s - R_{nl}$$

---

## 3. Koefisien Tanaman Jagung ($K_c$) Dinamis

Evapotranspirasi aktual tanaman jagung ($ET_c$) dihitung dengan mengalikan $ET_0$ terhadap koefisien tanaman $K_c$ yang berubah mengikuti fase pertumbuhan (Days After Transplanting / $DAT$):

$$ET_c = K_c(DAT) \cdot ET_0$$

```
Kc Factor
1.2 ┤                           ╭─────────╮
1.0 ┤                          ╭╯         ╰╮
0.8 ┤                     ╭────╯           ╰╮
0.6 ┤                ╭────╯                 ╰────╮
0.4 ┤ ───────╭───────╯                           ╰──────
0.2 ┤
    └────────┬───────────┬────────────┬──────────┬────── DAT
    0 (VE)   14 (V3)     35 (V8)      65 (VT)    105 (R6)
```

| Fase Fenologi | Rentang $DAT$ | Nilai $K_c$ | Kedalaman Akar ($Z_r$) | Keterangan Agronomi |
|---|---|---|---|---|
| **Perkecambahan (VE–V2)** | $0 - 14$ HST | $0.40$ | $0.15\text{ m}$ (15 cm) | Penguapan didominasi evaporasi tanah |
| **Vegetatif Cepat (V3–V8)** | $15 - 35$ HST | $0.80$ | $0.30\text{ m}$ (30 cm) | Pertumbuhan tajuk daun pesat |
| **Pembungaan & Malai (VT–R1)**| $36 - 65$ HST | $1.15$ | $0.50\text{ m}$ (50 cm) | Konsumsi air & hara nitrogen puncak |
| **Pengisian Biji (R2–R4)** | $66 - 85$ HST | $1.05$ | $0.60\text{ m}$ (60 cm) | Translokasi karbohidrat ke tongkol |
| **Pemasakan Akhir (R5–R6)** | $86 - 105$ HST | $0.60$ | $0.60\text{ m}$ (60 cm) | Daun mulai mengering alami (*senescence*) |

---

## 4. Persamaan Pemutakhiran Kadar Air Tanah ($\theta$)

Perubahan kadar air volumetrik tanah ($\Delta \theta$ dalam % VWC) per interval waktu $\Delta t$ dihitung melalui neraca massa lapisan perakaran:

$$\Delta \theta = \frac{P_{eff} - ET_c - DRAIN}{Z_r \cdot 1000} \cdot 100\%$$

### 4.1 Parameter Pembatas:
1. **Curah Hujan Efektif ($P_{eff}$):**
   Fraksi air hujan yang menembus kanopi dan meresap ke tanah (tidak terbuang sebagai limpasan permukaan / *runoff*):
   - Jika curah hujan $P \le 5\text{ mm}$, maka $P_{eff} = 0.7 \cdot P$ (sebagian tertahan di kanopi).
   - Jika curah hujan $P > 5\text{ mm}$, maka $P_{eff} = 0.85 \cdot P - 2.0$.
2. **Titik Layu Permanen ($\theta_{wp}$):**
   Batas bawah kelembaban tanah di mana akar tidak mampu lagi menyerap air. Diturunkan dari data BBSDLP Kementan & ISRIC SoilGrids menggunakan Pedotransfer Function Saxton & Rawls (2006) (lihat rincian di [`SOIL_BASELINE_DATA.md`](SOIL_BASELINE_DATA.md)):
   * Tanah Karst Lamongan: $\theta_{wp} = 13.8\%$.
   * Tanah Ultisol Lampung: $\theta_{wp} = 11.5\%$.
3. **Kapasitas Lapang ($\theta_{fc}$):**
   Batas atas kelembaban tanah optimal setelah kelebihan air gravitasi mengalir habis:
   * Tanah Karst Lamongan: $\theta_{fc} = 39.5\%$.
   * Tanah Ultisol Lampung: $\theta_{fc} = 36.2\%$.
4. **Drainase Gravitasi ($DRAIN$):**
   Jika $\theta > \theta_{fc}$, kelebihan air akan terbuang sebagai perkolasi dalam waktu 24 jam:
   $$DRAIN = \max\Big(0.0, \; (\theta - \theta_{fc}) \cdot Z_r \cdot 1000\Big)$$

### 4.2 Pembaruan State Akhir:
$$\theta(t+1) = \text{clamp}\Big(\theta(t) + \Delta \theta, \; \theta_{wp}, \; \theta_{fc}\Big)$$

---

## 5. Contoh Implementasi Python (`digital_twin/water_balance.py`)

```python
import math

class FAO56WaterBalance:
    def __init__(self, elevation_m: float = 40.0):
        self.elevation_m = elevation_m
        # Tekanan atmosfer rata-rata (kPa)
        self.atm_pressure = 101.3 * math.pow((293.0 - 0.0065 * elevation_m) / 293.0, 5.26)
        # Konstanta psikrometrik gamma (kPa/C)
        self.gamma = 0.000665 * self.atm_pressure
        self.theta_wp = 12.0   # Wilting point (%)
        self.theta_fc = 42.0   # Field capacity (%)

    def calculate_et0(self, temp_c: float, humidity_rh: float, wind_speed_ms: float, solar_rad_mj: float) -> float:
        """Menghitung ET0 Penman-Monteith (mm/hari)."""
        # Tekanan uap jenuh (kPa)
        es = 0.6108 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
        # Tekanan uap aktual (kPa)
        ea = es * (humidity_rh / 100.0)
        # Kemiringan kurva delta (kPa/C)
        delta = (4098.0 * es) / math.pow(temp_c + 237.3, 2)
        # Radiasi netto Rn (perkiraan albedo 0.23)
        rn = 0.77 * solar_rad_mj * 0.408

        numerator = 0.408 * delta * rn + self.gamma * (900.0 / (temp_c + 273.0)) * wind_speed_ms * (es - ea)
        denominator = delta + self.gamma * (1.0 + 0.34 * wind_speed_ms)
        et0 = numerator / denominator
        return max(0.0, et0)

    def get_kc_and_root_depth(self, dat: int) -> tuple[float, float]:
        """Mengembalikan koefisien Kc dan kedalaman perakaran Zr (meter)."""
        if dat <= 14:
            return 0.40, 0.15
        elif dat <= 35:
            # Interpolasi linier fase vegetatif
            frac = (dat - 14) / (35 - 14)
            return 0.40 + frac * (0.80 - 0.40), 0.15 + frac * 0.15
        elif dat <= 65:
            return 1.15, 0.50
        elif dat <= 85:
            return 1.05, 0.60
        else:
            return 0.60, 0.60

    def update_soil_moisture(self, current_theta: float, dat: int, et0_daily: float, rain_mm: float, interval_hours: float = 0.25) -> tuple[float, float]:
        """Memperbarui kadar air tanah untuk interval waktu tertentu (default: 15 menit = 0.25 jam)."""
        kc, zr = self.get_kc_and_root_depth(dat)
        # ETc untuk interval waktu
        etc_interval = (kc * et0_daily) * (interval_hours / 24.0)
        
        # Hujan efektif untuk interval
        p_eff = max(0.0, rain_mm * 0.8)
        
        # Perubahan kadar air volumetrik (%)
        delta_theta = ((p_eff - etc_interval) / (zr * 1000.0)) * 100.0
        new_theta = max(self.theta_wp, min(self.theta_fc, current_theta + delta_theta))
        return new_theta, etc_interval
```

---

## 6. Kriteria Validasi Unit Test

1. **Uji Nilai Ekstrem:** Nilai $ET_0$ pada suhu 34°C, angin 3 m/s, RH 40%, dan radiasi $22\text{ MJ/m}^2$ harus berada di rentang **$5.0 - 7.5\text{ mm/hari}$** (wajar untuk iklim tropis terik).
2. **Uji Penyerapan Air:** Pada kondisi tanpa hujan selama 48 jam berturut-turut pada fase pembungaan ($K_c = 1.15$), kadar air tanah $\theta$ harus mengalami penurunan kontinu rata-rata $2.5\% - 4.0\%$ per hari.
