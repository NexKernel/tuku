"""DTOs del tutor: conversaciones y mensajes."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import Difficulty, MessageRole, TutorStep


class StartConversationRequest(BaseModel):
    problem: str = Field(min_length=3, max_length=8000)
    title: str | None = Field(default=None, max_length=200)


class AdvanceRequest(BaseModel):
    message: str | None = Field(default=None, max_length=8000)
    hint_level: int | None = Field(default=None, ge=1, le=3)


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: MessageRole
    content: str
    step: TutorStep | None
    created_at: datetime


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    detected_subject: str | None
    detected_topic: str | None
    detected_difficulty: Difficulty | None
    current_step: TutorStep
    is_favorite: bool
    created_at: datetime


class ConversationDetail(ConversationRead):
    problem_statement: str | None
    messages: list[MessageRead]
