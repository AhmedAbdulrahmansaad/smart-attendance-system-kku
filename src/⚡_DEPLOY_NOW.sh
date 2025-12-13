#!/bin/bash

# ========================================
# 🚀 نشر سريع - Quick Deploy
# نظام الحضور الذكي - جامعة الملك خالد
# ========================================

echo ""
echo "🔥 =========================================="
echo "🚀 نشر Edge Function السريع"
echo "   Quick Edge Function Deployment"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ID="pcymgqdjbdklrikdquih"
SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"

# ========================================
# Step 1: Check Supabase CLI
# ========================================
echo -e "${CYAN}[1/5] 🔍 التحقق من Supabase CLI...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI غير مثبت!${NC}"
    echo ""
    echo -e "${YELLOW}📦 قم بتثبيته:${NC}"
    echo ""
    echo "npm install -g supabase"
    echo ""
    echo -e "${YELLOW}أو على macOS:${NC}"
    echo "brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

VERSION=$(supabase --version)
echo -e "${GREEN}✅ مثبت: $VERSION${NC}"
echo ""

# ========================================
# Step 2: Login Check
# ========================================
echo -e "${CYAN}[2/5] 🔐 التحقق من تسجيل الدخول...${NC}"

if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✅ مسجل دخول${NC}"
else
    echo -e "${YELLOW}📝 فتح المتصفح لتسجيل الدخول...${NC}"
    supabase login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ فشل تسجيل الدخول${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ تم تسجيل الدخول${NC}"
fi
echo ""

# ========================================
# Step 3: Link Project
# ========================================
echo -e "${CYAN}[3/5] 🔗 ربط المشروع...${NC}"
echo "Project ID: $PROJECT_ID"

if supabase status &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ المشروع مرتبط${NC}"
else
    echo -e "${YELLOW}📝 ربط المشروع...${NC}"
    supabase link --project-ref $PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم الربط${NC}"
    else
        echo -e "${RED}❌ فشل الربط${NC}"
        echo ""
        echo -e "${YELLOW}💡 تأكد من:${NC}"
        echo "   1. Project ID صحيح"
        echo "   2. لديك صلاحية الوصول للمشروع"
        echo ""
        exit 1
    fi
fi
echo ""

# ========================================
# Step 4: Set Secrets
# ========================================
echo -e "${CYAN}[4/5] 🔑 تعيين Environment Variables...${NC}"
echo ""
echo -e "${BLUE}⚠️  احصل على Service Role Key من:${NC}"
echo "https://supabase.com/dashboard/project/$PROJECT_ID/settings/api"
echo ""
echo -e "${RED}⚠️  مهم: انسخ 'service_role' key (ليس anon key!)${NC}"
echo ""
echo -e "${YELLOW}اضغط Enter إذا كانت Secrets معينة مسبقاً...${NC}"
read -p "Service Role Key (أو Enter للتخطي): " SERVICE_ROLE_KEY

if [ ! -z "$SERVICE_ROLE_KEY" ]; then
    echo ""
    echo -e "${BLUE}📝 تعيين Secrets...${NC}"
    
    supabase secrets set \
        SUPABASE_URL="$SUPABASE_URL" \
        SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ" \
        SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم تعيين Secrets${NC}"
    else
        echo -e "${RED}❌ فشل تعيين Secrets${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  تم تخطي تعيين Secrets (يفترض أنها معينة مسبقاً)${NC}"
fi
echo ""

# ========================================
# Step 5: Deploy Function
# ========================================
echo -e "${CYAN}[5/5] 🚀 نشر Edge Function...${NC}"
echo "Function: server"
echo "Path: supabase/functions/server"
echo ""
echo -e "${YELLOW}⏳ جاري النشر... (قد يستغرق 10-30 ثانية)${NC}"
echo ""

supabase functions deploy server --no-verify-jwt

DEPLOY_EXIT_CODE=$?

echo ""

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ✅ ✅ نجح النشر! ✅ ✅ ✅${NC}"
    echo ""
    
    # Wait for function to be ready
    echo -e "${YELLOW}⏳ انتظار 5 ثوانٍ لتفعيل Function...${NC}"
    sleep 5
    echo ""
    
    # Test the function
    echo -e "${CYAN}🧪 اختبار Edge Function...${NC}"
    echo "URL: $SUPABASE_URL/functions/v1/make-server-90ad488b/health"
    echo ""
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/health")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo -e "${BLUE}HTTP Status: $HTTP_CODE${NC}"
    echo ""
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}🎉 ============================================${NC}"
        echo -e "${GREEN}   ✅ النشر ناجح! Backend يعمل!${NC}"
        echo -e "${GREEN}   ✅ Deployment Successful! Backend is up!${NC}"
        echo -e "${GREEN}============================================${NC}"
        echo ""
        echo -e "${BLUE}Response:${NC}"
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
        echo ""
        echo ""
        echo -e "${CYAN}📋 الخطوات التالية:${NC}"
        echo ""
        echo -e "${YELLOW}1. تطبيق Database Schema (إذا لم يتم بعد):${NC}"
        echo "   • افتح: https://supabase.com/dashboard/project/$PROJECT_ID/sql"
        echo "   • انسخ محتوى database_schema.sql"
        echo "   • الصقه في SQL Editor واضغط Run"
        echo ""
        echo -e "${YELLOW}2. ابدأ التطوير:${NC}"
        echo "   npm run dev"
        echo ""
        echo -e "${YELLOW}3. أو اختبر النظام:${NC}"
        echo "   ./test-complete-system.sh"
        echo ""
        echo -e "${YELLOW}4. راجع Logs إذا لزم:${NC}"
        echo "   https://supabase.com/dashboard/project/$PROJECT_ID/functions/server/logs"
        echo ""
        
    elif [ "$HTTP_CODE" -eq 404 ]; then
        echo -e "${YELLOW}⚠️  ============================================${NC}"
        echo -e "${YELLOW}   Function منشور لكن يحتاج وقتاً إضافياً${NC}"
        echo -e "${YELLOW}============================================${NC}"
        echo ""
        echo "انتظر 30-60 ثانية ثم اختبر:"
        echo ""
        echo "curl $SUPABASE_URL/functions/v1/make-server-90ad488b/health"
        echo ""
        
    else
        echo -e "${YELLOW}⚠️  استجابة غير متوقعة (HTTP $HTTP_CODE)${NC}"
        echo ""
        echo -e "${BLUE}Response:${NC}"
        echo "$BODY"
        echo ""
        echo "انتظر قليلاً ثم اختبر يدوياً."
        echo ""
    fi
    
else
    echo -e "${RED}❌ ============================================${NC}"
    echo -e "${RED}   فشل النشر!${NC}"
    echo -e "${RED}   Deployment Failed!${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo -e "${YELLOW}💡 الحلول المحتملة:${NC}"
    echo ""
    echo "1. تحقق من ملف index.tsx:"
    echo "   supabase/functions/server/index.tsx"
    echo ""
    echo "2. تحقق من syntax errors:"
    echo "   deno check supabase/functions/server/index.tsx"
    echo ""
    echo "3. راجع Logs:"
    echo "   supabase functions logs server"
    echo ""
    echo "4. جرب النشر يدوياً مع verbose:"
    echo "   supabase functions deploy server --debug"
    echo ""
    exit 1
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 انتهى السكربت!${NC}"
echo "============================================"
echo ""
