# publish-telemetry.ps1 - kirim satu paket telemetri uji ke Mosquitto, meniru firmware.
# Contoh:
#   .\scripts\publish-telemetry.ps1
#   .\scripts\publish-telemetry.ps1 -NodeId VS-A1-003 -Moisture 18.2 -Temp 36.5 -Ph 8.1 -Battery 3.72

param(
    [string]$NodeId = "VS-SIM-001",
    [double]$Moisture = 24.5,
    [double]$Temp = 31.2,
    [double]$Ph = 7.6,
    [double]$Battery = 3.95
)

$ErrorActionPreference = "Stop"
$inv = [System.Globalization.CultureInfo]::InvariantCulture
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$payload = '{"n":"' + $NodeId + '","ts":' + $ts + ',"m":' + $Moisture.ToString($inv) + ',"t":' + $Temp.ToString($inv) + ',"ph":' + $Ph.ToString($inv) + ',"b":' + $Battery.ToString($inv) + '}'
$topic = "/volatisafe/v1/node/$NodeId/telemetry"

Write-Host "[mqtt] $topic"
Write-Host "[mqtt] $payload"

# Payload dikirim lewat stdin (-s). PowerShell membuang tanda kutip ganda saat
# argumen diteruskan ke exe native, jadi -m akan merusak JSON.
$payload | docker exec -i volatisafe_mosquitto mosquitto_pub -h 127.0.0.1 -t $topic -s
if ($LASTEXITCODE -ne 0) { throw "mosquitto_pub gagal. Pastikan container volatisafe_mosquitto berjalan." }

Write-Host "[ok] paket terkirim. Cek dashboard atau http://localhost:8000/api/v1/fields/BLOK-A/current-status"
