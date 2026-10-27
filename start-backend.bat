@echo off
title VolatiSafe AIoT - Central Backend (FastAPI)
echo ========================================================
echo   VolatiSafe AIoT - Menjalankan Backend Python FastAPI
echo   Akses Swagger API: http://localhost:8000/docs
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
pause
