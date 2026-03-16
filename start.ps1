# RateScope — avvia frontend e backend in parallelo su Windows
# Uso: .\start.ps1
# Richiede: Python 3.11+, Node 18+, PostgreSQL, Redis in esecuzione

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RateScope — avvio in corso...               ║" -ForegroundColor Cyan
Write-Host "║  Frontend → http://localhost:5173            ║" -ForegroundColor Cyan
Write-Host "║  Backend  → http://localhost:8000            ║" -ForegroundColor Cyan
Write-Host "║  API docs → http://localhost:8000/docs       ║" -ForegroundColor Cyan
Write-Host "║  Chiudi le finestre per fermare              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Backend ──────────────────────────────────────────────────
$backendDir = Join-Path $ROOT "backend"

$backendScript = @"
Set-Location '$backendDir'

# Crea virtualenv se non esiste
if (-not (Test-Path '.venv')) {
    Write-Host '[backend] Creazione virtualenv...' -ForegroundColor Cyan
    python -m venv .venv
}

# Attiva virtualenv
& '.venv\Scripts\Activate.ps1'

# Installa dipendenze
Write-Host '[backend] Installazione dipendenze...' -ForegroundColor Cyan
pip install -q -r requirements.txt

# Crea .env se non esiste
if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
    Write-Host '[backend] Creazione .env dal template...' -ForegroundColor Cyan
    Copy-Item '.env.example' '.env'
}

Write-Host '[backend] Avvio su http://localhost:8000 ...' -ForegroundColor Cyan
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# ── Frontend ─────────────────────────────────────────────────
$frontendDir = Join-Path $ROOT "frontend"

$frontendScript = @"
Set-Location '$frontendDir'

# Installa node_modules se non esiste
if (-not (Test-Path 'node_modules')) {
    Write-Host '[frontend] Installazione dipendenze npm...' -ForegroundColor Yellow
    npm install
}

# Crea .env se non esiste
if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
    Write-Host '[frontend] Creazione .env dal template...' -ForegroundColor Yellow
    Copy-Item '.env.example' '.env'
}

Write-Host '[frontend] Avvio su http://localhost:5173 ...' -ForegroundColor Yellow
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host "Due finestre aperte: backend e frontend." -ForegroundColor Green
Write-Host "Chiudile per fermare i processi." -ForegroundColor Green
