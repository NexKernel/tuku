"""Orquestador del Tutor Socrático.

Coordina el proveedor de IA, la máquina de estados de los caminos de pensamiento
(explorador, rápido y problema) y la persistencia de la conversación. Es la capa que la API invoca.
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums import MessageRole, TutorStep
from app.domain.models.tutor import Conversation, Message
from app.services.ai import ChatMessage, build_ai_provider
from app.services.ai.prompts import (
    FATIGUE_CLOSE_NOTE,
    FATIGUE_SHORTCUT_NOTE,
    FIRST_TURN_NOTE,
    build_step_instruction,
    build_system_prompt,
    confidence_note,
    confidence_steps,
    default_path_for,
    detect_fatigue,
    final_answer_step,
    min_answers,
    next_step,
    path_steps,
)
from app.services.review_service import ReviewService
from app.services.usage import record_usage

_HISTORY_LIMIT = 20


class TutorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.ai = build_ai_provider()

    async def start_conversation(
        self,
        user_id: uuid.UUID,
        problem: str,
        title: str | None = None,
        grade: int | None = None,
        path: str | None = None,
    ) -> Conversation:
        path = path or default_path_for(grade, problem)
        convo = Conversation(
            user_id=user_id,
            problem_statement=problem,
            title=title or _derive_title(problem),
            current_step=path_steps(path)[0],
            grade=grade,
            path=path,
        )
        self.db.add(convo)
        await self.db.flush()
        self.db.add(
            Message(
                conversation_id=convo.id,
                role=MessageRole.USER,
                content=problem,
                step=None,  # el reto inicial no cuenta como respuesta a un paso
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

    async def _answers_in_step(self, convo: Conversation) -> int:
        stmt = select(func.count()).where(
            Message.conversation_id == convo.id,
            Message.role == MessageRole.USER,
            Message.step == convo.current_step,
        )
        return (await self.db.execute(stmt)).scalar_one()

    async def _confidence(self, convo: Conversation, step: TutorStep) -> int | None:
        """Última seguridad que marcó el niño al responder en `step`."""
        stmt = (
            select(Message)
            .where(
                Message.conversation_id == convo.id,
                Message.role == MessageRole.USER,
                Message.step == step,
            )
            .order_by(Message.created_at.desc())
        )
        for msg in (await self.db.execute(stmt)).scalars():
            if msg.confidence:
                return msg.confidence
        return None

    async def advance(
        self,
        convo: Conversation,
        user_input: str | None = None,
        hint_level: int | None = None,
        confidence: int | None = None,
        tired: bool = False,
    ) -> Message:
        """Registra la respuesta del niño, avanza si el paso se cumplió y genera el turno del tutor.

        - Con respuesta: se guarda en el paso actual; si ya alcanzó las respuestas mínimas
          del paso, se pasa al siguiente y el tutor reacciona y plantea ese nuevo paso.
        - Con pista o sin texto: el tutor ayuda en el paso actual, sin avanzar. Pedir ayuda
          nunca salta el pensamiento del niño.
        - `confidence` (1-3) es cuán seguro dijo estar el niño de su respuesta.
        - Cansancio (botón "Me cansé" o frases como "muchas preguntas"): se salta al paso
          de la respuesta final (conclusión, o revisión en el camino problema). Mejor un reto corto terminado que un niño que abandona.
        """
        steps = path_steps(convo.path)
        final_step = final_answer_step(convo.path)
        fatigued = tired or detect_fatigue(user_input)
        # Antes de la respuesta final el cansancio toma un atajo; después, se avanza normal.
        shortcut = fatigued and steps.index(convo.current_step) < steps.index(final_step)
        if user_input:
            self.db.add(
                Message(
                    conversation_id=convo.id,
                    role=MessageRole.USER,
                    content=user_input,
                    step=convo.current_step,
                    meta={"confidence": confidence} if confidence else {},
                )
            )
            await self.db.flush()
            if not shortcut and await self._answers_in_step(convo) >= min_answers(
                convo.current_step, convo.path
            ):
                convo.current_step = next_step(convo.current_step, convo.path)
                if convo.current_step == TutorStep.TRANSFER:
                    # Reto completado: se repasará en unos días.
                    await ReviewService(self.db).schedule_first(convo)

        context: list[str] = []
        if shortcut:
            convo.current_step = final_step
            context.append(FATIGUE_SHORTCUT_NOTE)
        elif fatigued:
            context.append(FATIGUE_CLOSE_NOTE)

        history = await self._history(convo.id)
        ai_messages = [
            ChatMessage(
                role="assistant" if m.role == MessageRole.TUTOR else "user",
                content=m.content,
            )
            for m in history
        ]
        if convo.current_step == TutorStep.METACOGNITION:
            first, last = confidence_steps(convo.path)
            context.append(
                confidence_note(
                    await self._confidence(convo, first),
                    await self._confidence(convo, last),
                )
            )
        is_first_turn = not any(m.role == MessageRole.TUTOR for m in history)
        if is_first_turn and convo.current_step != TutorStep.CURIOSITY:
            context.append(FIRST_TURN_NOTE)
        instruction = build_step_instruction(
            convo.current_step, hint_level, "\n".join(c for c in context if c), convo.grade
        )
        ai_messages.append(ChatMessage(role="user", content=f"[INSTRUCCIÓN INTERNA] {instruction}"))

        completion = await self.ai.complete(
            system=build_system_prompt(convo.grade),
            messages=ai_messages,
            max_tokens=400,  # brevedad: la memoria de trabajo infantil es pequeña
            temperature=0.6,
        )

        tutor_msg = Message(
            conversation_id=convo.id,
            role=MessageRole.TUTOR,
            content=completion.text,
            step=convo.current_step,
            meta={
                "model": completion.model,
                "input_tokens": completion.input_tokens,
                "output_tokens": completion.output_tokens,
                "hint_level": hint_level,
                "fatigue": fatigued,
            },
        )
        self.db.add(tutor_msg)
        record_usage(self.db, convo.user_id, "tutor", completion)
        await self.db.flush()
        return tutor_msg


def _derive_title(problem: str) -> str:
    text = problem.strip().replace("\n", " ")
    return (text[:60] + "…") if len(text) > 60 else text or "Nuevo problema"
