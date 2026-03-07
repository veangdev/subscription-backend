# Quick Cloud Run Setup

## Option 1: One-Line Setup (Recommended)

Open [Google Cloud Shell](https://shell.cloud.google.com/) and run:

```bash
curl -s https://raw.githubusercontent.com/YOUR-USERNAME/YOUR-REPO/main/scripts/setup-cloud-run.sh | bash
```

Or manually run these commands:

```bash
PROJECT_ID="box-subscription-system"
gcloud config set project ${PROJECT_ID}

# Enable APIs
gcloud services enable sqladmin.googleapis.com sql-component.googleapis.com secretmanager.googleapis.com run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com iam.googleapis.com serviceusage.googleapis.com

# Grant permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Option 2: Manual Setup via Console

1. **Enable APIs**: Go to [APIs Dashboard](https://console.cloud.google.com/apis/dashboard?project=box-subscription-system)
   - Search and enable: Cloud SQL Admin API
   - Search and enable: Cloud SQL API
   - Search and enable: Secret Manager API

2. **Grant Permissions**: Go to [IAM](https://console.cloud.google.com/iam-admin/iam?project=box-subscription-system)
   - Find service account: `github-actions@box-subscription-system.iam.gserviceaccount.com`
   - Add roles:
     - Cloud SQL Client
     - Secret Manager Secret Accessor

## Verify Setup

After running setup, verify with:

```bash
# Check service account roles
gcloud projects get-iam-policy box-subscription-system \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@box-subscription-system.iam.gserviceaccount.com"

# Check Cloud SQL instance
gcloud sql instances describe subscription-db --project=box-subscription-system --format="value(connectionName)"

# Check secrets
gcloud secrets list --project=box-subscription-system
```

## After Setup

Once setup is complete, the GitHub Actions workflow will automatically deploy on the next push to main branch.

Monitor deployment:
```bash
# Watch GitHub Actions
# https://github.com/YOUR-USERNAME/YOUR-REPO/actions

# Or check Cloud Run logs
gcloud run services logs tail subscription-backend --region=us-central1 --project=box-subscription-system
```
