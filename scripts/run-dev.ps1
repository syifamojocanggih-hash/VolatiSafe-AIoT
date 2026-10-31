# run-dev.ps1 - nyalakan TimescaleDB + Mosquitto (Docker), backend FastAPI, dan frontend Next.js.
# Pemakaian:
#   .\scripts\run-dev.ps1                 # install bila perlu, lalu jalankan semua
#   .\scripts\run-dev.ps1 -SkipInstall    # lewati pip/npm install
#   .\scripts\run-dev.ps1 -NoBrowser      # jangan buka browser otomatis

param(
    [switch]$SkipInstall,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Wait-TcpPort {
    param([string]$TargetHost, [int]$Port, [int]$TimeoutSeconds = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $client.Connect($TargetHost, $Port)
            $client.Close()
            return $true
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

function Wait-HttpOk {
    param([string]$Url, [int]$TimeoutSeconds = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($res.StatusCode -eq 200) { return $true }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

# 1. File konfigurasi lokal
foreach ($pair in @(
    @("backend\.env.example", "backend\.env"),
    @("frontend\.env.example", "frontend\.env.local")
)) {
    if (-not (Test-Path $pair[1])) {
        Copy-Item $pair[0] $pair[1]
        Write-Host "[env] dibuat $($pair[1]) dari contoh"
    }
}

# 2. Infrastruktur (DB + broker MQTT)
Write-Host "[docker] menyalakan timescaledb + mosquitto..."
docker compose -f docker/docker-compose.yml up -d timescaledb mosquitto
if ($LASTEXITCODE -ne 0) { throw "docker compose gagal. Pastikan Docker Desktop berjalan." }

if (-not (Wait-TcpPort -TargetHost "127.0.0.1" -Port 5433 -TimeoutSeconds 120)) {
    throw "TimescaleDB tidak siap di port 5433. Cek: docker logs volatisafe_timescaledb"
}
if (-not (Wait-TcpPort -TargetHost "127.0.0.1" -Port 1883 -TimeoutSeconds 60)) {
    throw "Mosquitto tidak siap di port 1883. Cek: docker logs volatisafe_mosquitto"
}
Write-Host "[docker] DB 5433 dan MQTT 1883 siap"

# 3. Dependensi backend (venv lokal, tanpa LightGBM karena MOCK_AI_PREDICTOR=true)
$venvPython = Join-Path $root "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "[python] membuat virtualenv backend\.venv..."
    python -m venv backend\.venv
}
if (-not $SkipInstall) {
    Write-Host "[python] install dependensi runtime..."
    & $venvPython -m pip install --quiet --disable-pip-version-check -r backend\requirements-local.txt
    if ($LASTEXITCODE -ne 0) { throw "pip install gagal." }
}

# 4. Dependensi frontend
if (-not $SkipInstall -and -not (Test-Path "frontend\node_modules")) {
    Write-Host "[node] npm install (sekali saja, bisa beberapa menit)..."
    Push-Location frontend
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) { throw "npm install gagal." }
}

# 5. Jalankan backend dan frontend di jendela terpisah
Write-Host "[run] backend  -> http://localhost:8000/docs"
Start-Process powershell -WorkingDirectory (Join-Path $root "backend") -ArgumentList @(
    "-NoExit", "-Command",
    "& '$venvPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
)

Write-Host "[run] frontend -> http://localhost:3000"
Start-Process powershell -WorkingDirectory (Join-Path $root "frontend") -ArgumentList @(
    "-NoExit", "-Command", "npm run dev"
)

# 6. Tunggu backend siap, lalu buka dashboard
if (Wait-HttpOk -Url "http://localhost:8000/api/v1/health" -TimeoutSeconds 90) {
    Write-Host "[ok] backend sehat"
} else {
    Write-Warning "Backend belum membalas /api/v1/health. Lihat jendela backend."
}

if (-not $NoBrowser) {
    Start-Process "http://localhost:3000"
}

Write-Host ""
Write-Host "Dashboard : http://localhost:3000"
Write-Host "API docs  : http://localhost:8000/docs"
Write-Host "Kirim paket uji: .\scripts\publish-telemetry.ps1"
Write-Host "Matikan infra  : docker compose -f docker/docker-compose.yml down"
