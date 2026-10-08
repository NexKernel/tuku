"""Dependencias transversales de la API: sesión, usuario actual, roles."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rate_limit
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.domain.enums import UserRole
from app.domain.models.user import User
from app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o token inválido.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    import uuid

    user = await AuthService(db).get_by_id(uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def limit_ai_turns(user: CurrentUser) -> None:
    """Tope de turnos con IA por niño y minuto: protege la cuota de IA en los picos."""
    await rate_limit.enforce(
        "ai",
        str(user.id),
        settings.RATE_LIMIT_TUTOR_PER_MIN,
        "¡Vas muy rápido! Tuku necesita un respiro: espera un ratito y vuelve a intentarlo.",
    )


AITurnLimit = Depends(limit_ai_turns)


def require_roles(*roles: UserRole):
    async def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta acción.",
            )
        return user

    return checker
