"""Repaso espaciado de los retos completados.

Al completar un reto se programa un repaso para el día siguiente; al responderlo se
programa el siguiente con un intervalo mayor (1 → 3 → 7 días). Recuperar lo aprendido
con días de separación es una de las estrategias con más evidencia para la memoria
a largo plazo.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.enums import MessageRole
from app.domain.models.review import Review
from app.domain.models.tutor import Conversation, Message
from app.services.ai import ChatMessage, build_ai_provider
from app.services.ai.prompts import (
    REVIEW_FEEDBACK_INSTRUCTION,
    REVIEW_QUESTION_INSTRUCTION,
    REVIEW_ROUNDS,
    build_system_prompt,
)

# Días de espera antes de cada ronda (índice = ronda - 1).
REVIEW_INTERVALS_DAYS: tuple[int, ...] = (1, 3, 7)

_TRANSCRIPT_LIMIT = 16


def next_review_due(round_done: int, done_at: datetime) -> tuple[int, datetime] | None:
    """Ronda y fecha del siguiente repaso tras completar `round_done` (0 = el reto)."""
    if round_done >= len(REVIEW_INTERVALS_DAYS):
        return None
    return round_done + 1, done_at + timedelta(days=REVIEW_INTERVALS_DAYS[round_done])


class ReviewService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def schedule_first(self, convo: Conversation) -> None:
        """Programa la primera ronda de un reto recién completado (una sola vez)."""
        exists = await self.db.scalar(
            select(func.count()).where(Review.conversation_id == convo.id)
        )
        if exists:
            return
        nxt = next_review_due(0, datetime.now(UTC))
        assert nxt is not None
        self.db.add(
            Review(user_id=convo.user_id, conversation_id=convo.id, round=nxt[0], due_at=nxt[1])
        )

    async def due(self, user_id: uuid.UUID, limit: int = 5) -> list[Review]:
        stmt = (
            select(Review)
            .options(selectinload(Review.conversation))
            .join(Conversation, Conversation.id == Review.conversation_id)
            .where(
                Review.user_id == user_id,
                Review.completed_at.is_(None),
                Review.due_at <= datetime.now(UTC),
                Review.deleted_at.is_(None),
                Conversation.deleted_at.is_(None),
            )
            .order_by(Review.due_at)
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def completed_count(self, user_id: uuid.UUID) -> int:
        return await self.db.scalar(
            select(func.count()).where(
                Review.user_id == user_id, Review.completed_at.is_not(None)
            )
        ) or 0

    async def get(self, review_id: uuid.UUID, user_id: uuid.UUID) -> Review | None:
        return await self.db.scalar(
            select(Review)
            .options(selectinload(Review.conversation))
            .where(
                Review.id == review_id,
                Review.user_id == user_id,
                Review.deleted_at.is_(None),
            )
        )

    async def start(self, review: Review) -> Review:
        """Genera (una sola vez) la pregunta de recuperación de esta ronda."""
        if review.question:
            return review
        convo = review.conversation
        instruction = REVIEW_QUESTION_INSTRUCTION.format(
            round_goal=REVIEW_ROUNDS.get(review.round, REVIEW_ROUNDS[1]),
            transcript=await self._transcript(review.conversation_id),
        )
        review.question = await self._ask(convo, instruction, max_tokens=250)
        await self.db.flush()
        return review

    async def answer(self, review: Review, answer: str) -> Review:
        """Guarda la respuesta, da retroalimentación y programa la siguiente ronda."""
        if review.completed_at:
            return review
        convo = review.conversation
        instruction = REVIEW_FEEDBACK_INSTRUCTION.format(
            question=review.question or "",
            answer=answer,
            transcript=await self._transcript(review.conversation_id),
        )
        review.answer = answer
        review.feedback = await self._ask(convo, instruction, max_tokens=300)
        review.completed_at = datetime.now(UTC)

        nxt = next_review_due(review.round, review.completed_at)
        if nxt:
            self.db.add(
                Review(
                    user_id=review.user_id,
                    conversation_id=review.conversation_id,
                    round=nxt[0],
                    due_at=nxt[1],
                )
            )
        await self.db.flush()
        return review

    async def _transcript(self, convo_id: uuid.UUID) -> str:
        stmt = (
            select(Message)
            .where(Message.conversation_id == convo_id)
            .order_by(Message.created_at.desc())
            .limit(_TRANSCRIPT_LIMIT)
        )
        rows = reversed((await self.db.execute(stmt)).scalars().all())
        return "\n".join(
            f"{'Tuku' if m.role == MessageRole.TUTOR else 'Niño'}: {m.content}" for m in rows
        )

    async def _ask(self, convo: Conversation | None, instruction: str, max_tokens: int) -> str:
        completion = await build_ai_provider().complete(
            system=build_system_prompt(convo.grade if convo else None),
            messages=[ChatMessage(role="user", content=f"[INSTRUCCIÓN INTERNA] {instruction}")],
            max_tokens=max_tokens,
            temperature=0.6,
        )
        return completion.text
