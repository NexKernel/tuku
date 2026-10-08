"""camino problema

Añade los pasos del camino "problema" (problemas con números): estimar, planear sin
calcular, calcular y revisar si tiene sentido.

Revision ID: d8f4b1e7a925
Revises: c5e2a9d4f173
Create Date: 2026-10-04 10:00:00.000000
"""
from collections.abc import Sequence

from alembic import op

revision: str = 'd8f4b1e7a925'
down_revision: str | None = 'c5e2a9d4f173'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NEW_VALUES = ('ESTIMATE', 'PLAN', 'SOLVE', 'CHECK')
OLD_STEPS = (
    'CURIOSITY', 'UNDERSTAND', 'HYPOTHESIS', 'REASONING', 'EVIDENCE',
    'PERSPECTIVES', 'CONCLUSION', 'METACOGNITION', 'TRANSFER',
)
# Al bajar, cada paso nuevo pasa a su equivalente del camino explorador.
NEW_TO_OLD = {
    'ESTIMATE': 'HYPOTHESIS', 'PLAN': 'REASONING', 'SOLVE': 'CONCLUSION', 'CHECK': 'CONCLUSION',
}
COLUMNS = (('conversations', 'current_step'), ('messages', 'step'))


def upgrade() -> None:
    # ADD VALUE no puede usarse dentro de la misma transacción que lo estrena.
    with op.get_context().autocommit_block():
        for value in NEW_VALUES:
            op.execute(f"ALTER TYPE tutor_step ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # Postgres no permite quitar valores de un enum: se recrea el tipo.
    for table, col in COLUMNS:
        op.execute(f'ALTER TABLE {table} ALTER COLUMN {col} DROP DEFAULT')
        op.execute(f'ALTER TABLE {table} ALTER COLUMN {col} TYPE text USING {col}::text')
    op.execute('DROP TYPE tutor_step')
    labels = ', '.join(f"'{v}'" for v in OLD_STEPS)
    op.execute(f'CREATE TYPE tutor_step AS ENUM ({labels})')

    cases = ' '.join(f"WHEN '{a}' THEN '{b}'" for a, b in NEW_TO_OLD.items())
    for table, col in COLUMNS:
        op.execute(f'UPDATE {table} SET {col} = CASE {col} {cases} ELSE {col} END WHERE {col} IS NOT NULL')
        op.execute(
            f'ALTER TABLE {table} ALTER COLUMN {col} TYPE tutor_step USING {col}::tutor_step'
        )
    op.execute("UPDATE conversations SET path = 'full' WHERE path = 'problem'")
