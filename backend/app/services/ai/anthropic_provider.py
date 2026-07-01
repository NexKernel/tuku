"""Implementación de AIProvider sobre el SDK de Anthropic (Claude)."""

from __future__ import annotations

from anthropic import AsyncAnthropic

from app.services.ai.base import AICompletion, ChatMessage


class AnthropicProvider:
    def __init__(self, api_key: str, model: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def complete(
        self,
        *,
        system: str,
        messages: list[ChatMessage],
        max_tokens: int = 1024,
        temperature: float = 0.4,
    ) -> AICompletion:
        # Anthropic separa el `system` del historial; los roles válidos son user/assistant.
        payload = [
            {"role": "assistant" if m.role in ("assistant", "tutor") else "user",
             "content": m.content}
            for m in messages
        ]
        resp = await self._client.messages.create(
            model=self.model,
            system=system,
            messages=payload,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        text = "".join(block.text for block in resp.content if block.type == "text")
        return AICompletion(
            text=text,
            model=self.model,
            input_tokens=resp.usage.input_tokens,
            output_tokens=resp.usage.output_tokens,
        )
