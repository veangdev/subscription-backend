#!/bin/bash

# Check Cloud Run logs for subscription-backend service
# Usage: ./scripts/check-cloudrun-logs.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
SERVICE="subscription-backend"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 <PROJECT_ID> [REGION]"
    echo "Example: $0 my-project-id us-central1"
    exit 1
fi

echo "Fetching logs for Cloud Run service: $SERVICE"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""
echo "========================================"
echo "Recent logs:"
echo "========================================"

gcloud run services logs read "$SERVICE" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --limit=100 \
    --format="table(severity,timestamp,textPayload)"

echo ""
echo "========================================"
echo "Error logs only:"
echo "========================================"

gcloud run services logs read "$SERVICE" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --limit=50 \
    --format="table(severity,timestamp,textPayload)" \
    | grep -i "error\|failed\|exception" || echo "No error logs found"
