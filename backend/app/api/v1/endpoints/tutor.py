"""Endpoints del Tutor Socrático."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AITurnLimit, CurrentUser, DbSession
from app.domain.models.tutor import Conversation
from app.schemas.tutor import (
    AdvanceRequest,
    ConversationDetail,
    ConversationRead,
    MessageRead,
    StartConversationRequest,
)
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/tutor", tags=["Tutor IA"])


@router.get("/conversations", response_model=list[ConversationRead])
async def list_conversations(user: CurrentUser, db: DbSession) -> list[ConversationRead]:
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == user.id, Conversation.deleted_at.is_(None))
        .order_by(Conversation.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [ConversationRead.model_validate(c) for c in rows]


@router.post(
    "/conversations",
    response_model=ConversationDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[AITurnLimit],
)
async def start_conversation(
    data: StartConversationRequest, user: CurrentUser, db: DbSession
) -> ConversationDetail:
    service = TutorService(db)
    convo = await service.start_conversation(
        user.id, data.problem, data.title, data.grade, data.path
    )
    await service.advance(convo)  # primer turno del tutor
    # Commit antes de responder: el cierre de get_db corre DESPUÉS de enviar la respuesta,
    # y la siguiente petición del cliente podría leer el estado anterior.
    await db.commit()
    await db.refresh(convo, ["messages"])
    return ConversationDetail.model_validate(convo)


@router.get("/conversations/{convo_id}", response_model=ConversationDetail)
async def get_conversation(
    convo_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> ConversationDetail:
    service = TutorService(db)
    convo = await service.get_conversation(convo_id, user.id)
    if convo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversación no encontrada.")
    await db.refresh(convo, ["messages"])
    return ConversationDetail.model_validate(convo)


@router.post(
    "/conversations/{convo_id}/advance", response_model=MessageRead, dependencies=[AITurnLimit]
)
async def advance_conversation(
    convo_id: uuid.UUID, data: AdvanceRequest, user: CurrentUser, db: DbSession
) -> MessageRead:
    service = TutorService(db)
    convo = await service.get_conversation(convo_id, user.id)
    if convo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversación no encontrada.")
    msg = await service.advance(
        convo, data.message, data.hint_level, data.confidence, tired=data.tired
    )
    # Commit antes de responder: el cierre de get_db corre DESPUÉS de enviar la respuesta,
    # y la siguiente petición del cliente podría leer el estado anterior.
    await db.commit()
    return MessageRead.model_validate(msg)
