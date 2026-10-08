"""Fábrica que resuelve el proveedor de IA según la configuración.

Si el proveedor elegido no tiene API key, cae con gracia a `EchoProvider` para que
la plataforma siga siendo ejecutable en desarrollo.

El proveedor es un singleton por proceso: así el cliente HTTP reutiliza sus conexiones
(TLS incluido) entre peticiones, y un único semáforo limita las llamadas simultáneas.
"""

from __future__ import annotations

import asyncio
import logging
from functools import lru_cache

from app.core.config import settings
from app.services.ai.base import AICompletion, AIProvider, ChatMessage
from app.services.ai.echo_provider import EchoProvider

logger = logging.getLogger(__name__)


class AIUnavailableError(Exception):
    """La IA no pudo responder: cola llena, timeout o error del proveedor."""


class _LimitedProvider:
    """Envuelve un proveedor con un tope de concurrencia y errores uniformes.

    En un pico (un aula entera escribiendo a la vez) los turnos esperan su hueco en vez de
    lanzar cientos de llamadas que el proveedor rechazaría con 429.
    """

    def __init__(self, inner: AIProvider, max_concurrency: int, queue_timeout: float) -> None:
        self._inner = inner
        self._slots = asyncio.Semaphore(max_concurrency)
        self._queue_timeout = queue_timeout
        self.model = inner.model

    async def complete(
        self,
        *,
        system: str,
        messages: list[ChatMessage],
        max_tokens: int = 1024,
        temperature: float = 0.4,
    ) -> AICompletion:
        try:
            await asyncio.wait_for(self._slots.acquire(), self._queue_timeout)
        except TimeoutError as exc:
            logger.warning("Cola de IA llena: %ss sin hueco libre.", self._queue_timeout)
            raise AIUnavailableError("Cola de IA llena.") from exc
        try:
            return await self._inner.complete(
                system=system, messages=messages, max_tokens=max_tokens, temperature=temperature
            )
        except Exception as exc:  # errores del SDK (429 tras reintentos, 5xx, timeout)
            logger.exception("Fallo del proveedor de IA (%s).", self.model)
            raise AIUnavailableError(str(exc)) from exc
        finally:
            self._slots.release()


def _resolve_provider() -> AIProvider:
    provider = settings.AI_PROVIDER

    if provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        from app.services.ai.anthropic_provider import AnthropicProvider

        return AnthropicProvider(settings.ANTHROPIC_API_KEY, settings.AI_MODEL)

    if provider == "openai" and settings.OPENAI_API_KEY:
        from app.services.ai.openai_provider import OpenAIProvider

        return OpenAIProvider(settings.OPENAI_API_KEY, settings.AI_MODEL)

    if provider == "deepseek" and settings.DEEPSEEK_API_KEY:
        # DeepSeek expone una API compatible con OpenAI: reutilizamos el mismo SDK
        # cambiando solo el base_url.
        from app.services.ai.openai_provider import OpenAIProvider

        return OpenAIProvider(
            settings.DEEPSEEK_API_KEY,
            settings.AI_MODEL,
            base_url=settings.DEEPSEEK_BASE_URL,
        )

    # Espacio para Gemini — misma interfaz `AIProvider`.

    if provider != "echo":
        logger.warning(
            "Proveedor de IA '%s' sin API key. Usando EchoProvider (modo demo).", provider
        )
    return EchoProvider()


@lru_cache
def build_ai_provider() -> AIProvider:
    inner = _resolve_provider()
    if isinstance(inner, EchoProvider):
        return inner
    return _LimitedProvider(inner, settings.AI_MAX_CONCURRENCY, settings.AI_QUEUE_TIMEOUT)
