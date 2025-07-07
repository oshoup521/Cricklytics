#!/bin/bash

echo "🚀 Deploying Cricklytics to production..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Prepare for deployment
echo "📋 Preparing deployment..."

echo "✅ Build complete! Ready for Vercel deployment."
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Vercel"
echo "3. Configure your custom domain in Vercel"
echo "4. Set up environment variables in Vercel dashboard"
