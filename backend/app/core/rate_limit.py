"""Límite de peticiones por ventana fija de 60 s, compartido entre workers vía Redis.

Si Redis no responde, se deja pasar (fail-open): es preferible no limitar unos minutos
a dejar a todo un colegio sin poder entrar.
"""

from __future__ import annotations

import logging
import time

from fastapi import HTTPException, status
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger(__name__)

_WINDOW = 60
# Tras un fallo de Redis no se reintenta durante este tiempo (evita sumar latencia).
_BACKOFF = 30.0

_redis: Redis | None = None
_down_until = 0.0


def _client() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(
            settings.REDIS_URL, socket_connect_timeout=0.5, socket_timeout=0.5
        )
    return _redis


async def enforce(bucket: str, key: str, limit: int, message: str) -> None:
    """Lanza 429 si `key` superó `limit` peticiones en el minuto actual."""
    global _down_until
    if not settings.RATE_LIMIT_ENABLED or limit <= 0 or time.monotonic() < _down_until:
        return
    window = int(time.time()) // _WINDOW
    redis_key = f"rl:{bucket}:{key}:{window}"
    try:
        pipe = _client().pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, _WINDOW)
        count, _ = await pipe.execute()
    except (RedisError, OSError):
        logger.warning("Redis no disponible: límite de peticiones desactivado %ss.", _BACKOFF)
        _down_until = time.monotonic() + _BACKOFF
        return
    if count > limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            message,
            headers={"Retry-After": str(_WINDOW - int(time.time()) % _WINDOW)},
        )
