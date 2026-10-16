#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🛡️  Deploying TrustLens AI to Google Cloud Run"
echo "=========================================================="

PROJECT_ID="project-70e159c8-db48-48d9-812"
REGION="us-central1"
REPO_NAME="trustlens-repo"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/trustlens-ai:latest"

echo "📍 Region:   $REGION"
echo "📦 Image:    $IMAGE"
echo "=========================================================="

echo "🔐 Step 1/3: Configuring Docker authentication..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "🔨 Step 2/3: Building and pushing Docker container..."
docker build -t "$IMAGE" .
docker push "$IMAGE"

echo "🚀 Step 3/3: Deploying revision to Google Cloud Run..."
gcloud run deploy trustlens-ai \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --no-cpu-throttling \
  --min-instances=1 \
  --max-instances=1 \
  --allow-unauthenticated

echo "=========================================================="
echo "🎉 SUCCESS: TrustLens AI is LIVE with updated backend!"
echo "=========================================================="
