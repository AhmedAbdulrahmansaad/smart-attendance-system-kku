#!/bin/bash

# 🔍 سكربت التحقق من الإعدادات
# Setup Verification Script

echo "=================================================="
echo "🔍 التحقق من إعدادات النظام"
echo "Setup Verification for Smart Attendance System"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="pcymgqdjbdklrikdquih"
SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"

PASSED=0
FAILED=0

echo -e "${BLUE}🔍 بدء الفحص...${NC}"
echo ""

# Check 1: Supabase CLI
echo -e "${YELLOW}[1/6] التحقق من Supabase CLI...${NC}"
if command -v supabase &> /dev/null; then
    VERSION=$(supabase --version)
    echo -e "${GREEN}✅ Supabase CLI مثبت: $VERSION${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Supabase CLI غير مثبت${NC}"
    echo -e "${YELLOW}💡 قم بتثبيته: npm install -g supabase${NC}"
    ((FAILED++))
fi
echo ""

# Check 2: Project Files
echo -e "${YELLOW}[2/6] التحقق من ملفات المشروع...${NC}"
FILES_OK=true

if [ ! -f "utils/api.ts" ]; then
    echo -e "${RED}❌ ملف utils/api.ts غير موجود${NC}"
    FILES_OK=false
    ((FAILED++))
fi

if [ ! -f "supabase/functions/server/index.tsx" ]; then
    echo -e "${RED}❌ ملف Edge Function غير موجود${NC}"
    FILES_OK=false
    ((FAILED++))
fi

if [ ! -f "database_schema.sql" ]; then
    echo -e "${RED}❌ ملف database_schema.sql غير موجود${NC}"
    FILES_OK=false
    ((FAILED++))
fi

if [ "$FILES_OK" = true ]; then
    echo -e "${GREEN}✅ جميع الملفات المطلوبة موجودة${NC}"
    ((PASSED++))
fi
echo ""

# Check 3: URL Configuration
echo -e "${YELLOW}[3/6] التحقق من إعدادات URL...${NC}"
if grep -q 'functions/v1/server"' utils/api.ts; then
    echo -e "${GREEN}✅ URL في utils/api.ts صحيح${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ URL في utils/api.ts خاطئ${NC}"
    echo -e "${YELLOW}💡 يجب أن يكون: https://PROJECT_ID.supabase.co/functions/v1/server${NC}"
    ((FAILED++))
fi
echo ""

# Check 4: Edge Function Endpoint
echo -e "${YELLOW}[4/6] التحقق من Edge Function...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/functions/v1/server/health" 2>/dev/null)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Edge Function منشورة وتعمل (HTTP 200)${NC}"
    
    # Get response
    RESPONSE=$(curl -s "$SUPABASE_URL/functions/v1/server/health" 2>/dev/null)
    echo -e "${BLUE}Response:${NC}"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    ((PASSED++))
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${RED}❌ Edge Function غير منشورة (HTTP 404)${NC}"
    echo -e "${YELLOW}💡 قم بنشرها: ./deploy-complete.sh${NC}"
    ((FAILED++))
else
    echo -e "${YELLOW}⚠️  استجابة غير متوقعة (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi
echo ""

# Check 5: Stats Endpoint
echo -e "${YELLOW}[5/6] التحقق من endpoint الإحصائيات...${NC}"
STATS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/functions/v1/server/stats/public" 2>/dev/null)

if [ "$STATS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Stats endpoint يعمل (HTTP 200)${NC}"
    
    STATS_RESPONSE=$(curl -s "$SUPABASE_URL/functions/v1/server/stats/public" 2>/dev/null)
    echo -e "${BLUE}Stats:${NC}"
    echo "$STATS_RESPONSE" | jq . 2>/dev/null || echo "$STATS_RESPONSE"
    ((PASSED++))
else
    echo -e "${RED}❌ Stats endpoint لا يعمل (HTTP $STATS_CODE)${NC}"
    ((FAILED++))
fi
echo ""

# Check 6: Database Connection
echo -e "${YELLOW}[6/6] التحقق من قاعدة البيانات...${NC}"
if [ "$HTTP_CODE" -eq 200 ]; then
    HEALTH=$(curl -s "$SUPABASE_URL/functions/v1/server/health" 2>/dev/null)
    DB_STATUS=$(echo "$HEALTH" | jq -r '.database' 2>/dev/null)
    
    if [ "$DB_STATUS" = "true" ]; then
        echo -e "${GREEN}✅ قاعدة البيانات متصلة${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ قاعدة البيانات غير متصلة${NC}"
        echo -e "${YELLOW}💡 تحقق من تنفيذ SQL Schema${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  لا يمكن التحقق من قاعدة البيانات (Edge Function غير منشورة)${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "=================================================="
echo -e "${BLUE}📊 ملخص الفحص | Summary${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ نجح: $PASSED${NC}"
echo -e "${RED}❌ فشل: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "=================================================="
    echo -e "${GREEN}🎉 ممتاز! النظام جاهز تماماً!${NC}"
    echo -e "${GREEN}Excellent! System is fully ready!${NC}"
    echo "=================================================="
    echo ""
    echo -e "${BLUE}الخطوات التالية:${NC}"
    echo "1. افتح التطبيق في المتصفح"
    echo "2. جرب إنشاء حساب جديد"
    echo "3. سجل الدخول"
    echo "4. استمتع بالنظام! 🚀"
    exit 0
else
    echo "=================================================="
    echo -e "${YELLOW}⚠️  بعض المشاكل تحتاج إلى إصلاح${NC}"
    echo -e "${YELLOW}Some issues need to be fixed${NC}"
    echo "=================================================="
    echo ""
    echo -e "${BLUE}الإجراءات المقترحة:${NC}"
    
    if [ "$HTTP_CODE" -ne 200 ]; then
        echo -e "${YELLOW}1. نشر Edge Function:${NC}"
        echo "   ./deploy-complete.sh"
        echo ""
    fi
    
    if [ "$DB_STATUS" != "true" ]; then
        echo -e "${YELLOW}2. تنفيذ SQL Schema:${NC}"
        echo "   - افتح: https://supabase.com/dashboard/project/$PROJECT_ID/sql"
        echo "   - انسخ محتوى database_schema.sql"
        echo "   - الصقه وشغّل Run"
        echo ""
    fi
    
    echo -e "${YELLOW}3. راجع الدليل الكامل:${NC}"
    echo "   ⚡_ابدأ_هنا_الآن_START_HERE_NOW.md"
    echo ""
    
    exit 1
fi
