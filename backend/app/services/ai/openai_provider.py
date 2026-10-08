"""Implementación de AIProvider sobre el SDK de OpenAI."""

from __future__ import annotations

from openai import AsyncOpenAI

from app.core.config import settings
from app.services.ai.base import AICompletion, ChatMessage


class OpenAIProvider:
    def __init__(self, api_key: str, model: str, base_url: str | None = None) -> None:
        self._client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=settings.AI_REQUEST_TIMEOUT,
            max_retries=settings.AI_MAX_RETRIES,  # reintenta 429/5xx con backoff
        )
        self.model = model

    async def complete(
        self,
        *,
        system: str,
        messages: list[ChatMessage],
        max_tokens: int = 1024,
        temperature: float = 0.4,
    ) -> AICompletion:
        payload = [{"role": "system", "content": system}]
        payload += [
            {
                "role": "assistant" if m.role in ("assistant", "tutor") else "user",
                "content": m.content,
            }
            for m in messages
        ]
        resp = await self._client.chat.completions.create(
            model=self.model,
            messages=payload,  # type: ignore[arg-type]
            max_tokens=max_tokens,
            temperature=temperature,
        )
        text = resp.choices[0].message.content or ""
        usage = resp.usage
        return AICompletion(
            text=text,
            model=self.model,
            input_tokens=usage.prompt_tokens if usage else 0,
            output_tokens=usage.completion_tokens if usage else 0,
        )
