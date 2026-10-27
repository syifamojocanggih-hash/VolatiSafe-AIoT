@echo off
title VolatiSafe AIoT - Frontend (Next.js)
echo ========================================================
echo   VolatiSafe AIoT - Menjalankan Frontend Next.js 14
echo   Akses: http://localhost:3000/digital-twin
echo ========================================================
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Menginstal dependensi frontend...
    call npm install
)
call npm run dev
pause
