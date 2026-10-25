from typing import List, Optional
from pydantic import BaseModel, Field


class AuthLoginRequest(BaseModel):
    name: str = Field(default="Member")
    email: str = Field(..., min_length=3)
    password: Optional[str] = ""
    role: str = Field(default="INVESTOR")  # "INVESTOR" | "FOUNDER" | "ADMIN"


class AICoachRequest(BaseModel):
    raw_idea: str = Field(..., min_length=5)
    location: str = Field(default="Guwahati, Assam")
    target_amount_inr: float = Field(default=500000.0, gt=0)
    subscription_tier: str = Field(default="SCALE_VIP")


class SimulatorRequest(BaseModel):
    capital_inr: float = Field(..., ge=0)
    royalty_percent: float = Field(..., ge=0, le=50)
    return_cap_multiple: float = Field(..., ge=1.0, le=3.0)
    monthly_revenue_inr: float = Field(..., ge=0)


class MilestoneInput(BaseModel):
    sequence_number: int
    title: str
    allocation_percent: float


class CreateDealRequest(BaseModel):
    title: str
    founder_name: str = "Rohan Baruah"
    category: str = "Physical Retail"
    domain: str = "Food & Beverage"
    location: str = "Guwahati, Assam"
    structure_type: str = "ROYALTY"
    subscription_tier: str = "SCALE_VIP"
    target_amount_inr: float = Field(..., gt=0)
    royalty_percent: float = Field(default=6.5, ge=0.0, le=25.0)
    return_cap_multiple: float = Field(default=1.4, ge=1.0, le=2.5)
    est_monthly_revenue_inr: float = Field(default=300000.0, ge=0)
    pitch_video_url: Optional[str] = ""
    pitch_script_summary: str = ""
    compliance_items: List[dict] = []
    challenges_items: List[dict] = []
    growth_playbook_items: List[dict] = []
    milestones: List[MilestoneInput] = []


class PledgeRequest(BaseModel):
    investor_name: str = Field(..., min_length=2)
    investor_email: Optional[str] = "aarav@venturelink.in"
    amount_inr: float = Field(..., gt=0)


class ProofSubmitRequest(BaseModel):
    proof_type: str = Field(default="GST_INVOICE")
    proof_reference: str = Field(..., min_length=3)


class MonthlyRevenueSimulateRequest(BaseModel):
    month_label: str = Field(..., min_length=2)
    reported_revenue_inr: float = Field(..., ge=0)