# Start-Task2.ps1 — IncentIQ Toyota Nippon
Write-Host ""
Write-Host "===========================================" -ForegroundColor Red
Write-Host "   IncentIQ — Toyota Nippon Platform" -ForegroundColor Red
Write-Host "===========================================" -ForegroundColor White
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend  = "$root\backend"
$frontend = "$root\frontend"

# Check .env
$envPath = "$backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: backend/.env not found!" -ForegroundColor Red; exit 1
}

Write-Host "Starting Backend  (port 5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; `$env:PATH = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); node index.js"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend (port 5174)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; `$env:PATH = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); npm run dev"

Start-Sleep -Seconds 4
Write-Host ""
Write-Host "  App:     http://localhost:5174" -ForegroundColor Green
Write-Host "  API:     http://localhost:5001/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "  Admin:   admin@toyotanippon.com  / admin123" -ForegroundColor White
Write-Host "  Officer: salman@toyotanippon.com / officer123" -ForegroundColor White
Write-Host ""
Start-Process "http://localhost:5174"
