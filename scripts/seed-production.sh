#!/bin/bash

# Seed Production Database Helper Script
# This script helps you seed the production Cloud SQL database from your local machine

set -e

echo "🌱 Production Database Seeder"
echo "============================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found"
    echo "   Please create .env.production with your production database credentials"
    exit 1
fi

# Check if Cloud SQL Proxy is installed
if ! command -v cloud-sql-proxy &> /dev/null; then
    echo "❌ Cloud SQL Proxy is not installed"
    echo ""
    echo "   Install it with:"
    echo "   macOS: brew install cloud-sql-proxy"
    echo "   Linux: wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud-sql-proxy && chmod +x cloud-sql-proxy"
    echo ""
    exit 1
fi

# Prompt for project ID
echo "Enter your Google Cloud Project ID:"
read -r PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID is required"
    exit 1
fi

INSTANCE_CONNECTION_NAME="$PROJECT_ID:us-central1:subscription-db"

echo ""
echo "📡 Starting Cloud SQL Proxy..."
echo "   Connection: $INSTANCE_CONNECTION_NAME"
echo ""

# Start Cloud SQL Proxy in the background
cloud-sql-proxy "$INSTANCE_CONNECTION_NAME" &
PROXY_PID=$!

# Wait for proxy to be ready
echo "⏳ Waiting for proxy to connect..."
sleep 3

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping Cloud SQL Proxy..."
    kill $PROXY_PID 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Run the seeder
echo "🌱 Running seeder..."
echo ""

npm run seed:admin

echo ""
echo "✅ Done!"
echo ""
echo "You can now login to BoxAdmin with:"
echo "   Username: admin"
echo "   Password: Admin@123"
echo ""
