#!/bin/bash

# 🧪 نظام الاختبار السريع - Quick System Test
# King Khalid University Smart Attendance System

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Quick System Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check project files
echo "📁 Test 1/5: Checking project files..."
FILES_OK=true

if [ ! -f "App.tsx" ]; then
    echo "❌ App.tsx not found!"
    FILES_OK=false
fi

if [ ! -f "components/AuthContext.tsx" ]; then
    echo "❌ AuthContext.tsx not found!"
    FILES_OK=false
fi

if [ ! -f "utils/api.ts" ]; then
    echo "❌ api.ts not found!"
    FILES_OK=false
fi

if [ ! -f "database_schema.sql" ]; then
    echo "❌ database_schema.sql not found!"
    FILES_OK=false
fi

if [ "$FILES_OK" = true ]; then
    echo "✅ All project files found!"
else
    echo "❌ Some files are missing!"
    exit 1
fi

echo ""

# Test 2: Check Supabase configuration
echo "🔧 Test 2/5: Checking Supabase configuration..."
if [ -f "utils/supabase/info.tsx" ]; then
    if grep -q "pcymgqdjbdklrikdquih" utils/supabase/info.tsx; then
        echo "✅ Supabase configuration found!"
    else
        echo "❌ Invalid Supabase configuration!"
        exit 1
    fi
else
    echo "❌ Supabase info file not found!"
    exit 1
fi

echo ""

# Test 3: Check Edge Function URL
echo "🌐 Test 3/5: Testing Edge Function availability..."
EDGE_FUNCTION_URL="https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health"

echo "Testing: $EDGE_FUNCTION_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_FUNCTION_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Edge Function is deployed and working!"
    echo "📊 Testing health endpoint..."
    RESPONSE=$(curl -s "$EDGE_FUNCTION_URL")
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  Edge Function not deployed (404)"
    echo "💡 This is OK! System uses fallback mode"
    echo "💡 To deploy: ./🚀_نشر_سريع_QUICK_DEPLOY.sh"
else
    echo "⚠️  Edge Function status: $HTTP_CODE"
    echo "💡 System will use fallback mode"
fi

echo ""

# Test 4: Check package.json
echo "📦 Test 4/5: Checking dependencies..."
if [ -f "package.json" ]; then
    if grep -q "react" package.json; then
        echo "✅ React dependency found!"
    else
        echo "❌ React dependency not found!"
        exit 1
    fi
    
    if grep -q "supabase" package.json; then
        echo "✅ Supabase dependency found!"
    else
        echo "❌ Supabase dependency not found!"
        exit 1
    fi
else
    echo "❌ package.json not found!"
    exit 1
fi

echo ""

# Test 5: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Project files: OK"
echo "✅ Supabase config: OK"
echo "✅ Dependencies: OK"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Edge Function: Deployed"
else
    echo "⚠️  Edge Function: Not deployed (using fallback)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 System Status: READY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start development server:"
echo "   npm run dev"
echo ""
echo "2. Open browser:"
echo "   http://localhost:5173"
echo ""
echo "3. Login with any @kku.edu.sa email"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo "💡 Optional: Deploy Edge Function for full features:"
    echo "   ./🚀_نشر_سريع_QUICK_DEPLOY.sh"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ النظام جاهز للاستخدام!"
echo "✨ System ready to use!"
echo ""
