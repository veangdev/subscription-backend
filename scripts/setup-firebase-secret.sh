#!/bin/bash

# Setup Firebase service account secret in Google Secret Manager
# This needs to be run once before deploying

set -e

PROJECT_ID="${1:-}"
FIREBASE_JSON_PATH="${2:-boxapp-22465-firebase-adminsdk-fbsvc-f533763f9a.json}"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 <GCP_PROJECT_ID> [path-to-firebase-json]"
    echo "Example: $0 my-project-id boxapp-22465-firebase-adminsdk-fbsvc-f533763f9a.json"
    exit 1
fi

if [ ! -f "$FIREBASE_JSON_PATH" ]; then
    echo "Error: Firebase service account file not found: $FIREBASE_JSON_PATH"
    exit 1
fi

echo "=========================================="
echo "Setting up Firebase Secret in Secret Manager"
echo "=========================================="
echo "Project: $PROJECT_ID"
echo "Firebase file: $FIREBASE_JSON_PATH"
echo ""

# Enable Secret Manager API
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com \
    --project="$PROJECT_ID" \
    --quiet

# Check if secret exists
if gcloud secrets describe firebase-service-account --project="$PROJECT_ID" 2>/dev/null; then
    echo ""
    echo "Secret 'firebase-service-account' already exists."
    read -p "Do you want to add a new version? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Adding new version to existing secret..."
        gcloud secrets versions add firebase-service-account \
            --data-file="$FIREBASE_JSON_PATH" \
            --project="$PROJECT_ID"
        echo "✅ New version added successfully!"
    else
        echo "Skipping secret creation."
    fi
else
    echo "Creating new secret 'firebase-service-account'..."
    gcloud secrets create firebase-service-account \
        --data-file="$FIREBASE_JSON_PATH" \
        --replication-policy=automatic \
        --project="$PROJECT_ID"
    echo "✅ Secret created successfully!"
fi

# Grant access to Cloud Run service account
echo ""
echo "Looking for Cloud Run service account..."

# Get the Cloud Run service account email
SERVICE_ACCOUNT=$(gcloud run services describe subscription-backend \
    --region=us-central1 \
    --project="$PROJECT_ID" \
    --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo "")

if [ -z "$SERVICE_ACCOUNT" ]; then
    echo "⚠️  Cloud Run service not found or not deployed yet."
    echo "After deploying for the first time, run this script again to grant permissions."
else
    echo "Found service account: $SERVICE_ACCOUNT"
    echo "Granting secret accessor permission..."
    
    gcloud secrets add-iam-policy-binding firebase-service-account \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID"
    
    echo "✅ Permissions granted!"
fi

echo ""
echo "=========================================="
echo "✅ Firebase secret setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Add FIREBASE_SERVICE_ACCOUNT_KEY to GitHub Secrets"
echo "2. Push your code to trigger deployment"
echo "3. The secret will be mounted at /secrets/firebase/service-account.json"
echo ""
