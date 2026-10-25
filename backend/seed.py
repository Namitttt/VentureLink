import json
import hashlib
from sqlalchemy.orm import Session
from models import Deal, Milestone, Investment, RoyaltyLedger, PlatformMetrics, UserAccount


def make_hash(payload: str) -> str:
    return "0x" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def seed_database(db: Session):
    if db.query(Deal).count() > 0:
        return

    metrics = PlatformMetrics(
        saas_revenue_inr=11998.0,
        escrow_fees_inr=3600.0,
        royalty_fees_inr=243.75,
        audit_fees_inr=2997.0
    )
    db.add(metrics)

    # Seed Initial User Accounts (For Admin Panel visibility & deletion testing)
    users = [
        UserAccount(name="Namit Mahure (Master Admin)", email="admin@venturelink.in", role="ADMIN", status="VERIFIED_ADMIN"),
        UserAccount(name="Aarav Mehta", email="aarav@venturelink.in", role="INVESTOR", status="SEC42_ACCREDITED"),
        UserAccount(name="Ananya Sharma", email="ananya@venturelink.in", role="INVESTOR", status="SEC42_ACCREDITED"),
        UserAccount(name="Rohan Baruah", email="rohan@roastery.in", role="FOUNDER", status="KYC_VERIFIED"),
        UserAccount(name="Kabir Kalita", email="kabir@ecoweave.in", role="FOUNDER", status="KYC_VERIFIED"),
    ]
    db.add_all(users)

    # Deal 1: Guwahati Specialty Roastery & Cafe (SCALE_VIP)
    d1_compliance = [
        {"step": "1. Business PAN & Partnership Deed", "authority": "Income Tax Dept (NSDL)", "status": "VERIFIED", "detail": "PAN: AABCG8821D verified."},
        {"step": "2. Udyam MSME Registration", "authority": "Ministry of MSME", "status": "VERIFIED", "detail": "UDYAM-AS-01-0092811 active."},
        {"step": "3. Business Current Account + UPI POS", "authority": "HDFC Bank + RazorpayPOS", "status": "VERIFIED", "detail": "Linked to RBI Trustee Escrow."},
        {"step": "4. GST Registration (Assam NE Rule)", "authority": "GSTN Portal", "status": "VERIFIED", "detail": "GSTIN: 18AABCG8821D1Z5 active."},
        {"step": "5. FSSAI State Food License", "authority": "FoSCoS Assam", "status": "VERIFIED", "detail": "Certified for cold-brew bottling."}
    ]
    d1_challenges = [
        {"risk": "Monsoon Footfall Fluctuations", "solution": "Adaptive 6.5% royalty scales down automatically in slow months—zero fixed EMI default risk."},
        {"risk": "B2B Cafe Distribution", "solution": "Enrolled in Scale-Up VIP Tier: matched with 12 Guwahati & Shillong cafes."}
    ]
    d1_growth = [
        {"channel": "VIP B2B Wholesale Pipeline", "action": "Direct supply contracts with 12 boutique hotels & cafes in Northeast India."},
        {"channel": "ONDC & Quick-Commerce Onboarding", "action": "Automated storefront catalog managed by VentureLink VIP Concierge."}
    ]

    deal1 = Deal(
        title="Guwahati Specialty Roastery & Cafe",
        founder_name="Rohan Baruah",
        category="Physical Retail",
        domain="Food & Beverage",
        location="Guwahati, Assam",
        structure_type="ROYALTY",
        subscription_tier="SCALE_VIP",
        target_amount_inr=500000.0,
        funded_amount_inr=375000.0,
        royalty_percent=6.5,
        return_cap_multiple=1.4,
        total_repaid_inr=24375.0,
        est_monthly_revenue_inr=375000.0,
        backer_count=42,
        status="ACTIVE_ESCROW",
        pitch_video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        pitch_script_summary="Expanding single-origin Assam cold brew production with automated bottling hardware. Raising ₹5L at 6.5% monthly royalty (1.4x cap, 0% equity dilution).",
        compliance_json=json.dumps(d1_compliance),
        challenges_json=json.dumps(d1_challenges),
        growth_playbook_json=json.dumps(d1_growth),
        readiness_score=100
    )
    db.add(deal1)
    db.flush()

    db.add_all([
        Milestone(
            deal_id=deal1.id, sequence_number=1, title="Tranche 1: Roasting Hardware",
            allocation_percent=40.0, amount_inr=200000.0, status="RELEASED",
            proof_type="GST_INVOICE", proof_reference="Invoice #AS-8821 Verified",
            audit_hash=make_hash("d1-m1-AS-8821"), platform_fee_deducted_inr=3000.0, net_disbursed_inr=197000.0
        ),
        Milestone(
            deal_id=deal1.id, sequence_number=2, title="Tranche 2: Storefront Fit-out",
            allocation_percent=35.0, amount_inr=175000.0, status="PROOF_SUBMITTED",
            proof_type="GST_INVOICE", proof_reference="Pending GST & Contractor Receipt #AS-9012",
            audit_hash=make_hash("d1-m2-AS-9012")
        ),
        Milestone(
            deal_id=deal1.id, sequence_number=3, title="Tranche 3: POS & Working Capital",
            allocation_percent=25.0, amount_inr=125000.0, status="LOCKED",
            proof_reference="Awaiting Tranche 2 Completion"
        ),
        Investment(
            deal_id=deal1.id, investor_name="Aarav Mehta", investor_email="aarav@venturelink.in",
            amount_inr=40000.0, expected_return_inr=56000.0, repaid_amount_inr=11200.0
        ),
        Investment(
            deal_id=deal1.id, investor_name="Ananya Sharma", investor_email="ananya@venturelink.in",
            amount_inr=60000.0, expected_return_inr=84000.0, repaid_amount_inr=13175.0
        ),
        Investment(
            deal_id=deal1.id, investor_name="Guwahati Syndicate (40 Backers)", investor_email="syndicate@venturelink.in",
            amount_inr=275000.0, expected_return_inr=385000.0, repaid_amount_inr=0.0
        ),
        RoyaltyLedger(
            deal_id=deal1.id, month_label="October 2026", reported_revenue_inr=375000.0,
            royalty_deducted_inr=24375.0, platform_fee_inr=243.75, net_distributed_inr=24131.25,
            verification_source="SIMULATED_INDIA_STACK_GSTN_POS", audit_hash=make_hash("d1-oct-2026")
        )
    ])

    # Deal 2: EcoWeave Bamboo Fabricators (GROWTH_PRO)
    deal2 = Deal(
        title="EcoWeave Bamboo Fabricators",
        founder_name="Kabir Kalita",
        category="Hardware Maker",
        domain="Hardware & Local Manufacturing",
        location="Jorhat, Assam",
        structure_type="ROYALTY",
        subscription_tier="GROWTH_PRO",
        target_amount_inr=750000.0,
        funded_amount_inr=480000.0,
        royalty_percent=8.0,
        return_cap_multiple=1.5,
        total_repaid_inr=0.0,
        est_monthly_revenue_inr=420000.0,
        backer_count=68,
        status="FUNDING",
        pitch_video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        pitch_script_summary="Precision CNC machinery for export-grade sustainable bamboo furniture and modular acoustic kits.",
        compliance_json=json.dumps(d1_compliance[:4]),
        challenges_json=json.dumps(d1_challenges),
        growth_playbook_json=json.dumps(d1_growth[:1]),
        readiness_score=92
    )
    db.add(deal2)
    db.flush()

    db.add_all([
        Milestone(deal_id=deal2.id, sequence_number=1, title="Tranche 1: CNC Lathe Procurement", allocation_percent=50.0, amount_inr=375000.0, status="PROOF_SUBMITTED", proof_reference="Vendor Proforma #JR-4410"),
        Milestone(deal_id=deal2.id, sequence_number=2, title="Tranche 2: Tooling & Raw Bamboo Stock", allocation_percent=30.0, amount_inr=225000.0, status="LOCKED", proof_reference="Locked in Vault"),
        Milestone(deal_id=deal2.id, sequence_number=3, title="Tranche 3: Quality Compliance Certification", allocation_percent=20.0, amount_inr=150000.0, status="LOCKED", proof_reference="Locked in Vault"),
        Investment(deal_id=deal2.id, investor_name="Upper Assam Angels (68 Backers)", investor_email="jorhat@venturelink.in", amount_inr=480000.0, expected_return_inr=720000.0, repaid_amount_inr=0.0)
    ])

    # Deal 3: HyperLocal Delivery Fleet (STARTER - Milestone SAFE)
    deal3 = Deal(
        title="HyperLocal EV Delivery Fleet",
        founder_name="Priya Bora",
        category="Clean Tech",
        domain="SaaS & Mobility",
        location="Guwahati, Assam",
        structure_type="SAFE",
        subscription_tier="STARTER",
        target_amount_inr=1200000.0,
        funded_amount_inr=1050000.0,
        royalty_percent=5.0,
        return_cap_multiple=1.5,
        total_repaid_inr=0.0,
        est_monthly_revenue_inr=510000.0,
        backer_count=89,
        status="ACTIVE_ESCROW",
        pitch_video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        pitch_script_summary="Solar-swappable EV cargo scooters serving regional institutional campuses and local merchants.",
        compliance_json=json.dumps(d1_compliance[:3]),
        challenges_json=json.dumps(d1_challenges[:1]),
        growth_playbook_json=json.dumps([]),
        readiness_score=88
    )
    db.add(deal3)
    db.flush()

    db.add_all([
        Milestone(deal_id=deal3.id, sequence_number=1, title="Tranche 1: Chassis & Battery Packs", allocation_percent=45.0, amount_inr=540000.0, status="RELEASED", proof_reference="SHA-256 Telemetry Verified", audit_hash=make_hash("d3-m1")),
        Milestone(deal_id=deal3.id, sequence_number=2, title="Tranche 2: Solar Swap Hub Assembly", allocation_percent=35.0, amount_inr=420000.0, status="PROOF_SUBMITTED", proof_reference="Site Lease & Meter ID #GHY-19"),
        Milestone(deal_id=deal3.id, sequence_number=3, title="Tranche 3: Pilot Fleet Insurance & QA", allocation_percent=20.0, amount_inr=240000.0, status="LOCKED", proof_reference="Locked in Vault"),
        Investment(deal_id=deal3.id, investor_name="NE CleanTech Syndicate (89 Backers)", investor_email="ev@venturelink.in", amount_inr=1050000.0, expected_return_inr=1575000.0, repaid_amount_inr=0.0)
    ])

    db.commit()