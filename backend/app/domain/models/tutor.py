"""Conversaciones del tutor, mensajes e intentos de resolución."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.base import Entity
from app.domain.enums import Difficulty, MessageRole, TutorStep

if TYPE_CHECKING:
    from app.domain.models.user import User


class Conversation(Entity):
    """Una sesión de tutoría alrededor de un problema. Mantiene el paso actual del flujo."""

    __tablename__ = "conversations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200), default="Nuevo problema", nullable=False)
    problem_statement: Mapped[str | None] = mapped_column(Text, nullable=True)
    detected_subject: Mapped[str | None] = mapped_column(String(80), nullable=True)
    detected_topic: Mapped[str | None] = mapped_column(String(160), nullable=True)
    detected_subtopic: Mapped[str | None] = mapped_column(String(160), nullable=True)
    detected_difficulty: Mapped[Difficulty | None] = mapped_column(
        Enum(Difficulty, name="difficulty"), nullable=True
    )
    current_step: Mapped[TutorStep] = mapped_column(
        Enum(TutorStep, name="tutor_step"), default=TutorStep.DETECT_TOPIC, nullable=False
    )
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="conversations")
    messages: Mapped[list[Message]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Entity):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole, name="message_role"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    step: Mapped[TutorStep | None] = mapped_column(
        Enum(TutorStep, name="tutor_step"), nullable=True
    )
    # Metadatos del turno: pista usada, tiempo, tokens, etc.
    meta: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class Attempt(Entity):
    """Registro de desempeño: resultado del estudiante frente a un problema."""

    __tablename__ = "attempts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )
    question_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("questions.id", ondelete="SET NULL"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
