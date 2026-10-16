#!/usr/bin/env bash
# ==============================================================================
# TrustLens AI - Google Cloud Services Automated Master Setup & Deployment
# Project: project-70e159c8-db48-48d9-812
# ==============================================================================

set -e

PROJECT_ID="${PROJECT_ID:-project-70e159c8-db48-48d9-812}"
REGION="${REGION:-us-central1}"
REPO_NAME="trustlens-repo"
SA_NAME="trustlens-agent-sa"
BUCKET_NAME="trustlens-evidence"

echo "=========================================================="
echo "🛡️  TrustLens AI - Google Cloud Master Setup & Deploy"
echo "=========================================================="
echo "📌 Project ID:        $PROJECT_ID"
echo "📍 Region:            $REGION"
echo "📦 Artifact Registry: $REPO_NAME"
echo "🪣 GCS Bucket:        $BUCKET_NAME"
echo "🔑 Service Account:   $SA_NAME"
echo "=========================================================="

gcloud config set project "$PROJECT_ID"

# 1. Enable Required GCP APIs
echo "⚙️ [1/6] Enabling Google Cloud Services APIs..."
gcloud services enable \
  aiplatform.googleapis.com \
  run.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com

# 2. Setup Application Service Account (trustlens-agent-sa)
echo "🔑 [2/6] Configuring Service Account ($SA_NAME)..."
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="TrustLens Agent Service Account"
fi

# Grant Vertex AI, Cloud Storage, and Logging permissions to App SA
for ROLE in roles/aiplatform.user roles/storage.admin roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" --condition=None >/dev/null 2>&1 || true
done

# 3. Setup Cloud Build & Compute Engine IAM Permissions
echo "🔐 [3/6] Configuring Cloud Build & Compute deployment permissions..."
PROJECT_NUM=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CB_SA="${PROJECT_NUM}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"

for SA in "$CB_SA" "$COMPUTE_SA"; do
  for ROLE in roles/artifactregistry.admin roles/storage.admin roles/logging.logWriter roles/run.admin roles/iam.serviceAccountUser; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:$SA" \
      --role="$ROLE" --condition=None >/dev/null 2>&1 || true
  done
done

# 4. Setup Cloud Storage Bucket
echo "🪣 [4/6] Verifying Cloud Storage bucket (gs://$BUCKET_NAME)..."
if ! gsutil ls -b "gs://$BUCKET_NAME" >/dev/null 2>&1; then
  gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME" || true
fi
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME" || true

# 5. Setup Artifact Registry Repository
echo "📦 [5/6] Verifying Artifact Registry repository ($REPO_NAME)..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="TrustLens AI Docker Repository" || true
fi

# 6. Build Frontend & Deploy to Cloud Run
echo "🚀 [6/6] Building Frontend & Deploying to Google Cloud Run..."
npm install
npm run build

gcloud run deploy trustlens-ai \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --execution-environment=gen2 \
  --cpu=2 \
  --memory=4Gi \
  --timeout=3600 \
  --service-account="$SA_EMAIL" \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$BUCKET_NAME,HEADLESS=true"

echo "=========================================================="
echo "🎉 SUCCESS: TrustLens AI is LIVE on Google Cloud!"
echo "=========================================================="
