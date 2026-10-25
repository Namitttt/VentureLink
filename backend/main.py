import json
import math
import hashlib
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SessionLocal
from models import Deal, Milestone, Investment, RoyaltyLedger, PlatformMetrics, UserAccount
from schemas import (
    AuthLoginRequest,
    AICoachRequest,
    SimulatorRequest,
    CreateDealRequest,
    PledgeRequest,
    ProofSubmitRequest,
    MonthlyRevenueSimulateRequest,
)
from ai_coach import generate_founder_blueprint
from seed import seed_database

# Recreate tables cleanly if schema updated
Base.metadata.create_all(bind=engine)
with SessionLocal() as db_init:
    seed_database(db_init)

app = FastAPI(title="VentureLink API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USD_INR_RATE = 84.0
TIER_PRICES_INR = {"STARTER": 0.0, "GROWTH_PRO": 1999.0, "SCALE_VIP": 9999.0}
TIER_ESCROW_FEE_PCT = {"STARTER": 2.5, "GROWTH_PRO": 2.0, "SCALE_VIP": 1.5}
TIER_RANK = {"SCALE_VIP": 1, "GROWTH_PRO": 2, "STARTER": 3}


def serialize_deal(d: Deal) -> dict:
    """Returns BOTH camelCase (for the luxury UI) and snake_case keys so nothing ever breaks."""
    total_obligation = round(d.target_amount_inr * d.return_cap_multiple, 2)
    remaining_cap = max(0.0, round(total_obligation - d.total_repaid_inr, 2))
    escrow_released = sum(m.amount_inr for m in d.milestones if m.status == "RELEASED")
    escrow_locked = max(0.0, round(d.funded_amount_inr - escrow_released, 2))
    pct = (d.funded_amount_inr / d.target_amount_inr) * 100.0 if d.target_amount_inr > 0 else 0.0

    sorted_milestones = sorted(d.milestones, key=lambda x: x.sequence_number)
    tranches_ui = []
    milestones_raw = []

    for m in sorted_milestones:
        ui_status = "RELEASED" if m.status == "RELEASED" else ("IN_ESCROW" if m.status == "PROOF_SUBMITTED" else "LOCKED")
        tranches_ui.append({
            "id": m.id,
            "sequence_number": m.sequence_number,
            "name": m.title,
            "share": m.allocation_percent,
            "amount_inr": m.amount_inr,
            "status": ui_status,
            "raw_status": m.status,
            "proof": m.proof_reference or "Locked in RBI Trustee Vault",
            "audit_hash": m.audit_hash or "Pending SHA-256 Verification",
        })
        milestones_raw.append({
            "id": m.id,
            "sequence_number": m.sequence_number,
            "title": m.title,
            "allocation_percent": m.allocation_percent,
            "amount_inr": m.amount_inr,
            "status": m.status,
            "proof_type": m.proof_type,
            "proof_reference": m.proof_reference,
            "audit_hash": m.audit_hash,
            "platform_fee_deducted_inr": m.platform_fee_deducted_inr,
            "net_disbursed_inr": m.net_disbursed_inr,
        })

    is_royalty = d.structure_type == "ROYALTY"

    return {
        "id": d.id,
        "title": d.title,
        "founder_name": d.founder_name,
        "category": d.category,
        "domain": d.domain,
        "location": d.location,
        # Dual keys for Luxury Frontend + Backend compatibility
        "structure": "REVENUE_SHARE" if is_royalty else "SAFE_EQUITY",
        "structure_type": d.structure_type,
        "subscription_tier": d.subscription_tier,
        "escrow_fee_percent": TIER_ESCROW_FEE_PCT.get(d.subscription_tier, 2.5),
        "targetAmountINR": d.target_amount_inr,
        "target_amount_inr": d.target_amount_inr,
        "raisedAmountINR": d.funded_amount_inr,
        "funded_amount_inr": d.funded_amount_inr,
        "funding_progress_pct": round(min(100.0, pct), 1),
        "escrow_locked_inr": escrow_locked,
        "escrow_released_inr": escrow_released,
        "royaltyPercent": d.royalty_percent,
        "royalty_percent": d.royalty_percent,
        "returnCapMultiple": d.return_cap_multiple,
        "return_cap_multiple": d.return_cap_multiple,
        "total_obligation_inr": total_obligation,
        "total_repaid_inr": d.total_repaid_inr,
        "remaining_obligation_inr": remaining_cap,
        "est_monthly_revenue_inr": d.est_monthly_revenue_inr,
        "backers": d.backer_count,
        "backer_count": d.backer_count,
        "status": d.status,
        "description": d.pitch_script_summary,
        "pitch_script_summary": d.pitch_script_summary,
        "pitch_video_url": d.pitch_video_url,
        "compliance_items": json.loads(d.compliance_json or "[]"),
        "challenges_items": json.loads(d.challenges_json or "[]"),
        "growth_playbook_items": json.loads(d.growth_playbook_json or "[]"),
        "readiness_score": d.readiness_score,
        "tranches": tranches_ui,
        "milestones": milestones_raw,
        "investments": [
            {
                "id": inv.id,
                "deal_id": d.id,
                "deal_title": d.title,
                "investor_name": inv.investor_name,
                "investor_email": inv.investor_email,
                "amount_inr": inv.amount_inr,
                "expected_return_inr": inv.expected_return_inr,
                "repaid_amount_inr": inv.repaid_amount_inr,
            }
            for inv in d.investments
        ],
        "royalty_ledgers": [
            {
                "id": rl.id,
                "month_label": rl.month_label,
                "reported_revenue_inr": rl.reported_revenue_inr,
                "royalty_deducted_inr": rl.royalty_deducted_inr,
                "platform_fee_inr": rl.platform_fee_inr,
                "net_distributed_inr": rl.net_distributed_inr,
                "verification_source": rl.verification_source,
                "audit_hash": rl.audit_hash,
            }
            for rl in d.royalty_ledgers
        ],
    }


@app.post("/api/auth/login")
def login_or_register_user(req: AuthLoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    if not email_clean:
        raise HTTPException(status_code=400, detail="Email address is required.")

    role_upper = req.role.upper()

    # Stealth Admin Elevation
    if email_clean in ["admin@venturelink.in", "namit@venturelink.in"] or role_upper == "ADMIN":
        if req.password != "admin123":
            raise HTTPException(status_code=401, detail="Invalid Master Admin Passcode.")
        role_upper = "ADMIN"

    existing = db.query(UserAccount).filter(UserAccount.email == email_clean).first()
    if not existing:
        # Derive a clean name from email if Full Name wasn't provided during Login
        fallback_name = email_clean.split("@")[0].replace(".", " ").title()
        user_name = req.name.strip() if req.name.strip() else fallback_name
        if role_upper == "ADMIN":
            user_name = "Namit Mahure (Master Admin)"

        existing = UserAccount(
            name=user_name,
            email=email_clean,
            role=role_upper,
            status="VERIFIED_ADMIN" if role_upper == "ADMIN" else "SEC42_ACCREDITED",
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
    else:
        # Keep existing user's saved name unless they explicitly typed a new one on Sign Up
        if req.name.strip():
            existing.name = req.name.strip()
        if role_upper == "ADMIN":
            existing.role = "ADMIN"
            existing.status = "VERIFIED_ADMIN"
        db.commit()
        db.refresh(existing)

    return {
        "id": existing.id,
        "name": existing.name,
        "email": existing.email,
        "role": existing.role,
        "status": existing.status,
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    metrics = db.query(PlatformMetrics).first()
    total_rev = (
        (metrics.saas_revenue_inr + metrics.escrow_fees_inr + metrics.royalty_fees_inr + metrics.audit_fees_inr)
        if metrics
        else 0.0
    )
    return {
        "status": "ok",
        "usd_inr_rate": USD_INR_RATE,
        "platform_revenue": {
            "saas_revenue_inr": metrics.saas_revenue_inr if metrics else 0.0,
            "escrow_fees_inr": metrics.escrow_fees_inr if metrics else 0.0,
            "royalty_fees_inr": metrics.royalty_fees_inr if metrics else 0.0,
            "audit_fees_inr": metrics.audit_fees_inr if metrics else 0.0,
            "total_revenue_inr": round(total_rev, 2),
        },
    }


@app.get("/api/deals")
def list_deals(db: Session = Depends(get_db)):
    deals = db.query(Deal).all()
    deals.sort(key=lambda d: (TIER_RANK.get(d.subscription_tier, 9), -d.id))
    return [serialize_deal(d) for d in deals]


@app.post("/api/ai/coach")
def run_ai_founder_coach(req: AICoachRequest):
    return generate_founder_blueprint(
        raw_idea=req.raw_idea,
        location=req.location,
        target_inr=req.target_amount_inr,
        tier=req.subscription_tier,
    )


@app.post("/api/simulator/calculate")
def calculate_adaptive_payback(req: SimulatorRequest):
    total_repayment_cap_inr = round(req.capital_inr * req.return_cap_multiple, 2)
    net_profit_inr = round(total_repayment_cap_inr - req.capital_inr, 2)
    monthly_royalty_inr = round(req.monthly_revenue_inr * (req.royalty_percent / 100.0), 2)

    if req.monthly_revenue_inr <= 0 or monthly_royalty_inr <= 0:
        return {
            "zero_revenue_grace_mode": True,
            "status_badge": "ZERO_REVENUE_GRACE_ACTIVE",
            "message": "Zero-Revenue Grace Period Active: ₹0 Royalty Due This Month. Zero default penalty.",
            "total_repayment_cap_inr": total_repayment_cap_inr,
            "net_profit_inr": net_profit_inr,
            "monthly_royalty_inr": 0.0,
            "estimated_months": None,
        }

    estimated_months = int(math.ceil(total_repayment_cap_inr / monthly_royalty_inr))
    return {
        "zero_revenue_grace_mode": False,
        "status_badge": "ADAPTIVE_ROYALTY_ACTIVE",
        "message": f"At ₹{req.monthly_revenue_inr:,.0f}/mo sales, {req.royalty_percent}% royalty pays off the {req.return_cap_multiple}x cap in ~{estimated_months} months.",
        "total_repayment_cap_inr": total_repayment_cap_inr,
        "net_profit_inr": net_profit_inr,
        "monthly_royalty_inr": monthly_royalty_inr,
        "estimated_months": estimated_months,
    }


@app.post("/api/deals")
def create_new_deal(req: CreateDealRequest, db: Session = Depends(get_db)):
    milestones_input = req.milestones or [
        MilestoneInput(sequence_number=1, title="Tranche 1: Core Equipment (GST Invoice)", allocation_percent=40.0),
        MilestoneInput(sequence_number=2, title="Tranche 2: Inventory & Setup", allocation_percent=35.0),
        MilestoneInput(sequence_number=3, title="Tranche 3: Growth Working Capital", allocation_percent=25.0),
    ]

    new_deal = Deal(
        title=req.title,
        founder_name=req.founder_name,
        category=req.category,
        domain=req.domain,
        location=req.location,
        structure_type=req.structure_type,
        subscription_tier=req.subscription_tier,
        target_amount_inr=req.target_amount_inr,
        funded_amount_inr=75000.0,  # Initial anchor syndicate seed for instant demo feel
        royalty_percent=req.royalty_percent,
        return_cap_multiple=req.return_cap_multiple,
        total_repaid_inr=0.0,
        est_monthly_revenue_inr=req.est_monthly_revenue_inr,
        backer_count=8,
        status="FUNDING",
        pitch_video_url=req.pitch_video_url or "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        pitch_script_summary=req.pitch_script_summary or "Founder-launched regional growth syndicate with 3-stage RBI trustee escrow protection.",
        compliance_json=json.dumps(req.compliance_items),
        challenges_json=json.dumps(req.challenges_items),
        growth_playbook_json=json.dumps(req.growth_playbook_items),
        readiness_score=98 if req.subscription_tier == "SCALE_VIP" else 88,
    )
    db.add(new_deal)
    db.flush()

    for m in milestones_input:
        tranche_amt = round(req.target_amount_inr * (m.allocation_percent / 100.0), 2)
        db.add(
            Milestone(
                deal_id=new_deal.id,
                sequence_number=m.sequence_number,
                title=m.title,
                allocation_percent=m.allocation_percent,
                amount_inr=tranche_amt,
                status="PROOF_SUBMITTED" if m.sequence_number == 1 else "LOCKED",
                proof_reference="Pending GST Invoice Verification" if m.sequence_number == 1 else "Locked in Vault",
            )
        )

    db.add(
        Investment(
            deal_id=new_deal.id,
            investor_name="Anchor Micro-Syndicate (8 Backers)",
            investor_email="anchor@venturelink.in",
            amount_inr=75000.0,
            expected_return_inr=round(75000.0 * req.return_cap_multiple, 2),
            repaid_amount_inr=0.0,
        )
    )

    metrics = db.query(PlatformMetrics).first()
    if metrics:
        metrics.saas_revenue_inr += TIER_PRICES_INR.get(req.subscription_tier, 0.0)
        metrics.audit_fees_inr += 999.0

    db.commit()
    db.refresh(new_deal)
    return serialize_deal(new_deal)


@app.post("/api/deals/{deal_id}/pledge")
def pledge_capital(deal_id: int, req: PledgeRequest, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.backer_count >= 199:
        raise HTTPException(status_code=400, detail="Section 42(7) Private Syndicate Limit Reached (Max 199 Backers).")

    accepted_amount = req.amount_inr
    expected_return = round(accepted_amount * deal.return_cap_multiple, 2)

    db.add(
        Investment(
            deal_id=deal.id,
            investor_name=req.investor_name,
            investor_email=req.investor_email or "investor@venturelink.in",
            amount_inr=accepted_amount,
            expected_return_inr=expected_return,
            repaid_amount_inr=0.0,
        )
    )
    deal.funded_amount_inr = round(deal.funded_amount_inr + accepted_amount, 2)
    deal.backer_count = min(199, deal.backer_count + 1)
    if deal.funded_amount_inr >= deal.target_amount_inr:
        deal.status = "ACTIVE_ESCROW"

    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


@app.post("/api/deals/{deal_id}/tranches/{tranche_index}/unlock")
def unlock_tranche_by_index(deal_id: int, tranche_index: int, req: Optional[ProofSubmitRequest] = None, db: Session = Depends(get_db)):
    """One-click GST Invoice Upload + Escrow Release for Founder & Admin Demo Flow."""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    seq_num = tranche_index + 1
    milestone = (
        db.query(Milestone)
        .filter(Milestone.deal_id == deal_id, Milestone.sequence_number == seq_num)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    proof_ref = req.proof_reference if req and req.proof_reference else f"GSTN Invoice #AS-{9040 + milestone.id} Verified"
    fee_pct = TIER_ESCROW_FEE_PCT.get(deal.subscription_tier, 2.5)
    fee_inr = round(milestone.amount_inr * (fee_pct / 100.0), 2)
    net_inr = round(milestone.amount_inr - fee_inr, 2)

    milestone.proof_type = "GST_INVOICE"
    milestone.proof_reference = proof_ref
    milestone.audit_hash = "0x" + hashlib.sha256(f"{deal_id}-{milestone.id}-{proof_ref}".encode()).hexdigest()[:24]
    milestone.status = "RELEASED"
    milestone.platform_fee_deducted_inr = fee_inr
    milestone.net_disbursed_inr = net_inr
    deal.status = "ACTIVE_ESCROW"

    metrics = db.query(PlatformMetrics).first()
    if metrics:
        metrics.escrow_fees_inr = round(metrics.escrow_fees_inr + fee_inr, 2)

    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


@app.post("/api/deals/{deal_id}/royalties/simulate-month")
def simulate_monthly_royalty_payout(deal_id: int, req: MonthlyRevenueSimulateRequest, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    total_cap = round(deal.target_amount_inr * deal.return_cap_multiple, 2)
    remaining_cap = max(0.0, round(total_cap - deal.total_repaid_inr, 2))
    raw_royalty = round(req.reported_revenue_inr * (deal.royalty_percent / 100.0), 2)
    actual_royalty = min(raw_royalty, remaining_cap) if remaining_cap > 0 else raw_royalty
    platform_routing_fee = round(actual_royalty * 0.01, 2)
    net_to_investors = round(actual_royalty - platform_routing_fee, 2)

    db.add(
        RoyaltyLedger(
            deal_id=deal.id,
            month_label=req.month_label,
            reported_revenue_inr=req.reported_revenue_inr,
            royalty_deducted_inr=actual_royalty,
            platform_fee_inr=platform_routing_fee,
            net_distributed_inr=net_to_investors,
            verification_source="SIMULATED_INDIA_STACK_GSTN_POS",
            audit_hash="0x" + hashlib.sha256(f"{deal_id}-{req.month_label}-{req.reported_revenue_inr}".encode()).hexdigest()[:24],
        )
    )

    deal.total_repaid_inr = round(deal.total_repaid_inr + actual_royalty, 2)
    if deal.funded_amount_inr > 0 and actual_royalty > 0:
        for inv in deal.investments:
            share = inv.amount_inr / deal.funded_amount_inr
            inv.repaid_amount_inr = round(inv.repaid_amount_inr + (actual_royalty * share), 2)

    metrics = db.query(PlatformMetrics).first()
    if metrics:
        metrics.royalty_fees_inr = round(metrics.royalty_fees_inr + platform_routing_fee, 2)

    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


# ==========================================
# MASTER ADMIN PORTAL ENDPOINTS
# ==========================================
@app.get("/api/admin/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    users = db.query(UserAccount).order_by(UserAccount.id.desc()).all()
    investments = db.query(Investment).order_by(Investment.id.desc()).all()
    deals = db.query(Deal).all()
    metrics = db.query(PlatformMetrics).first()

    total_rev = (
        (metrics.saas_revenue_inr + metrics.escrow_fees_inr + metrics.royalty_fees_inr + metrics.audit_fees_inr)
        if metrics
        else 0.0
    )

    return {
        "platform_revenue": {
            "saas_revenue_inr": metrics.saas_revenue_inr if metrics else 0.0,
            "escrow_fees_inr": metrics.escrow_fees_inr if metrics else 0.0,
            "royalty_fees_inr": metrics.royalty_fees_inr if metrics else 0.0,
            "audit_fees_inr": metrics.audit_fees_inr if metrics else 0.0,
            "total_revenue_inr": round(total_rev, 2),
        },
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
            }
            for u in users
        ],
        "investments": [
            {
                "id": inv.id,
                "deal_id": inv.deal_id,
                "deal_title": inv.deal.title if inv.deal else f"Deal #{inv.deal_id}",
                "investor_name": inv.investor_name,
                "investor_email": inv.investor_email,
                "amount_inr": inv.amount_inr,
                "expected_return_inr": inv.expected_return_inr,
                "repaid_amount_inr": inv.repaid_amount_inr,
            }
            for inv in investments
        ],
        "deals": [serialize_deal(d) for d in deals],
    }


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "deleted", "user_id": user_id}


@app.delete("/api/admin/investments/{investment_id}")
def admin_delete_investment(investment_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investment).filter(Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment record not found")

    deal = db.query(Deal).filter(Deal.id == inv.deal_id).first()
    if deal:
        deal.funded_amount_inr = max(0.0, round(deal.funded_amount_inr - inv.amount_inr, 2))
        deal.backer_count = max(0, deal.backer_count - 1)

    db.delete(inv)
    db.commit()
    return {"status": "deleted_and_refunded", "investment_id": investment_id}


@app.delete("/api/admin/deals/{deal_id}")
def admin_delete_deal(deal_id: int, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"status": "deal_deleted", "deal_id": deal_id}


@app.post("/api/reset-demo")
def reset_demo_database(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database(db)
    return {"status": "reset_complete"}