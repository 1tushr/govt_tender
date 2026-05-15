from sqlalchemy import Column, String, Text, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portal = Column(String(20), nullable=False, index=True)  # 'cppp', 'gem', 'maharashtra', etc.
    tender_id = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(Text, nullable=False)
    category = Column(String(200))
    state = Column(String(100))
    value_min = Column(BigInteger)
    value_max = Column(BigInteger)
    deadline = Column(DateTime(timezone=True), index=True)
    doc_url = Column(Text)
    doc_r2_key = Column(Text)
    raw_text = Column(Text)
    eligibility = Column(JSONB)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    parsed_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    __table_args__ = (
        Index('idx_tenders_category_fts', 'category', postgresql_using='gin'),
        Index('idx_tenders_title_fts', 'title', postgresql_using='gin'),
    )

    def __repr__(self):
        return f"<Tender {self.tender_id}: {self.title[:50]}>"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_uid = Column(String(200), unique=True, nullable=False, index=True)
    email = Column(String(300), unique=True, nullable=False, index=True)
    phone_wa = Column(String(20))
    business_name = Column(String(300))
    plan = Column(String(20), default='free')  # free, basic, pro, agency
    razorpay_sub_id = Column(String(200), index=True)
    plan_expires_at = Column(DateTime(timezone=True))
    keywords = Column(ARRAY(String))
    categories = Column(ARRAY(String))
    states = Column(ARRAY(String))
    value_min = Column(BigInteger, default=0)
    value_max = Column(BigInteger, default=9999999999)
    wa_enabled = Column(Boolean, default=False)
    email_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_digest_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<User {self.email} ({self.plan})>"


class DigestLog(Base):
    __tablename__ = "digest_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    channel = Column(String(10))  # 'email' or 'whatsapp'
    tender_ids = Column(ARRAY(UUID(as_uuid=True)))
    status = Column(String(20))  # 'sent' or 'failed'

    user = relationship("User", backref="digest_logs")

    def __repr__(self):
        return f"<DigestLog {self.user_id} - {self.channel} - {self.status}>"


class UserTenderAction(Base):
    __tablename__ = "user_tender_actions"

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True)
    tender_id = Column(UUID(as_uuid=True), ForeignKey('tenders.id'), primary_key=True)
    action = Column(String(20), nullable=False)  # 'applied', 'watching', 'skip'
    noted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="tender_actions")
    tender = relationship("Tender", backref="user_actions")

    def __repr__(self):
        return f"<UserTenderAction {self.user_id} - {self.tender_id} - {self.action}>"
