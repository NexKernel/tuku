"""Fábrica que resuelve el proveedor de IA según la configuración.

Si el proveedor elegido no tiene API key, cae con gracia a `EchoProvider` para que
la plataforma siga siendo ejecutable en desarrollo.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.echo_provider import EchoProvider

logger = logging.getLogger(__name__)


def build_ai_provider() -> AIProvider:
    provider = settings.AI_PROVIDER

    if provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        from app.services.ai.anthropic_provider import AnthropicProvider

        return AnthropicProvider(settings.ANTHROPIC_API_KEY, settings.AI_MODEL)

    if provider == "openai" and settings.OPENAI_API_KEY:
        from app.services.ai.openai_provider import OpenAIProvider

        return OpenAIProvider(settings.OPENAI_API_KEY, settings.AI_MODEL)

    # Espacio para Gemini — misma interfaz `AIProvider`.

    if provider != "echo":
        logger.warning(
            "Proveedor de IA '%s' sin API key. Usando EchoProvider (modo demo).", provider
        )
    return EchoProvider()
