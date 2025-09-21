#!/bin/bash

# Backend Deployment Test Script
# Use this to test your deployed backend

if [ $# -eq 0 ]; then
    echo "Usage: ./test-deployment.sh <your-backend-url>"
    echo "Example: ./test-deployment.sh https://jp-app-backend.sevalla.com"
    exit 1
fi

BACKEND_URL=$1
echo "🧪 Testing Backend Deployment"
echo "=============================="
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Database Connection
echo "2️⃣ Testing Database Connection..."
DB_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$DB_RESPONSE" | grep -q "database"; then
    echo "✅ Database connection working"
else
    echo "⚠️  Database status unclear"
fi
echo ""

# Test 3: CORS Headers
echo "3️⃣ Testing CORS Configuration..."
CORS_RESPONSE=$(curl -s -I "$BACKEND_URL/api/health")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
else
    echo "⚠️  CORS headers missing"
fi
echo ""

# Test 4: Catalogue Endpoint
echo "4️⃣ Testing Catalogue Endpoint..."
CATALOGUE_RESPONSE=$(curl -s "$BACKEND_URL/api/catalogue")
if echo "$CATALOGUE_RESPONSE" | grep -q "catalogue"; then
    echo "✅ Catalogue endpoint accessible"
else
    echo "⚠️  Catalogue endpoint status unclear"
fi
echo ""

# Test 5: Admin Endpoint
echo "5️⃣ Testing Admin Endpoint..."
ADMIN_RESPONSE=$(curl -s "$BACKEND_URL/api/admin")
if echo "$ADMIN_RESPONSE" | grep -q "admin"; then
    echo "✅ Admin endpoint accessible"
else
    echo "⚠️  Admin endpoint status unclear"
fi
echo ""

echo "🎯 Test Summary:"
echo "================"
echo "If all tests show ✅, your backend is ready!"
echo "If any tests show ❌, check the deployment logs"
echo "If tests show ⚠️, verify your configuration"
echo ""
echo "📱 Next Steps:"
echo "1. Update frontend with: $BACKEND_URL/api"
echo "2. Test catalogue downloads"
echo "3. Test admin notifications"
echo "4. Deploy frontend to app store"
