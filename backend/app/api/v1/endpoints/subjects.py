"""Catálogo de materias (lectura pública para usuarios autenticados)."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.domain.models.academic import Subject

router = APIRouter(prefix="/subjects", tags=["Catálogo académico"])


class SubjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    icon: str | None
    color: str | None
    created_at: datetime


@router.get("", response_model=list[SubjectRead])
async def list_subjects(_: CurrentUser, db: DbSession) -> list[SubjectRead]:
    stmt = (
        select(Subject)
        .where(Subject.deleted_at.is_(None))
        .order_by(Subject.order, Subject.name)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [SubjectRead.model_validate(s) for s in rows]
