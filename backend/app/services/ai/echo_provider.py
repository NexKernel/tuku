"""Proveedor de desarrollo sin API key.

Simula a Tuku, el tutor Socrático de primaria, para poder ejecutar la plataforma end-to-end
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
            (
                m.content
                for m in reversed(messages)
                if m.role == "user" and not m.content.startswith("[INSTRUCCIÓN INTERNA]")
            ),
            "",
        )
        instruction = messages[-1].content if messages else ""
        if "MODO REPASO" in instruction:
            if "El niño respondió" in instruction:
                text = (
                    "🦉 ¡Recordaste muy bien tu porqué! Cada vez que recuerdas algo, "
                    "tu cerebro lo guarda con más fuerza. 💪"
                )
            else:
                text = (
                    "🦉 ¡Qué gusto verte otra vez! Hace unos días pensamos juntos.\n\n"
                    "**¿Recuerdas a qué conclusión llegaste y por qué?**"
                )
            text += "\n\n_(Respuesta simulada — configura una API key de IA para el tutor real.)_"
            return AICompletion(text=text, model=self.model, output_tokens=len(text) // 4)
        text = (
            "🦉 ¡Qué interesante lo que me cuentas!\n\n"
            f"Leí: _{last_user[:120]}_\n\n"
            "Antes de buscar la respuesta, quiero escucharte a ti.\n\n"
            "**¿Qué te hace pensar eso?**\n\n"
            "_(Respuesta simulada — configura una API key de IA para el tutor real.)_\n"
            "OPCIONES: Lo vi en casa | Me lo contaron | Lo imaginé"
        )
        return AICompletion(text=text, model=self.model, output_tokens=len(text) // 4)
