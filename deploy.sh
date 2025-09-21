#!/bin/bash

# Quick Deployment Script for JP App Backend
# Run this script to prepare and deploy your backend

echo "🚀 JP App Backend Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Checking environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "📝 Please create .env file with production values:"
    echo "   - Copy env.production.example to .env"
    echo "   - Update with your actual values"
    echo ""
fi

echo "🧪 Running tests..."
npm test

echo "✅ Backend is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Create .env file with production values"
echo "2. Deploy to Sevalla or Railway"
echo "3. Update frontend with production API URL"
echo "4. Test on real device"
echo ""
echo "🌐 For Sevalla deployment:"
echo "   - Go to sevalla.com"
echo "   - Connect your GitHub repo"
echo "   - Set environment variables"
echo "   - Deploy!"
echo ""
echo "🚀 For Railway deployment:"
echo "   - Go to railway.app"
echo "   - Connect GitHub"
echo "   - Auto-deploy!"
