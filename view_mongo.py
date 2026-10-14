"""
TrustLens AI - MongoDB CLI Inspector
Quick script to inspect runs and screenshots stored in MongoDB.
"""

import sys
import json
from pymongo import MongoClient

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def main():
    print("=" * 65)
    print("📦 TRUSTLENS AI - MONGODB STORAGE INSPECTOR")
    print("   Host: mongodb://localhost:27017/  |  Database: trustlens_db")
    print("=" * 65)

    client = MongoClient("mongodb://localhost:27017/")
    db = client["trustlens_db"]

    runs = list(db.runs.find().sort("created_at", -1))
    print(f"\n📊 TOTAL STORED RUNS: {len(runs)}")
    print(f"🖼️ TOTAL SCREENSHOTS IN MONGO: {db.screenshots.count_documents({})}")
    print("-" * 65)

    for i, r in enumerate(runs, 1):
        shots = list(db.screenshots.find({"run_id": r["run_id"]}).sort("step_number", 1))
        print(f"\n[{i}] Run ID: {r['run_id']}")
        print(f"    Target: {r.get('target_url')}")
        print(f"    Status: {r.get('status')} | Duration: {r.get('duration_seconds')}s")
        print(f"    Findings Count: {r.get('findings_count', len(r.get('findings', [])))}")
        print(f"    Screenshots in MongoDB: {len(shots)} frames")
        
        anomalies = r.get("candidate_anomalies", [])
        if anomalies:
            print(f"    🔍 Stage 2 Vision Anomalies ({len(anomalies)} isolated):")
            for a in anomalies:
                print(f"      • [{a.get('anomaly_id')}] {a.get('pattern_name')} ({a.get('model_used')}) - Conf: {a.get('confidence')}")

        for s in shots:
            has_b64 = bool(s.get("data_uri"))
            pattern_txt = f" [⚠️ {s['pattern']}]" if s.get("pattern") else ""
            print(f"      • #{s.get('step_number', 0):02d} {s.get('filename')}{pattern_txt} (Base64 stored: {has_b64})")

    print("\n" + "=" * 65)
    print("🌐 Open Visual Explorer in your browser to view all images at once:")
    print("   👉 http://localhost:8000/mongo-viewer")
    print("=" * 65)


if __name__ == "__main__":
    main()
