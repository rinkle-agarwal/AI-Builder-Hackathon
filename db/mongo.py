"""
MongoDB Storage Layer for TrustLens AI.
Stores run metadata, findings, and high-resolution screenshot frames (with base64 data URIs)
for historical replay, cross-stage pipelining, and multi-agent hand-offs.
"""

import os
import sys
import base64
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    from pymongo import MongoClient
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False


class MongoStorage:
    def __init__(self, uri: Optional[str] = None, db_name: str = "trustlens_db"):
        self.uri = uri or os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.db_name = db_name
        self._client = None
        self._db = None
        self._connected = False

        if HAS_PYMONGO:
            try:
                self._client = MongoClient(self.uri, serverSelectionTimeoutMS=2000)
                # Verify server connectivity
                self._client.admin.command('ping')
                self._db = self._client[self.db_name]
                self._connected = True
                print(f"[MongoDB] Connected: {self.uri} (Database: {self.db_name})")
                self._init_indexes()
            except Exception as e:
                print(f"[MongoDB] Offline ({e}). Operating with local disk fallback.")
                self._connected = False
        else:
            print("[MongoDB] pymongo not installed. Operating with local disk.")

    def _init_indexes(self):
        try:
            if self._connected and self._db is not None:
                self._db.runs.create_index("run_id", unique=True)
                self._db.screenshots.create_index([("run_id", 1), ("step_number", 1)])
                self._db.screenshots.create_index("filename")
        except Exception:
            pass

    @property
    def is_connected(self) -> bool:
        return self._connected

    def save_screenshot(
        self,
        run_id: str,
        filename: str,
        step_number: int,
        step_name: str,
        file_path: str,
        pattern: Optional[str] = None,
        comparison_type: Optional[str] = None,
        pair_id: Optional[str] = None,
        caption: Optional[str] = None,
        details: Optional[str] = None
    ) -> Optional[str]:
        """
        Stores screenshot record in MongoDB with base64 data URI so image is always
        retrievable across pipeline stages even if file system changes.
        """
        if not self._connected or self._db is None:
            return None

        try:
            path_obj = Path(file_path)
            data_uri = None
            size_bytes = 0

            if path_obj.exists():
                size_bytes = path_obj.stat().st_size
                with open(path_obj, "rb") as f:
                    raw_bytes = f.read()
                    b64 = base64.b64encode(raw_bytes).decode("utf-8")
                    data_uri = f"data:image/png;base64,{b64}"

            comp_type = comparison_type
            if not comp_type:
                comp_type = "before" if "before" in filename else ("after" if "after" in filename else "evidence")

            doc = {
                "run_id": run_id,
                "step_number": step_number,
                "filename": filename,
                "step_name": step_name,
                "web_url": f"/runs/{run_id}/{filename}",
                "pattern": pattern,
                "comparison_type": comp_type,
                "pair_id": pair_id or (pattern.lower().replace(" ", "_") if pattern else "general"),
                "caption": caption or step_name,
                "details": details,
                "size_bytes": size_bytes,
                "data_uri": data_uri,
                "created_at": datetime.now().isoformat()
            }

            self._db.screenshots.update_one(
                {"run_id": run_id, "filename": filename},
                {"$set": doc},
                upsert=True
            )
            return doc["web_url"]
        except Exception as e:
            print(f"Error saving screenshot to MongoDB: {e}")
            return None

    def save_run(self, run_id: str, run_data: Dict[str, Any]) -> bool:
        """Saves or updates run metadata, dark pattern pairs, and findings in MongoDB."""
        if not self._connected or self._db is None:
            return False

        try:
            doc = {
                "run_id": run_id,
                "site_name": run_data.get("siteName", "FreshCart (demo store)"),
                "target_url": run_data.get("targetUrl", "http://localhost:3000/freshcart.html"),
                "status": run_data.get("status", "Completed"),
                "duration_seconds": run_data.get("durationSeconds", 0),
                "compliance_score": run_data.get("complianceScore", 48),
                "findings_count": run_data.get("findings_count", len(run_data.get("findings", []))),
                "findings": run_data.get("findings", []),
                "screenshots": run_data.get("screenshots", []),
                "dark_pattern_pairs": run_data.get("dark_pattern_pairs", []),
                "updated_at": datetime.now().isoformat()
            }

            self._db.runs.update_one(
                {"run_id": run_id},
                {"$set": doc, "$setOnInsert": {"created_at": datetime.now().isoformat()}},
                upsert=True
            )
            print(f"💾 MongoDB: Persisted run document for {run_id}")
            return True
        except Exception as e:
            print(f"Error saving run to MongoDB: {e}")
            return False
            print(f"Error saving run to MongoDB: {e}")
            return False

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a run by run_id from MongoDB."""
        if not self._connected or self._db is None:
            return None
        try:
            doc = self._db.runs.find_one({"run_id": run_id}, {"_id": 0})
            return doc
        except Exception as e:
            print(f"Error getting run from MongoDB: {e}")
            return None

    def get_screenshots(self, run_id: str) -> List[Dict[str, Any]]:
        """Retrieves all screenshots for a run sorted by step_number."""
        if not self._connected or self._db is None:
            return []
        try:
            cursor = self._db.screenshots.find(
                {"run_id": run_id},
                {"_id": 0}
            ).sort("step_number", 1)
            return list(cursor)
        except Exception as e:
            print(f"Error getting screenshots from MongoDB: {e}")
            return []

    def list_runs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists latest runs from MongoDB."""
        if not self._connected or self._db is None:
            return []
        try:
            cursor = self._db.runs.find(
                {},
                {"_id": 0}
            ).sort("created_at", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            print(f"Error listing runs from MongoDB: {e}")
            return []

    def get_run_pairs(self, run_id: str) -> List[Dict[str, Any]]:
        """Returns screenshots grouped into Dark Pattern Before/After comparison pairs."""
        shots = self.get_screenshots(run_id)
        pairs_dict: Dict[str, Dict[str, Any]] = {}
        
        for s in shots:
            pid = s.get("pair_id") or s.get("pattern", "general")
            if pid not in pairs_dict:
                pairs_dict[pid] = {
                    "pair_id": pid,
                    "pattern": s.get("pattern", "Dark Pattern Check"),
                    "before": None,
                    "after": None,
                    "details": s.get("details", "")
                }
            if s.get("comparison_type") == "before" or "before" in s.get("filename", ""):
                pairs_dict[pid]["before"] = s
            elif s.get("comparison_type") == "after" or "after" in s.get("filename", ""):
                pairs_dict[pid]["after"] = s
            else:
                if not pairs_dict[pid]["before"]:
                    pairs_dict[pid]["before"] = s
                else:
                    pairs_dict[pid]["after"] = s
                    
        return list(pairs_dict.values())


# Global singleton instance
mongo = MongoStorage()
