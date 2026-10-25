# THERMAL_DIFFUSION.md — Model Difusi Termal Tanah Teredam

> **KOMPONEN INTI DIGITAL TWIN VOLATISAFE AIoT**  
> **Penanggung Jawab:** Andharu Raffi (Andharu) — *Digital Twin Engineer*  
> **Modul Kode:** `digital_twin/thermal_diffusion.py`  
> **Landasan Fisika:** Persamaan Konduksi Panas 1D Fourier & Redaman Inersia Termal Tanah  

---

## 1. Urgensi Ilmiah: Mengapa Suhu Tanah Menentukan Penguapan Amonia?
Suhu permukaan tanah ($T_{soil}$ pada kedalaman 5 cm) adalah penggerak utama aktivitas enzim *urease*. Berdasarkan **Persamaan Kinetika Arrhenius**:
$$k_{urease}(T) = A \cdot \exp\left(-\frac{E_a}{R(T + 273.15)}\right)$$
Setiap kenaikan suhu tanah sebesar $10^\circ\text{C}$ (dari $25^\circ\text{C}$ ke $35^\circ\text{C}$), laju pemecahan Urea menjadi gas amonia **melonjak lebih dari 2.2 kali lipat ($Q_{10} \approx 2.2$)**.

Namun, suhu tanah tidak berfluktuasi secara instan mengikuti suhu udara. Lapisan tanah memiliki **inersia termal (*thermal damping & phase lag*)**:
* Puncak suhu udara siang hari biasanya terjadi pada pukul **12.30 – 13.00 WIB**.
* Puncak suhu tanah di zona perakaran (5–10 cm) baru tercapai pada pukul **14.00 – 14.30 WIB** (mengalami penundaan waktu 60–90 menit).

Modul ini memodelkan perambatan termal tersebut agar Digital Twin mampu memprediksi suhu tanah secara presisi, bahkan saat sensor fisik mengalami *dropout*.

---

## 2. Formulasi Difusi Termal 1 Dimensi

Perambatan panas ke dalam profil tanah diatur oleh persamaan diferensial konduksi panas 1D:

$$\frac{\partial T}{\partial t} = \kappa(\theta) \cdot \frac{\partial^2 T}{\partial z^2}$$

Di mana:
* $T$: Suhu tanah pada kedalaman $z$ (°C).
* $t$: Waktu (detik / jam).
* $z$: Kedalaman profil tanah ($z = 0.05\text{ m}$ untuk zona penempatan pupuk).
* $\kappa(\theta)$: Difusivitas termal tanah ($\text{m}^2/\text{s}$), yang merupakan fungsi dinamis dari kadar air tanah $\theta$.

### 2.1 Diskretisasi Model State-Space (Langkah Waktu 15 Menit)
Untuk eksekusi ringan (*lightweight*) di edge gateway maupun server backend, persamaan kontinu di atas didiskretisasi ke dalam bentuk beda hingga (*finite difference*) orde satu:

$$T_{soil}(t+1) = T_{soil}(t) + \alpha(\theta) \cdot \Big(T_{air}(t) - T_{soil}(t)\Big) + \beta \cdot R_s(t)$$

Di mana:
* $T_{soil}(t)$: Estimasi suhu tanah saat ini pada kedalaman 5 cm (°C).
* $T_{air}(t)$: Suhu udara ambien dari stasiun cuaca BMKG (°C).
* $R_s(t)$: Radiasi surya langsung yang memanaskan permukaan ($\text{MJ/m}^2/\text{jam}$).
* $\alpha(\theta)$: Koefisien konduktivitas termal dinamis ($0.05 \le \alpha \le 0.35$).
* $\beta$: Faktor pemanasan langsung radiasi permukaan ($\approx 0.15^\circ\text{C}/(\text{MJ/m}^2)$).

---

## 3. Dinamika Konduktivitas Termal $\alpha(\theta)$ terhadap Kelembaban

