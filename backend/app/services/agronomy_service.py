from datetime import datetime, date, timedelta, timezone
import uuid
from typing import Dict, Any, List
from app.schemas.agronomy import (
    FertilizerBlendRequestDTO,
    FertilizerBlendResponseDTO,
    PureNutrientsDTO,
    CommercialBlendDTO,
    PracticalUnitsDTO,
    CropCycleCreateDTO,
    CropCycleResponseDTO,
    CropMilestoneDTO,
    GanttPhaseDTO
)

class AgronomyService:
    """
    Kalkulator Racikan Pupuk Majemuk sesuai Permentan No. 40/2007 & Balitbangtan
    dan Pelacak Fenologi Siklus Tanam Jagung (DAT).
    """

    @classmethod
    def calculate_blend(cls, req: FertilizerBlendRequestDTO) -> FertilizerBlendResponseDTO:
        area = req.field_area_ha
        dat = req.crop_phase_dat
        yield_target = req.target_yield_ton_ha
        
        # Penentuan fase aplikasi
        if dat <= 15:
            stage_name = "Pemupukan Dasar (Fase V3 - Umur 10–15 HST)"
            # Kebutuhan per ha: Phonska 150 kg, Urea 50 kg
            urea_base = 50.0 * (area / 1.0) * (yield_target / 8.0)
            npk_base = 150.0 * (area / 1.0) * (yield_target / 8.0)
            za_base = 0.0
            instruction_note = "Tabur di samping benih berjarak 5 cm, tutup dengan tanah tipis."
        elif dat <= 40:
            stage_name = "Pemupukan Susulan I (Fase V8 - Umur 28–35 HST)"
            # Kebutuhan per ha: Urea 100 kg, Phonska 100 kg
            urea_base = 100.0 * (area / 1.0) * (yield_target / 8.0)
            npk_base = 100.0 * (area / 1.0) * (yield_target / 8.0)
            za_base = 0.0
            instruction_note = "Tabur di samping rumpun jagung berjarak 7–10 cm saat tanah lembap."
        else:
            stage_name = "Pemupukan Susulan II (Fase V12/Bunting - Umur 45–55 HST)"
            # Kebutuhan per ha: Urea 100 kg, ZA 25 kg
            urea_base = 100.0 * (area / 1.0) * (yield_target / 8.0)
            npk_base = 50.0 * (area / 1.0) * (yield_target / 8.0)
            za_base = 25.0 * (area / 1.0) * (yield_target / 8.0)
            instruction_note = "Tabur di antara larikan tanaman sebelum pembungaan serbuk sari."

        urea_kg = round(urea_base, 1)
        npk_kg = round(npk_base, 1)
        za_kg = round(za_base, 1)

        # Hitung hara murni (N, P2O5, K2O)
        # Urea: 46% N
        # NPK Phonska 15-15-15: 15% N, 15% P2O5, 15% K2O
        # ZA: 21% N
        pure_n = round((urea_kg * 0.46) + (npk_kg * 0.15) + (za_kg * 0.21), 1)
        pure_p = round(npk_kg * 0.15, 1)
        pure_k = round(npk_kg * 0.15, 1)

        # Konversi ke unit praktis petani
        sacks_urea = round(urea_kg / 50.0, 1)
        sacks_npk = round(npk_kg / 50.0, 1)
        total_kg = urea_kg + npk_kg + za_kg
        buckets_8kg = int(round(total_kg / 8.0))

        # Format pecahan teks karung (misal 1.5 -> 1½)
        def format_sacks(val: float) -> str:
            if val == 1.5:
                return "1½"
            if val == 0.5:
                return "½"
            if val == 2.5:
                return "2½"
            return f"{val:.1f}".rstrip('0').rstrip('.')

        instruction_text = (
            f"Campurkan {format_sacks(sacks_urea)} karung Urea dengan {format_sacks(sacks_npk)} karung Phonska 15-15-15, "
            f"setara {buckets_8kg} ember takar 8 kg. {instruction_note}"
        )

        recommendation_date = (date.today() + timedelta(days=2)).isoformat()

        return FertilizerBlendResponseDTO(
            application_stage=stage_name,
            recommendation_date=recommendation_date,
            pure_nutrients_kg=PureNutrientsDTO(
                nitrogen_n=pure_n,
                phosphate_p2o5=pure_p,
                potassium_k2o=pure_k
            ),
            commercial_blend_kg=CommercialBlendDTO(
                urea_kg=urea_kg,
                npk_phonska_kg=npk_kg,
                za_kg=za_kg
            ),
            practical_units=PracticalUnitsDTO(
                urea_sacks_50kg=sacks_urea,
                npk_sacks_50kg=sacks_npk,
                bucket_measure_8kg=buckets_8kg,
                instruction_text=instruction_text
            )
        )

    @classmethod
    def calculate_crop_cycle(cls, req: CropCycleCreateDTO) -> CropCycleResponseDTO:
        try:
            p_date = datetime.strptime(req.planting_date, "%Y-%m-%d").date()
        except ValueError:
            p_date = date.today()

        today = date.today()
        # Jika tanggal tanam di masa lalu, hitung selisih hari aktual. Jika masa depan, DAT = 0
        diff_days = (today - p_date).days
        current_dat = max(0, diff_days)

        # Durasi hidup total berdasarkan varietas benih
        seed_lower = req.seed_variety.lower()
        if "nk" in seed_lower or "212" in seed_lower:
            total_duration = 100
        elif "pioneer" in seed_lower or "p27" in seed_lower:
            total_duration = 110
        else:
            total_duration = 105

        if current_dat <= 7:
            stage = "Fase Perkecambahan (VE)"
        elif current_dat <= 20:
            stage = "Fase Daun Tiga (V3)"
        elif current_dat <= 40:
            stage = "Fase Pertumbuhan Cepat (V8)"
        elif current_dat <= 65:
            stage = "Fase Daun Dua Belas / Bunting (V12)"
        elif current_dat <= 90:
            stage = "Fase Pengisian Biji (R3)"
        else:
            stage = "Fase Masak Fisiologis (R6)"

        harvest_date = p_date + timedelta(days=total_duration)

        # 6 Definisi Fase Siklus Tanam Lengkap Model Gantt Chart
        phases_def = [
            {
                "id": "ve",
                "name": "Perkecambahan & Pertumbuhan Awal (VE)",
                "subtitle": "0–7 HST",
                "start_hst": 0,
                "end_hst": 7,
                "fertilizer_action": "Tanpa pupuk kimia · Jaga kelembaban tanah > 30% VWC",
                "h3_reminder_date": None,
                "description": "Kemunculan koleoptil di permukaan dan perpanjangan akar seminal primer. Sangat sensitif kekeringan.",
                "color_theme": "emerald"
            },
            {
                "id": "v3",
                "name": "Fase Daun Tiga (V3) · Pemupukan Dasar",
                "subtitle": "8–20 HST",
                "start_hst": 8,
                "end_hst": 20,
                "fertilizer_action": "Aplikasi Dasar: 112 kg Phonska 15-15-15 + 38 kg Urea (19 Ember)",
                "h3_reminder_date": (p_date + timedelta(days=9)).isoformat(),
                "description": "Diferensiasi titik tumbuh perakaran. Pupuk NPK Phonska dan Urea dasar untuk memperkokoh akar tunjang.",
                "color_theme": "blue"
            },
            {
                "id": "v8",
                "name": "Fase Pertumbuhan Cepat (V8) · Susulan I",
                "subtitle": "21–40 HST",
                "start_hst": 21,
                "end_hst": 40,
                "fertilizer_action": "Aplikasi Susulan I: 105 kg Urea + 40 kg Phonska (18 Ember)",
                "h3_reminder_date": (p_date + timedelta(days=29)).isoformat(),
                "description": "Puncak kebutuhan nitrogen harian. Fase paling kritis terhadap risiko penguapan gas amonia (AVRI).",
                "color_theme": "amber"
            },
            {
                "id": "v12",
                "name": "Fase Bunting & Malai (V12 / Tasseling) · Susulan II",
                "subtitle": "41–65 HST",
                "start_hst": 41,
                "end_hst": 65,
                "fertilizer_action": "Aplikasi Susulan II: 100 kg Urea + 25 kg ZA",
                "h3_reminder_date": (p_date + timedelta(days=47)).isoformat(),
                "description": "Pembentukan bakal tongkol dan penyerbukan malai jantan. Membutuhkan tambahan sulfur dari ZA.",
                "color_theme": "purple"
            },
            {
                "id": "r3",
                "name": "Fase Pengisian Biji & Pembuahan (R3)",
                "subtitle": "66–90 HST",
                "start_hst": 66,
                "end_hst": 90,
                "fertilizer_action": "Monitoring air tanah · Hindari genangan berlebih",
                "h3_reminder_date": None,
                "description": "Akumulasi pati pada bulir jagung. Daun bendera fotosintesis aktif memaksimalkan bobot pipilan.",
                "color_theme": "teal"
            },
            {
                "id": "r6",
                "name": "Fase Masak Fisiologis & Panen Raya (R6)",
                "subtitle": f"91–{total_duration} HST",
                "start_hst": 91,
                "end_hst": total_duration,
                "fertilizer_action": "Persiapan alat panen & pengeringan lantai terpal",
                "h3_reminder_date": (p_date + timedelta(days=total_duration - 7)).isoformat(),
                "description": "Terbentuk lapisan hitam (black layer) pada pangkal biji, kadar air susut 20–25%. Jagung siap dipanen.",
                "color_theme": "rose"
            }
        ]

        gantt_phase_dtos: List[GanttPhaseDTO] = []
        for p in phases_def:
            s_date = p_date + timedelta(days=p["start_hst"])
            e_date = p_date + timedelta(days=p["end_hst"])
            duration = (p["end_hst"] - p["start_hst"]) + 1

            if current_dat > p["end_hst"]:
                status_str = "completed"
                prog = 100.0
            elif current_dat >= p["start_hst"]:
                status_str = "active"
                span = max(1, p["end_hst"] - p["start_hst"] + 1)
                prog = round(min(100.0, max(0.0, ((current_dat - p["start_hst"] + 1) / span) * 100.0)), 1)
            else:
                status_str = "upcoming"
                prog = 0.0

            gantt_phase_dtos.append(
                GanttPhaseDTO(
                    id=p["id"],
                    name=p["name"],
                    subtitle=p["subtitle"],
                    start_hst=p["start_hst"],
                    end_hst=p["end_hst"],
                    duration_days=duration,
                    start_date=s_date.isoformat(),
                    end_date=e_date.isoformat(),
                    status=status_str,
                    progress_pct=prog,
                    fertilizer_action=p["fertilizer_action"],
                    h3_reminder_date=p["h3_reminder_date"],
                    description=p["description"],
                    color_theme=p["color_theme"]
                )
            )

        # Milestones jadwal pemupukan & panen
        milestones_def = [
            {
                "phase": "Fase V3 (Pemupukan Dasar)",
                "target_dat": 12,
                "action": "Tebus 2 karung Phonska + 1/2 karung Urea"
            },
            {
                "phase": "Fase V8 (Pemupukan Susulan I)",
                "target_dat": 32,
                "action": "Tebus 2 karung Urea + 1/2 karung Phonska"
            },
            {
                "phase": "Fase V12 (Pemupukan Susulan II)",
                "target_dat": 50,
                "action": "Tebus 2 karung Urea + 1/2 karung ZA"
            },
            {
                "phase": f"Estimasi Panen Fisiologis ({harvest_date.strftime('%d %b %Y')})",
                "target_dat": total_duration,
                "action": "Persiapan pengeringan terpal & pemanenan jagung"
            }
        ]

        milestone_dtos: List[CropMilestoneDTO] = []
        for m in milestones_def:
            c_date = p_date + timedelta(days=m["target_dat"])
            h3_date = c_date - timedelta(days=3)
            milestone_dtos.append(
                CropMilestoneDTO(
                    phase=m["phase"],
                    target_dat=m["target_dat"],
                    calendar_date=c_date.isoformat(),
                    h3_alert_date=h3_date.isoformat(),
                    action_required=m["action"]
                )
            )

        cycle_id = f"CYC-{p_date.year}-{uuid.uuid4().hex[:6].upper()}"

        return CropCycleResponseDTO(
            cycle_id=cycle_id,
            field_id=req.field_id,
            planting_date=p_date.isoformat(),
            seed_variety=req.seed_variety,
            field_area_ha=req.field_area_ha,
            target_yield_ton_ha=req.target_yield_ton_ha,
            current_dat=current_dat,
            growth_stage=stage,
            total_duration_days=total_duration,
            harvest_estimate_date=harvest_date.isoformat(),
            gantt_phases=gantt_phase_dtos,
            milestones=milestone_dtos
        )
