"""Registro del consumo de IA (tokens) por usuario, para el panel de superadmin."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.admin import AIUsage
from app.services.ai import AICompletion


def record_usage(
    db: AsyncSession, user_id: uuid.UUID, kind: str, completion: AICompletion
) -> None:
    """Anota una llamada a la IA en la misma transacción del turno que la provocó."""
    db.add(
        AIUsage(
            user_id=user_id,
            kind=kind,
            model=completion.model[:80],
            input_tokens=completion.input_tokens,
            output_tokens=completion.output_tokens,
        )
    )
