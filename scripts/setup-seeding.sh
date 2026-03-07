#!/bin/bash

# Quick Setup for Production Database Seeding
echo "🚀 Setting up Production Database Seeding"
echo "=========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found"
    exit 1
fi

# Check if password is still placeholder
if grep -q "YOUR_PASSWORD_HERE" .env.production; then
    echo "⚙️  Step 1: Get Production Database Password"
    echo ""
    echo "   Option A - Using gcloud CLI:"
    echo "   gcloud secrets versions access latest --secret=database-password"
    echo ""
    echo "   Option B - Using Google Cloud Console:"
    echo "   1. Go to: https://console.cloud.google.com/security/secret-manager"
    echo "   2. Find 'database-password' secret"
    echo "   3. Click 'View secret value'"
    echo ""
    echo "📝 Enter the database password:"
    read -s DB_PASSWORD
    echo ""
    
    # Update .env.production with the password
    sed -i.bak "s/DATABASE_PASSWORD=YOUR_PASSWORD_HERE/DATABASE_PASSWORD=$DB_PASSWORD/" .env.production
    rm .env.production.bak
    echo "✅ Password saved to .env.production"
else
    echo "✅ .env.production is already configured"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Install Cloud SQL Proxy (if not installed):"
echo "   macOS: brew install cloud-sql-proxy"
echo ""
echo "2. Get your Google Cloud Project ID from:"
echo "   https://console.cloud.google.com/home/dashboard"
echo ""
echo "3. Run the seeding script:"
echo "   ./scripts/seed-production.sh"
echo ""
echo "Or manually:"
echo "   cloud-sql-proxy YOUR_PROJECT_ID:us-central1:subscription-db &"
echo "   npm run seed:admin"
echo ""
