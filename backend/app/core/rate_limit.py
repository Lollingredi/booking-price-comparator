import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status


_lock = threading.Lock()
_calls: dict[str, list[float]] = defaultdict(list)


def rate_limit(max_calls: int, window_seconds: int):
    """Return a FastAPI dependency that enforces per-IP rate limiting.

    Args:
        max_calls: Maximum number of requests allowed per IP in the window.
        window_seconds: Rolling time window in seconds.
    """
    def check(request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        key = f"{request.url.path}:{ip}"
        now = time.monotonic()
        cutoff = now - window_seconds
        with _lock:
            _calls[key] = [t for t in _calls[key] if t > cutoff]
            if len(_calls[key]) >= max_calls:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Troppi tentativi. Riprova tra {window_seconds} secondi.",
                )
            _calls[key].append(now)
    return check
