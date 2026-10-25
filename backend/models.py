from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class PlatformMetrics(Base):
    __tablename__ = "platform_metrics"

    id = Column(Integer, primary_key=True, index=True)
    saas_revenue_inr = Column(Float, default=11998.0)
    escrow_fees_inr = Column(Float, default=4000.0)
    royalty_fees_inr = Column(Float, default=240.0)
    audit_fees_inr = Column(Float, default=2997.0)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # "INVESTOR" | "FOUNDER" | "ADMIN"
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=utc_now)


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    founder_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    location = Column(String, nullable=False)
    structure_type = Column(String, nullable=False)         # "ROYALTY" | "SAFE"
    subscription_tier = Column(String, default="STARTER")   # "STARTER" | "GROWTH_PRO" | "SCALE_VIP"
    
    target_amount_inr = Column(Float, nullable=False)
    funded_amount_inr = Column(Float, default=0.0)
    royalty_percent = Column(Float, nullable=False)
    return_cap_multiple = Column(Float, nullable=False)
    total_repaid_inr = Column(Float, default=0.0)
    est_monthly_revenue_inr = Column(Float, default=250000.0)
    
    backer_count = Column(Integer, default=0)
    status = Column(String, default="FUNDING")
    
    pitch_video_url = Column(String, default="")
    pitch_script_summary = Column(Text, default="")
    compliance_json = Column(Text, default="[]")
    challenges_json = Column(Text, default="[]")
    growth_playbook_json = Column(Text, default="[]")
    readiness_score = Column(Integer, default=80)
    created_at = Column(DateTime, default=utc_now)

    milestones = relationship("Milestone", back_populates="deal", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="deal", cascade="all, delete-orphan")
    royalty_ledgers = relationship("RoyaltyLedger", back_populates="deal", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    allocation_percent = Column(Float, nullable=False)
    amount_inr = Column(Float, nullable=False)
    status = Column(String, default="LOCKED")
    proof_type = Column(String, default="")
    proof_reference = Column(String, default="")
    audit_hash = Column(String, default="")
    platform_fee_deducted_inr = Column(Float, default=0.0)
    net_disbursed_inr = Column(Float, default=0.0)

    deal = relationship("Deal", back_populates="milestones")


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    investor_name = Column(String, nullable=False)
    investor_email = Column(String, default="investor@venturelink.in")
    amount_inr = Column(Float, nullable=False)
    expected_return_inr = Column(Float, nullable=False)
    repaid_amount_inr = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    deal = relationship("Deal", back_populates="investments")


class RoyaltyLedger(Base):
    __tablename__ = "royalty_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    month_label = Column(String, nullable=False)
    reported_revenue_inr = Column(Float, nullable=False)
    royalty_deducted_inr = Column(Float, nullable=False)
    platform_fee_inr = Column(Float, nullable=False)
    net_distributed_inr = Column(Float, nullable=False)
    verification_source = Column(String, default="SIMULATED_INDIA_STACK_GSTN_POS")
    audit_hash = Column(String, default="")
    created_at = Column(DateTime, default=utc_now)

    deal = relationship("Deal", back_populates="royalty_ledgers")