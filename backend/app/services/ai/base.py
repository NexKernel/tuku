"""Contrato común para cualquier proveedor de IA.

La aplicación nunca importa un SDK concreto: depende de esta interfaz. Cambiar de
Anthropic a OpenAI o Gemini es cuestión de implementar `AIProvider` y registrarlo
en la fábrica.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(slots=True)
class ChatMessage:
    role: str  # "user" | "assistant" | "system"
    content: str


@dataclass(slots=True)
class AICompletion:
    text: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0


@runtime_checkable
class AIProvider(Protocol):
    """Proveedor de generación de texto."""

    model: str

    async def complete(
        self,
        *,
        system: str,
        messages: list[ChatMessage],
        max_tokens: int = 1024,
        temperature: float = 0.4,
    ) -> AICompletion: ...
