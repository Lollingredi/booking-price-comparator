from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "ratescope",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.periodic"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Rome",
    enable_utc=True,
    beat_schedule={
        "fetch-rates-every-6h": {
            "task": "app.tasks.periodic.fetch_all_rates",
            "schedule": crontab(hour="*/6", minute=0),
        },
    },
    worker_redirect_stdouts_level="INFO",
)
