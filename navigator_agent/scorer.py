"""
Scorer module - Compare detected findings with expected findings
"""

import json
from pathlib import Path
from typing import Dict, List, Set, Tuple


def load_findings(findings_path: str) -> Dict:
    """Load findings from JSON file"""
    with open(findings_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_expected(expected_path: str = "data/expected_findings.json") -> Dict:
    """Load expected findings from JSON file"""
    with open(expected_path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_finding(finding: Dict) -> Tuple[str, str]:
    """
    Normalize a finding to (pattern_type, product_id) for comparison
    """
    pattern = finding.get("pattern") or finding.get("pattern_type") or ""
    item_id = finding.get("item_id") or finding.get("product_id") or ""
    
    # Normalize pattern aliases
    if pattern in ("false_urgency_scarcity", "false_urgency", "scarcity", "urgency"):
        pattern = "false_urgency_timer"
        
    # Normalize product / target aliases
    if item_id in ("storefront_banner", "atta-5kg", "multi_item_cart"):
        item_id = "atta"
    elif item_id in ("checkout_upsell", "checkout_payment", "payment"):
        item_id = "checkout"
    elif item_id in ("membership_cancellation", "account_cancellation", "account"):
        item_id = "membership"
        
    return (pattern, item_id)


def score_findings(
    findings_path: str,
    expected_path: str = "data/expected_findings.json"
) -> Dict:
    """
    Compare detected findings with expected findings.
    
    Args:
        findings_path: Path to the findings.json from a navigator run
        expected_path: Path to expected_findings.json
    
    Returns:
        Dict with matched, missed, and extra findings
    """
    # Load data
    findings_data = load_findings(findings_path)
    expected_data = load_expected(expected_path)
    
    # Extract finding lists
    detected_findings = findings_data.get("findings", [])
    expected_findings = expected_data.get("expected_findings", [])
    
    # Normalize to sets of (pattern_type, product_id)
    detected_set: Set[Tuple[str, str]] = set()
    for finding in detected_findings:
        detected_set.add(normalize_finding(finding))
    
    expected_set: Set[Tuple[str, str]] = set()
    for finding in expected_findings:
        expected_set.add(normalize_finding(finding))
    
    # Calculate matches, misses, extras
    matched = detected_set & expected_set
    missed = expected_set - detected_set
    extra = detected_set - expected_set
    
    # Build detailed result
    result = {
        "summary": {
            "total_expected": len(expected_set),
            "total_detected": len(detected_set),
            "matched": len(matched),
            "missed": len(missed),
            "extra": len(extra),
            "accuracy": len(matched) / len(expected_set) if expected_set else 0.0,
            "precision": len(matched) / len(detected_set) if detected_set else 0.0
        },
        "matched_findings": list(matched),
        "missed_findings": list(missed),
        "extra_findings": list(extra)
    }
    
    return result


def print_score_report(score: Dict):
    """Print a formatted score report"""
    summary = score["summary"]
    
    print("\n" + "="*60)
    print("📊 SCORER REPORT")
    print("="*60)
    
    print(f"\nExpected Findings: {summary['total_expected']}")
    print(f"Detected Findings: {summary['total_detected']}")
    print(f"\n✅ Matched: {summary['matched']}")
    print(f"❌ Missed:  {summary['missed']}")
    print(f"➕ Extra:   {summary['extra']}")
    
    print(f"\nAccuracy:  {summary['accuracy']*100:.1f}% (matched / expected)")
    print(f"Precision: {summary['precision']*100:.1f}% (matched / detected)")
    
    if score["matched_findings"]:
        print("\n✅ Matched Findings:")
        for pattern, product_id in score["matched_findings"]:
            print(f"   • {pattern} on {product_id}")
    
    if score["missed_findings"]:
        print("\n❌ Missed Findings (expected but not detected):")
        for pattern, product_id in score["missed_findings"]:
            print(f"   • {pattern} on {product_id}")
    
    if score["extra_findings"]:
        print("\n➕ Extra Findings (detected but not expected):")
        for pattern, product_id in score["extra_findings"]:
            print(f"   • {pattern} on {product_id}")
    
    print("\n" + "="*60)


def main():
    """CLI entry point for scoring"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m navigator_agent.scorer <findings.json> [expected_findings.json]")
        print("\nExample:")
        print("  python -m navigator_agent.scorer runs/20240315_143022/findings.json")
        sys.exit(1)
    
    findings_path = sys.argv[1]
    expected_path = sys.argv[2] if len(sys.argv) > 2 else "data/expected_findings.json"
    
    if not Path(findings_path).exists():
        print(f"❌ Error: Findings file not found: {findings_path}")
        sys.exit(1)
    
    if not Path(expected_path).exists():
        print(f"❌ Error: Expected findings file not found: {expected_path}")
        sys.exit(1)
    
    score = score_findings(findings_path, expected_path)
    print_score_report(score)


if __name__ == "__main__":
    main()
