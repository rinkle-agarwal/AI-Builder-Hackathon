"""
TrustLens AI Multi-Agent Backend Server
Coordinates Navigator Agent (Playwright browser automation) and Pattern Detector Agent.
Provides real-time SSE streaming for live dashboard telemetry and screenshots.
"""

import asyncio
import json
import threading
import time
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from navigator_agent import NavigatorAgent, PatternDetectorAgent, ReasoningAgent, FixSuggestionAgent, ComplianceTrailAgent, JourneyStep
from report_generator import generate_report_html, generate_report_pdf

app = FastAPI(title="TrustLens Multi-Agent Orchestrator")

# Mount static files so screenshots can be fetched directly
os.makedirs("runs", exist_ok=True)
os.makedirs("public/runs", exist_ok=True)
app.mount("/runs", StaticFiles(directory="public/runs"), name="runs")

if os.path.exists("dist/assets"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store of active and past runs
RUNS: Dict[str, Dict[str, Any]] = {}
EVENT_QUEUES: Dict[str, list] = {}


class StartRunRequest(BaseModel):
    siteName: Optional[str] = "FreshCart (demo store)"
    targetUrl: Optional[str] = "http://localhost:3000/freshcart.html"
    targetType: Optional[str] = "URL"
    variant: Optional[str] = "Partly fixed"
    journeyTemplate: Optional[str] = "Search > cart > checkout > cancel"
    mode: Optional[str] = "Quick"
    headless: Optional[bool] = False


def _emit_event(run_id: str, event_type: str, data: Dict[str, Any]):
    event = {
        "event": event_type,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    if run_id in EVENT_QUEUES:
        EVENT_QUEUES[run_id].append(event)


def _run_multi_agent_pipeline(run_id: str, req: StartRunRequest):
    if sys.platform == "win32":
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            loop = asyncio.ProactorEventLoop()
            asyncio.set_event_loop(loop)
        except Exception:
            pass

    run_state = RUNS[run_id]
    start_time = time.time()

    target_url = req.targetUrl or "/freshcart_fixed.html"
    if "freshcart-demo.store" in target_url:
        target_url = "/freshcart_fixed.html"

    # In Cloud Run container, route local, relative, or cloud URLs to internal container server
    port = os.getenv("PORT", "8080")
    if os.getenv("K_SERVICE") or sys.platform != "win32":
        if "localhost:3000" in target_url or "localhost:8000" in target_url:
            target_url = target_url.replace("localhost:3000", f"127.0.0.1:{port}").replace("localhost:8000", f"127.0.0.1:{port}")
        elif "run.app" in target_url:
            fname = target_url.split("/")[-1].split("?")[0]
            if fname.endswith(".html"):
                target_url = f"http://127.0.0.1:{port}/{fname}"
        elif target_url.startswith("/"):
            target_url = f"http://127.0.0.1:{port}{target_url}"

    req.targetUrl = target_url
    run_state["targetUrl"] = target_url

    try:
        # ─────────────────────────────────────────────────────────────
        # STAGE 1: NAVIGATOR AGENT (PLAYWRIGHT LIVE BROWSER)
        # ─────────────────────────────────────────────────────────────
        run_state["status"] = "Running"
        run_state["stages"][0]["status"] = "Running"
        run_state["stages"][0]["keyOutput"] = "Launching Chromium browser window via Playwright..."
        
        init_log = {
            "id": f"log-s1-init-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 1,
            "stageName": "Navigator Agent",
            "level": "info",
            "message": f"Orchestrator initiated Playwright instance. Target: {req.targetUrl}. Headless: {req.headless}."
        }
        run_state["stages"][0]["logs"].append(init_log)
        _emit_event(run_id, "log", {"stage": 1, "log": init_log})

        def on_step_progress(step: JourneyStep):
            elapsed = int(time.time() - start_time)
            run_state["durationSeconds"] = elapsed
            run_state["stages"][0]["elapsedTime"] = f"{elapsed}s"
            if step.screenshot_path not in run_state["screenshots"]:
                run_state["screenshots"].append(step.screenshot_path)
            
            s1_shots = run_state["stages"][0].setdefault("screenshots", [])
            if step.screenshot_path not in s1_shots:
                s1_shots.append(step.screenshot_path)
            
            # Update stage progress count
            sc_count = len(run_state["stages"][0]["screenshots"])
            run_state["stages"][0]["progressCount"] = f"{sc_count} of 10 evidence frames (Before/After)"
            run_state["stages"][0]["progressPercent"] = min(100, int((sc_count / 10) * 100))
            run_state["stages"][0]["latestLogLine"] = f"{step.name}"
            
            step_log = {
                "id": f"log-s1-{sc_count}-{int(time.time()*1000)}",
                "timestamp": step.timestamp,
                "stageNumber": 1,
                "stageName": "Navigator Agent",
                "level": "warn" if (getattr(step, "comparison_type", "") == "after" or "AFTER" in step.name) else "info",
                "message": f"{step.name}: {step.details or 'Captured dark pattern evidence checkpoint.'}"
            }
            run_state["stages"][0]["logs"].append(step_log)
            _emit_event(run_id, "screenshot", {
                "url": step.screenshot_path,
                "name": step.name,
                "checkpoints": f"{sc_count} of 10 evidence frames",
                "pattern": getattr(step, "pattern", None),
                "comparison_type": getattr(step, "comparison_type", None),
                "caption": getattr(step, "caption", None),
                "log": step_log
            })

        # Launch Navigator Agent (Headless on Cloud Run container, GUI on local desktop)
        is_cloud = bool(os.getenv("K_SERVICE") or sys.platform != "win32" or os.getenv("HEADLESS", "false").lower() == "true")
        target_endpoint = (req.targetUrl or "/freshcart_fixed.html").strip()
        if not target_endpoint.startswith("http"):
            if not target_endpoint.startswith("/"):
                target_endpoint = f"/{target_endpoint}"
            target_endpoint = f"http://127.0.0.1:8000{target_endpoint}"

        nav_agent = NavigatorAgent(
            base_url=target_endpoint,
            headless=True if is_cloud else req.headless,
            run_id=run_id,
            progress_callback=on_step_progress
        )

        nav_result = nav_agent.run_journey()
        
        # Finish Stage 1
        findings_count = len(nav_result.get("findings", []))
        run_state["stages"][0]["status"] = "Completed"
        run_state["stages"][0]["progressPercent"] = 100
        run_state["stages"][0]["progressCount"] = f"{len(nav_result['screenshots'])} evidence frames captured"
        run_state["stages"][0]["screenshots"] = nav_result["screenshots"]
        run_state["stages"][0]["keyOutput"] = (
            f"Operated full customer journey; 0 dark patterns detected across {len(nav_result['screenshots'])} evidence checkpoints."
            if findings_count == 0 else
            f"Operated full customer journey; {findings_count} dark pattern infractions isolated across {len(nav_result['screenshots'])} evidence frames."
        )
        
        done_s1_log = {
            "id": f"log-s1-done-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 1,
            "stageName": "Navigator Agent",
            "level": "success",
            "message": (
                f"Navigator Agent finished successfully. 0 infractions detected; verified compliant customer flow."
                if findings_count == 0 else
                f"Navigator Agent finished successfully. {findings_count} dark pattern infractions captured in Before/After pairs."
            )
        }
        run_state["stages"][0]["logs"].append(done_s1_log)
        _emit_event(run_id, "stage_complete", {
            "stage": 1,
            "log": done_s1_log,
            "findings": nav_result.get("findings", []),
            "screenshots": nav_result["screenshots"]
        })

        # ─────────────────────────────────────────────────────────────
        # STAGE 2: PATTERN DETECTOR AGENT (VISION AI & DIFFING)
        # ─────────────────────────────────────────────────────────────
        run_state["stages"][1]["status"] = "Running"
        run_state["stages"][1]["keyOutput"] = "Initializing Gemini Vision & Groq Multimodal Inspection..."
        run_state["stages"][1]["progressPercent"] = 10
        run_state["stages"][1]["progressCount"] = "0 of 5 pairs analyzed"
        _emit_event(run_id, "stage_start", {"stage": 2})

        def on_detector_progress(event: Dict[str, Any]):
            if event.get("type") == "log":
                log_entry = event["log"]
                run_state["stages"][1]["logs"].append(log_entry)
                run_state["stages"][1]["latestLogLine"] = log_entry["message"]
                _emit_event(run_id, "log", {"stage": 2, "log": log_entry})
            elif event.get("type") == "anomaly_detected":
                done = event.get("completed_pairs", 0)
                total = event.get("total_pairs", 5)
                pct = int((done / total) * 100)
                run_state["stages"][1]["progressPercent"] = pct
                run_state["stages"][1]["progressCount"] = f"{done} of {total} pairs analyzed"
                _emit_event(run_id, "anomaly_detected", event)

        detector = PatternDetectorAgent(run_id=run_id, progress_callback=on_detector_progress)
        det_result = detector.analyze_evidence_pairs(
            screenshots=nav_result["screenshots"],
            findings_from_nav=nav_result.get("findings", [])
        )

        anomalies = det_result.get("anomalies", [])
        run_state["anomalies"] = anomalies
        run_state["stages"][1]["anomalies"] = anomalies
        run_state["stages"][1]["status"] = "Completed"
        run_state["stages"][1]["progressPercent"] = 100
        run_state["stages"][1]["progressCount"] = f"{len(anomalies)} anomalies isolated"
        run_state["stages"][1]["keyOutput"] = (
            "Visual diffing complete; 0 anomalies detected. Storefront design strictly satisfies CCPA fair interface standards."
            if len(anomalies) == 0 else
            f"Visual diffing complete; {len(anomalies)} candidate dark pattern anomalies isolated via Vision AI."
        )

        done_s2_log = {
            "id": f"log-s2-done-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 2,
            "stageName": "Pattern Detector Agent",
            "level": "success",
            "message": (
                "Pattern Detector Agent finished. 0 anomalies detected across all checkpoints. Site layout conforms to fair design practices."
                if len(anomalies) == 0 else
                f"Pattern Detector Agent finished. {len(anomalies)} candidate dark pattern anomalies isolated across evidence pairs."
            )
        }
        run_state["stages"][1]["logs"].append(done_s2_log)
        _emit_event(run_id, "stage_complete", {"stage": 2, "log": done_s2_log, "anomalies": anomalies})

        # ─────────────────────────────────────────────────────────────
        # STAGE 3: REASONING AGENT (RAG Legal Grounding against CCPA 2023)
        # ─────────────────────────────────────────────────────────────
        run_state["stages"][2]["status"] = "Running"
        run_state["stages"][2]["progressPercent"] = 10
        run_state["stages"][2]["progressCount"] = "0 of 5 legal clauses grounded"
        run_state["stages"][2]["keyOutput"] = "Grounding candidate anomalies against CCPA 2023 & FTC guidelines..."
        _emit_event(run_id, "stage_start", {"stage": 3})

        def on_reasoning_progress(event):
            if event.get("type") == "log":
                log_entry = event["log"]
                run_state["stages"][2]["logs"].append(log_entry)
                run_state["logs"].append(log_entry)
                run_state["stages"][2]["latestLogLine"] = log_entry["message"]
                _emit_event(run_id, "log", {"stage": 3, "log": log_entry})
            elif event.get("type") == "ruling_generated":
                done = event.get("completed_rulings", 0)
                total = event.get("total_rulings", 5)
                pct = int((done / total) * 100)
                run_state["stages"][2]["progressPercent"] = pct
                run_state["stages"][2]["progressCount"] = f"{done} of {total} legal clauses grounded"
                _emit_event(run_id, "ruling_generated", event)

        reasoner = ReasoningAgent(run_id=run_id, progress_callback=on_reasoning_progress)
        reas_result = reasoner.evaluate_candidate_anomalies(anomalies=anomalies)

        rulings = reas_result.get("rulings", [])
        run_state["rulings"] = rulings
        run_state["stages"][2]["rulings"] = rulings
        run_state["stages"][2]["status"] = "Completed"
        run_state["stages"][2]["progressPercent"] = 100
        run_state["stages"][2]["progressCount"] = f"{len(rulings)} legal rulings formulated"
        run_state["stages"][2]["keyOutput"] = (
            "RAG regulatory evaluation complete; 0 dark pattern statutory violations found under CCPA 2023 Guidelines."
            if len(rulings) == 0 else
            f"RAG regulatory retrieval complete; {len(rulings)} dark pattern statutory violations grounded under CCPA 2023."
        )

        done_s3_log = {
            "id": f"log-s3-done-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 3,
            "stageName": "Reasoning Agent",
            "level": "success",
            "message": (
                "Reasoning Agent finished. 0 statutory compliance infractions grounded under CCPA 2023 (100% compliant)."
                if len(rulings) == 0 else
                f"Reasoning Agent finished. {len(rulings)} statutory compliance rulings grounded under CCPA 2023 Guidelines."
            )
        }
        run_state["stages"][2]["logs"].append(done_s3_log)
        _emit_event(run_id, "stage_complete", {"stage": 3, "log": done_s3_log, "rulings": rulings})

        # ─────────────────────────────────────────────────────────────
        # STAGE 4: FIX SUGGESTION AGENT (Compliance Fixes + Ethical Growth Alternatives)
        # ─────────────────────────────────────────────────────────────
        total_expected_fixes = len(rulings) if rulings is not None else 5
        run_state["stages"][3]["status"] = "Running"
        run_state["stages"][3]["progressPercent"] = 10
        run_state["stages"][3]["progressCount"] = (
            f"0 of {total_expected_fixes} remediation specs synthesized"
            if total_expected_fixes > 0 else
            "0 fixes required (Clean store)"
        )
        run_state["stages"][3]["keyOutput"] = "Synthesizing compliance fixes & high-impact ethical business alternatives..."
        _emit_event(run_id, "stage_start", {"stage": 4})

        def on_fix_progress(event):
            if event.get("type") == "log":
                log_entry = event["log"]
                run_state["stages"][3]["logs"].append(log_entry)
                run_state["logs"].append(log_entry)
                run_state["stages"][3]["latestLogLine"] = log_entry["message"]
                _emit_event(run_id, "log", {"stage": 4, "log": log_entry})
            elif event.get("type") == "fix_synthesized":
                done = event.get("completed_fixes", 0)
                total = event.get("total_fixes", total_expected_fixes or 1)
                pct = int((done / total) * 100) if total > 0 else 100
                run_state["stages"][3]["progressPercent"] = pct
                run_state["stages"][3]["progressCount"] = f"{done} of {total} fix specifications ready"
                _emit_event(run_id, "fix_synthesized", event)

        fix_agent = FixSuggestionAgent(run_id=run_id, progress_callback=on_fix_progress)
        fix_result = fix_agent.synthesize_remediations(rulings=rulings)

        fixes = fix_result.get("fixes", [])
        run_state["fixes"] = fixes
        run_state["stages"][3]["fixes"] = fixes
        run_state["stages"][3]["status"] = "Completed"
        run_state["stages"][3]["progressPercent"] = 100
        run_state["stages"][3]["progressCount"] = f"{len(fixes)} dual remediation specs ready"
        run_state["stages"][3]["keyOutput"] = (
            "Remediation synthesis complete; Zero corrective actions required for compliant store."
            if len(fixes) == 0 else
            f"Remediation synthesis complete; {len(fixes)} compliance fixes + ethical business growth alternatives formulated."
        )

        done_s4_log = {
            "id": f"log-s4-done-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 4,
            "stageName": "Fix Suggestion Agent",
            "level": "success",
            "message": (
                "Fix Suggestion Agent finished. Zero infractions detected; no remediation required."
                if len(fixes) == 0 else
                f"Fix Suggestion Agent finished. {len(fixes)} dual remediation specs synthesized (Compliance + Growth Alternatives)."
            )
        }
        run_state["stages"][3]["logs"].append(done_s4_log)
        _emit_event(run_id, "stage_complete", {"stage": 4, "log": done_s4_log, "fixes": fixes})

        # ─────────────────────────────────────────────────────────────
        # STAGE 5: COMPLIANCE TRAIL (Regulatory Audit Ledger & Certification)
        # ─────────────────────────────────────────────────────────────
        run_state["stages"][4]["status"] = "Running"
        run_state["stages"][4]["progressPercent"] = 15
        run_state["stages"][4]["progressCount"] = "Formulating audit ledger..."
        run_state["stages"][4]["keyOutput"] = "Sealing immutable chain-of-custody & calculating statutory compliance score..."
        _emit_event(run_id, "stage_start", {"stage": 5})

        def on_trail_progress(event):
            if event.get("type") == "log":
                log_entry = event["log"]
                run_state["stages"][4]["logs"].append(log_entry)
                run_state["logs"].append(log_entry)
                run_state["stages"][4]["latestLogLine"] = log_entry["message"]
                _emit_event(run_id, "log", {"stage": 5, "log": log_entry})
            elif event.get("type") == "audit_sealed":
                run_state["stages"][4]["progressPercent"] = 100
                run_state["stages"][4]["progressCount"] = "Audit ledger sealed (SHA-256 certified)"
                _emit_event(run_id, "audit_sealed", event)

        trail_agent = ComplianceTrailAgent(run_id=run_id, progress_callback=on_trail_progress)
        trail_result = trail_agent.seal_audit_trail(
            screenshots=nav_result["screenshots"],
            anomalies=anomalies,
            rulings=rulings,
            fixes=fixes,
            target_url=target_url
        )

        audit_rec = trail_result.get("audit_record", {})
        non_comp = len(rulings)
        score = audit_rec.get("compliance_score", 100 if non_comp == 0 else 16)
        run_state["audit_record"] = audit_rec
        run_state["complianceScore"] = score
        run_state["stages"][4]["status"] = "Completed"
        run_state["stages"][4]["progressPercent"] = 100
        run_state["stages"][4]["progressCount"] = "Ledger sealed (SHA-256 verified)"
        run_state["stages"][4]["keyOutput"] = f"Continuous audit ledger sealed; Score {score}/100 committed to MongoDB."

        done_s5_log = {
            "id": f"log-s5-done-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 5,
            "stageName": "Compliance Trail",
            "level": "success",
            "message": f"Compliance Trail completed! Audit record sealed with SHA-256 hash. Compliance Score: {score}/100."
        }
        run_state["stages"][4]["logs"].append(done_s5_log)
        _emit_event(run_id, "stage_complete", {"stage": 5, "log": done_s5_log, "audit_record": audit_rec})

        run_state["status"] = "Completed"
        run_state["durationSeconds"] = int(time.time() - start_time)
        run_state["findings"] = nav_result["findings"]
        run_state["complianceScore"] = score
        run_state["nonCompliantCount"] = non_comp
        run_state["compliantCount"] = 5 - non_comp
        run_state["needsReviewCount"] = 0

        _emit_event(run_id, "run_completed", {
            "run_id": run_id,
            "duration": run_state["durationSeconds"],
            "screenshots_count": len(nav_result["screenshots"]),
            "findings_count": len(nav_result["findings"]),
            "rulings_count": len(rulings),
            "fixes_count": len(fixes),
            "compliance_score": score,
            "non_compliant_count": non_comp,
            "compliant_count": 5 - non_comp,
            "needs_review_count": 0,
            "findings": nav_result["findings"],
            "audit_fingerprint": audit_rec.get("sha256_audit_fingerprint", "")
        })

    except Exception as e:
        print(f"Error in multi-agent pipeline: {e}")
        run_state["status"] = "Failed"
        run_state["stages"][0]["status"] = "Failed"
        fail_log = {
            "id": f"log-err-{int(time.time()*1000)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "stageNumber": 1,
            "stageName": "Navigator Agent",
            "level": "error",
            "message": f"Execution halted: {str(e)}"
        }
        run_state["stages"][0]["logs"].append(fail_log)
        _emit_event(run_id, "error", {"message": str(e), "log": fail_log})


@app.post("/api/run/start")
def start_run(req: StartRunRequest, background_tasks: BackgroundTasks):
    run_id = datetime.now().strftime("RUN-%m%d-%H%M%S")
    
    target_url = req.targetUrl or "http://localhost:3000/freshcart_fixed.html"
    if "freshcart-demo.store" in target_url:
        target_url = "http://localhost:3000/freshcart_fixed.html"
    req.targetUrl = target_url

    # Initialize run representation
    run_state = {
        "id": run_id,
        "siteName": req.siteName,
        "targetUrl": target_url,
        "variant": req.variant,
        "mode": req.mode,
        "status": "Running",
        "durationSeconds": 0,
        "complianceScore": 16,
        "previousRunScore": 56,
        "nonCompliantCount": 5,
        "compliantCount": 0,
        "needsReviewCount": 0,
        "screenshots": [],
        "findings": [],
        "anomalies": [],
        "stages": [
            {
                "number": 1,
                "name": "Navigator Agent",
                "role": "Autonomous customer journey execution & screenshot capture",
                "googleCloudService": "Cloud Run + Playwright",
                "status": "Running",
                "progressPercent": 10,
                "progressCount": "Initializing Playwright…",
                "elapsedTime": "0s",
                "keyOutput": "Launching Playwright browser on desktop…",
                "latestLogLine": "Opening Chromium browser…",
                "logs": []
            },
            {
                "number": 2,
                "name": "Pattern Detector Agent",
                "role": "Visual diffing & heuristic candidate anomaly classification",
                "googleCloudService": "Gemini on Vertex AI",
                "status": "Locked",
                "progressPercent": 0,
                "progressCount": "Locked",
                "elapsedTime": "—",
                "keyOutput": "🔒 Locked — Awaiting Navigator Agent refinement before activation.",
                "latestLogLine": "Stage locked for Navigator Agent testing.",
                "logs": []
            },
            {
                "number": 3,
                "name": "Reasoning Agent",
                "role": "RAG regulatory retrieval & confidence-scored compliance reasoning",
                "googleCloudService": "Gemini + RAG",
                "status": "Locked",
                "progressPercent": 0,
                "progressCount": "Locked",
                "elapsedTime": "—",
                "keyOutput": "🔒 Locked — Downstream stage locked.",
                "latestLogLine": "Stage locked.",
                "logs": []
            },
            {
                "number": 4,
                "name": "Fix Suggestion Agent",
                "role": "Concrete technical and UX remediation synthesis per finding",
                "googleCloudService": "Gemini on Vertex AI",
                "status": "Locked",
                "progressPercent": 0,
                "progressCount": "Locked",
                "elapsedTime": "—",
                "keyOutput": "🔒 Locked — Downstream stage locked.",
                "latestLogLine": "Stage locked.",
                "logs": []
            },
            {
                "number": 5,
                "name": "Verification Agent",
                "role": "Regression verification against previous baseline & audit export",
                "googleCloudService": "Firestore + Cloud Storage",
                "status": "Locked",
                "progressPercent": 0,
                "progressCount": "Locked",
                "elapsedTime": "—",
                "keyOutput": "🔒 Locked — Downstream stage locked.",
                "latestLogLine": "Stage locked.",
                "logs": []
            }
        ]
    }

    RUNS[run_id] = run_state
    EVENT_QUEUES[run_id] = []

    # Execute Playwright in a background thread
    thread = threading.Thread(
        target=_run_multi_agent_pipeline,
        args=(run_id, req),
        daemon=True
    )
    thread.start()

    return {"status": "started", "run_id": run_id, "run": run_state}


@app.get("/api/run/{run_id}")
def get_run(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="Run not found")
    return RUNS[run_id]


@app.get("/api/run/stream/{run_id}")
async def stream_run(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="Run not found")

    async def event_generator():
        # Immediate ping event so GFE and browser establish live stream without delay
        yield f"data: {json.dumps({'event': 'stream_connected', 'run_id': run_id})}\n\n"
        last_index = 0
        while True:
            events = EVENT_QUEUES.get(run_id, [])
            if last_index < len(events):
                for ev in events[last_index:]:
                    yield f"data: {json.dumps(ev)}\n\n"
                last_index = len(events)
            
            run = RUNS.get(run_id)
            if run and run.get("status") in ["Completed", "Failed"] and last_index >= len(events):
                yield f"data: {json.dumps({'event': 'stream_end', 'status': run.get('status')})}\n\n"
                break

            await asyncio.sleep(0.3)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/api/db/status")
def db_status():
    from db.mongo import mongo
    return {
        "connected": mongo.is_connected,
        "database": mongo.db_name,
        "uri": mongo.uri.split('@')[-1] if '@' in mongo.uri else mongo.uri
    }


@app.get("/api/db/runs")
def db_list_runs(limit: int = 20):
    from db.mongo import mongo
    return {"runs": mongo.list_runs(limit)}


@app.get("/api/db/runs/{run_id}")
def db_get_run(run_id: str):
    from db.mongo import mongo
    run = mongo.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found in MongoDB")
    return run


@app.get("/api/db/runs/{run_id}/screenshots")
def db_get_screenshots(run_id: str):
    from db.mongo import mongo
    screenshots = mongo.get_screenshots(run_id)
    pairs = mongo.get_run_pairs(run_id)
    return {"run_id": run_id, "count": len(screenshots), "screenshots": screenshots, "pairs": pairs}


@app.get("/mongo-viewer", response_class=HTMLResponse)
def mongo_viewer(run_id: Optional[str] = None):
    from db.mongo import mongo
    runs = mongo.list_runs(30)
    current_run_id = run_id or (runs[0]["run_id"] if runs else None)
    screenshots = mongo.get_screenshots(current_run_id) if current_run_id else []
    pairs = mongo.get_run_pairs(current_run_id) if current_run_id else []
    current_run = mongo.get_run(current_run_id) if current_run_id else None

    # Render interactive HTML visual explorer
    runs_tabs = "".join([
        f'<a href="/mongo-viewer?run_id={r["run_id"]}" class="tab {"active" if r["run_id"] == current_run_id else ""}">'
        f'<b>{r["run_id"]}</b><span>{len(r.get("screenshots", []))} frames &bull; {r.get("findings_count", len(r.get("findings", [])))} dark patterns</span></a>'
        for r in runs
    ])

    # 1. Pairs HTML (Before vs After comparison cards)
    pairs_html = ""
    for idx, p in enumerate(pairs):
        b = p.get("before") or {}
        a = p.get("after") or {}
        b_src = b.get("data_uri") or b.get("web_url") or ""
        a_src = a.get("data_uri") or a.get("web_url") or ""
        b_cap = b.get("caption") or b.get("step_name") or "Before: Advertised / Initial State"
        a_cap = a.get("caption") or a.get("step_name") or "After: Dark Pattern Injected State"
        pat = p.get("pattern", "Dark Pattern Check")
        details = p.get("details") or b.get("details") or a.get("details") or "Discrepancy verified by Playwright autonomous browser."

        pairs_html += f"""
        <div class="pair-card">
            <div class="pair-header">
                <div class="pair-title">
                    <span class="pair-idx">#{idx + 1}</span>
                    <b>{pat}</b>
                </div>
                <span class="badge red">⚠️ Dark Pattern Violation</span>
            </div>
            <div class="pair-body">
                <div class="pair-col before-col" onclick="openModal('{b_src}', '{b.get('filename', '')}', '{b_cap}', '{pat} (BEFORE)')">
                    <div class="col-tag before-tag">BEFORE &bull; ADVERTISED / CLEAN STATE</div>
                    <div class="thumb">
                        <img src="{b_src}" alt="{b_cap}" loading="lazy" />
                    </div>
                    <div class="col-desc">
                        <b>{b_cap}</b>
                        <code>{b.get('filename', '')}</code>
                    </div>
                </div>
                <div class="pair-arrow">&rarr;</div>
                <div class="pair-col after-col" onclick="openModal('{a_src}', '{a.get('filename', '')}', '{a_cap}', '{pat} (AFTER)')">
                    <div class="col-tag after-tag">AFTER &bull; VIOLATION INJECTED</div>
                    <div class="thumb">
                        <img src="{a_src}" alt="{a_cap}" loading="lazy" />
                    </div>
                    <div class="col-desc">
                        <b>{a_cap}</b>
                        <code>{a.get('filename', '')}</code>
                    </div>
                </div>
            </div>
            <div class="pair-footer">
                <span class="foot-label">Evidence Details:</span>
                <span>{details}</span>
            </div>
        </div>
        """

    # 2. Grid of all individual frames
    shots_html = ""
    for s in screenshots:
        pattern_badge = ""
        comp_tag = ""
        if s.get("comparison_type") == "before":
            comp_tag = '<span class="badge blue">BEFORE</span>'
        elif s.get("comparison_type") == "after":
            comp_tag = '<span class="badge red">AFTER</span>'

        if s.get("pattern"):
            pattern_badge = f'<span class="badge red">⚠️ {s["pattern"]}</span>'
        
        img_src = s.get("data_uri") or s.get("web_url") or ""
        size_kb = round(s.get("size_bytes", 0) / 1024, 1)

        shots_html += f"""
        <div class="card" onclick="openModal('{img_src}', '{s.get('filename')}', '{s.get('caption') or s.get('step_name')}', '{s.get('pattern') or ''}')">
            <div class="thumb">
                <span class="num">#{s.get('step_number', 0)}</span>
                <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px">
                    {comp_tag}
                    {pattern_badge}
                </div>
                <img src="{img_src}" alt="{s.get('step_name')}" loading="lazy" />
            </div>
            <div class="meta">
                <div class="title">{s.get('caption') or s.get('step_name', s.get('filename'))}</div>
                <div class="sub">
                    <code>{s.get('filename')}</code>
                    <span>{size_kb} KB</span>
                </div>
            </div>
        </div>
        """

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TrustLens AI - MongoDB Dark Pattern Explorer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root {{
    --bg: #0A1118; --card: #131E29; --line: #1F2E3E;
    --text: #E5EEF6; --muted: #8397AB; --brand: #2F81F7;
    --red: #F85149; --green: #3FB950; --blue: #58A6FF;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ background: var(--bg); color: var(--text); font-family: 'Public Sans', sans-serif; font-size: 14px; min-height: 100vh; padding: 24px; }}
header {{ max-width: 1300px; margin: 0 auto 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid var(--line); padding-bottom: 18px; }}
.brand {{ display: flex; align-items: center; gap: 12px; }}
.brand h1 {{ font-size: 20px; font-weight: 700; color: #fff; }}
.pill {{ background: rgba(63, 185, 80, 0.15); color: var(--green); border: 1px solid rgba(63, 185, 80, 0.4); font-size: 12px; padding: 4px 10px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }}
.dot {{ width: 8px; height: 8px; border-radius: 50%; background: var(--green); }}
.actions a {{ color: var(--text); text-decoration: none; background: var(--card); border: 1px solid var(--line); padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; transition: all .15s; margin-left: 8px; }}
.actions a:hover {{ border-color: var(--brand); color: #fff; }}
.wrap {{ max-width: 1300px; margin: 0 auto; }}
.tabs-wrap {{ margin-bottom: 20px; }}
.tabs-label {{ font-size: 11px; text-transform: uppercase; color: var(--muted); font-weight: 700; letter-spacing: .05em; margin-bottom: 8px; }}
.tabs {{ display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; }}
.tab {{ background: var(--card); border: 1px solid var(--line); padding: 8px 14px; border-radius: 8px; text-decoration: none; color: var(--muted); font-size: 13px; display: flex; align-items: center; gap: 8px; transition: all .15s; shrink: 0; }}
.tab b {{ color: var(--text); }}
.tab span {{ font-size: 11px; opacity: .7; font-family: 'JetBrains Mono', monospace; }}
.tab:hover {{ border-color: var(--brand); }}
.tab.active {{ background: rgba(47, 129, 247, 0.15); border-color: var(--brand); color: #fff; }}
.tab.active b {{ color: #fff; }}
.summary-bar {{ background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; }}
.summary-bar .item {{ display: flex; flex-direction: column; gap: 2px; }}
.summary-bar .item label {{ font-size: 11px; color: var(--muted); text-transform: uppercase; }}
.summary-bar .item value {{ font-size: 15px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }}

/* Section Controls */
.view-bar {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }}
.view-title {{ font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }}
.view-toggle {{ display: flex; gap: 6px; background: var(--card); padding: 4px; border-radius: 8px; border: 1px solid var(--line); }}
.view-btn {{ background: none; border: 0; color: var(--muted); padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; }}
.view-btn.active {{ background: var(--brand); color: #fff; }}

/* Before vs After Pair Cards */
.pairs-container {{ display: flex; flex-direction: column; gap: 20px; }}
.pair-card {{ background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }}
.pair-header {{ padding: 12px 18px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); }}
.pair-title {{ font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }}
.pair-idx {{ background: var(--brand); color: #fff; font-size: 11px; font-family: 'JetBrains Mono', monospace; padding: 2px 8px; border-radius: 6px; }}
.pair-body {{ display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; padding: 16px; align-items: center; }}
@media (max-width: 768px) {{ .pair-body {{ grid-template-columns: 1fr; }} }}
.pair-arrow {{ font-size: 24px; color: var(--muted); text-align: center; font-weight: 700; }}
.pair-col {{ background: #060A0E; border-radius: 10px; overflow: hidden; border: 1px solid var(--line); cursor: pointer; transition: transform .15s, border-color .15s; }}
.pair-col:hover {{ transform: translateY(-2px); }}
.before-col:hover {{ border-color: var(--blue); }}
.after-col:hover {{ border-color: var(--red); }}
.col-tag {{ font-size: 10px; font-weight: 700; letter-spacing: .05em; padding: 6px 12px; }}
.before-tag {{ background: rgba(88, 166, 255, 0.15); color: var(--blue); border-bottom: 1px solid rgba(88, 166, 255, 0.3); }}
.after-tag {{ background: rgba(248, 81, 73, 0.15); color: var(--red); border-bottom: 1px solid rgba(248, 81, 73, 0.3); }}
.pair-col .thumb {{ aspect-ratio: 16/10; overflow: hidden; }}
.pair-col .thumb img {{ width: 100%; height: 100%; object-fit: cover; object-position: top; }}
.col-desc {{ padding: 10px 12px; background: var(--card); border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; font-size: 12px; }}
.col-desc b {{ color: #fff; }}
.col-desc code {{ font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); }}
.pair-footer {{ padding: 10px 18px; border-top: 1px solid var(--line); background: rgba(0,0,0,0.2); font-size: 12px; color: var(--muted); display: flex; gap: 8px; }}
.pair-footer .foot-label {{ color: #fff; font-weight: 600; }}

/* Grid view */
.grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }}
.card {{ background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform .15s, border-color .15s; }}
.card:hover {{ transform: translateY(-2px); border-color: var(--brand); }}
.thumb {{ position: relative; aspect-ratio: 16/10; background: #060A0E; overflow: hidden; display: flex; align-items: center; justify-content: center; }}
.thumb img {{ width: 100%; height: 100%; object-fit: cover; object-position: top; }}
.thumb .num {{ position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #fff; font-size: 10px; font-family: 'JetBrains Mono', monospace; padding: 2px 6px; border-radius: 4px; }}
.badge {{ font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; }}
.badge.red {{ background: rgba(248, 81, 73, 0.2); color: var(--red); border: 1px solid var(--red); }}
.badge.blue {{ background: rgba(88, 166, 255, 0.2); color: var(--blue); border: 1px solid var(--blue); }}
.meta {{ padding: 12px; }}
.title {{ font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
.sub {{ display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); }}
.sub code {{ font-family: 'JetBrains Mono', monospace; }}

/* Modal */
.modal {{ position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: none; place-items: center; z-index: 100; padding: 20px; }}
.modal.open {{ display: grid; }}
.modal-box {{ max-width: 1100px; width: 100%; max-height: 94vh; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }}
.modal-head {{ padding: 12px 18px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }}
.modal-body {{ padding: 16px; overflow: auto; text-align: center; }}
.modal-body img {{ max-width: 100%; max-height: 72vh; border-radius: 8px; border: 1px solid var(--line); }}
.close {{ background: none; border: 0; color: var(--text); font-size: 20px; cursor: pointer; }}
</style>
</head>
<body>
<header>
    <div class="brand">
        <h1>TrustLens AI &bull; MongoDB Dark Pattern Explorer</h1>
        <span class="pill"><span class="dot"></span> MongoDB trustlens_db @ localhost:27017</span>
    </div>
    <div class="actions">
        <a href="http://localhost:3000" target="_blank">&larr; Return to Dashboard</a>
        <a href="/api/db/runs" target="_blank">View Runs JSON</a>
        <a href="/api/db/runs/{current_run_id}/screenshots" target="_blank">View Run Screenshots JSON</a>
    </div>
</header>
<div class="wrap">
    <div class="tabs-wrap">
        <div class="tabs-label">All Stored Runs in trustlens_db.runs ({len(runs)} runs total)</div>
        <div class="tabs">{runs_tabs}</div>
    </div>
    <div class="summary-bar">
        <div class="item">
            <label>Selected Run</label>
            <value>{current_run_id or 'None'}</value>
        </div>
        <div class="item">
            <label>Stored Screenshots in MongoDB</label>
            <value>{len(screenshots)} frames</value>
        </div>
        <div class="item">
            <label>Storage Format</label>
            <value style="color:var(--brand)">Base64 Data URI + BSON Metadata</value>
        </div>
        <div class="item">
            <label>Dark Patterns Detected</label>
            <value style="color:var(--red)">{current_run.get('findings_count', len(pairs)) if current_run else len(pairs)} patterns</value>
        </div>
    </div>

    <div class="view-bar">
        <div class="view-title">
            <span>🛡️ Dark Pattern Evidence &bull; Before vs After Comparisons</span>
        </div>
        <div class="view-toggle">
            <button id="btnPairs" class="view-btn active" onclick="showView('pairs')">Before vs After Pairs</button>
            <button id="btnGrid" class="view-btn" onclick="showView('grid')">All Frames Grid</button>
        </div>
    </div>

    <div id="viewPairs" class="pairs-container">
        {pairs_html if pairs_html else '<p style="color:var(--muted)">No dark pattern pairs found for this run.</p>'}
    </div>

    <div id="viewGrid" class="grid" style="display:none">
        {shots_html if shots_html else '<p style="color:var(--muted)">No screenshots found for this run.</p>'}
    </div>
</div>
<div id="modal" class="modal" onclick="closeModal()">
    <div class="modal-box" onclick="event.stopPropagation()">
        <div class="modal-head">
            <div>
                <b id="mTitle" style="color:#fff"></b>
                <span id="mSub" style="color:var(--muted);font-size:12px;margin-left:8px"></span>
            </div>
            <button class="close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <img id="mImg" src="" alt="Fullscreen screenshot" />
        </div>
    </div>
</div>
<script>
function showView(v) {{
    if(v === 'pairs') {{
        document.getElementById('viewPairs').style.display = 'flex';
        document.getElementById('viewGrid').style.display = 'none';
        document.getElementById('btnPairs').classList.add('active');
        document.getElementById('btnGrid').classList.remove('active');
    }} else {{
        document.getElementById('viewPairs').style.display = 'none';
        document.getElementById('viewGrid').style.display = 'grid';
        document.getElementById('btnPairs').classList.remove('active');
        document.getElementById('btnGrid').classList.add('active');
    }}
}}
function openModal(src, file, title, pat) {{
    document.getElementById('mImg').src = src;
    document.getElementById('mTitle').innerText = title;
    document.getElementById('mSub').innerText = file + (pat ? ' • ' + pat : '');
    document.getElementById('modal').classList.add('open');
}}
function closeModal() {{
    document.getElementById('modal').classList.remove('open');
}}
document.addEventListener('keydown', e => {{ if(e.key === 'Escape') closeModal(); }});
</script>
</body>
</html>
"""
    return HTMLResponse(content=html)


@app.get("/api/fixtures")
def list_available_fixtures(request: Request):
    """Scans public/ directory and dynamically returns all available test HTML stores."""
    public_dir = Path("public")
    fixtures = []

    if public_dir.exists():
        for f in sorted(public_dir.glob("*.html")):
            fname = f.name
            is_fixed = "fixed" in fname.lower() or "clean" in fname.lower()
            if fname == "freshcart.html":
                label = "FreshCart Storefront"
                desc = "Grocery catalogue, cart drawer, promotional flash banner, and checkout journey."
                tag = ""
                variant = "All faults"
            elif fname == "freshcart_fixed.html":
                label = "FreshCart Storefront (v2)"
                desc = "Grocery catalogue, cart drawer, upfront pricing disclosures, and checkout journey."
                tag = ""
                variant = "Clean control"
            else:
                label = fname.replace("_", " ").replace(".html", "").title()
                desc = f"Storefront test fixture in public/{fname}"
                tag = ""
                variant = "Clean control" if is_fixed else "All faults"

            fixtures.append({
                "filename": fname,
                "url": f"/{fname}",
                "label": label,
                "description": desc,
                "tag": tag,
                "is_compliant": is_fixed,
                "variant": variant
            })
    return {"fixtures": fixtures}


@app.get("/{html_file}.html")
def serve_any_html_page(html_file: str):
    for candidate in [f"public/{html_file}.html", f"{html_file}.html"]:
        if os.path.exists(candidate):
            return FileResponse(candidate)
    raise HTTPException(status_code=404, detail=f"{html_file}.html not found")


@app.get("/api/run/{run_id}/report.html")
def get_run_report_html(run_id: str):
    """Generates an executive HTML audit report for the given run ID."""
    run_data = RUNS.get(run_id)
    if not run_data:
        try:
            from db.mongo import mongo
            if mongo._connected and mongo._db is not None:
                doc = mongo._db.runs.find_one({"run_id": run_id})
                if doc:
                    doc.pop("_id", None)
                    run_data = doc
        except Exception:
            pass
    if not run_data:
        run_data = {
            "run_id": run_id,
            "siteName": "FreshCart",
            "complianceScore": 16,
            "targetUrl": "http://localhost:3000/freshcart_fixed.html"
        }
    
    html = generate_report_html(run_data)
    return HTMLResponse(content=html)


@app.get("/api/run/{run_id}/report.pdf")
async def get_run_report_pdf(run_id: str):
    """Compiles and downloads a high-fidelity A4 executive PDF audit report."""
    run_data = RUNS.get(run_id)
    if not run_data:
        try:
            from db.mongo import mongo
            if mongo._connected and mongo._db is not None:
                doc = mongo._db.runs.find_one({"run_id": run_id})
                if doc:
                    doc.pop("_id", None)
                    run_data = doc
        except Exception:
            pass
    if not run_data:
        run_data = {
            "run_id": run_id,
            "siteName": "FreshCart",
            "complianceScore": 16,
            "targetUrl": "http://localhost:3000/freshcart_fixed.html"
        }
    
    try:
        pdf_bytes = await generate_report_pdf(run_data)
        
        # Upload report to Google Cloud Storage if configured
        try:
            from db import gcs_storage
            if gcs_storage and gcs_storage.is_connected:
                gcs_storage.upload_report_pdf(run_id, pdf_bytes)
        except Exception:
            pass

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="TrustLens-Audit-Report-{run_id}.pdf"',
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


# ─────────────────────────────────────────────────────────────
# SPA & STATIC FALLBACK ROUTER (FOR CLOUD RUN PRODUCTION)
# ─────────────────────────────────────────────────────────────
@app.get("/{full_path:path}")
async def serve_spa_or_static(full_path: str):
    """Serves compiled React SPA assets and static files from dist/."""
    # 1. Direct dist file check (e.g. freshcart.html, freshcart_fixed.html)
    dist_file = Path("dist") / full_path
    if full_path and dist_file.is_file():
        return FileResponse(dist_file)
    # 2. Public file check
    pub_file = Path("public") / full_path
    if full_path and pub_file.is_file():
        return FileResponse(pub_file)
    # 3. SPA index.html fallback for client-side React routes
    index_file = Path("dist/index.html")
    if index_file.is_file():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="File not found")


def release_port(port: int = 8000):
    """Automatically frees port 8000 if a previous orphaned Python instance is still listening."""
    if sys.platform != "win32":
        return
    try:
        import subprocess
        out = subprocess.run(
            ["powershell", "-NoProfile", "-Command", f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"],
            capture_output=True,
            text=True
        )
        current_pid = os.getpid()
        for line in out.stdout.strip().splitlines():
            line = line.strip()
            if line.isdigit():
                pid = int(line)
                if pid != current_pid and pid > 0:
                    print(f"🔄 Port {port} was held by previous process {pid}. Auto-releasing port...")
                    subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True)
                    time.sleep(0.6)
    except Exception:
        pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0" if (os.getenv("K_SERVICE") or sys.platform != "win32") else "127.0.0.1"
    release_port(port)
    if sys.platform == "win32":
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        except Exception:
            pass
    gcp_proj = os.getenv("GCP_PROJECT_ID", "project-70e159c8-db48-48d9-812")
    gcs_bucket = os.getenv("GCS_BUCKET_NAME", "trustlens-evidence")
    gcp_reg = os.getenv("GCP_REGION", "us-central1")
    print("=" * 65)
    print("🛡️  TRUSTLENS AI - MULTI-AGENT PLATFORM STARTED")
    print(f"📌 Google Cloud Project ID: {gcp_proj}")
    print(f"📍 Google Cloud Region:     {gcp_reg}")
    print(f"🪣 Cloud Storage Bucket:    gs://{gcs_bucket}")
    print(f"🧠 AI Engine:               Vertex AI Gemini 2.5 Flash")
    print(f"🚀 Dashboard & API Host:    http://{host}:{port}")
    print("=" * 65)
    uvicorn.run("server:app", host=host, port=port, reload=False)


