# stop-dev.ps1 - hentikan backend (8000) dan frontend (3000) yang dijalankan run-dev.ps1.
# Infrastruktur Docker tidak ikut dimatikan:
#   docker compose -f docker/docker-compose.yml down

param([int[]]$Ports = @(8000, 3000))

$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $PSScriptRoot

function Get-ProcessTable {
    Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine
}

function Get-Depth {
    param($Table, [int]$TargetId)
    $depth = 0
    $current = $TargetId
    while ($depth -le 20) {
        $proc = $Table | Where-Object { $_.ProcessId -eq $current } | Select-Object -First 1
        if (-not $proc -or -not $proc.ParentProcessId) { break }
        $current = [int]$proc.ParentProcessId
        $depth++
    }
    return $depth
}

# uvicorn --reload dan npm sama-sama memakai proses pengawas: membunuh induk saja
# meninggalkan anak yang tetap memegang port. Kumpulkan seluruh keturunan dulu,
# lalu bunuh dari yang paling dalam supaya tidak ada yang terlepas.
function Stop-Tree {
    param($Table, [int[]]$Roots)

    $targets = @{}
    foreach ($rootId in $Roots) { $targets[$rootId] = $true }

    $changed = $true
    while ($changed) {
        $changed = $false
        foreach ($proc in $Table) {
            $parentId = [int]$proc.ParentProcessId
            if ($targets.ContainsKey($parentId) -and -not $targets.ContainsKey([int]$proc.ProcessId)) {
                $targets[[int]$proc.ProcessId] = $true
                $changed = $true
            }
        }
    }

    $ordered = $targets.Keys | Sort-Object { Get-Depth -Table $Table -TargetId $_ } -Descending
    foreach ($targetId in $ordered) {
        Stop-Process -Id $targetId -Force
    }
    return $ordered
}

$table = Get-ProcessTable
$roots = @()

foreach ($port in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) {
        Write-Host "[skip] port $port tidak dipakai"
        continue
    }
    foreach ($procId in ($conns | Select-Object -ExpandProperty OwningProcess -Unique)) {
        $roots += [int]$procId
        Write-Host "[stop] port $port -> PID $procId"
    }
}

# Jaring pengaman: proses dev repo ini yang masih hidup walau port-nya sudah lepas,
# misalnya reloader uvicorn yang menunggu perubahan berkas. Pola harus ketat dan
# hanya menyasar python/node/cmd; kalau longgar, skrip bisa membunuh dirinya sendiri
# karena teks perintah pemanggil juga memuat kata "uvicorn" atau "npm".
$sweep = $table | Where-Object {
    $proc = $_
    if (-not $proc.CommandLine) { return $false }
    if ($proc.ProcessId -eq $PID) { return $false }
    if ($proc.Name -notin @('python.exe', 'node.exe', 'cmd.exe')) { return $false }
    if ($proc.CommandLine -notlike "*$root*") { return $false }
    return ($proc.CommandLine -match '-m\s+uvicorn\s+app\.main:app' -or
            $proc.CommandLine -match 'next.*\bdev\b' -or
            $proc.CommandLine -match 'npm(\.cmd)?[^|]*\srun\s+dev')
} | Select-Object -ExpandProperty ProcessId

foreach ($procId in $sweep) { $roots += [int]$procId }

if ($roots.Count -eq 0) {
    Write-Host "[ok] tidak ada proses dev yang berjalan"
} else {
    $killed = Stop-Tree -Table $table -Roots ($roots | Select-Object -Unique)
    Write-Host "[ok] $($killed.Count) proses dihentikan"
}

Start-Sleep -Seconds 2

$still = foreach ($port in $Ports) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
}
if ($still) {
    Write-Warning "Port masih dipakai: $(($still.LocalPort | Sort-Object -Unique) -join ', ')"
} else {
    Write-Host "[ok] port $(($Ports | Sort-Object -Unique) -join ', ') bebas"
}

Write-Host ""
Write-Host "Infrastruktur Docker masih hidup. Matikan dengan:"
Write-Host "  docker compose -f docker/docker-compose.yml down"
