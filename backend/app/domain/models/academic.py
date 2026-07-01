"""Catálogo académico: materias, temas, subtemas y banco de preguntas."""

from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.base import Entity
from app.domain.enums import Difficulty


class Subject(Entity):
    __tablename__ = "subjects"

    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(40), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    topics: Mapped[list[Topic]] = relationship(
        back_populates="subject", cascade="all, delete-orphan"
    )


class Topic(Entity):
    __tablename__ = "topics"
    __table_args__ = (UniqueConstraint("subject_id", "slug", name="uq_topic_subject_slug"),)

    subject_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)

    subject: Mapped[Subject] = relationship(back_populates="topics")
    subtopics: Mapped[list[Subtopic]] = relationship(
        back_populates="topic", cascade="all, delete-orphan"
    )


class Subtopic(Entity):
    __tablename__ = "subtopics"
    __table_args__ = (UniqueConstraint("topic_id", "slug", name="uq_subtopic_topic_slug"),)

    topic_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), nullable=False)

    topic: Mapped[Topic] = relationship(back_populates="subtopics")


class Question(Entity):
    """Ítem del banco de preguntas. `alternatives` y `tags` son JSONB flexibles."""

    __tablename__ = "questions"

    subject_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="RESTRICT"), index=True
    )
    topic_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    subtopic_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("subtopics.id", ondelete="SET NULL"), nullable=True
    )
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, name="difficulty"), default=Difficulty.INTERMEDIATE, nullable=False
    )
    competency: Mapped[str | None] = mapped_column(String(200), nullable=True)
    suggested_seconds: Mapped[int] = mapped_column(Integer, default=90, nullable=False)
    correct_answer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    alternatives: Mapped[list | None] = mapped_column(JSONB, default=list)
    tags: Mapped[list | None] = mapped_column(JSONB, default=list)
    source: Mapped[str | None] = mapped_column(String(200), nullable=True)
