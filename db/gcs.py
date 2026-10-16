"""
Google Cloud Storage (GCS) Service for TrustLens AI.
Stores evidence screenshots, before/after comparison frames, and audit reports
in a secure, scalable Google Cloud Storage bucket.
"""

import os
import sys
from pathlib import Path
from typing import Optional

try:
    from google.cloud import storage
    HAS_GCS = True
except Exception:
    try:
        import google.cloud.storage as storage  # type: ignore
        HAS_GCS = True
    except Exception:
        storage = None  # type: ignore
        HAS_GCS = False


class CloudStorageManager:
    def __init__(self, bucket_name: Optional[str] = None):
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME", "trustlens-evidence")
        self.project_id = os.getenv("GCP_PROJECT_ID", "project-70e159c8-db48-48d9-812")
        self._client = None
        self._bucket = None
        self._connected = False

        if HAS_GCS and self.bucket_name and storage is not None:
            try:
                sa_key = Path("service_account.json")
                if sa_key.is_file():
                    self._client = storage.Client.from_service_account_json(str(sa_key))
                elif self.project_id:
                    self._client = storage.Client(project=self.project_id)
                else:
                    self._client = storage.Client()
                self._bucket = self._client.bucket(self.bucket_name)
                # Verify bucket exists/access
                if self._bucket.exists():
                    self._connected = True
                    print(f"[GCS] Connected to bucket: {self.bucket_name}")
                else:
                    print(f"[GCS] Bucket {self.bucket_name} not found or no access.")
            except Exception as e:
                print(f"[GCS] Offline ({e}). Operating with local disk storage fallback.")
                self._connected = False
        else:
            if not self.bucket_name:
                print("[GCS] GCS_BUCKET_NAME not set. Using local file storage.")
            else:
                print("[GCS] google-cloud-storage offline. Using local file storage.")

    @property
    def is_connected(self) -> bool:
        return self._connected and self._bucket is not None

    def upload_screenshot(self, run_id: str, filename: str, file_path: str) -> str:
        """
        Uploads a screenshot to GCS under runs/{run_id}/{filename}.
        Returns the GCS public URL if uploaded, otherwise returns local web path /runs/{run_id}/{filename}.
        """
        local_web_url = f"/runs/{run_id}/{filename}"
        if not self.is_connected or self._bucket is None:
            return local_web_url

        try:
            blob_path = f"runs/{run_id}/{filename}"
            blob = self._bucket.blob(blob_path)
            blob.upload_from_filename(file_path, content_type="image/png")
            # Return standard public URL
            gcs_url = f"https://storage.googleapis.com/{self.bucket_name}/{blob_path}"
            return gcs_url
        except Exception as e:
            print(f"[GCS] Failed to upload {filename} to GCS: {e}")
            return local_web_url

    def upload_report_pdf(self, run_id: str, pdf_bytes: bytes) -> Optional[str]:
        """
        Uploads an audit report PDF to GCS under reports/{run_id}/TrustLens-Audit-Report.pdf.
        """
        if not self.is_connected or self._bucket is None:
            return None

        try:
            blob_path = f"reports/{run_id}/TrustLens-Audit-Report-{run_id}.pdf"
            blob = self._bucket.blob(blob_path)
            blob.upload_from_string(pdf_bytes, content_type="application/pdf")
            return f"https://storage.googleapis.com/{self.bucket_name}/{blob_path}"
        except Exception as e:
            print(f"[GCS] Failed to upload PDF report: {e}")
            return None


# Global singleton
gcs_storage = CloudStorageManager()
