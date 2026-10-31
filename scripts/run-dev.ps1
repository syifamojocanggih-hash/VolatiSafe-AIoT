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

# Perintah native (docker, pip, npm) menulis progres ke stderr. Dengan
# ErrorActionPreference=Stop, PowerShell menganggapnya error fatal terutama saat
# output dialihkan. Di sini stderr ditampung ke berkas sementara dan hanya
# ditampilkan bila perintah benar-benar gagal.
function Invoke-Native {
    param([scriptblock]$Command)
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $stderrFile = [System.IO.Path]::GetTempFileName()
    try {
        & $Command 2> $stderrFile
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            $stderrText = Get-Content -Path $stderrFile -Raw
            if ($stderrText) { Write-Host $stderrText.Trim() }
        }
        return $exitCode
    } finally {
        Remove-Item -Path $stderrFile -Force -ErrorAction SilentlyContinue
        $ErrorActionPreference = $previous
    }
}

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
$dockerExit = Invoke-Native { docker compose -f docker/docker-compose.yml up -d timescaledb mosquitto }
if ($dockerExit -ne 0) { throw "docker compose gagal. Pastikan Docker Desktop berjalan." }

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
    $pipExit = Invoke-Native { & $venvPython -m pip install --quiet --disable-pip-version-check -r backend\requirements-local.txt }
    if ($pipExit -ne 0) { throw "pip install gagal." }
}

# 4. Dependensi frontend
if (-not $SkipInstall -and -not (Test-Path "frontend\node_modules")) {
    Write-Host "[node] npm install (sekali saja, bisa beberapa menit)..."
    Push-Location frontend
    $npmExit = Invoke-Native { npm install }
    Pop-Location
    if ($npmExit -ne 0) { throw "npm install gagal." }
}

# 5. Jalankan backend dan frontend di latar belakang, log ke berkas.
#    Jendela disembunyikan supaya klik tidak memicu mode QuickEdit konsol yang
#    bisa membekukan proses saat demo.
$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$backendLog = Join-Path $logDir "backend.log"
$frontendLog = Join-Path $logDir "frontend.log"

function Test-PortBusy {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

if (Test-PortBusy -Port 8000) {
    Write-Warning "Port 8000 sudah dipakai, backend tidak dijalankan ulang. Hentikan dulu: .\scripts\stop-dev.ps1"
} else {
    Write-Host "[run] backend  -> http://localhost:8000/docs"
    Set-Content -Path $backendLog -Value "" -Encoding utf8
    $backendCmd = "/c `"`"$venvPython`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload > `"$backendLog`" 2>&1`""
    Start-Process -FilePath "cmd.exe" -ArgumentList $backendCmd -WorkingDirectory (Join-Path $root "backend") -WindowStyle Hidden
}

if (Test-PortBusy -Port 3000) {
    Write-Warning "Port 3000 sudah dipakai, frontend tidak dijalankan ulang. Hentikan dulu: .\scripts\stop-dev.ps1"
} else {
    Write-Host "[run] frontend -> http://localhost:3000"
    Set-Content -Path $frontendLog -Value "" -Encoding utf8
    $frontendCmd = "/c `"npm run dev > `"$frontendLog`" 2>&1`""
    Start-Process -FilePath "cmd.exe" -ArgumentList $frontendCmd -WorkingDirectory (Join-Path $root "frontend") -WindowStyle Hidden
}

# 6. Tunggu backend siap, lalu buka dashboard
if (Wait-HttpOk -Url "http://localhost:8000/api/v1/health" -TimeoutSeconds 90) {
    Write-Host "[ok] backend sehat"
} else {
    Write-Warning "Backend belum membalas /api/v1/health. Cek logs\backend.log"
}

if (-not $NoBrowser) {
    Start-Process "http://localhost:3000"
}

Write-Host ""
Write-Host "Dashboard : http://localhost:3000"
Write-Host "API docs  : http://localhost:8000/docs"
Write-Host "Log backend  : logs\backend.log"
Write-Host "Log frontend : logs\frontend.log"
Write-Host "Pantau log   : Get-Content logs\backend.log -Tail 20 -Wait"
Write-Host "Kirim paket uji: .\scripts\publish-telemetry.ps1"
Write-Host "Matikan semua  : .\scripts\stop-dev.ps1"
