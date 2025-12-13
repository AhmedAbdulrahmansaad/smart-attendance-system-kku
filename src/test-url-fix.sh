#!/bin/bash

# 🧪 Test URL Fix for Edge Functions
# This script tests the correct URL format after the fix

echo "=================================="
echo "🧪 Testing Edge Function URLs"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="pcymgqdjbdklrikdquih"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/make-server-90ad488b"

echo "📍 Base URL: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local name=$2
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "   URL: ${BASE_URL}${endpoint}"
    
    response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Content-Type: application/json")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "   ${GREEN}✅ Success (200)${NC}"
        echo "   Response: $(echo "$body" | head -c 100)..."
    elif [ "$http_code" = "404" ]; then
        echo -e "   ${RED}❌ Not Found (404) - Edge Function not deployed${NC}"
        echo -e "   ${YELLOW}📝 Run: ./deploy-edge-function.sh${NC}"
    elif [ "$http_code" = "401" ]; then
        echo -e "   ${YELLOW}⚠️  Unauthorized (401) - Authentication required (expected for protected endpoints)${NC}"
    else
        echo -e "   ${RED}❌ Error ($http_code)${NC}"
        echo "   Response: $body"
    fi
    echo ""
}

# Test 1: Health Check (Public)
test_endpoint "/health" "Health Check"

# Test 2: Public Stats (Public)
test_endpoint "/stats/public" "Public Stats (Landing Page)"

# Test 3: Dashboard Stats (Protected - should return 401 without login)
test_endpoint "/stats/dashboard" "Dashboard Stats (Protected)"

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo ""
echo "Expected Results:"
echo "  ✅ Health Check: 200 OK"
echo "  ✅ Public Stats: 200 OK"
echo "  ⚠️  Dashboard Stats: 401 Unauthorized (needs authentication)"
echo ""
echo "If you see 404 errors:"
echo "  1. Edge Function is not deployed yet"
echo "  2. Run: ./deploy-edge-function.sh"
echo "  3. Make sure database schema is applied first"
echo ""
echo "=================================="
echo "✅ Test Complete"
echo "=================================="
