# Build kedua environment berurutan, gagal bila salah satu gagal (HW-1.4).
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($target in @('esp32dev', 'wokwi')) {
    Write-Host "==> pio run -e $target"
    pio run --project-dir $root -e $target
    if ($LASTEXITCODE -ne 0) {
        Write-Host "GAGAL: build env '$target' exit $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "OK: esp32dev dan wokwi sama-sama sukses" -ForegroundColor Green
