Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting BuyerDNA Enterprise Platform (2 Terminals Mode)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/2] Starting Backend API + Python ML Microservice (Port 5000 & 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Vite + React Frontend on Port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "BuyerDNA Platform is running in 2 Terminals!" -ForegroundColor Yellow
Write-Host "Terminal 1 (Backend & ML): http://localhost:5000 | Docs: http://localhost:5000/docs" -ForegroundColor White
Write-Host "Terminal 2 (Frontend)    : http://localhost:5173" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
