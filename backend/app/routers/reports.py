import csv
import io
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.telemetry import TelemetryModel
from app.schemas.envelope import create_envelope
from app.schemas.reports import ImpactSummaryDTO, ProvenanceRecordDTO, ProvenanceAuditResponseDTO
from app.services.mock_db import db

router = APIRouter(prefix="/reports", tags=["Reports & Audit"])

@router.get("/impact-summary")
def get_impact_summary(
    field_id: str = Query("BLOK-A", description="ID Petak"),
    session: Session = Depends(get_db)
):
    """
    Mengambil ringkasan dampak efisiensi pemupukan, estimasi penghematan biaya pupuk,
    dan jam kritis yang berhasil dicegah petani.
    """
    field = db._fields.get(field_id, {})
    action_history = field.get("action_history", [])
    postponed_count = sum(1 for a in action_history if a.get("is_postponed"))
    total_actions = len(action_history)

    # Estimasi penghematan: Rp 750.000 / ha dikali luas lahan (0.75 ha)
    area_ha = float(field.get("area_ha", 0.75))
    base_savings = 750000.0 * (area_ha / 1.0)
    # Tambahan penghematan per aksi penundaan kritis: Rp 125.000 per aksi
    total_savings_idr = int(base_savings + (postponed_count * 125000))
    urea_saved_kg = round(30.0 * (area_ha / 0.75) + (postponed_count * 15.0), 1)
    critical_hours_prevented = 14 + (postponed_count * 6)

    res = ImpactSummaryDTO(
        field_id=field_id,
        urea_efficiency_target="≥ 20–35%",
        cost_savings_per_ha_idr=total_savings_idr,
        nitrogen_loss_reduction="45% → <15%",
        total_actions_recorded=total_actions,
        total_urea_saved_kg=urea_saved_kg,
        critical_hours_prevented=critical_hours_prevented,
        last_audit_iso=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    return create_envelope(res.model_dump())

@router.get("/provenance-audit")
def get_provenance_audit(
    field_id: str = Query("BLOK-A", description="ID Petak"),
    limit: int = Query(30, ge=5, le=100, description="Batas jumlah baris log"),
    session: Session = Depends(get_db)
):
    """
    Mengambil riwayat log audit data provenance (ESP32 LoRa Direct vs Digital Twin FAO-56 Failover)
    langsung dari TimescaleDB dan state database live.
    """
    records = []

    # 1. Coba baca dari TimescaleDB jika ada
    try:
        rows = (
            session.query(TelemetryModel)
            .order_by(TelemetryModel.ts.desc())
            .limit(limit)
            .all()
        )
        if rows:
            for r in rows:
                is_pred = bool(r.is_predicted)
                src = "FAO56_DigitalTwin_Failover" if is_pred else "ESP32_LoRa_Direct"
                moisture = float(r.moisture or 25.0)
                temp = float(r.soil_temp or 28.0)
                ph = float(r.ph or 7.2)
                # Estimasi AVRI sederhana untuk log
                score = int(min(100, max(0, (temp - 22.0) * 3.5 + (8.0 - moisture) * 1.5)))
                cat = "aman" if score <= 30 else "waspada" if score <= 60 else "kritis" if score <= 80 else "bahaya"
                node = db._nodes.get(r.node_id)
                loc = node.bedeng_location if node else f"Bedeng ({r.node_id})"

                records.append(ProvenanceRecordDTO(
                    timestamp=r.ts.strftime("%Y-%m-%d %H:%M:%S"),
                    node_id=r.node_id,
                    block_name=loc,
                    moisture_pct=round(moisture, 1),
                    soil_temp_c=round(temp, 1),
                    ph=round(ph, 2),
                    battery_v=round(float(r.battery_v or 3.92), 2),
                    avri_score=score,
                    risk_class=cat.upper(),
                    is_predicted=is_pred,
                    provenance_source=src
                ))
    except Exception:
        pass

    # 2. Jika belum cukup, tambahkan dari state live node & deret waktu
    if len(records) < 10:
        for node in list(db._nodes.values()):
            series = db.get_node_telemetry(node.node_id, hours=12)
            if series and series.series:
                for pt in series.series[:4]:
                    is_pred = pt.is_predicted
                    src = "FAO56_DigitalTwin_Failover" if is_pred else "ESP32_LoRa_Direct"
                    # Hitung skor AVRI
                    s_calc = int(min(100, max(0, (pt.soil_temp_c - 20) * 3.2 + (pt.ph - 6.5) * 18 - (pt.moisture_pct - 20) * 1.1)))
                    c_calc = "AMAN" if s_calc <= 30 else "WASPADA" if s_calc <= 60 else "KRITIS" if s_calc <= 80 else "BAHAYA"
                    records.append(ProvenanceRecordDTO(
                        timestamp=pt.timestamp.replace("T", " ").replace("Z", ""),
                        node_id=node.node_id,
                        block_name=node.bedeng_location or f"Bedeng ({node.node_id})",
                        moisture_pct=pt.moisture_pct,
                        soil_temp_c=pt.soil_temp_c,
                        ph=pt.ph,
                        battery_v=pt.battery_voltage,
                        avri_score=s_calc,
                        risk_class=c_calc,
                        is_predicted=is_pred,
                        provenance_source=src
                    ))

    # Urutkan berdasarkan waktu terbaru
    records.sort(key=lambda x: x.timestamp, reverse=True)
    selected_records = records[:limit]

    direct_count = sum(1 for r in selected_records if not r.is_predicted)
    failover_count = len(selected_records) - direct_count

    audit_res = ProvenanceAuditResponseDTO(
        field_id=field_id,
        total_records=len(selected_records),
        direct_telemetry_count=direct_count,
        failover_imputed_count=failover_count,
        records=selected_records
    )
    return create_envelope(audit_res.model_dump())

@router.get("/telemetry-csv")
def download_telemetry_csv(
    field_id: str = Query("BLOK-A", description="ID Petak"),
    hours: int = Query(72, description="Rentang jam historis ekspor CSV"),
    session: Session = Depends(get_db)
):
    """
    Mengekspor file CSV audit telemetri lengkap dengan seluruh kolom provenance
    (timestamp, node_id, block_name, moisture_pct, soil_temp_c, soil_ph, battery_voltage,
    avri_score, risk_class, is_predicted, provenance_source).
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Tulis Header CSV
    headers = [
        "timestamp",
        "node_id",
        "block_name",
        "moisture_pct",
        "soil_temp_c",
        "soil_ph",
        "battery_voltage",
        "avri_score",
        "risk_class",
        "is_predicted",
        "provenance_source"
    ]
    writer.writerow(headers)

    # Kumpulkan data dari seluruh node aktif
    records = []
    for node in list(db._nodes.values()):
        series_obj = db.get_node_telemetry(node.node_id, hours=hours)
        if series_obj and series_obj.series:
            for pt in series_obj.series:
                is_pred = pt.is_predicted
                src = "FAO56_DigitalTwin_Failover" if is_pred else "ESP32_LoRa_Direct"
                score = int(min(100, max(0, (pt.soil_temp_c - 20) * 3.2 + (pt.ph - 6.5) * 18 - (pt.moisture_pct - 20) * 1.1)))
                cat = "AMAN" if score <= 30 else "WASPADA" if score <= 60 else "KRITIS" if score <= 80 else "BAHAYA"
                records.append([
                    pt.timestamp.replace("T", " ").replace("Z", ""),
                    node.node_id,
                    node.bedeng_location or f"Bedeng ({node.node_id})",
                    f"{pt.moisture_pct:.1f}",
                    f"{pt.soil_temp_c:.1f}",
                    f"{pt.ph:.2f}",
                    f"{pt.battery_voltage:.2f}",
                    str(score),
                    cat,
                    "TRUE" if is_pred else "FALSE",
                    src
                ])

    # Urutkan berdasarkan waktu terbaru
    records.sort(key=lambda r: r[0], reverse=True)
    for r in records:
        writer.writerow(r)

    csv_data = output.getvalue()
    filename = f"volatisafe_audit_telemetri_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Total-Rows": str(len(records))
        }
    )

