#!/bin/bash

# Script to start the TGM Ventures app locally with secrets from Google Secret Manager

echo "🚀 Starting TGM Ventures local development..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    exit 1
fi

# Set the project
gcloud config set project tgm-ventures-site > /dev/null 2>&1

# Fetch the Firebase API key from Google Secret Manager
echo "🔐 Fetching Firebase API key from Secret Manager..."
FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY" --project="tgm-ventures-site" 2>/dev/null)

if [ -z "$FIREBASE_API_KEY" ]; then
    echo "❌ Error: Failed to fetch Firebase API key from Secret Manager"
    echo "Please ensure you have access to the tgm-ventures-site project"
    exit 1
fi

echo "✅ Successfully fetched Firebase API key"

# Export the environment variable
export NEXT_PUBLIC_FIREBASE_API_KEY="$FIREBASE_API_KEY"

# Start the development server
echo "🚀 Starting Next.js development server..."
echo "📍 The app will be available at http://localhost:3000"
echo ""
npm run dev
