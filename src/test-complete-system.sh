#!/bin/bash

# اختبار شامل للنظام الكامل - نظام الحضور الذكي
# King Khalid University Smart Attendance System - Complete Test

echo "🧪 بدء الاختبار الشامل للنظام..."
echo "=========================================="
echo ""

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# المتغيرات
PROJECT_ID="pcymgqdjbdklrikdquih"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/make-server-90ad488b"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# دالة للطباعة
print_test() {
    echo -e "${BLUE}[TEST $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ==================== الاختبارات ====================

echo "📋 قائمة الاختبارات:"
echo "  1. Health Check"
echo "  2. Public Stats"
echo "  3. Dashboard Stats (Expected 401)"
echo "  4. Login Endpoint Structure"
echo "  5. Signup Endpoint Structure"
echo ""
echo "=========================================="
echo ""

# Test 1: Health Check
((TOTAL_TESTS++))
print_test "1" "Health Check Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_CODE" = "200" ]; then
    print_success "Health Check: $HEALTH_CODE OK"
    echo "   Response: $HEALTH_BODY" | head -c 100
    echo "..."
else
    print_error "Health Check: $HEALTH_CODE (Expected: 200)"
    echo "   Response: $HEALTH_BODY"
fi
echo ""

# Test 2: Public Stats
((TOTAL_TESTS++))
print_test "2" "Public Stats Endpoint..."
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/stats/public")
STATS_CODE=$(echo "$STATS_RESPONSE" | tail -n 1)
STATS_BODY=$(echo "$STATS_RESPONSE" | head -n -1)

if [ "$STATS_CODE" = "200" ]; then
    print_success "Public Stats: $STATS_CODE OK"
    echo "   Response: $STATS_BODY" | head -c 100
    echo "..."
else
    print_error "Public Stats: $STATS_CODE (Expected: 200)"
    echo "   Response: $STATS_BODY"
fi
echo ""

# Test 3: Dashboard Stats (Should return 401)
((TOTAL_TESTS++))
print_test "3" "Dashboard Stats Endpoint (Protected)..."
DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/stats/dashboard")
DASHBOARD_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n 1)

if [ "$DASHBOARD_CODE" = "401" ]; then
    print_success "Dashboard Stats: $DASHBOARD_CODE Unauthorized (Correct - requires auth)"
else
    print_warning "Dashboard Stats: $DASHBOARD_CODE (Expected: 401)"
fi
echo ""

# Test 4: Login Endpoint Structure
((TOTAL_TESTS++))
print_test "4" "Login Endpoint Structure..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{}')
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

# Login should return 400 or 401 for empty body (not 404)
if [ "$LOGIN_CODE" = "400" ] || [ "$LOGIN_CODE" = "401" ] || [ "$LOGIN_CODE" = "422" ]; then
    print_success "Login Endpoint exists: $LOGIN_CODE (Endpoint is working)"
else
    print_error "Login Endpoint: $LOGIN_CODE (Expected: 400/401/422, Got: $LOGIN_CODE)"
    echo "   Response: $LOGIN_BODY"
fi
echo ""

# Test 5: Signup Endpoint Structure
((TOTAL_TESTS++))
print_test "5" "Signup Endpoint Structure..."
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/signup" \
    -H "Content-Type: application/json" \
    -d '{}')
SIGNUP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n 1)
SIGNUP_BODY=$(echo "$SIGNUP_RESPONSE" | head -n -1)

# Signup should return 400 or 422 for empty body (not 404)
if [ "$SIGNUP_CODE" = "400" ] || [ "$SIGNUP_CODE" = "422" ]; then
    print_success "Signup Endpoint exists: $SIGNUP_CODE (Endpoint is working)"
else
    print_error "Signup Endpoint: $SIGNUP_CODE (Expected: 400/422, Got: $SIGNUP_CODE)"
    echo "   Response: $SIGNUP_BODY"
fi
echo ""

# ==================== النتائج النهائية ====================

echo "=========================================="
echo "📊 نتائج الاختبار النهائية"
echo "=========================================="
echo ""
echo -e "${BLUE}إجمالي الاختبارات:${NC} $TOTAL_TESTS"
echo -e "${GREEN}نجح:${NC} $PASSED_TESTS"
echo -e "${RED}فشل:${NC} $FAILED_TESTS"
echo ""

# حساب النسبة
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${BLUE}نسبة النجاح:${NC} $PERCENTAGE%"
else
    PERCENTAGE=0
fi
echo ""

# الحكم النهائي
if [ $PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}✅ النظام يعمل بشكل ممتاز!${NC}"
    echo -e "${GREEN}   جاهز للاستخدام الفوري 🚀${NC}"
    EXIT_CODE=0
elif [ $PERCENTAGE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  النظام يعمل لكن هناك بعض المشاكل${NC}"
    echo -e "${YELLOW}   راجع الأخطاء أعلاه${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}❌ النظام يحتاج إصلاح${NC}"
    echo -e "${RED}   راجع دليل الإصلاح: TROUBLESHOOTING_AR.md${NC}"
    EXIT_CODE=2
fi
echo ""

# نصائح إضافية
echo "=========================================="
echo "💡 نصائح إضافية"
echo "=========================================="
echo ""

if [ "$HEALTH_CODE" != "200" ]; then
    echo -e "${YELLOW}⚠️  Health Check فشل - قد يكون Edge Function غير منشور${NC}"
    echo "   الحل: ./deploy-edge-function.sh"
    echo ""
fi

if [ "$STATS_CODE" != "200" ]; then
    echo -e "${YELLOW}⚠️  Public Stats فشل - قد تكون Database Schema غير مطبّقة${NC}"
    echo "   الحل: طبّق DATABASE_READY_TO_EXECUTE.sql في Supabase Dashboard"
    echo ""
fi

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "${GREEN}🎉 ممتاز! جميع الاختبارات نجحت${NC}"
    echo ""
    echo "الخطوات التالية:"
    echo "  1. افتح المتصفح: http://localhost:3000"
    echo "  2. جرّب تسجيل الدخول"
    echo "  3. اختبر لوحات التحكم"
    echo "  4. جرّب البث المباشر"
    echo ""
fi

echo "=========================================="
echo "📚 ملفات المساعدة"
echo "=========================================="
echo ""
echo "  - دليل التشغيل: ⚡_ابدأ_التشغيل_النهائي.md"
echo "  - دليل الاختبار: TESTING_CHECKLIST.md"
echo "  - حل المشاكل: TROUBLESHOOTING_AR.md"
echo "  - البث المباشر: LIVE_STREAMING_GUIDE_AR.md"
echo ""
echo "=========================================="
echo "✨ انتهى الاختبار"
echo "=========================================="

exit $EXIT_CODE
