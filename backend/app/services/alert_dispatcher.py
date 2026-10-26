from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

class AlertDispatcherService:
    """
    Dispatcher Notifikasi Peringatan Dini Petani (WhatsApp & Telegram)
    dengan mekanisme rate-limiting 1 jam (WEBSOCKET_AND_ALERTS.md §2).
    """

    def __init__(self):
        # Menyimpan timestamp pengiriman terakhir per petak untuk rate-limiting
        self._last_alert_time: Dict[str, datetime] = {}
        self._rate_limit_seconds = 3600  # 1 jam

    def can_send_alert(self, field_id: str) -> bool:
        now = datetime.now(timezone.utc)
        if field_id not in self._last_alert_time:
            return True
        last_time = self._last_alert_time[field_id]
        return (now - last_time).total_seconds() >= self._rate_limit_seconds

    def format_critical_whatsapp_msg(
        self,
        field_name: str,
        avri_score: float,
        soil_temp_c: float,
        moisture_pct: float,
        ph: float,
        field_id: str = "BLOK-A"
    ) -> str:
        return (
            f"VolatiSafe AIoT · {field_name}\n\n"
            f"🔴 PERINGATAN RISIKO KRITIS: {avri_score:.1f}%\n"
            f"Jangan tabur pupuk Urea sekarang!\n\n"
            f"Kondisi Lahan Terkini:\n"
            f"• Suhu Tanah : {soil_temp_c:.1f}°C (Sangat Panas)\n"
            f"• Kelembaban : {moisture_pct:.1f}% (Kering)\n"
            f"• pH Tanah   : {ph:.2f} (Basa / Berkapur)\n\n"
            f"⚠️ Potensi penguapan amonia ke udara mencapai {avri_score:.1f}%. "
            f"Pupuk Anda akan terbuang percuma dan daun jagung tetap menguning.\n\n"
            f"✅ Jendela Aman Terdekat:\n"
            f"Besok Pagi, pukul 06:00 – 09:00 WIB (Risiko 18%)\n\n"
            f"Buka Panduan: https://volatisafe.id/petak/{field_id}"
        )

    def format_h3_whatsapp_msg(
        self,
        farmer_name: str,
        dat: int,
        phase_name: str,
        area_ha: float,
        urea_sacks: float,
        npk_sacks: float
    ) -> str:
        return (
            f"Halo {farmer_name},\n\n"
            f"3 hari lagi tanaman jagung Anda memasuki umur {dat} HST ({phase_name}).\n\n"
            f"Kebutuhan Pupuk Lahan {area_ha} ha:\n"
            f"• {urea_sacks} Karung Urea (isi 50 kg)\n"
            f"• {npk_sacks} Karung NPK Phonska 15-15-15\n\n"
            f"Segera tebus/siapkan pupuk di Kios Tani Desa. VolatiSafe akan memantau "
            f"kondisi cuaca untuk memilih jam penaburan terbaik di hari aplikasi."
        )

    def dispatch_critical_alert(
        self,
        field_id: str,
        field_name: str,
        avri_score: float,
        soil_temp_c: float,
        moisture_pct: float,
        ph: float
    ) -> Dict[str, Any]:
        """
        Kirim notifikasi via WhatsApp dan Telegram simulasi
        """
        now = datetime.now(timezone.utc)
        if not self.can_send_alert(field_id):
            return {
                "dispatched": False,
                "reason": "rate_limited",
                "message": "Peringatan sudah dikirim dalam 1 jam terakhir."
            }

        msg = self.format_critical_whatsapp_msg(
            field_name=field_name,
            avri_score=avri_score,
            soil_temp_c=soil_temp_c,
            moisture_pct=moisture_pct,
            ph=ph,
            field_id=field_id
        )

        self._last_alert_time[field_id] = now

        # Simulasi pengiriman sukses ke gateway WhatsApp & Telegram
        return {
            "dispatched": True,
            "field_id": field_id,
            "avri_score": avri_score,
            "channels": ["WhatsApp (Wablas/Fonnte)", "Telegram (@VolatiSafeAlertBot)"],
            "formatted_message": msg,
            "timestamp": now.isoformat()
        }

alert_dispatcher = AlertDispatcherService()
