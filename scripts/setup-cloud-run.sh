#!/bin/bash

# Setup script for Cloud Run deployment
# Run this in Google Cloud Shell: https://shell.cloud.google.com/

set -e

PROJECT_ID="box-subscription-system"
PROJECT_NUMBER="528466251837"
REGION="us-central1"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=========================================="
echo "Cloud Run Setup for ${PROJECT_ID}"
echo "=========================================="
echo ""

# Set the project
gcloud config set project ${PROJECT_ID}

echo "1. Enabling required APIs..."
gcloud services enable \
  sqladmin.googleapis.com \
  sql-component.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  serviceusage.googleapis.com

echo "✓ APIs enabled"
echo ""

echo "2. Granting Cloud SQL Client role to service account..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.client" \
  --condition=None

echo "✓ Cloud SQL Client role granted"
echo ""

echo "3. Granting Secret Manager Accessor role to service account..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None

echo "✓ Secret Manager Accessor role granted"
echo ""

echo "4. Verifying Cloud SQL instance..."
gcloud sql instances describe subscription-db --format="value(connectionName)" || {
  echo "⚠️  Cloud SQL instance 'subscription-db' not found or not accessible"
  exit 1
}

echo "✓ Cloud SQL instance verified"
echo ""

echo "5. Verifying required secrets exist..."
for SECRET in database-password jwt-secret stripe-secret-key1; do
  if gcloud secrets describe ${SECRET} --project=${PROJECT_ID} &>/dev/null; then
    echo "  ✓ ${SECRET}"
  else
    echo "  ✗ ${SECRET} (missing - needs to be created)"
  fi
done

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Service Account: ${SERVICE_ACCOUNT}"
echo "Roles granted:"
echo "  - roles/cloudsql.client"
echo "  - roles/secretmanager.secretAccessor"
echo ""
echo "The next GitHub push to main branch will trigger deployment."
echo ""
