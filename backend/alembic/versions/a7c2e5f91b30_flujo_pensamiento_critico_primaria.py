"""flujo de pensamiento crítico para primaria

Reemplaza los 15 pasos preuniversitarios por los 9 pasos del flujo de primaria y
añade el grado del niño a la conversación.

Revision ID: a7c2e5f91b30
Revises: cdd9389ec9e1
Create Date: 2026-10-02 10:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'a7c2e5f91b30'
down_revision: str | None = 'cdd9389ec9e1'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

OLD_STEPS = (
    'DETECT_TOPIC', 'DETECT_SUBTOPIC', 'DETECT_DIFFICULTY', 'DETECT_COMPETENCIES',
    'EXTRACT_DATA', 'EXPLAIN_STRATEGY', 'SOCRATIC_QUESTIONS', 'AWAIT_RESPONSE',
    'FEEDBACK', 'SOLVE', 'SHORT_METHOD', 'ELIMINATION_METHOD', 'COMMON_ERROR',
    'SIMILAR_EXERCISE', 'REGISTER_PERFORMANCE',
)
NEW_STEPS = (
    'CURIOSITY', 'UNDERSTAND', 'HYPOTHESIS', 'REASONING', 'EVIDENCE',
    'PERSPECTIVES', 'CONCLUSION', 'METACOGNITION', 'TRANSFER',
)

# Equivalencia aproximada para no perder las conversaciones ya guardadas.
OLD_TO_NEW = {
    'DETECT_TOPIC': 'CURIOSITY', 'DETECT_SUBTOPIC': 'CURIOSITY',
    'DETECT_DIFFICULTY': 'CURIOSITY', 'DETECT_COMPETENCIES': 'CURIOSITY',
    'EXTRACT_DATA': 'UNDERSTAND', 'EXPLAIN_STRATEGY': 'UNDERSTAND',
    'SOCRATIC_QUESTIONS': 'REASONING', 'AWAIT_RESPONSE': 'REASONING',
    'FEEDBACK': 'EVIDENCE', 'SOLVE': 'CONCLUSION', 'SHORT_METHOD': 'CONCLUSION',
    'ELIMINATION_METHOD': 'CONCLUSION', 'COMMON_ERROR': 'METACOGNITION',
    'SIMILAR_EXERCISE': 'TRANSFER', 'REGISTER_PERFORMANCE': 'TRANSFER',
}
NEW_TO_OLD = {
    'CURIOSITY': 'DETECT_TOPIC', 'UNDERSTAND': 'EXTRACT_DATA',
    'HYPOTHESIS': 'SOCRATIC_QUESTIONS', 'REASONING': 'AWAIT_RESPONSE',
    'EVIDENCE': 'FEEDBACK', 'PERSPECTIVES': 'FEEDBACK', 'CONCLUSION': 'SOLVE',
    'METACOGNITION': 'COMMON_ERROR', 'TRANSFER': 'SIMILAR_EXERCISE',
}

COLUMNS = (('conversations', 'current_step'), ('messages', 'step'))


def _swap_enum(values: Sequence[str], mapping: dict[str, str]) -> None:
    for table, col in COLUMNS:
        op.execute(f'ALTER TABLE {table} ALTER COLUMN {col} DROP DEFAULT')
        op.execute(f'ALTER TABLE {table} ALTER COLUMN {col} TYPE text USING {col}::text')
    op.execute('DROP TYPE tutor_step')
    labels = ', '.join(f"'{v}'" for v in values)
    op.execute(f'CREATE TYPE tutor_step AS ENUM ({labels})')

    cases = ' '.join(f"WHEN '{a}' THEN '{b}'" for a, b in mapping.items())
    for table, col in COLUMNS:
        op.execute(f'UPDATE {table} SET {col} = CASE {col} {cases} END WHERE {col} IS NOT NULL')
        op.execute(
            f'ALTER TABLE {table} ALTER COLUMN {col} TYPE tutor_step USING {col}::tutor_step'
        )


def upgrade() -> None:
    _swap_enum(NEW_STEPS, OLD_TO_NEW)
    op.add_column('conversations', sa.Column('grade', sa.SmallInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column('conversations', 'grade')
    _swap_enum(OLD_STEPS, NEW_TO_OLD)
