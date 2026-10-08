"""Endpoints del repaso espaciado."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AITurnLimit, CurrentUser, DbSession
from app.domain.models.review import Review
from app.schemas.tutor import ReviewAnswerRequest, ReviewOverview, ReviewRead
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Repaso"])


def _read(review: Review) -> ReviewRead:
    return ReviewRead(
        id=review.id,
        conversation_id=review.conversation_id,
        conversation_title=review.conversation.title,
        round=review.round,
        due_at=review.due_at,
        question=review.question,
        answer=review.answer,
        feedback=review.feedback,
        completed_at=review.completed_at,
    )


async def _owned(service: ReviewService, review_id: uuid.UUID, user_id: uuid.UUID) -> Review:
    review = await service.get(review_id, user_id)
    if review is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Repaso no encontrado.")
    return review


@router.get("", response_model=ReviewOverview)
async def overview(user: CurrentUser, db: DbSession) -> ReviewOverview:
    service = ReviewService(db)
    due = await service.due(user.id)
    return ReviewOverview(
        due=[_read(r) for r in due], completed=await service.completed_count(user.id)
    )


@router.post("/{review_id}/start", response_model=ReviewRead, dependencies=[AITurnLimit])
async def start_review(review_id: uuid.UUID, user: CurrentUser, db: DbSession) -> ReviewRead:
    service = ReviewService(db)
    review = await _owned(service, review_id, user.id)
    started = _read(await service.start(review))
    await db.commit()
    return started


@router.post("/{review_id}/answer", response_model=ReviewRead, dependencies=[AITurnLimit])
async def answer_review(
    review_id: uuid.UUID, data: ReviewAnswerRequest, user: CurrentUser, db: DbSession
) -> ReviewRead:
    service = ReviewService(db)
    review = await _owned(service, review_id, user.id)
    if review.question is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Primero abre el repaso.")
    answered = _read(await service.answer(review, data.answer))
    # Commit antes de responder: el cierre de get_db corre DESPUÉS de enviar la respuesta,
    # y la siguiente petición del cliente podría leer el estado anterior.
    await db.commit()
    return answered
