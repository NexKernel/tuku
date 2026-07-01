"""Orquestador del Tutor Socrático.

Coordina el proveedor de IA, la máquina de estados de 15 pasos y la persistencia
de la conversación. Es la capa que la API invoca.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums import MessageRole, TutorStep
from app.domain.models.tutor import Conversation, Message
from app.services.ai import ChatMessage, build_ai_provider
from app.services.ai.prompts import (
    TUTOR_SYSTEM_PROMPT,
    build_step_instruction,
    next_step,
)

_HISTORY_LIMIT = 20


class TutorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.ai = build_ai_provider()

    async def start_conversation(
        self, user_id: uuid.UUID, problem: str, title: str | None = None
    ) -> Conversation:
        convo = Conversation(
            user_id=user_id,
            problem_statement=problem,
            title=title or _derive_title(problem),
            current_step=TutorStep.DETECT_TOPIC,
        )
        self.db.add(convo)
        await self.db.flush()
        self.db.add(
            Message(
                conversation_id=convo.id,
                role=MessageRole.USER,
                content=problem,
                step=TutorStep.DETECT_TOPIC,
            )
        )
        await self.db.flush()
        return convo

    async def get_conversation(
        self, convo_id: uuid.UUID, user_id: uuid.UUID
    ) -> Conversation | None:
        stmt = select(Conversation).where(
            Conversation.id == convo_id,
            Conversation.user_id == user_id,
            Conversation.deleted_at.is_(None),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def _history(self, convo_id: uuid.UUID) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == convo_id)
            .order_by(Message.created_at.desc())
            .limit(_HISTORY_LIMIT)
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        return list(reversed(rows))

    async def advance(
        self,
        convo: Conversation,
        user_input: str | None = None,
        hint_level: int | None = None,
    ) -> Message:
        """Genera la respuesta del tutor para el paso actual y avanza la máquina de estados."""
        if user_input:
            self.db.add(
                Message(
                    conversation_id=convo.id,
                    role=MessageRole.USER,
                    content=user_input,
                    step=convo.current_step,
                )
            )
            await self.db.flush()

        history = await self._history(convo.id)
        ai_messages = [
            ChatMessage(
                role="assistant" if m.role == MessageRole.TUTOR else "user",
                content=m.content,
            )
            for m in history
        ]
        instruction = build_step_instruction(convo.current_step, hint_level)
        ai_messages.append(ChatMessage(role="user", content=f"[INSTRUCCIÓN INTERNA] {instruction}"))

        completion = await self.ai.complete(
            system=TUTOR_SYSTEM_PROMPT,
            messages=ai_messages,
            max_tokens=1200,
            temperature=0.4,
        )

        tutor_msg = Message(
            conversation_id=convo.id,
            role=MessageRole.TUTOR,
            content=completion.text,
            step=convo.current_step,
            meta={
                "model": completion.model,
                "output_tokens": completion.output_tokens,
                "hint_level": hint_level,
            },
        )
        self.db.add(tutor_msg)

        # Avanza salvo que el paso se detenga a esperar al estudiante.
        if convo.current_step not in (TutorStep.SOCRATIC_QUESTIONS, TutorStep.AWAIT_RESPONSE):
            convo.current_step = next_step(convo.current_step)
        elif user_input:
            convo.current_step = next_step(convo.current_step)

        await self.db.flush()
        return tutor_msg


def _derive_title(problem: str) -> str:
    text = problem.strip().replace("\n", " ")
    return (text[:60] + "…") if len(text) > 60 else text or "Nuevo problema"
