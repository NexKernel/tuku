"""Panel de superadministrador: métricas y habilitar/desactivar cuentas.

Solo accesible con rol superadmin, que se asigna por SUPERADMIN_EMAIL (no desde la app).
"""

from __future__ import annotations

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import DbSession, require_roles
from app.domain.enums import UserRole
from app.domain.models.user import User
from app.schemas.admin import (
    AdminSettings,
    AdminStats,
    AdminUser,
    AdminUserPage,
    BulkActiveRequest,
    BulkActiveResult,
    SetActiveRequest,
)
from app.services.admin_service import REQUIRE_APPROVAL, AdminError, AdminService

router = APIRouter(prefix="/admin", tags=["Superadmin"])

SuperAdmin = Annotated[User, Depends(require_roles(UserRole.SUPERADMIN))]


@router.get("/stats", response_model=AdminStats)
async def stats(
    _: SuperAdmin, db: DbSession, days: Annotated[int, Query(ge=7, le=90)] = 30
) -> AdminStats:
    return AdminStats.model_validate(await AdminService(db).stats(days))


@router.get("/users", response_model=AdminUserPage)
async def list_users(
    _: SuperAdmin,
    db: DbSession,
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[
        Literal["all", "active", "inactive"], Query(alias="status")
    ] = "all",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> AdminUserPage:
    items, total = await AdminService(db).list_users(q, status_filter, page, page_size)
    return AdminUserPage(
        items=[AdminUser.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}", response_model=SetActiveRequest)
async def set_active(
    user_id: uuid.UUID, data: SetActiveRequest, actor: SuperAdmin, db: DbSession
) -> SetActiveRequest:
    try:
        user = await AdminService(db).set_active(user_id, data.is_active, actor)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except AdminError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    await db.commit()
    return SetActiveRequest(is_active=user.is_active)


@router.post("/users/bulk", response_model=BulkActiveResult)
async def bulk_set_active(
    data: BulkActiveRequest, actor: SuperAdmin, db: DbSession
) -> BulkActiveResult:
    updated = await AdminService(db).bulk_set_active(data.is_active, actor, data.user_ids)
    await db.commit()
    return BulkActiveResult(updated=updated)


@router.get("/settings", response_model=AdminSettings)
async def get_settings(_: SuperAdmin, db: DbSession) -> AdminSettings:
    return AdminSettings(require_approval=await AdminService(db).require_approval())


@router.put("/settings", response_model=AdminSettings)
async def put_settings(data: AdminSettings, _: SuperAdmin, db: DbSession) -> AdminSettings:
    await AdminService(db).set_setting(REQUIRE_APPROVAL, data.require_approval)
    await db.commit()
    return data
