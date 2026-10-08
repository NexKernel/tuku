"""DTOs del tutor: conversaciones y mensajes."""

from __future__ import annotations

import uuid
from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import Difficulty, MessageRole, TutorStep


class StartConversationRequest(BaseModel):
    problem: str = Field(min_length=3, max_length=8000)
    title: str | None = Field(default=None, max_length=200)
    grade: int | None = Field(default=None, ge=1, le=6)
    # Sin elegir: problema con números → "problem"; 1.º-2.º → "quick"; resto → "full".
    path: Literal["quick", "full", "problem"] | None = None


class AdvanceRequest(BaseModel):
    message: str | None = Field(default=None, max_length=8000)
    hint_level: int | None = Field(default=None, ge=1, le=3)
    # Cuán seguro está el niño de su respuesta: 1 poco, 2 más o menos, 3 muy seguro.
    confidence: int | None = Field(default=None, ge=1, le=3)
    # El niño pulsó "Me cansé": se acorta el camino hasta la conclusión.
    tired: bool = False


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: MessageRole
    content: str
    step: TutorStep | None
    confidence: int | None = None
    created_at: datetime


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    detected_subject: str | None
    detected_topic: str | None
    detected_difficulty: Difficulty | None
    current_step: TutorStep
    grade: int | None
    path: str
    is_favorite: bool
    created_at: datetime


class ConversationDetail(ConversationRead):
    problem_statement: str | None
    messages: list[MessageRead]


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    conversation_title: str
    round: int
    due_at: datetime
    question: str | None
    answer: str | None
    feedback: str | None
    completed_at: datetime | None


class ReviewOverview(BaseModel):
    due: list[ReviewRead]
    completed: int


class ReviewAnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=4000)
