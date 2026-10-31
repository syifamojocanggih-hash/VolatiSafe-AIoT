# Gate satu perintah: dua build firmware + unit test native (HW-1.4, HW-3.5).
# Berhenti di kegagalan pertama supaya tidak ada hasil hijau palsu.
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

Write-Host "==> pio test -e native"
pio test --project-dir $root -e native
if ($LASTEXITCODE -ne 0) {
    Write-Host "GAGAL: unit test native exit $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "OK: esp32dev, wokwi, dan native semuanya lulus" -ForegroundColor Green
