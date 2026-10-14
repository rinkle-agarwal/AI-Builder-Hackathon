"""
TrustLens AI - Stage 4: Fix Suggestion Agent
Synthesizes concrete technical remediations and high-impact ethical business alternatives
for all isolated dark pattern violations:
1. Direct Compliance Fix (Eliminates CCPA/FTC violation)
2. High-Impact Ethical Business Alternative (Boosts conversion, AOV, retention without deceptive manipulation)
"""

import os
import json
import time
import re
import requests
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime

# ══════════════════════════════════════════════════════════════════════════
# FIX & ETHICAL BUSINESS ALTERNATIVE SPECIFICATION CORPUS
# ══════════════════════════════════════════════════════════════════════════

DEFAULT_FIX_SPECS: Dict[str, Dict[str, Any]] = {
    "drip_pricing": {
        "fix_id": "FX-01",
        "anomaly_id": "CA-01",
        "ruling_id": "LR-01",
        "pattern_name": "Drip Pricing",
        "issue_summary": "Unannounced ₹30 Handling & Packaging fee stealthily injected at cart checkout stage.",
        "compliance_fix": {
            "title": "Full-Price Upfront Transparency Mandate",
            "action": "Disclose the ₹30 fee upfront on every product card or incorporate packaging overhead directly into base MRP.",
            "code_diff": "- <span className='cart-total'>Subtotal: ₹756 + Fee: ₹30</span>\n+ <span className='cart-total'>Subtotal (All-Inclusive): ₹786</span>",
            "regulatory_status": "100% CCPA Section 5(1) Compliant"
        },
        "business_alternative": {
            "title": "Gamified Free-Handling Threshold (AOV Accelerator)",
            "strategy": "Replace sneaky checkout fees with an honest, motivating spend threshold.",
            "ux_copy": "🎉 Add ₹43 more of grocery staples to unlock FREE Packaging & Express Delivery!",
            "how_it_works": "Display a dynamic cart progress bar. When users have ₹756 in cart, incentivize adding an extra staple (e.g. snack or tea) to reach ₹800 rather than penalizing them with a surprise fee.",
            "projected_impact": "+16% Average Order Value (AOV), -28% Cart Abandonment at payment stage."
        },
        "engineering_spec": {
            "component": "CartDrawer.tsx / PriceSummary.tsx",
            "effort": "Low (1 Sprint)",
            "priority": "P1 Urgent"
        }
    },
    "false_urgency": {
        "fix_id": "FX-02",
        "anomaly_id": "CA-02",
        "ruling_id": "LR-02",
        "pattern_name": "False Urgency",
        "issue_summary": "Fabricated countdown timer resets back to 09:59 on page reload.",
        "compliance_fix": {
            "title": "Decommission Client-Side Artificial Clocks",
            "action": "Remove the recurring client-side countdown timer banner or bind timers strictly to server-side flash sale schedules with fixed UTC expiries.",
            "code_diff": "- const [timeLeft, setTimeLeft] = useState(600); // Resets on reload\n+ // Timer removed or synced with verifiable server timestamp",
            "regulatory_status": "100% CCPA Section 5(3) Compliant"
        },
        "business_alternative": {
            "title": "Authentic Farm-to-Table Batch Dispatch Transparency",
            "strategy": "Leverage genuine operational freshness cycles instead of fake urgency clocks.",
            "ux_copy": "🚚 Fresh Morning Harvest dispatched at 10:00 AM — Next 14 express delivery slots open for Indiranagar!",
            "how_it_works": "Communicate real operational schedules (e.g. dispatch batch cutoffs or real rider availability). Customers feel authentic urgency to order before the morning dispatch cutoff.",
            "projected_impact": "+11% Organic Conversion, +34% Brand Trust Rating, Zero regulatory liability."
        },
        "engineering_spec": {
            "component": "CountdownBanner.tsx / StoreHeader.tsx",
            "effort": "Low (< 2 Days)",
            "priority": "P2 High"
        }
    },
    "confirmshaming": {
        "fix_id": "FX-03",
        "anomaly_id": "CA-03",
        "ruling_id": "LR-03",
        "pattern_name": "Confirmshaming",
        "issue_summary": "Upsell modal uses emotionally manipulative guilt copy ('No thanks, I like paying extra').",
        "compliance_fix": {
            "title": "Neutral Psychological Opt-Out Copy",
            "action": "Replace derogatory dismissal phrasing with standard neutral copy.",
            "code_diff": "- <button>No thanks, I like paying extra</button>\n+ <button>No, thanks</button> or <button>Maybe later</button>",
            "regulatory_status": "100% CCPA Section 5(5) Compliant"
        },
        "business_alternative": {
            "title": "Transparent Value Calculator with 1-Order Risk-Free Guarantee",
            "strategy": "Highlight objective savings without emotional manipulation.",
            "ux_copy": "⚡ Skip for now — Or try 1 delivery free to save ₹120 on your groceries. Cancel anytime.",
            "how_it_works": "Display a personalized savings calculator showing exact money saved based on current cart items. Give users an honest 'Try 1 Delivery Free' option without locking them into psychological guilt.",
            "projected_impact": "+24% Secondary Trial Adoption, -40% Negative Customer Sentiment."
        },
        "engineering_spec": {
            "component": "PlusModal.tsx / InterstitialUpsell.tsx",
            "effort": "Immediate (Copy Change)",
            "priority": "P1 Urgent"
        }
    },
    "basket_sneaking": {
        "fix_id": "FX-04",
        "anomaly_id": "CA-04",
        "ruling_id": "LR-04",
        "pattern_name": "Basket Sneaking",
        "issue_summary": "Voluntary ₹10 charity donation checkbox is pre-selected by default at checkout.",
        "compliance_fix": {
            "title": "Affirmative Consent Default State",
            "action": "Uncheck the charity donation checkbox by default. Require an explicit, voluntary click by consumer.",
            "code_diff": "- <input type='checkbox' defaultChecked={true} />\n+ <input type='checkbox' defaultChecked={false} />",
            "regulatory_status": "100% CCPA Section 5(2) Compliant"
        },
        "business_alternative": {
            "title": "Gamified 'FreshCart Matches Your Impact' Micro-Round-up",
            "strategy": "Turn an unannounced fee into a proud, voluntary customer partnership.",
            "ux_copy": "🌱 Round up your bill by ₹4 to support local farmers — FreshCart will match 100% of your donation!",
            "how_it_works": "Instead of pre-checking ₹10, suggest rounding up ₹786 to ₹790. FreshCart pledges to match every rupee. Customers willingly opt-in because they feel part of a positive initiative.",
            "projected_impact": "38% Voluntary Opt-in Rate (Higher than sneaky tick), +45% Positive ESG Brand Perception."
        },
        "engineering_spec": {
            "component": "PaymentOptions.tsx / DonationCheckbox.tsx",
            "effort": "Immediate (< 1 Hour)",
            "priority": "P1 Urgent"
        }
    },
    "subscription_trap": {
        "fix_id": "FX-05",
        "anomaly_id": "CA-05",
        "ruling_id": "LR-05",
        "pattern_name": "Subscription Trap",
        "issue_summary": "1-click effortless enrollment vs 4-screen cancellation maze with mandatory typing barrier ('Type CANCEL').",
        "compliance_fix": {
            "title": "Symmetric 1-Click Cancellation Parity",
            "action": "Remove multi-screen survey maze and text input requirements. Provide an instant, frictionless 1-click 'Cancel Subscription' CTA in account settings.",
            "code_diff": "- <form onSubmit={requireTyping('CANCEL')}>4 Survey Screens...</form>\n+ <button onClick={handleOneClickCancel}>Cancel Subscription</button>",
            "regulatory_status": "100% CCPA Section 5(4) & FTC Click-to-Cancel Compliant"
        },
        "business_alternative": {
            "title": "'Pause for 14 Days' Retention Bridge & Delivery Frequency Swap",
            "strategy": "Save customer churn ethically without trapping them in a labyrinth.",
            "ux_copy": "Going out of town? Pause your membership for 14 days with 1 click, or switch to bi-weekly deliveries.",
            "how_it_works": "Directly beside the 1-click Cancel button, offer a 1-click 'Pause Membership' or 'Switch to Bi-weekly' option. Users who only needed a temporary break choose to Pause instead of canceling completely.",
            "projected_impact": "42% of Churn-Intent Users choose to Pause instead of canceling, preserving long-term Customer LTV!"
        },
        "engineering_spec": {
            "component": "AccountCancellation.tsx / MembershipSettings.tsx",
            "effort": "Medium (1 Sprint)",
            "priority": "P1 Urgent"
        }
    }
}


