"""DTOs del panel de superadministrador."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.enums import UserRole


class DayPoint(BaseModel):
    day: str
    registrations: int
    tokens: int


class TopUser(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    tokens: int


class AdminStats(BaseModel):
    users_total: int
    users_active: int
    users_inactive: int
    registered_today: int
    registered_7d: int
    tokens_input: int
    tokens_output: int
    ai_calls: int
    tokens_today: int
    tokens_7d: int
    require_approval: bool
    series: list[DayPoint]
    top_users: list[TopUser]


class AdminUser(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    tokens: int
    last_activity: datetime | None
    conversations: int


class AdminUserPage(BaseModel):
    items: list[AdminUser]
    total: int
    page: int
    page_size: int


class SetActiveRequest(BaseModel):
    is_active: bool


class BulkActiveRequest(BaseModel):
    is_active: bool
    # Sin lista = TODOS los usuarios (menos superadmins).
    user_ids: list[uuid.UUID] | None = Field(default=None, max_length=1000)


class BulkActiveResult(BaseModel):
    updated: int


class AdminSettings(BaseModel):
    require_approval: bool
