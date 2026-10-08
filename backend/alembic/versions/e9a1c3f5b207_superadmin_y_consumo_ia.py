"""superadmin y consumo de IA

Tabla ai_usage (tokens por llamada a la IA, por usuario) y app_settings (ajustes globales).
Rellena ai_usage con el historial de los mensajes del tutor: solo se guardaban los tokens de
salida, así que el historial queda con entrada = 0.

Revision ID: e9a1c3f5b207
Revises: d8f4b1e7a925
Create Date: 2026-10-08 12:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'e9a1c3f5b207'
down_revision: str | None = 'd8f4b1e7a925'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'ai_usage',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('model', sa.String(length=80), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=False),
        sa.Column('output_tokens', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'),
                  nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_ai_usage_user_id_users'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_ai_usage')),
    )
    op.create_index(op.f('ix_ai_usage_user_id'), 'ai_usage', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_usage_created_at'), 'ai_usage', ['created_at'], unique=False)
    # El panel lista usuarios del más nuevo al más antiguo y cuenta registros por día.
    op.create_index(op.f('ix_users_created_at'), 'users', ['created_at'], unique=False)

    op.create_table(
        'app_settings',
        sa.Column('key', sa.String(length=80), nullable=False),
        sa.Column('value', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'),
                  nullable=False),
        sa.PrimaryKeyConstraint('key', name=op.f('pk_app_settings')),
    )

    op.execute(
        """
        INSERT INTO ai_usage (id, user_id, kind, model, input_tokens, output_tokens, created_at)
        SELECT gen_random_uuid(), c.user_id, 'tutor', COALESCE(m.meta->>'model', ''),
               0, COALESCE((m.meta->>'output_tokens')::int, 0), m.created_at
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.role = 'TUTOR' AND m.meta ? 'output_tokens'
        """
    )


def downgrade() -> None:
    op.drop_table('app_settings')
    op.drop_index(op.f('ix_users_created_at'), table_name='users')
    op.drop_index(op.f('ix_ai_usage_created_at'), table_name='ai_usage')
    op.drop_index(op.f('ix_ai_usage_user_id'), table_name='ai_usage')
    op.drop_table('ai_usage')
