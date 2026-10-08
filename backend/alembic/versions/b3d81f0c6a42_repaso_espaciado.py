"""repaso espaciado

Tabla de repasos: rondas de recuperación (1, 3 y 7 días) de los retos completados.

Revision ID: b3d81f0c6a42
Revises: a7c2e5f91b30
Create Date: 2026-10-02 12:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b3d81f0c6a42'
down_revision: str | None = 'a7c2e5f91b30'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'reviews',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('round', sa.SmallInteger(), nullable=False),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('question', sa.Text(), nullable=True),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], name=op.f('fk_reviews_conversation_id_conversations'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_reviews_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_reviews')),
    )
    op.create_index(op.f('ix_reviews_conversation_id'), 'reviews', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_reviews_due_at'), 'reviews', ['due_at'], unique=False)
    op.create_index(op.f('ix_reviews_user_id'), 'reviews', ['user_id'], unique=False)

    # Los retos ya completados antes de esta versión también entran al repaso.
    op.execute(
        """
        INSERT INTO reviews (id, user_id, conversation_id, round, due_at)
        SELECT gen_random_uuid(), user_id, id, 1, now()
        FROM conversations
        WHERE current_step = 'TRANSFER' AND deleted_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_reviews_user_id'), table_name='reviews')
    op.drop_index(op.f('ix_reviews_due_at'), table_name='reviews')
    op.drop_index(op.f('ix_reviews_conversation_id'), table_name='reviews')
    op.drop_table('reviews')
