"""Endpoints de autenticación."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError

from app.api.deps import CurrentUser, DbSession
from app.core import rate_limit
from app.core.config import settings
from app.core.security import decode_token
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserRead,
)
from app.services.auth_service import AuthError, AuthService

router = APIRouter(prefix="/auth", tags=["Autenticación"])


async def _limit_login(email: str) -> None:
    # Por correo y no por IP: un aula entera sale a internet con la misma IP.
    await rate_limit.enforce(
        "login",
        email.strip().lower(),
        settings.RATE_LIMIT_LOGIN_PER_MIN,
        "Demasiados intentos de inicio de sesión. Espera un minuto e inténtalo otra vez.",
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: DbSession) -> UserRead:
    try:
        user = await AuthService(db).register(data)
    except AuthError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    # Commit antes de responder: el cierre de get_db corre DESPUÉS de enviar la respuesta,
    # y la siguiente petición del cliente podría leer el estado anterior.
    await db.commit()
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, db: DbSession) -> TokenPair:
    await _limit_login(data.email)
    service = AuthService(db)
    try:
        user = await service.authenticate(data.email, data.password)
    except AuthError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc
    return service.issue_tokens(user)


@router.post("/token", response_model=TokenPair, include_in_schema=False)
async def login_form(
    db: DbSession, form: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> TokenPair:
    """Compatibilidad con el botón *Authorize* de Swagger (OAuth2 password flow)."""
    await _limit_login(form.username)
    service = AuthService(db)
    try:
        user = await service.authenticate(form.username, form.password)
    except AuthError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc
    return service.issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, db: DbSession) -> TokenPair:
    service = AuthService(db)
    try:
        payload = decode_token(data.refresh_token, expected_type="refresh")
        user = await service.get_by_id(uuid.UUID(payload["sub"]))
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token inválido.") from exc
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no válido.")
    return service.issue_tokens(user)


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)
