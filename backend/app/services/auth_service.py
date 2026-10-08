"""Registro, autenticación y emisión de tokens."""

from __future__ import annotations

import uuid

from anyio import to_thread
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.domain.models.user import StudentProfile, User
from app.schemas.auth import RegisterRequest, TokenPair
from app.services.admin_service import AdminService


class AuthError(Exception):
    """Error de dominio de autenticación (credenciales/estado)."""


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower(), User.deleted_at.is_(None))
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def register(self, data: RegisterRequest) -> User:
        if await self.get_by_email(data.email):
            raise AuthError("Ya existe una cuenta con ese correo.")
        user = User(
            email=data.email.lower(),
            # bcrypt es CPU puro (~250 ms): en un hilo para no congelar el event loop.
            hashed_password=await to_thread.run_sync(hash_password, data.password),
            full_name=data.full_name,
        )
        user.profile = StudentProfile()
        # Con "aprobar registros" activo en el panel, la cuenta nace desactivada.
        if await AdminService(self.db).require_approval():
            user.is_active = False
        self.db.add(user)
        await self.db.flush()
        return user

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.get_by_email(email)
        if not user or not await to_thread.run_sync(
            verify_password, password, user.hashed_password
        ):
            raise AuthError("Correo o contraseña incorrectos.")
        if not user.is_active:
            raise AuthError(
                "Tu cuenta todavía no está habilitada. Pide al administrador que la active."
            )
        return user

    @staticmethod
    def issue_tokens(user: User) -> TokenPair:
        claims = {"role": user.role.value, "email": user.email}
        return TokenPair(
            access_token=create_access_token(str(user.id), **claims),
            refresh_token=create_refresh_token(str(user.id)),
        )
