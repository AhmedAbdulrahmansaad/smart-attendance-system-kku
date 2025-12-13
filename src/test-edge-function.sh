#!/bin/bash

# 🧪 اختبار Edge Function
# Test Edge Function

echo "=================================================="
echo "🧪 اختبار Edge Function"
echo "Testing Edge Function"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"

echo -e "${BLUE}🌐 اختبار الاتصال...${NC}"
echo "URL: $SUPABASE_URL/functions/v1/make-server-90ad488b/health"
echo ""

# Test health endpoint
echo -e "${YELLOW}[1/3] اختبار /health endpoint...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ /health endpoint يعمل بشكل صحيح${NC}"
else
    echo -e "${RED}❌ /health endpoint لا يعمل (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test public stats endpoint
echo -e "${YELLOW}[2/3] اختبار /stats/public endpoint...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/stats/public")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ /stats/public endpoint يعمل بشكل صحيح${NC}"
else
    echo -e "${RED}❌ /stats/public endpoint لا يعمل (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test /me endpoint (should return 401 without auth)
echo -e "${YELLOW}[3/3] اختبار /me endpoint (بدون authentication)...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✅ /me endpoint يعمل بشكل صحيح (401 Unauthorized متوقع)${NC}"
else
    echo -e "${YELLOW}⚠️  /me endpoint رد بـ HTTP $HTTP_CODE (متوقع 401)${NC}"
fi
echo ""

echo "=================================================="
echo -e "${BLUE}📊 ملخص النتائج:${NC}"
echo "=================================================="
echo ""

# Summary
TESTS_PASSED=0
TESTS_TOTAL=3

# Re-test to count
RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
[ "$HTTP_CODE" -eq 200 ] && TESTS_PASSED=$((TESTS_PASSED + 1))

RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/stats/public")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
[ "$HTTP_CODE" -eq 200 ] && TESTS_PASSED=$((TESTS_PASSED + 1))

RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
[ "$HTTP_CODE" -eq 401 ] && TESTS_PASSED=$((TESTS_PASSED + 1))

echo "✅ اختبارات نجحت: $TESTS_PASSED / $TESTS_TOTAL"
echo ""

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo -e "${GREEN}🎉 Edge Function يعمل بشكل مثالي!${NC}"
    echo ""
    echo "الخطوات التالية:"
    echo "1. تطبيق SQL Schema (إذا لم تفعل بعد)"
    echo "2. افتح التطبيق في المتصفح"
    echo "3. أنشئ حساب جديد واختبر النظام"
elif [ $TESTS_PASSED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Edge Function يعمل جزئياً${NC}"
    echo ""
    echo "بعض endpoints تعمل والبعض الآخر لا."
    echo "قد تحتاج إلى:"
    echo "1. الانتظار بضع ثوانٍ وإعادة الاختبار"
    echo "2. التحقق من اللوغ في Supabase Dashboard"
else
    echo -e "${RED}❌ Edge Function لا يعمل${NC}"
    echo ""
    echo "الحلول المقترحة:"
    echo "1. تأكد من نشر Edge Function:"
    echo "   ./deploy-edge-function.sh"
    echo ""
    echo "2. راجع دليل الإصلاح:"
    echo "   🔥_FIX_404_EDGE_FUNCTION.md"
    echo ""
    echo "3. تحقق من اللوغ:"
    echo "   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/functions/server/logs"
fi

echo ""
echo "=================================================="