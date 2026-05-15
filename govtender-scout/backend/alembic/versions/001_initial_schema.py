"""Initial database schema creation."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid


# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial database schema."""
    
    # Create tenders table
    op.create_table(
        'tenders',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('portal', sa.String(20), nullable=False, index=True),
        sa.Column('tender_id', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('category', sa.String(200)),
        sa.Column('state', sa.String(100)),
        sa.Column('value_min', sa.BigInteger()),
        sa.Column('value_max', sa.BigInteger()),
        sa.Column('deadline', sa.DateTime(timezone=True), index=True),
        sa.Column('doc_url', sa.Text()),
        sa.Column('doc_r2_key', sa.Text()),
        sa.Column('raw_text', sa.Text()),
        sa.Column('eligibility', JSONB),
        sa.Column('scraped_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('parsed_at', sa.DateTime(timezone=True)),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('supabase_uid', sa.String(200), unique=True, nullable=False, index=True),
        sa.Column('email', sa.String(300), unique=True, nullable=False, index=True),
        sa.Column('phone_wa', sa.String(20)),
        sa.Column('business_name', sa.String(300)),
        sa.Column('plan', sa.String(20), default='free'),
        sa.Column('razorpay_sub_id', sa.String(200), index=True),
        sa.Column('plan_expires_at', sa.DateTime(timezone=True)),
        sa.Column('keywords', ARRAY(sa.String())),
        sa.Column('categories', ARRAY(sa.String())),
        sa.Column('states', ARRAY(sa.String())),
        sa.Column('value_min', sa.BigInteger(), default=0),
        sa.Column('value_max', sa.BigInteger(), default=9999999999),
        sa.Column('wa_enabled', sa.Boolean(), default=False),
        sa.Column('email_enabled', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_digest_at', sa.DateTime(timezone=True)),
    )
    
    # Create digest_log table
    op.create_table(
        'digest_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('channel', sa.String(10)),
        sa.Column('tender_ids', ARRAY(UUID(as_uuid=True))),
        sa.Column('status', sa.String(20)),
    )
    
    # Create user_tender_actions table
    op.create_table(
        'user_tender_actions',
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('tender_id', UUID(as_uuid=True), sa.ForeignKey('tenders.id'), primary_key=True),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('noted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('idx_tenders_deadline', 'tenders', ['deadline'])
    op.create_index('idx_tenders_portal', 'tenders', ['portal'])
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_plan', 'users', ['plan'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('user_tender_actions')
    op.drop_table('digest_log')
    op.drop_table('users')
    op.drop_table('tenders')
