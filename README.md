# RateScope — Rate Shopping SaaS per Albergatori

Monitoraggio prezzi competitor su OTA (Booking.com, Expedia, Hotels.com, Agoda) per piccoli albergatori italiani.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4
- **Backend**: Python FastAPI + SQLAlchemy (async) + PostgreSQL
- **Task Queue**: Celery + Redis
- **Rate API**: [Xotelo](https://data.xotelo.com/api)
- **Auth**: JWT (access + refresh token)
- **Deploy**: Vercel (frontend) + Render (backend + DB + Redis)

## Struttura

```
ratescope/
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── api/       # Endpoints: auth, hotels, rates, alerts
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Xotelo client, rate fetcher, alert engine
│   │   └── tasks/     # Celery periodic tasks
│   └── alembic/       # DB migrations
└── frontend/          # React SPA
    └── src/
        ├── api/        # Axios API clients
        ├── components/ # UI components
        ├── contexts/   # Auth context
        ├── hooks/      # Custom hooks
        ├── pages/      # Dashboard, Competitors, Alerts
        └── types/      # TypeScript interfaces
```

## Setup Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, SECRET_KEY

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# Start Celery beat (scheduler)
celery -A app.tasks.celery_app beat --loglevel=info
```

## Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrazione |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Profilo utente |
| POST | `/api/hotels` | Crea/aggiorna hotel |
| GET | `/api/hotels/mine` | Il tuo hotel + competitor |
| POST | `/api/hotels/competitors` | Aggiungi competitor |
| DELETE | `/api/hotels/competitors/{id}` | Rimuovi competitor |
| GET | `/api/hotels/search?q=` | Cerca hotel su Xotelo |
| GET | `/api/rates/current` | Prezzi attuali |
| GET | `/api/rates/history` | Storico prezzi |
| GET | `/api/rates/comparison` | Tabella comparazione |
| GET | `/api/alerts/rules` | Lista regole alert |
| POST | `/api/alerts/rules` | Crea regola |
| PUT | `/api/alerts/rules/{id}` | Aggiorna regola |
| DELETE | `/api/alerts/rules/{id}` | Elimina regola |
| GET | `/api/alerts/log` | Storico alert |
| PUT | `/api/alerts/log/{id}/read` | Segna come letto |
