#!/bin/bash

# JP App Backend Setup Script
# This script helps you prepare your backend for deployment

echo "🚀 JP App Backend Setup"
echo "======================"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd backend && ./setup.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up environment variables..."
if [ ! -f ".env" ]; then
    if [ -f "env.production.example" ]; then
        cp env.production.example .env
        echo "✅ Created .env file from template"
        echo "⚠️  Please edit .env with your actual values:"
        echo "   - MONGODB_URI: Your MongoDB connection string"
        echo "   - JWT_SECRET: A strong random secret key"
        echo "   - EMAIL_USER: Your Gmail address"
        echo "   - EMAIL_PASS: Your Gmail app password"
    else
        echo "❌ env.production.example not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

echo "🧪 Running tests..."
if npm test; then
    echo "✅ Tests passed"
else
    echo "⚠️  Tests failed - check your setup"
fi

echo "🔍 Checking configuration..."
echo "📋 Current environment variables:"
if [ -f ".env" ]; then
    echo "   MONGODB_URI: $(grep MONGODB_URI .env | cut -d'=' -f2 | cut -c1-20)..."
    echo "   JWT_SECRET: $(grep JWT_SECRET .env | cut -d'=' -f2 | cut -c1-20)..."
    echo "   EMAIL_USER: $(grep EMAIL_USER .env | cut -d'=' -f2)"
    echo "   NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
else
    echo "   ❌ .env file not found"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Edit .env file with your actual values"
echo "2. Choose a deployment platform:"
echo "   - Sevalla: sevalla.com (recommended)"
echo "   - Railway: railway.app"
echo "   - Heroku: heroku.com"
echo "3. Follow the README.md deployment guide"
echo "4. Test your deployed backend"
echo ""
echo "📚 For detailed instructions, see README.md"
echo "🚀 Happy deploying!"
