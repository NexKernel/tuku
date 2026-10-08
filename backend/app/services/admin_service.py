"""Panel de superadmin: métricas de registros y consumo de IA, y gestión de cuentas."""

from __future__ import annotations

import uuid
from datetime import timedelta
from typing import Any

from sqlalchemy import Date, case, cast, func, literal_column, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums import UserRole
from app.domain.models.admin import AIUsage, AppSetting
from app.domain.models.tutor import Conversation
from app.domain.models.user import User

# Los "días" del panel son días de Lima, no de UTC (a las 19:00 de Lima ya es mañana en UTC).
# Perú es UTC-5 fijo (sin horario de verano desde 1994): un offset no depende de que Postgres
# o el contenedor tengan la base de zonas horarias instalada.
LIMA_OFFSET = literal_column("INTERVAL '-05:00'")
REQUIRE_APPROVAL = "require_approval"


class AdminError(Exception):
    """Acción no permitida (p. ej. desactivar a un superadmin o a uno mismo)."""


def _local_day(column: Any) -> Any:
    return cast(func.timezone(LIMA_OFFSET, column), Date)


class AdminService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Ajustes ────────────────────────────────────────────────────────────
    async def get_setting(self, key: str, default: Any = None) -> Any:
        row = await self.db.get(AppSetting, key)
        return default if row is None else row.value

    async def set_setting(self, key: str, value: Any) -> None:
        row = await self.db.get(AppSetting, key)
        if row is None:
            self.db.add(AppSetting(key=key, value=value))
        else:
            row.value = value
        await self.db.flush()

    async def require_approval(self) -> bool:
        return bool(await self.get_setting(REQUIRE_APPROVAL, False))

    # ── Métricas ───────────────────────────────────────────────────────────
    async def stats(self, days: int = 30) -> dict[str, Any]:
        # "Hoy" en Lima, calculado igual que la agrupación por día.
        today = (await self.db.execute(select(_local_day(func.now())))).scalar_one()
        week_ago = today - timedelta(days=6)
        start = today - timedelta(days=days - 1)
        alive = User.deleted_at.is_(None)
        user_day = _local_day(User.created_at)
        usage_day = _local_day(AIUsage.created_at)

        u = (
            await self.db.execute(
                select(
                    func.count(),
                    func.count().filter(User.is_active.is_(True)),
                    func.count().filter(user_day == today),
                    func.count().filter(user_day >= week_ago),
                ).where(alive, User.role != UserRole.SUPERADMIN)
            )
        ).one()

        t = (
            await self.db.execute(
                select(
                    func.coalesce(func.sum(AIUsage.input_tokens), 0),
                    func.coalesce(func.sum(AIUsage.output_tokens), 0),
                    func.count(),
                    func.coalesce(
                        func.sum(
                            case(
                                (usage_day == today, AIUsage.input_tokens + AIUsage.output_tokens),
                                else_=0,
                            )
                        ),
                        0,
                    ),
                    func.coalesce(
                        func.sum(
                            case(
                                (
                                    usage_day >= week_ago,
                                    AIUsage.input_tokens + AIUsage.output_tokens,
                                ),
                                else_=0,
                            )
                        ),
                        0,
                    ),
                )
            )
        ).one()

        regs = dict(
            (
                await self.db.execute(
                    select(user_day, func.count())
                    .where(alive, User.role != UserRole.SUPERADMIN, user_day >= start)
                    .group_by(user_day)
                )
            ).all()
        )
        toks = dict(
            (
                await self.db.execute(
                    select(usage_day, func.sum(AIUsage.input_tokens + AIUsage.output_tokens))
                    .where(usage_day >= start)
                    .group_by(usage_day)
                )
            ).all()
        )
        series = [
            {
                "day": d.isoformat(),
                "registrations": int(regs.get(d, 0)),
                "tokens": int(toks.get(d, 0) or 0),
            }
            for d in (start + timedelta(days=i) for i in range(days))
        ]

        total_tokens = func.sum(AIUsage.input_tokens + AIUsage.output_tokens)
        top = (
            await self.db.execute(
                select(User.id, User.full_name, User.email, total_tokens)
                .join(AIUsage, AIUsage.user_id == User.id)
                .group_by(User.id)
                .order_by(total_tokens.desc())
                .limit(5)
            )
        ).all()

        return {
            "users_total": u[0],
            "users_active": u[1],
            "users_inactive": u[0] - u[1],
            "registered_today": u[2],
            "registered_7d": u[3],
            "tokens_input": int(t[0]),
            "tokens_output": int(t[1]),
            "ai_calls": t[2],
            "tokens_today": int(t[3]),
            "tokens_7d": int(t[4]),
            "require_approval": await self.require_approval(),
            "series": series,
            "top_users": [
                {"id": r[0], "full_name": r[1], "email": r[2], "tokens": int(r[3] or 0)}
                for r in top
            ],
        }

    # ── Usuarios ───────────────────────────────────────────────────────────
    async def list_users(
        self, q: str | None, status: str, page: int, page_size: int
    ) -> tuple[list[dict[str, Any]], int]:
        usage = (
            select(
                AIUsage.user_id.label("uid"),
                func.sum(AIUsage.input_tokens + AIUsage.output_tokens).label("tokens"),
                func.max(AIUsage.created_at).label("last_activity"),
            )
            .group_by(AIUsage.user_id)
            .subquery()
        )
        convos = (
            select(Conversation.user_id.label("uid"), func.count().label("n"))
            .where(Conversation.deleted_at.is_(None))
            .group_by(Conversation.user_id)
            .subquery()
        )

        filters = [User.deleted_at.is_(None)]
        if q:
            like = f"%{q.strip()}%"
            filters.append(or_(User.email.ilike(like), User.full_name.ilike(like)))
        if status == "active":
            filters.append(User.is_active.is_(True))
        elif status == "inactive":
            filters.append(User.is_active.is_(False))

        total = (await self.db.execute(select(func.count()).select_from(User).where(*filters))).scalar_one()
        rows = (
            await self.db.execute(
                select(
                    User,
                    func.coalesce(usage.c.tokens, 0),
                    usage.c.last_activity,
                    func.coalesce(convos.c.n, 0),
                )
                .outerjoin(usage, usage.c.uid == User.id)
                .outerjoin(convos, convos.c.uid == User.id)
                .where(*filters)
                .order_by(User.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
        items = [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "tokens": int(tokens),
                "last_activity": last,
                "conversations": int(n),
            }
            for user, tokens, last, n in rows
        ]
        return items, total

    async def set_active(self, user_id: uuid.UUID, active: bool, actor: User) -> User:
        user = await self.db.get(User, user_id)
        if user is None or user.deleted_at is not None:
            raise LookupError("Usuario no encontrado.")
        if user.id == actor.id or user.role == UserRole.SUPERADMIN:
            raise AdminError("No puedes desactivar una cuenta de superadministrador.")
        user.is_active = active
        await self.db.flush()
        return user

    async def bulk_set_active(
        self, active: bool, actor: User, user_ids: list[uuid.UUID] | None
    ) -> int:
        """Cambia el estado de los usuarios indicados, o de todos si `user_ids` es None.

        Nunca toca cuentas de superadmin ni la propia.
        """
        stmt = (
            update(User)
            .where(
                User.deleted_at.is_(None),
                User.role != UserRole.SUPERADMIN,
                User.id != actor.id,
                User.is_active.is_not(active),
            )
            .values(is_active=active)
            .execution_options(synchronize_session=False)
        )
        if user_ids is not None:
            stmt = stmt.where(User.id.in_(user_ids))
        result = await self.db.execute(stmt)
        return result.rowcount or 0
