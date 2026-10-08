"""Datos semilla: materias del temario y un usuario demo.

Ejecutar:  python -m app.seed
Idempotente: no duplica registros si ya existen.
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.domain.enums import UserRole
from app.domain.models.academic import Subject
from app.domain.models.user import StudentProfile, User

# Áreas del Currículo Nacional de Educación Básica (primaria) + competencias transversales.
SUBJECTS: list[tuple[str, str, str, str]] = [
    ("Matemática", "matematica", "calculator", "#3b82f6"),
    ("Comunicación", "comunicacion", "book-open", "#a855f7"),
    ("Ciencia y Tecnología", "ciencia-tecnologia", "flask-conical", "#14b8a6"),
    ("Personal Social", "personal-social", "users", "#f59e0b"),
    ("Arte y Cultura", "arte-cultura", "palette", "#ec4899"),
    ("Educación Física", "educacion-fisica", "activity", "#22c55e"),
    ("Inglés", "ingles", "languages", "#06b6d4"),
    ("Educación Religiosa", "educacion-religiosa", "heart", "#f43f5e"),
    ("TIC y aprender a aprender", "competencias-transversales", "monitor-smartphone", "#8b5cf6"),
]

DEMO_EMAIL = "estudiante@preu.pe"
DEMO_PASSWORD = "estudiante123"


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # Materias
        existing_slugs = set((await db.execute(select(Subject.slug))).scalars().all())
        created = 0
        for order, (name, slug, icon, color) in enumerate(SUBJECTS):
            if slug in existing_slugs:
                continue
            db.add(Subject(name=name, slug=slug, icon=icon, color=color, order=order))
            created += 1

        # Usuario demo (contraseña pública: solo si SEED_DEMO_USER está activo)
        demo = (
            await db.execute(select(User).where(User.email == DEMO_EMAIL))
        ).scalar_one_or_none()
        if settings.SEED_DEMO_USER and demo is None:
            demo = User(
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                full_name="Estudiante Demo",
                role=UserRole.STUDENT,
                is_verified=True,
            )
            demo.profile = StudentProfile(level=3, xp=1240, coins=85, current_streak=5)
            db.add(demo)

        await db.commit()
        demo_info = f"{DEMO_EMAIL} / {DEMO_PASSWORD}" if settings.SEED_DEMO_USER else "desactivado"
        print(f"[OK] Materias nuevas: {created} | Usuario demo: {demo_info}")


if __name__ == "__main__":
    asyncio.run(seed())
