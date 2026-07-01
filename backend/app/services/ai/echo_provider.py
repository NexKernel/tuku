"""Proveedor de desarrollo sin API key.

Simula un tutor Socrático coherente para poder ejecutar la plataforma end-to-end
sin credenciales. Útil en CI, demos y desarrollo local.
"""

from __future__ import annotations

from app.services.ai.base import AICompletion, ChatMessage


class EchoProvider:
    model = "echo-dev"

    async def complete(
        self,
        *,
        system: str,
        messages: list[ChatMessage],
        max_tokens: int = 1024,
        temperature: float = 0.4,
    ) -> AICompletion:
        last_user = next(
            (m.content for m in reversed(messages) if m.role == "user"), ""
        )
        text = (
            "🧭 **Antes de resolver, pensemos juntos.**\n\n"
            f"Leí tu planteamiento: _{last_user[:160]}_\n\n"
            "1. ¿Qué te están pidiendo exactamente encontrar?\n"
            "2. ¿Qué datos tienes y cuál es la relación entre ellos?\n"
            "3. ¿Qué concepto crees que conecta esos datos con lo que buscas?\n\n"
            "Responde con tu razonamiento y avanzamos paso a paso. "
            "_(Respuesta simulada — configura una API key de IA para el tutor real.)_"
        )
        return AICompletion(text=text, model=self.model, output_tokens=len(text) // 4)
