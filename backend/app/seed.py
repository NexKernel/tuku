"""Datos semilla: materias del temario y un usuario demo.

Ejecutar:  python -m app.seed
Idempotente: no duplica registros si ya existen.
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.domain.enums import UserRole
from app.domain.models.academic import Subject
from app.domain.models.user import StudentProfile, User

SUBJECTS: list[tuple[str, str, str, str]] = [
    ("Álgebra", "algebra", "sigma", "#6366f1"),
    ("Aritmética", "aritmetica", "calculator", "#8b5cf6"),
    ("Geometría", "geometria", "triangle", "#ec4899"),
    ("Trigonometría", "trigonometria", "waves", "#f43f5e"),
    ("Física", "fisica", "atom", "#0ea5e9"),
    ("Química", "quimica", "flask-conical", "#14b8a6"),
    ("Biología", "biologia", "dna", "#22c55e"),
    ("Historia", "historia", "landmark", "#f59e0b"),
    ("Geografía", "geografia", "globe", "#84cc16"),
    ("Economía", "economia", "trending-up", "#10b981"),
    ("Literatura", "literatura", "book-open", "#a855f7"),
    ("Filosofía", "filosofia", "brain", "#64748b"),
    ("Psicología", "psicologia", "smile", "#e11d48"),
    ("Razonamiento Matemático", "razonamiento-matematico", "puzzle", "#3b82f6"),
    ("Razonamiento Verbal", "razonamiento-verbal", "message-square", "#06b6d4"),
    ("Actualidad", "actualidad", "newspaper", "#f97316"),
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

        # Usuario demo
        demo = (
            await db.execute(select(User).where(User.email == DEMO_EMAIL))
        ).scalar_one_or_none()
        if demo is None:
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
        print(f"[OK] Materias nuevas: {created} | Usuario demo: {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
