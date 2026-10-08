"""Protecciones para picos de uso: cola de IA y límite de peticiones."""

import asyncio

import pytest
from fastapi import HTTPException

from app.core import rate_limit
from app.services.ai.base import AICompletion, ChatMessage
from app.services.ai.factory import AIUnavailableError, _LimitedProvider


class _SlowProvider:
    model = "slow"

    def __init__(self, delay: float = 0.0, fail: bool = False) -> None:
        self.delay = delay
        self.fail = fail
        self.active = 0
        self.peak = 0

    async def complete(self, **_: object) -> AICompletion:
        self.active += 1
        self.peak = max(self.peak, self.active)
        try:
            await asyncio.sleep(self.delay)
            if self.fail:
                raise RuntimeError("429 Too Many Requests")
            return AICompletion(text="ok", model=self.model)
        finally:
            self.active -= 1


_MSG = [ChatMessage(role="user", content="hola")]


def test_ai_concurrency_is_capped() -> None:
    asyncio.run(_test_ai_concurrency_is_capped())


async def _test_ai_concurrency_is_capped() -> None:
    inner = _SlowProvider(delay=0.02)
    provider = _LimitedProvider(inner, max_concurrency=3, queue_timeout=5)
    results = await asyncio.gather(*(provider.complete(system="", messages=_MSG) for _ in range(20)))
    assert all(r.text == "ok" for r in results)
    assert inner.peak == 3


def test_ai_queue_timeout_raises_unavailable() -> None:
    asyncio.run(_test_ai_queue_timeout_raises_unavailable())


async def _test_ai_queue_timeout_raises_unavailable() -> None:
    provider = _LimitedProvider(_SlowProvider(delay=0.5), max_concurrency=1, queue_timeout=0.05)
    first = asyncio.create_task(provider.complete(system="", messages=_MSG))
    await asyncio.sleep(0.01)
    with pytest.raises(AIUnavailableError):
        await provider.complete(system="", messages=_MSG)
    await first


def test_ai_provider_errors_are_wrapped_and_release_slot() -> None:
    asyncio.run(_test_ai_provider_errors_are_wrapped_and_release_slot())


async def _test_ai_provider_errors_are_wrapped_and_release_slot() -> None:
    provider = _LimitedProvider(_SlowProvider(fail=True), max_concurrency=1, queue_timeout=0.1)
    for _ in range(3):  # si el hueco no se liberase, la 2.ª llamada daría timeout de cola
        with pytest.raises(AIUnavailableError, match="429"):
            await provider.complete(system="", messages=_MSG)


class _FakePipe:
    def __init__(self, store: dict[str, int]) -> None:
        self.store = store
        self.key = ""

    def incr(self, key: str) -> None:
        self.key = key

    def expire(self, *_: object) -> None:
        pass

    async def execute(self) -> list[object]:
        self.store[self.key] = self.store.get(self.key, 0) + 1
        return [self.store[self.key], True]


class _FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, int] = {}

    def pipeline(self) -> _FakePipe:
        return _FakePipe(self.store)


def test_rate_limit_blocks_after_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    asyncio.run(_test_rate_limit_blocks_after_limit(monkeypatch))


async def _test_rate_limit_blocks_after_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rate_limit, "_redis", _FakeRedis())
    monkeypatch.setattr(rate_limit, "_down_until", 0.0)
    for _ in range(3):
        await rate_limit.enforce("t", "nino", 3, "espera")
    with pytest.raises(HTTPException) as exc:
        await rate_limit.enforce("t", "nino", 3, "espera")
    assert exc.value.status_code == 429
    await rate_limit.enforce("t", "otro-nino", 3, "espera")  # cada clave tiene su cupo


def test_rate_limit_fails_open_without_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    asyncio.run(_test_rate_limit_fails_open_without_redis(monkeypatch))


async def _test_rate_limit_fails_open_without_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Down:
        def pipeline(self) -> None:
            raise OSError("connection refused")

    monkeypatch.setattr(rate_limit, "_redis", _Down())
    monkeypatch.setattr(rate_limit, "_down_until", 0.0)
    for _ in range(50):
        await rate_limit.enforce("t", "nino", 1, "espera")
    assert rate_limit._down_until > 0
