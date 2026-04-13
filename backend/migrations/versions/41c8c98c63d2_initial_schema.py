"""initial schema

Revision ID: 41c8c98c63d2
Revises: 
Create Date: 2026-04-13 11:37:28.164673

"""
from alembic import op
import sqlalchemy as sa


revision = '41c8c98c63d2'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = inspector.get_table_names()

    if 'users' not in existing:
        op.create_table(
            'users',
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(length=254), nullable=False),
            sa.Column('password', sa.String(length=255), nullable=False),
            sa.Column('f_name', sa.String(length=100), nullable=True),
            sa.Column('l_name', sa.String(length=100), nullable=True),
            sa.Column('company', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('user_id'),
            sa.UniqueConstraint('email'),
        )

    if 'sessions' not in existing:
        op.create_table(
            'sessions',
            sa.Column('session_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('session_id'),
        )

    if 'chat_history' not in existing:
        op.create_table(
            'chat_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('session_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(length=10), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('media_url', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.CheckConstraint("role IN ('user', 'agent')", name='role_check'),
            sa.ForeignKeyConstraint(['session_id'], ['sessions.session_id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )


def downgrade():
    op.drop_table('chat_history')
    op.drop_table('sessions')
    op.drop_table('users')