Air memiliki kapasitas panas jenis ($c_w \approx 4.184\text{ J/g}\cdot^\circ\text{C}$) yang jauh lebih tinggi daripada partikel mineral tanah kering ($c_s \approx 0.8\text{ J/g}\cdot^\circ\text{C}$). Oleh karena itu:
* **Tanah Basah ($\theta \ge 35\%$):** Memiliki kapasitas penahan panas tinggi. Suhu tanah stabil, sulit naik dan lambat turun ($\alpha \approx 0.10$).
* **Tanah Kering ($\theta \le 18\%$):** Memiliki kapasitas panas rendah. Begitu matahari terik, tanah langsung memanas cepat seperti wajan penggorengan ($\alpha \approx 0.28$).

### Formulasi Matematis Koefisien $\alpha(\theta)$:
$$\alpha(\theta) = \alpha_{dry} - \left(\frac{\theta - \theta_{wp}}{\theta_{fc} - \theta_{wp}}\right) \cdot (\alpha_{dry} - \alpha_{wet})$$

Dengan parameter kalibrasi tanah sentra jagung (Lampung Tengah & Lamongan):
* $\alpha_{dry} = 0.28$ (Kondisi kering kemarau)
* $\alpha_{wet} = 0.10$ (Kondisi kapasitas lapang basah)
* $\theta_{wp} = 12.0\%$ (Titik layu)
* $\theta_{fc} = 42.0\%$ (Kapasitas lapang)

---

## 4. Contoh Implementasi Python (`digital_twin/thermal_diffusion.py`)

```python
class SoilThermalDiffusionModel:
    def __init__(self, depth_cm: float = 5.0):
        self.depth_cm = depth_cm
        self.alpha_dry = 0.28
        self.alpha_wet = 0.10
        self.theta_wp = 12.0
        self.theta_fc = 42.0
        self.rad_factor = 0.12  # Pemanasan tambahan radiasi surya langsung

    def get_alpha(self, moisture_pct: float) -> float:
        """Menghitung koefisien konduktivitas termal berbasis kelembaban tanah."""
        moist_clamped = max(self.theta_wp, min(self.theta_fc, moisture_pct))
        saturation_fraction = (moist_clamped - self.theta_wp) / (self.theta_fc - self.theta_wp)
        alpha = self.alpha_dry - saturation_fraction * (self.alpha_dry - self.alpha_wet)
        return alpha

    def step(self, current_t_soil: float, t_air: float, moisture_pct: float, solar_rad_mj_per_hour: float, dt_hours: float = 0.25) -> float:
        """
        Memperbarui estimasi suhu tanah untuk interval dt_hours (default 15 menit = 0.25 jam).
        """
        alpha = self.get_alpha(moisture_pct)
        # Efek selisih suhu udara terhadap inersia tanah
        delta_temp = alpha * (t_air - current_t_soil) * (dt_hours / 0.25)
        # Efek radiasi surya permukaan (hanya aktif siang hari saat t_air > 25C)
        solar_boost = self.rad_factor * solar_rad_mj_per_hour * dt_hours if t_air > 25.0 else 0.0
        
        updated_t_soil = current_t_soil + delta_temp + solar_boost
        # Batasan fisik tanah terbuka tropis (10°C - 50°C)
        return max(10.0, min(50.0, updated_t_soil))
```

---

## 5. Kriteria Validasi Ilmiah (Quality Gates)

Modul `thermal_diffusion.py` wajib lolos pengujian simulasi deret waktu 24 jam dengan kriteria:
1. **Fase Tunda (*Phase Lag Test*):** Saat kurva suhu udara $T_{air}$ mencapai puncak pada pukul 12.30 WIB (misal: 35.0°C), puncak kurva suhu tanah $T_{soil}$ pada kedalaman 5 cm harus jatuh di antara pukul **13.30 – 14.30 WIB**.
2. **Redaman Amplitudo (*Amplitude Damping Test*):** Fluktuasi suhu tanah harian ($\Delta T_{soil} = T_{max} - T_{min}$) harus lebih kecil $30\% - 40\%$ dibandingkan fluktuasi suhu udara ($\Delta T_{air}$).
3. **Stabilitas Numerik:** Tidak ada lonjakan suhu (*oscillating spike*) yang melebihi $1.5^\circ\text{C}$ per interval 15 menit.
