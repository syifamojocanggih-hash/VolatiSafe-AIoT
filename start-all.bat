@echo off
title VolatiSafe AIoT - System Launcher
echo ========================================================
echo   VolatiSafe AIoT - Menjalankan Seluruh Sistem
echo ========================================================
start "VolatiSafe AIoT - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
start "VolatiSafe AIoT - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1"
echo.
echo Server sedang dibuka di dua jendela terpisah:
echo  1. Frontend (Next.js):  http://localhost:3000/digital-twin
echo  2. Backend (FastAPI):   http://localhost:8000/docs
echo.
echo Tekan tombol apa saja untuk menutup launcher ini...
pause >nul
