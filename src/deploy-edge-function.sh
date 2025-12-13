#!/bin/bash

# 🚀 سكربت نشر Edge Function فقط
# Deploy Edge Function Only Script

echo "=================================================="
echo "🔥 نشر Edge Function - جامعة الملك خالد"
echo "Deploy Edge Function - King Khalid University"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID="pcymgqdjbdklrikdquih"
SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ"

# Step 1: Check Supabase CLI
echo -e "${YELLOW}[1/6] 🔍 التحقق من Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI غير مثبت!${NC}"
    echo -e "${YELLOW}📦 قم بتثبيته باستخدام:${NC}"
    echo "npm install -g supabase"
    echo ""
    echo -e "${YELLOW}أو على macOS:${NC}"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

SUPABASE_VERSION=$(supabase --version)
echo -e "${GREEN}✅ Supabase CLI مثبت: $SUPABASE_VERSION${NC}"
echo ""

# Step 2: Login
echo -e "${YELLOW}[2/6] 🔐 التحقق من تسجيل الدخول...${NC}"
echo -e "${BLUE}إذا لم تكن مسجل دخول، سيفتح المتصفح تلقائياً...${NC}"

# Check if already logged in
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✅ مسجل دخول بالفعل${NC}"
else
    echo -e "${YELLOW}📝 يرجى تسجيل الدخول...${NC}"
    supabase login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ فشل تسجيل الدخول${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ تم تسجيل الدخول بنجاح${NC}"
fi
echo ""

# Step 3: Link Project
echo -e "${YELLOW}[3/6] 🔗 ربط المشروع...${NC}"
echo "Project ID: $PROJECT_ID"

# Check if already linked
if supabase status &> /dev/null; then
    echo -e "${GREEN}✅ المشروع مرتبط بالفعل${NC}"
else
    echo -e "${BLUE}📝 ربط المشروع...${NC}"
    supabase link --project-ref $PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم ربط المشروع بنجاح${NC}"
    else
        echo -e "${RED}❌ فشل ربط المشروع${NC}"
        echo -e "${YELLOW}💡 تحقق من أن Project ID صحيح${NC}"
        exit 1
    fi
fi
echo ""

# Step 4: Get Service Role Key
echo -e "${YELLOW}[4/6] 🔑 تعيين Environment Variables...${NC}"
echo ""
echo -e "${BLUE}⚠️  احصل على Service Role Key من:${NC}"
echo "https://supabase.com/dashboard/project/$PROJECT_ID/settings/api"
echo ""
echo -e "${RED}⚠️  تحذير: انسخ 'service_role' key وليس 'anon' key!${NC}"
echo ""
read -p "Service Role Key: " SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Service Role Key مطلوب!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 تعيين المتغيرات البيئية...${NC}"

supabase secrets set \
    SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_ANON_KEY="$ANON_KEY" \
    SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم تعيين المتغيرات البيئية بنجاح${NC}"
else
    echo -e "${RED}❌ فشل تعيين المتغيرات البيئية${NC}"
    exit 1
fi
echo ""

# Step 5: Deploy Edge Function
echo -e "${YELLOW}[5/6] 🚀 نشر Edge Function...${NC}"
echo "Function name: server"
echo "Path: /supabase/functions/server/index.tsx"
echo ""

supabase functions deploy server

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ تم نشر Edge Function بنجاح!${NC}"
else
    echo ""
    echo -e "${RED}❌ فشل نشر Edge Function${NC}"
    echo -e "${YELLOW}💡 تحقق من:${NC}"
    echo "   - ملف /supabase/functions/server/index.tsx موجود"
    echo "   - الملف لا يحتوي على أخطاء syntax"
    exit 1
fi
echo ""

# Step 6: Test Connection
echo -e "${YELLOW}[6/6] 🧪 اختبار Edge Function...${NC}"
echo ""
echo "Testing endpoint: $SUPABASE_URL/functions/v1/make-server-90ad488b/health"
echo ""
echo -e "${BLUE}انتظار 5 ثوانٍ للتأكد من تفعيل Function...${NC}"
sleep 5
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo -e "${BLUE}HTTP Status: $HTTP_CODE${NC}"
echo ""
echo -e "${BLUE}Response:${NC}"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}=================================================="
    echo "✅ نجح النشر! Edge Function يعمل بشكل صحيح"
    echo "=================================================="
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}📊 الخطوات التالية:${NC}"
    echo ""
    echo "1. تطبيق SQL Schema:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID/sql"
    echo "   (انسخ محتوى /database_schema.sql والصقه ثم Run)"
    echo ""
    echo "2. افتح التطبيق واختبر النظام"
    echo ""
    echo "3. راجع اللوغ إذا واجهت مشاكل:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID/functions/server/logs"
    echo ""
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${RED}=================================================="
    echo "❌ خطأ 404: Edge Function غير موجود"
    echo "=================================================="
    echo -e "${NC}"
    echo ""
    echo -e "${YELLOW}💡 احتمالات:${NC}"
    echo "1. Function لم يتم تفعيله بعد (انتظر دقيقة وأعد الاختبار)"
    echo "2. اسم Function غير صحيح"
    echo "3. مشكلة في النشر"
    echo ""
    echo "أعد تشغيل السكربت بعد دقيقة:"
    echo "./deploy-edge-function.sh"
else
    echo -e "${YELLOW}=================================================="
    echo "⚠️  تحذير: استجابة غير متوقعة (HTTP $HTTP_CODE)"
    echo "=================================================="
    echo -e "${NC}"
    echo ""
    echo "قد يحتاج Function لبضع ثوانٍ إضافية للتفعيل الكامل."
    echo "أعد الاختبار بعد دقيقة:"
    echo ""
    echo "curl $SUPABASE_URL/functions/v1/make-server-90ad488b/health"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 انتهى السكربت"
echo "=================================================="
echo -e "${NC}"