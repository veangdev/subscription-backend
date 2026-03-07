#!/bin/bash

# Seed Admin User - Simple Version
# This script calls the seed endpoint after deployment

API_URL="https://subscription-backend-528466251837.us-central1.run.app/api"

echo "🌱 Seeding Admin User via API Endpoint"
echo "======================================="
echo ""
echo "API: $API_URL"
echo ""
echo "⏳ Checking if deployment is ready..."

# Check if the seed endpoint exists
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/admin/auth/login")

if [ "$HEALTH_CHECK" -eq 404 ]; then
    echo "⚠️  Deployment not ready yet. Please wait 2-3 minutes and try again."
    echo ""
    echo "You can check deployment status at:"
    echo "https://github.com/veangdev/subscription-backend/actions"
    echo ""
    echo "Then run this script again: ./scripts/seed-admin-simple.sh"
    exit 0
fi

echo "✅ API is ready!"
echo ""
echo "📤 Calling seed endpoint..."
echo ""

# Call the seed endpoint
RESPONSE=$(curl -s -X POST "$API_URL/admin/auth/seed-default-admin" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Admin Login Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Username: admin"
echo "Password: Admin@123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Login at: http://localhost:3001/login"
echo ""
