#!/bin/bash
# Comprehensive Cloud Run Deployment Monitor and Fixer
# Run this to check status and auto-fix issues

PROJECT_ID="box-subscription-system"
REGION="us-central1"
SERVICE="subscription-backend"
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running in Cloud Shell
if [ -n "$DEVSHELL_PROJECT_ID" ]; then
    print_info "Running in Cloud Shell"
    gcloud config set project ${PROJECT_ID}
else
    print_warning "Not running in Cloud Shell - some commands might require authentication"
fi

echo ""
print_header "Cloud Run Deployment Status Check"
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE}"
echo "Region: ${REGION}"
echo ""

# 1. Check if service exists
print_info "Checking if Cloud Run service exists..."
SERVICE_URL=$(gcloud run services describe ${SERVICE} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(status.url)" 2>/dev/null || echo "NOT_FOUND")

if [ "$SERVICE_URL" != "NOT_FOUND" ]; then
    print_success "Service exists: ${SERVICE_URL}"
else
    print_error "Service not found - needs to be deployed first"
    echo ""
    exit 1
fi
echo ""

# 2. Check latest revision status
print_info "Checking latest revision status..."
LATEST_REVISION=$(gcloud run revisions list \
    --service=${SERVICE} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --limit=1 \
    --format="value(metadata.name)")

REVISION_STATUS=$(gcloud run revisions describe ${LATEST_REVISION} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(status.conditions[0].status)")

REVISION_REASON=$(gcloud run revisions describe ${LATEST_REVISION} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(status.conditions[0].reason)")

REVISION_MESSAGE=$(gcloud run revisions describe ${LATEST_REVISION} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(status.conditions[0].message)")

echo "Latest Revision: ${LATEST_REVISION}"
echo "Status: ${REVISION_STATUS}"
echo "Reason: ${REVISION_REASON}"
if [ -n "$REVISION_MESSAGE" ]; then
    echo "Message: ${REVISION_MESSAGE}"
fi

if [ "$REVISION_STATUS" = "True" ] && [ "$REVISION_REASON" = "Ready" ]; then
    print_success "Revision is READY and HEALTHY!"
elif [ "$REVISION_REASON" = "ContainerStarting" ] || [ "$REVISION_REASON" = "Deploying" ]; then
    print_warning "Revision is still starting up..."
else
    print_error "Revision has issues!"
fi
echo ""

# 3. Test health endpoint
print_info "Testing health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${SERVICE_URL}/health)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Health check PASSED (HTTP ${HTTP_CODE})"
    curl -s ${SERVICE_URL}/health | python3 -m json.tool 2>/dev/null || echo ""
elif [ "$HTTP_CODE" = "502" ] || [ "$HTTP_CODE" = "503" ]; then
    print_warning "Service starting or unhealthy (HTTP ${HTTP_CODE})"
else
    print_error "Health check FAILED (HTTP ${HTTP_CODE})"
fi
echo ""

# 4. Check recent logs
print_info "Recent logs (last 20 lines)..."
gcloud run services logs read ${SERVICE} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --limit=20 \
    --format="table(severity,timestamp.date('%Y-%m-%d %H:%M:%S'),textPayload)" 2>/dev/null || echo "No logs available"

echo ""

# 5. Check for errors in logs
print_info "Checking for errors in logs..."
ERROR_COUNT=$(gcloud run services logs read ${SERVICE} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --limit=100 \
    --format="value(severity)" 2>/dev/null | grep -c "ERROR" || echo "0")

if [ "$ERROR_COUNT" -gt "0" ]; then
    print_warning "Found ${ERROR_COUNT} errors in recent logs"
    echo ""
    print_info "Recent errors:"
    gcloud run services logs read ${SERVICE} \
        --region=${REGION} \
        --project=${PROJECT_ID} \
        --limit=100 \
        --format="table(timestamp.date('%Y-%m-%d %H:%M:%S'),textPayload)" 2>/dev/null \
        | grep -i "error" | head -10
else
    print_success "No errors in recent logs"
fi
echo ""

# 6. Check GitHub Actions status
print_header " GitHub Actions Status"
print_info "Check deployment status at:"
echo "https://github.com/veangdev/subscription-backend/actions"
echo ""

# 7. Check Cloud SQL connection
print_info "Checking Cloud SQL instance..."
INSTANCE_STATUS=$(gcloud sql instances describe subscription-db \
    --project=${PROJECT_ID} \
    --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$INSTANCE_STATUS" = "RUNNABLE" ]; then
    print_success "Cloud SQL instance is running"
elif [ "$INSTANCE_STATUS" = "NOT_FOUND" ]; then
    print_error "Cloud SQL instance not found!"
else
    print_warning "Cloud SQL instance state: ${INSTANCE_STATUS}"
fi
echo ""

# 8. Check service account permissions
print_info "Checking service account permissions..."
HAS_SQL_CLIENT=$(gcloud projects get-iam-policy ${PROJECT_ID} \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
    --format="value(bindings.role)" | grep -c "roles/cloudsql.client" || echo "0")

HAS_SECRET_ACCESSOR=$(gcloud projects get-iam-policy ${PROJECT_ID} \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
    --format="value(bindings.role)" | grep -c "roles/secretmanager.secretAccessor" || echo "0")

if [ "$HAS_SQL_CLIENT" -gt "0" ]; then
    print_success "Service account has Cloud SQL Client role"
else
    print_error "Service account MISSING Cloud SQL Client role"
    FIX_NEEDED=true
fi

if [ "$HAS_SECRET_ACCESSOR" -gt "0" ]; then
    print_success "Service account has Secret Manager Accessor role"
else
    print_error "Service account MISSING Secret Manager Accessor role"
    FIX_NEEDED=true
fi
echo ""

# 9. Check secrets exist
print_info "Checking required secrets..."
for SECRET in database-password jwt-secret stripe-secret-key1; do
    if gcloud secrets describe ${SECRET} --project=${PROJECT_ID} &>/dev/null; then
        print_success "Secret '${SECRET}' exists"
    else
        print_error "Secret '${SECRET}' is MISSING"
        FIX_NEEDED=true
    fi
done
echo ""

# 10. Offer to fix issues
if [ "$FIX_NEEDED" = "true" ]; then
    print_header "Issues Found - Fix Needed"
    echo ""
    echo "Would you like to auto-fix the issues? (requires permissions)"
    echo "This will:"
    echo "  - Enable required APIs"
    echo "  - Grant necessary IAM roles"
    echo ""
    read -p "Run auto-fix? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Running auto-fix..."
        bash "$(dirname $0)/emergency-fix.sh"
    fi
else
    print_header "Summary"
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "🎉 DEPLOYMENT SUCCESSFUL!"
        echo ""
        echo "Service URL: ${SERVICE_URL}"
        echo "Health: ${SERVICE_URL}/health"
        echo "API Docs: ${SERVICE_URL}/api/docs"
    elif [ "$REVISION_REASON" = "ContainerStarting" ]; then
        print_warning "Deployment in progress... check back in 1-2 minutes"
    else
        print_warning "Service is deployed but may have issues"
        echo "Check logs for details"
    fi
fi
echo ""