@dataclass
class FixSuggestion:
    fix_id: str
    anomaly_id: str
    ruling_id: str
    pattern_name: str
    issue_summary: str
    compliance_fix_title: str
    compliance_fix_action: str
    compliance_code_diff: str
    regulatory_status: str
    business_alternative_title: str
    business_alternative_strategy: str
    business_alternative_copy: str
    business_alternative_how_it_works: str
    projected_business_impact: str
    component_target: str
    engineering_effort: str
    priority: str


class FixSuggestionAgent:
    """
    Stage 4: Fix Suggestion Agent
    Synthesizes concrete technical remediations and high-impact ethical business alternatives.
    """

    def __init__(self, run_id: str, progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.run_id = run_id
        self.progress_callback = progress_callback
        self.groq_key = os.getenv("GROQ_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.fixes: List[FixSuggestion] = []

    def _log(self, message: str, level: str = "info", fix_index: Optional[int] = None):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "id": f"log-s4-{int(time.time()*1000)}-{len(self.fixes)}",
            "timestamp": timestamp,
            "stageNumber": 4,
            "stageName": "Fix Suggestion Agent",
            "level": level,
            "message": message
        }
        if self.progress_callback:
            try:
                self.progress_callback({
                    "type": "log",
                    "log": log_entry,
                    "fix_index": fix_index
                })
            except Exception:
                pass
        return log_entry

    def _call_groq_fix_enhancer(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Invokes Groq LLM to refine actionable business alternative copy."""
        if not self.groq_key:
            return None
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "qwen/qwen3.8-27b",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a growth UX and behavioral design expert. Provide high-impact, ethical, "
                        "conversion-boosting alternatives to dark patterns in valid JSON only."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                return json.loads(content)
        except Exception:
            pass
        return None

    def synthesize_remediations(self, rulings: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Synthesizes compliance fixes & high-impact ethical business alternatives for each legal ruling.
        Generates 1 dual remediation specification for every ruling produced by the Reasoning Agent.
        """
        self._log("Initializing Fix Suggestion Agent (Stage 4)...", level="info")
        self._log(
            "Synthesizing compliance remediations & high-impact ethical business growth alternatives...",
            level="info"
        )

        self.fixes = []

        if rulings is not None and len(rulings) == 0:
            self._log("✅ Zero infractions detected. No remediation required — site is fully compliant.", level="info")
            return {"fixes": [], "total_fixes": 0}

        def _get_field(obj: Any, key: str, default: Any = "") -> Any:
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        def _match_pattern_key(r: Any, fallback_idx: int) -> str:
            raw = (
                _get_field(r, "pattern_name") or
                _get_field(r, "pattern_type") or
                _get_field(r, "pattern") or
                _get_field(r, "pattern_id") or
                ""
            ).lower()
            clean = re.sub(r'[^a-z0-9]', '', raw)

            if any(term in clean for term in ["drip", "fee", "price", "pricing", "drippricing", "hiddenfee"]):
                return "drip_pricing"
            if any(term in clean for term in ["urgency", "timer", "scarcity", "falseurgency", "countdown", "clock"]):
                return "false_urgency"
            if any(term in clean for term in ["shame", "shaming", "confirm", "confirmshaming", "guilt"]):
                return "confirmshaming"
            if any(term in clean for term in ["sneak", "basket", "donation", "basketsneaking", "prechecked"]):
                return "basket_sneaking"
            if any(term in clean for term in ["sub", "trap", "cancel", "member", "subscription", "subscriptiontrap"]):
                return "subscription_trap"

            for k in DEFAULT_FIX_SPECS.keys():
                k_clean = re.sub(r'[^a-z0-9]', '', k)
                if k_clean in clean or clean in k_clean:
                    return k

            default_keys = list(DEFAULT_FIX_SPECS.keys())
            return default_keys[fallback_idx % len(default_keys)]

        # Prepare exactly 1 fix task per ruling (or 5 default specs if rulings is None)
        tasks = []
        if rulings is not None:
            for idx, r in enumerate(rulings):
                pkey = _match_pattern_key(r, idx)
                tasks.append({
                    "ruling": r,
                    "spec": DEFAULT_FIX_SPECS[pkey],
                    "fix_id": f"FX-0{idx+1}"
                })
        else:
            default_keys = ["drip_pricing", "false_urgency", "confirmshaming", "basket_sneaking", "subscription_trap"]
            for idx, k in enumerate(default_keys):
                tasks.append({
                    "ruling": {},
                    "spec": DEFAULT_FIX_SPECS[k],
                    "fix_id": f"FX-0{idx+1}"
                })

        total = len(tasks)

        for idx, task in enumerate(tasks):
            r = task["ruling"]
            spec = task["spec"]
            f_id = task["fix_id"]

            r_id = _get_field(r, "ruling_id") or spec["ruling_id"]
            a_id = _get_field(r, "anomaly_id") or spec["anomaly_id"]
            p_name = _get_field(r, "pattern_name") or spec["pattern_name"]
            issue_summary = _get_field(r, "legal_reasoning") or spec["issue_summary"]
            compliance_action = _get_field(r, "remediation_summary") or spec["compliance_fix"]["action"]
            statutory_clause = _get_field(r, "statutory_clause")
            reg_status = f"100% {statutory_clause} Compliant" if statutory_clause else spec["compliance_fix"]["regulatory_status"]

            self._log(
                f"Generating dual remediation spec for [{r_id}: {p_name}] -> Compliance Fix + Growth Alternative...",
                level="info",
                fix_index=idx + 1
            )

            # Optional LLM refinement
            prompt = (
                f"Pattern: {p_name}\n"
                f"Issue: {issue_summary}\n"
                f"Proposed Business Strategy: {spec['business_alternative']['title']}\n"
                f"Enhance the UX copy and projected impact in JSON format with fields:\n"
                f"ux_copy (1 compelling sentence), projected_impact (metric projection)."
            )
            llm_res = self._call_groq_fix_enhancer(prompt)

            if llm_res and "ux_copy" in llm_res:
                ux_copy = llm_res.get("ux_copy", spec["business_alternative"]["ux_copy"])
                proj_impact = llm_res.get("projected_impact", spec["business_alternative"]["projected_impact"])
            else:
                ux_copy = spec["business_alternative"]["ux_copy"]
                proj_impact = spec["business_alternative"]["projected_impact"]

            fix_obj = FixSuggestion(
                fix_id=f_id,
                anomaly_id=a_id,
                ruling_id=r_id,
                pattern_name=p_name,
                issue_summary=issue_summary,
                compliance_fix_title=spec["compliance_fix"]["title"],
                compliance_fix_action=compliance_action,
                compliance_code_diff=spec["compliance_fix"]["code_diff"],
                regulatory_status=reg_status,
                business_alternative_title=spec["business_alternative"]["title"],
                business_alternative_strategy=spec["business_alternative"]["strategy"],
                business_alternative_copy=ux_copy,
                business_alternative_how_it_works=spec["business_alternative"]["how_it_works"],
                projected_business_impact=proj_impact,
                component_target=spec["engineering_spec"]["component"],
                engineering_effort=spec["engineering_spec"]["effort"],
                priority=spec["engineering_spec"]["priority"]
            )
            self.fixes.append(fix_obj)

            self._log(
                f"✨ {f_id} Ready: Compliance Fix + Ethical Growth Alternative: {spec['business_alternative']['title']} ({proj_impact})",
                level="success",
                fix_index=idx + 1
            )

            if self.progress_callback:
                try:
                    self.progress_callback({
                        "type": "fix_synthesized",
                        "fix": asdict(fix_obj),
                        "completed_fixes": idx + 1,
                        "total_fixes": total
                    })
                except Exception:
                    pass

            time.sleep(0.35)

        self._log(
            f"Fix suggestion synthesis complete! {len(self.fixes)} dual remediation specs generated (Compliance + Business Impact).",
            level="success"
        )

        # Persist to MongoDB
        try:
            from db.mongo import mongo
            if mongo._connected and mongo._db is not None:
                mongo._db.runs.update_one(
                    {"run_id": self.run_id},
                    {
                        "$set": {
                            "fix_suggestions": [asdict(f) for f in self.fixes],
                            "fixes_count": len(self.fixes),
                            "stage_4_status": "Completed"
                        }
                    }
                )
                print(f"💾 MongoDB: Persisted {len(self.fixes)} fix suggestions for {self.run_id}")
        except Exception as e:
            print(f"MongoDB fix save warning: {e}")

        return {
            "run_id": self.run_id,
            "fixes": [asdict(f) for f in self.fixes],
            "total_fixes": len(self.fixes)
        }
