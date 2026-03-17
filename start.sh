#!/bin/bash
# RateScope — avvia frontend e backend in parallelo
# Uso: ./start.sh
# Richiede: Python 3.11+, Node 18+, PostgreSQL, Redis in esecuzione

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colori per distinguere i log
TEAL='\033[0;36m'
CORAL='\033[0;31m'
RESET='\033[0m'

log_backend()  { echo -e "${TEAL}[backend]${RESET}  $*"; }
log_frontend() { echo -e "${CORAL}[frontend]${RESET} $*"; }

# Termina entrambi i processi all'uscita (Ctrl+C)
cleanup() {
  echo ""
  echo "Arresto in corso..."
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
  echo "Fermato."
}
trap cleanup EXIT INT TERM

# ── Backend ──────────────────────────────────────────────────
log_backend "Avvio backend su http://localhost:8000 ..."
(
  cd "$ROOT/backend"

  # Crea virtualenv se non esiste
  if [ ! -d ".venv" ]; then
    log_backend "Creazione virtualenv..."
    python3 -m venv .venv
  fi

  # Attiva virtualenv e installa dipendenze
  source .venv/bin/activate
  pip install -q -r requirements.txt

  # Crea .env dal template se non esiste
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    log_backend "Creazione .env dal template..."
    cp .env.example .env
  fi

  log_backend "Backend pronto → http://localhost:8000/docs"
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | \
    while IFS= read -r line; do log_backend "$line"; done
) &

# ── Frontend ─────────────────────────────────────────────────
log_frontend "Avvio frontend su http://localhost:5173 ..."
(
  cd "$ROOT/frontend"

  # Installa node_modules se non esiste
  if [ ! -d "node_modules" ]; then
    log_frontend "Installazione dipendenze npm..."
    npm install
  fi

  # Crea .env dal template se non esiste
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    log_frontend "Creazione .env dal template..."
    cp .env.example .env
  fi

  log_frontend "Frontend pronto → http://localhost:5173"
  npm run dev 2>&1 | \
    while IFS= read -r line; do log_frontend "$line"; done
) &

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  RateScope in avvio...                       ║"
echo "║  Frontend → http://localhost:5173            ║"
echo "║  Backend  → http://localhost:8000            ║"
echo "║  API docs → http://localhost:8000/docs       ║"
echo "║  Premi Ctrl+C per fermare tutto              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

wait
