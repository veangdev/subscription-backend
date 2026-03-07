#!/bin/bash

# Quick Admin Seeder
# Run this after deployment completes (2-3 minutes)

echo "🌱 Creating admin user..."

curl -s -X POST \
  "https://subscription-backend-528466251837.us-central1.run.app/api/admin/auth/seed-default-admin" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo "✅ Done!"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: Admin@123"
echo ""
echo "Login at: http://localhost:3001/login"
echo ""
