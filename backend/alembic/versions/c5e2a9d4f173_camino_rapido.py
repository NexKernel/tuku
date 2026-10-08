"""camino rápido

Añade el camino elegido por el niño a la conversación: "quick" (5 pasos) o "full" (9).

Revision ID: c5e2a9d4f173
Revises: b3d81f0c6a42
Create Date: 2026-10-02 14:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'c5e2a9d4f173'
down_revision: str | None = 'b3d81f0c6a42'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'conversations',
        sa.Column('path', sa.String(length=10), server_default='full', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('conversations', 'path')
