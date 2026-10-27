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
    CropMilestoneDTO
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
        # Jika tanggal tanam di masa lalu, hitung selisih hari. Jika masa depan, DAT = 0
        diff_days = (today - p_date).days
        current_dat = max(0, diff_days)

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
                "phase": "Estimasi Panen Fisiologis (R6)",
                "target_dat": 105,
                "action": "Persiapan pengeringan terpal & panen"
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
            current_dat=current_dat,
            growth_stage=stage,
            milestones=milestone_dtos
        )
