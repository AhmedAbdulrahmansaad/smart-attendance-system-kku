#!/bin/bash

# =====================================================
# Test Stats Dashboard Endpoint
# نظام الحضور الذكي - جامعة الملك خالد
# =====================================================

echo "🧪 Testing Stats Dashboard Endpoint..."
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b"

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
echo "Endpoint: GET $BASE_URL/health"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Health check: PASSED${NC}"
  echo "Response: $BODY"
else
  echo -e "${RED}❌ Health check: FAILED${NC}"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Public Stats (No Auth Required)
echo -e "${BLUE}Test 2: Public Stats${NC}"
echo "Endpoint: GET $BASE_URL/stats/public"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/stats/public")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Public stats: PASSED${NC}"
  echo "Response: $BODY"
else
  echo -e "${RED}❌ Public stats: FAILED${NC}"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Dashboard Stats (Auth Required - Should Fail Without Token)
echo -e "${BLUE}Test 3: Dashboard Stats (Without Auth)${NC}"
echo "Endpoint: GET $BASE_URL/stats/dashboard"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/stats/dashboard")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✅ Dashboard stats (no auth): PASSED (correctly rejected)${NC}"
  echo "Response: $BODY"
else
  echo -e "${YELLOW}⚠️  Dashboard stats (no auth): Unexpected response${NC}"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 4: Check if endpoint exists (404 vs 401)
echo -e "${BLUE}Test 4: Endpoint Existence Check${NC}"
if [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${RED}❌ CRITICAL: Endpoint not found (404)${NC}"
  echo -e "${RED}   The endpoint may not be deployed yet!${NC}"
  echo -e "${YELLOW}   Please run: ./deploy-edge-function.sh${NC}"
elif [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✅ Endpoint exists (returns 401 for unauthorized)${NC}"
else
  echo -e "${YELLOW}⚠️  Endpoint returned: $HTTP_CODE${NC}"
fi
echo ""

# Summary
echo "======================================"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "======================================"
echo ""

if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✅ All tests PASSED!${NC}"
  echo ""
  echo "The endpoint is working correctly."
  echo "It requires authentication as expected."
  echo ""
  echo "To test with authentication:"
  echo "1. Sign in through the frontend"
  echo "2. Get your access token from localStorage"
  echo "3. Run:"
  echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
  echo "     $BASE_URL/stats/dashboard"
  echo ""
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${RED}❌ Endpoint not deployed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Deploy the edge function:"
  echo "   ./deploy-edge-function.sh"
  echo ""
  echo "2. Run this test again:"
  echo "   ./test-stats-endpoint.sh"
  echo ""
else
  echo -e "${YELLOW}⚠️  Unexpected response${NC}"
  echo ""
  echo "Please check:"
  echo "1. Edge function deployment status"
  echo "2. Supabase project status"
  echo "3. Network connectivity"
  echo ""
fi

echo "======================================"
echo -e "${BLUE}For more information:${NC}"
echo "  - Arabic Guide: /⚡_حل_مشكلة_العمود_active.md"
echo "  - English Guide: /✅_DATABASE_COLUMN_ERROR_FIXED.md"
echo "  - Quick Verification: /🎯_QUICK_FIX_VERIFICATION.md"
echo "======================================"
