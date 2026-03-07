#!/bin/bash
# Emergency fix script - Run in Cloud Shell
# https://shell.cloud.google.com

set -e

PROJECT_ID="box-subscription-system"
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=============================================="
echo "EMERGENCY Cloud Run Deployment Fix"
echo "Project: ${PROJECT_ID}"
echo "=============================================="
echo ""

# Set project
gcloud config set project ${PROJECT_ID}

echo "Step 1: Enabling ALL required APIs (forced)..."
gcloud services enable \
  sqladmin.googleapis.com \
  sql-component.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  serviceusage.googleapis.com \
  compute.googleapis.com \
  --project=${PROJECT_ID}

echo "✓ APIs enabled"
echo ""

echo "Step 2: Granting ALL necessary roles to service account..."

# Cloud SQL Client
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client" \
  --condition=None

# Secret Manager Accessor  
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None

# Cloud Run Admin (for deployment)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin" \
  --condition=None

# Service Account User
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

# Artifact Registry Writer
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer" \
  --condition=None

echo "✓ All roles granted"
echo ""

echo "Step 3: Checking Cloud SQL instance..."
INSTANCE_CONNECTION=$(gcloud sql instances describe subscription-db \
  --project=${PROJECT_ID} \
  --format="value(connectionName)" 2>/dev/null || echo "NOT_FOUND")

if [ "$INSTANCE_CONNECTION" != "NOT_FOUND" ]; then
  echo "✓ Cloud SQL instance found: ${INSTANCE_CONNECTION}"
else
  echo "✗ Cloud SQL instance 'subscription-db' not found!"
  echo "  Please create it or check the name"
fi
echo ""

echo "Step 4: Checking secrets..."
for SECRET in database-password jwt-secret stripe-secret-key1; do
  if gcloud secrets describe ${SECRET} --project=${PROJECT_ID} &>/dev/null; then
    echo "  ✓ ${SECRET} exists"
  else
    echo "  ✗ ${SECRET} MISSING - needs to be created!"
  fi
done
echo ""

echo "Step 5: Checking current Cloud Run service..."
SERVICE_URL=$(gcloud run services describe subscription-backend \
  --region=us-central1 \
  --project=${PROJECT_ID} \
  --format="value(status.url)" 2>/dev/null || echo "NOT_DEPLOYED")

if [ "$SERVICE_URL" != "NOT_DEPLOYED" ]; then
  echo "✓ Service exists: ${SERVICE_URL}"
  echo "  Checking last deployment status..."
  gcloud run revisions list \
    --service=subscription-backend \
    --region=us-central1 \
    --project=${PROJECT_ID} \
    --limit=3 \
    --format="table(metadata.name,status.conditions[0].type,status.conditions[0].status,status.conditions[0].message)"
else
  echo "✗ Service not yet deployed"
fi
echo ""

echo "=============================================="
echo "Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Make sure all secrets exist (database-password, jwt-secret, stripe-secret-key1)"
echo "2. Push code to GitHub main branch to trigger deployment"
echo "3. Or manually deploy with:"
echo ""
echo "   gcloud run deploy subscription-backend \\"
echo "     --image us-central1-docker.pkg.dev/${PROJECT_ID}/subscription-backend/app:latest \\"
echo "     --region us-central1 \\"
echo "     --service-account ${SA_EMAIL} \\"
echo "     --add-cloudsql-instances ${PROJECT_ID}:us-central1:subscription-db \\"
echo "     --set-env-vars NODE_ENV=production,DB_SYNC=false,DB_MIGRATIONS=false \\"
echo "     --update-secrets DATABASE_PASSWORD=database-password:latest,JWT_SECRET=jwt-secret:latest,STRIPE_SECRET_KEY=stripe-secret-key1:latest \\"
echo "     --allow-unauthenticated \\"
echo "     --memory 1Gi --cpu 2 --timeout 300"
echo ""
