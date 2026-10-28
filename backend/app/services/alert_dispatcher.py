from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

class AlertDispatcherService:
    """
    Dispatcher Notifikasi Peringatan Dini Petani (WhatsApp & Telegram)
    dengan mekanisme rate-limiting 1 jam (WEBSOCKET_AND_ALERTS.md §2).
    """

    def __init__(self):
        # Menyimpan timestamp pengiriman terakhir per petak untuk rate-limiting
        self._last_alert_time: Dict[str, datetime] = {}
        self._rate_limit_seconds = 3600  # 1 jam
        self._dispatch_history: List[Dict[str, Any]] = []

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
        field_id: str = "BLOK-A",
        farmer_name: str = "Pak Suparman",
        best_window: str = "Besok Pagi, pukul 06:00 – 09:00 WIB (Risiko 18%)"
    ) -> str:
        return (
            f"VolatiSafe AIoT · {field_name}\n"
            f"Penerima: {farmer_name}\n\n"
            f"🔴 PERINGATAN RISIKO KRITIS: {avri_score:.1f}%\n"
            f"Jangan tabur pupuk Urea sekarang!\n\n"
            f"Kondisi Lahan Terkini:\n"
            f"• Suhu Tanah : {soil_temp_c:.1f}°C (Sangat Panas)\n"
            f"• Kelembaban : {moisture_pct:.1f}% (Kering)\n"
            f"• pH Tanah   : {ph:.2f} (Basa / Berkapur)\n\n"
            f"⚠️ Potensi penguapan amonia ke udara mencapai {avri_score:.1f}%. "
            f"Pupuk Anda akan terbuang percuma dan daun jagung tetap menguning.\n\n"
            f"✅ Jendela Aman Terdekat:\n"
            f"{best_window}\n\n"
            f"Buka Panduan: https://volatisafe.id/petak/{field_id}"
        )

    def format_h3_whatsapp_msg(
        self,
        farmer_name: str,
        dat: int,
        phase_name: str,
        area_ha: float,
        urea_sacks: float,
        npk_sacks: float,
        field_id: str = "BLOK-A"
    ) -> str:
        return (
            f"Halo {farmer_name},\n\n"
            f"3 hari lagi tanaman jagung Anda memasuki umur {dat} HST ({phase_name}).\n\n"
            f"Kebutuhan Pupuk Lahan {area_ha:.2f} ha:\n"
            f"• {urea_sacks:.1f} Karung Urea (isi 50 kg)\n"
            f"• {npk_sacks:.1f} Karung NPK Phonska 15-15-15\n\n"
            f"Segera tebus/siapkan pupuk di Kios Tani Desa. VolatiSafe akan memantau "
            f"kondisi cuaca untuk memilih jam penaburan terbaik di hari aplikasi.\n\n"
            f"Buka Rincian: https://volatisafe.id/petak/{field_id}"
        )

    def format_daily_digest_msg(
        self,
        field_name: str,
        farmer_name: str,
        avri_score: float,
        risk_category: str,
        soil_temp_c: float,
        moisture_pct: float,
        best_window: str,
        field_id: str = "BLOK-A"
    ) -> str:
        status_emoji = "🟢" if avri_score <= 30 else ("🟡" if avri_score <= 60 else "🔴")
        return (
            f"VolatiSafe AIoT · {field_name}\n"
            f"Selamat Pagi, {farmer_name}! (Prakiraan Pukul 05:30 WIB)\n\n"
            f"{status_emoji} Status Volatilisasi: {risk_category.upper()} ({avri_score:.1f}%)\n"
            f"• Suhu Tanah Pagi: {soil_temp_c:.1f}°C\n"
            f"• Kelembaban Pori: {moisture_pct:.1f}%\n\n"
            f"✅ Rekomendasi Jendela Aman Hari Ini:\n"
            f"{best_window}\n\n"
            f"Buka Dashboard: https://volatisafe.id/petak/{field_id}"
        )

    def dispatch_critical_alert(
        self,
        field_id: str,
        field_name: str,
        avri_score: float,
        soil_temp_c: float,
        moisture_pct: float,
        ph: float,
        farmer_name: str = "Pak Suparman",
        best_window: str = "Besok Pagi, pukul 06:00 – 09:00 WIB (Risiko 18%)",
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Kirim notifikasi via WhatsApp dan Telegram simulasi
        """
        now = datetime.now(timezone.utc)
        if not force and not self.can_send_alert(field_id):
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
            field_id=field_id,
            farmer_name=farmer_name,
            best_window=best_window
        )

        self._last_alert_time[field_id] = now
        entry = {
            "dispatched": True,
            "field_id": field_id,
            "alert_type": "critical",
            "avri_score": avri_score,
            "channels": ["WhatsApp (Wablas/Fonnte API)", "Telegram (@VolatiSafeAlertBot)"],
            "formatted_message": msg,
            "status": "DELIVERED_SIMULATED",
            "timestamp": now.isoformat()
        }
        self._dispatch_history.append(entry)
        return entry

    def dispatch_alert(
        self,
        field_id: str,
        alert_type: str,
        message: str,
        channels: Optional[List[str]] = None,
        force: bool = True
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        if not force and not self.can_send_alert(field_id):
            return {
                "dispatched": False,
                "reason": "rate_limited",
                "message": "Notifikasi sudah dikirim dalam 1 jam terakhir."
            }

        self._last_alert_time[field_id] = now
        entry = {
            "dispatched": True,
            "field_id": field_id,
            "alert_type": alert_type,
            "channels": channels or ["WhatsApp (Wablas/Fonnte API)", "Telegram (@VolatiSafeAlertBot)"],
            "formatted_message": message,
            "status": "DELIVERED_SIMULATED",
            "timestamp": now.isoformat()
        }
        self._dispatch_history.append(entry)
        return entry

    def get_dispatch_history(self) -> List[Dict[str, Any]]:
        return self._dispatch_history

alert_dispatcher = AlertDispatcherService()
