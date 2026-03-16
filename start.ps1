# RateScope — avvia frontend e backend in parallelo su Windows
# Uso: .\start.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir  = Join-Path $ROOT "backend"
$frontendDir = Join-Path $ROOT "frontend"

# ── Script backend (salvato in file temp) ─────────────────────
$backendCode = "Set-Location '" + $backendDir + "'
if (-not (Test-Path '.venv')) {
    Write-Host '[backend] Creazione virtualenv...' -ForegroundColor Cyan
    python -m venv .venv
}
& '.venv\Scripts\Activate.ps1'
pip install -q -r requirements.txt
if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
    Copy-Item '.env.example' '.env'
}
Write-Host '[backend] Avvio su http://localhost:8000' -ForegroundColor Cyan
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

$backendTmp = [System.IO.Path]::GetTempFileName() + ".ps1"
Set-Content -Path $backendTmp -Value $backendCode -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", $backendTmp

# ── Script frontend (salvato in file temp) ────────────────────
$frontendCode = "Set-Location '" + $frontendDir + "'
if (-not (Test-Path 'node_modules')) {
    Write-Host '[frontend] Installazione dipendenze npm...' -ForegroundColor Yellow
    npm install
}
if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
    Copy-Item '.env.example' '.env'
}
Write-Host '[frontend] Avvio su http://localhost:5173' -ForegroundColor Yellow
npm run dev"

$frontendTmp = [System.IO.Path]::GetTempFileName() + ".ps1"
Set-Content -Path $frontendTmp -Value $frontendCode -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", $frontendTmp

# ── Riepilogo ─────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RateScope avviato in due finestre           ║" -ForegroundColor Cyan
Write-Host "║  Frontend -> http://localhost:5173           ║" -ForegroundColor Cyan
Write-Host "║  Backend  -> http://localhost:8000           ║" -ForegroundColor Cyan
Write-Host "║  API docs -> http://localhost:8000/docs      ║" -ForegroundColor Cyan
Write-Host "║  Chiudi le finestre per fermare              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
