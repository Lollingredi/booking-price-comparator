"""
Email notification service using SendGrid HTTP API.

Requires SENDGRID_API_KEY env var to be set. If not configured,
emails are silently skipped (logged as warning on first attempt).
"""
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send"
_warned = False


async def send_alert_email(
    to_email: str,
    subject: str,
    body_html: str,
) -> bool:
    """Send an email via SendGrid. Returns True on success, False on failure."""
    global _warned

    if not settings.SENDGRID_API_KEY:
        if not _warned:
            logger.warning(
                "SENDGRID_API_KEY non configurata — le notifiche email sono disabilitate. "
                "Imposta SENDGRID_API_KEY nelle variabili d'ambiente per attivare le email."
            )
            _warned = True
        return False

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": settings.FROM_EMAIL, "name": "RateScope Alert"},
        "subject": subject,
        "content": [{"type": "text/html", "value": body_html}],
    }
    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(_SENDGRID_URL, json=payload, headers=headers)
        if resp.status_code in (200, 201, 202):
            logger.info("Email inviata a %s: %s", to_email, subject)
            return True
        logger.error(
            "SendGrid error %d per %s: %s",
            resp.status_code, to_email, resp.text[:200],
        )
        return False
    except Exception as exc:
        logger.error("Errore invio email a %s: %s", to_email, exc)
        return False


def build_alert_html(message: str, severity: str) -> str:
    """Build a simple HTML email body for an alert notification."""
    color_map = {
        "danger": "#E24B4A",
        "warning": "#D85A30",
        "info": "#1D9E75",
    }
    color = color_map.get(severity, "#1D9E75")
    severity_label = {"danger": "Critico", "warning": "Attenzione", "info": "Info"}.get(severity, severity)

    return f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="border-left: 4px solid {color}; padding: 16px 20px; background: #f9fafb; border-radius: 8px;">
    <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: {color}; font-weight: 600;">
      {severity_label}
    </p>
    <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
      {message}
    </p>
  </div>
  <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
    RateScope — Rate Shopping per Albergatori
  </p>
</body>
</html>"""
