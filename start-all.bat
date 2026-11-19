@echo off
echo ========================================================
echo Starting BuyerDNA Enterprise Platform (2 Terminals Mode)
echo ========================================================

echo [1/2] Starting Backend API + Python ML Microservice on Port 5000 & 8000...
start "BuyerDNA - Backend & ML Engine" cmd /k "cd backend && python main.py"

timeout /t 3 >nul

echo [2/2] Starting Vite + React Frontend on Port 5173...
start "BuyerDNA - Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo BuyerDNA is now launching in 2 Terminals!
echo 1. Backend & ML Engine : http://localhost:5000 & http://localhost:8000
echo 2. Frontend Dashboard  : http://localhost:5173
echo ========================================================
