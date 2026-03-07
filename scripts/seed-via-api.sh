#!/bin/bash

# Seed Admin User via API
# This script creates an admin user directly via your production API

set -e

API_URL="https://subscription-backend-528466251837.us-central1.run.app/api"

echo "🌱 Creating Admin User"
echo "===================="
echo ""
echo "API: $API_URL"
echo ""

# Create admin user via the admin auth endpoint
echo "📤 Attempting to create admin user via auth/register endpoint..."
echo ""

HTTP_CODE=$(curl -s -o /tmp/seed_response.json -w "%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Administrator",
    "username": "admin",
    "email": "admin@boxadmin.com",
    "password": "Admin@123",
    "role": "Admin"
  }')

BODY=$(cat /tmp/seed_response.json 2>/dev/null || echo "")

echo "Response Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Admin user created successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Login Credentials:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Username: admin"
    echo "Password: Admin@123"
    echo "Email: admin@boxadmin.com"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Login at: http://localhost:3001/login"
    echo ""
elif [ "$HTTP_CODE" -eq 409 ] || echo "$BODY" | grep -qi "already exists\|duplicate\|unique"; then
    echo "ℹ️  Admin user already exists"
    echo ""
    echo "You can login with:"
    echo "Username: admin"
    echo "Password: Admin@123"
    echo ""
else
    echo "❌ Failed to create admin user"
    echo "Response: $BODY"
    echo ""
    echo "This might mean:"
    echo "1. The backend deployment is still in progress"
    echo "2. The users endpoint requires authentication"
    echo "3. The database schema hasn't been updated yet"
    echo ""
    echo "Please wait a few minutes for deployment to complete and try again."
fi
