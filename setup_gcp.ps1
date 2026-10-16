# ==============================================================================
# TrustLens AI - Google Cloud Services Setup Script (PowerShell)
# ==============================================================================

param (
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = "asia-south1",
    [string]$RepoName = "trustlens-repo",
    [string]$SaName = "trustlens-agent-sa"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🛡️  TrustLens AI - Google Cloud Services Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not $ProjectId) {
    try {
        $ProjectId = (gcloud config get-value project 2>$null).Trim()
    } catch {}
}

if (-not $ProjectId -or $ProjectId -eq "(unset)") {
    Write-Host "❌ Error: Google Cloud Project ID not specified." -ForegroundColor Red
    Write-Host "👉 Please specify your Project ID: .\setup_gcp.ps1 -ProjectId 'your-project-id'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📌 Active GCP Project: $ProjectId" -ForegroundColor Green
Write-Host "📍 Target Region:     $Region" -ForegroundColor Green
$BucketName = "trustlens-evidence-$ProjectId"
Write-Host "🪣 Target GCS Bucket: $BucketName" -ForegroundColor Green
Write-Host ""

# 1. Enable APIs
Write-Host "⚙️ [1/5] Enabling Google Cloud Services APIs..." -ForegroundColor Yellow
gcloud services enable aiplatform.googleapis.com run.googleapis.com storage.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com iam.googleapis.com
Write-Host "✅ APIs enabled." -ForegroundColor Green

# 2. Artifact Registry
Write-Host "📦 [2/5] Setting up Artifact Registry ($RepoName)..." -ForegroundColor Yellow
gcloud artifacts repositories create $RepoName --repository-format=docker --location=$Region --description="Docker repository for TrustLens AI" --quiet 2>$null
Write-Host "✅ Artifact Registry repository ready." -ForegroundColor Green

# 3. Cloud Storage
Write-Host "🪣 [3/5] Setting up Google Cloud Storage bucket ($BucketName)..." -ForegroundColor Yellow
gcloud storage buckets create "gs://$BucketName" --project=$ProjectId --location=$Region --uniform-bucket-level-access --quiet 2>$null
gcloud storage buckets add-iam-policy-binding "gs://$BucketName" --member="allUsers" --role="roles/storage.objectViewer" --quiet 2>$null
Write-Host "✅ Cloud Storage bucket ready with public viewer access." -ForegroundColor Green

# 4. Cloud IAM
Write-Host "🔑 [4/5] Configuring Cloud IAM Service Account ($SaName)..." -ForegroundColor Yellow
$SaEmail = "$SaName@$ProjectId.iam.gserviceaccount.com"
gcloud iam service-accounts create $SaName --display-name="TrustLens AI Agent Service Account" --quiet 2>$null

gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SaEmail" --role="roles/aiplatform.user" --condition=None --quiet 2>$null
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SaEmail" --role="roles/storage.objectAdmin" --condition=None --quiet 2>$null

$ProjectNum = (gcloud projects describe $ProjectId --format="value(projectNumber)").Trim()
$CbSa = "$ProjectNum@cloudbuild.gserviceaccount.com"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$CbSa" --role="roles/run.admin" --condition=None --quiet 2>$null
gcloud iam service-accounts add-iam-policy-binding $SaEmail --member="serviceAccount:$CbSa" --role="roles/iam.serviceAccountUser" --condition=None --quiet 2>$null
Write-Host "✅ Cloud IAM roles bound." -ForegroundColor Green

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎉 ALL 7 GOOGLE CLOUD SERVICES ARE CONFIGURED!" -ForegroundColor Cyan
Write-Host "To build and deploy live on Cloud Run, run:" -ForegroundColor White
Write-Host "   gcloud builds submit --config=cloudbuild.yaml ." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
