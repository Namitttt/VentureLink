import os
import json

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


def generate_founder_blueprint(raw_idea: str, location: str, target_inr: float, tier: str) -> dict:
    idea_lower = raw_idea.lower()

    is_food = any(w in idea_lower for w in ["cafe", "coffee", "tea", "food", "bakery", "restaurant", "brew", "kitchen", "snack", "momo"])
    is_software = any(w in idea_lower for w in ["app", "saas", "ai", "software", "platform", "web", "cloud", "bot", "code"])
    
    if is_food:
        category = "Physical"
        domain = "Food & Beverage"
        structure_type = "ROYALTY"
        rec_royalty = 6.0
        rec_cap = 1.35
    elif is_software:
        category = "Digital"
        domain = "SaaS & AI"
        structure_type = "SAFE"
        rec_royalty = 5.0
        rec_cap = 1.50
    else:
        category = "Physical"
        domain = "Hardware & Local Manufacturing"
        structure_type = "ROYALTY"
        rec_royalty = 7.0
        rec_cap = 1.40

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if HAS_GENAI and api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""
            You are an Indian Startup CA & YC Growth Advisor. A founder in {location} wants to build: "{raw_idea}" raising ₹{target_inr:,.0f}.
            Return ONLY valid JSON with these exact keys:
            "suggested_title": (short catchy business name),
            "pitch_script_60s": (a crisp 60-second spoken pitch script for investors),
            "est_monthly_revenue_inr": (number, realistic monthly revenue in INR)
            """
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            parsed = json.loads(text)
            suggested_title = parsed.get("suggested_title", raw_idea[:40].title())
            pitch_script = parsed.get("pitch_script_60s", "")
            est_rev = float(parsed.get("est_monthly_revenue_inr", target_inr * 0.45))
            ai_mode = "LIVE_GEMINI_2_5_FLASH"
        except Exception:
            suggested_title, pitch_script, est_rev, ai_mode = _build_fallback_text(raw_idea, location, target_inr, rec_royalty, rec_cap)
    else:
        suggested_title, pitch_script, est_rev, ai_mode = _build_fallback_text(raw_idea, location, target_inr, rec_royalty, rec_cap)

    compliance_checklist = [
        {
            "step": "1. Business PAN & Sole Prop / LLP Deed",
            "authority": "Income Tax Dept (NSDL)",
            "status": "REQUIRED_FIRST",
            "detail": "Mandatory identity before opening a business current account or signing revenue-share contracts under Indian Contract Act, 1872."
        },
        {
            "step": "2. Udyam MSME Registration",
            "authority": "Ministry of MSME (udyamregistration.gov.in)",
            "status": "FREE_INSTANT",
            "detail": "100% free Aadhaar-based certificate. Unlocks priority micro-enterprise protection and legalizes commercial vendor invoicing."
        },
        {
            "step": "3. Zero-Balance Business Current Account + UPI Merchant POS",
            "authority": "RBI Regulated Bank + NPCI",
            "status": "REQUIRED_FOR_ESCROW",
            "detail": "Required to receive staged milestone disbursements from VentureLink Trustee Escrow and link Account Aggregator (AA) sales feeds."
        },
        {
            "step": "4. GST Registration (Threshold & Inter-State Check)",
            "authority": "GSTN Portal (gst.gov.in)",
            "status": "CONDITIONAL",
            "detail": "Mandatory if turnover crosses ₹20L (₹10L in NE states like Assam) OR immediately if buying/selling across state lines or via e-commerce."
        },
    ]

    if is_food:
        compliance_checklist.append({
            "step": "5. FSSAI Basic / State Food Safety License",
            "authority": "FoSCoS FSSAI Portal",
            "status": "SECTOR_MANDATORY",
            "detail": "Mandatory ₹100/yr basic food registration before unlocking Milestone 3 (Public Store Launch)."
        })
    elif is_software:
        compliance_checklist.append({
            "step": "5. DPDP Act Privacy Notice & IP Assignment",
            "authority": "MeitY / Cert-In Guidelines",
            "status": "SECTOR_MANDATORY",
            "detail": "Clean source-code IP ownership and user data consent compliance before unlocking Milestone 3."
        })
    else:
        compliance_checklist.append({
            "step": "5. Local Shop & Establishment Act License (Gumasta / Trade License)",
            "authority": f"Municipal Corporation ({location})",
            "status": "SECTOR_MANDATORY",
            "detail": "Required for commercial workshop lease, 3-phase electricity meter, and labor compliance."
        })

    challenges = [
        {
            "risk": "Seasonal Revenue Dip / Slow Early Months",
            "solution": f"Solved via VentureLink Adaptive Royalty: during lean months, you pay {rec_royalty}% of actual sales (even ₹0 if sales pause) instead of fixed bank EMIs."
        },
        {
            "risk": "Investor Trust Deficit (First-Time Founder)",
            "solution": "Solved via 3-Stage Milestone Escrow: backers see 100% of capital locked in trustee vaults and released only against verified GST invoices."
        },
        {
            "risk": "Section 42(7) Private Placement Compliance",
            "solution": "VentureLink automatically caps syndicate backers at 199 private micro-angels and uses non-dilutive commercial royalty agreements."
        }
    ]

    growth_playbook = [
        {
            "channel": "Hyperlocal ONDC & Google Business Profile Dominance",
            "action": f"VentureLink Growth Team sets up automated local discovery in {location} + WhatsApp catalog ordering to drive Day-1 cashflow."
        },
        {
            "channel": "Pre-Negotiated B2B Wholesale Supplier Network",
            "action": "12%–18% bulk equipment and raw material discount via VentureLink verified vendor partners during Milestone 1 procurement."
        },
        {
            "channel": "Institutional Working-Capital Graduation",
            "action": "Once your 3 escrow milestones complete and 3 months of UPI royalties are verified, unlock instant 1-click top-up capital at 1.25x cap."
        }
    ]

    milestones = [
        {
            "sequence_number": 1,
            "title": "Core Equipment / Setup Procurement (Verified Vendor GST Invoice)",
            "allocation_percent": 40.0
        },
        {
            "sequence_number": 2,
            "title": "Site Fit-Out / Beta Prototype & License Sign-Off",
            "allocation_percent": 35.0
        },
        {
            "sequence_number": 3,
            "title": "Live Commercial Launch & UPI/POS Account Aggregator Link",
            "allocation_percent": 25.0
        }
    ]

    return {
        "ai_engine_mode": ai_mode,
        "suggested_title": suggested_title,
        "category": category,
        "domain": domain,
        "location": location,
        "structure_type": structure_type,
        "recommended_royalty_percent": rec_royalty,
        "recommended_return_cap": rec_cap,
        "est_monthly_revenue_inr": round(est_rev, 0),
        "pitch_script_60s": pitch_script,
        "compliance_checklist": compliance_checklist,
        "challenges": challenges,
        "growth_playbook": growth_playbook,
        "recommended_milestones": milestones
    }


def _build_fallback_text(raw_idea: str, location: str, target_inr: float, royalty: float, cap: float):
    words = [w.capitalize() for w in raw_idea.split()[:4]]
    suggested_title = " ".join(words) if words else "NextGen Micro-Venture"
    est_rev = max(round(target_inr * 0.45, -3), 100000.0)
    pitch_script = (
        f"Hi, I'm building {suggested_title} right here in {location}. "
        f"Right now, customers struggle with inconsistent quality and high prices in our segment. "
        f"We are raising ₹{target_inr:,.0f} on VentureLink with zero equity dilution—offering backers a {royalty}% monthly gross revenue share up to a {cap}x return cap. "
        f"100% of your capital is safeguarded inside a 3-stage Milestone Escrow Vault and only unlocks as we submit verified GST invoices and launch live UPI sales!"
    )
    return suggested_title, pitch_script, est_rev, "SIMULATED_SMART_DOMAIN_ANALYZER"