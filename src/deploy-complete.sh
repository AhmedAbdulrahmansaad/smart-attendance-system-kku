#!/bin/bash

# 🚀 سكربت النشر الكامل لنظام الحضور الذكي
# Complete Deployment Script for Smart Attendance System

echo "=================================================="
echo "🎓 نظام الحضور الذكي - جامعة الملك خالد"
echo "Smart Attendance System - King Khalid University"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="pcymgqdjbdklrikdquih"
SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ"

echo -e "${BLUE}📋 خطوات النشر / Deployment Steps:${NC}"
echo "1. تحقق من Supabase CLI"
echo "2. ربط المشروع"
echo "3. تعيين المتغيرات البيئية"
echo "4. نشر Edge Function"
echo "5. اختبار الاتصال"
echo ""

# Step 1: Check Supabase CLI
echo -e "${YELLOW}[1/5] 🔍 التحقق من Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI غير مثبت!${NC}"
    echo -e "${YELLOW}📦 قم بتثبيته باستخدام:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

SUPABASE_VERSION=$(supabase --version)
echo -e "${GREEN}✅ Supabase CLI مثبت: $SUPABASE_VERSION${NC}"
echo ""

# Step 2: Link Project
echo -e "${YELLOW}[2/5] 🔗 ربط المشروع...${NC}"
echo "Project ID: $PROJECT_ID"

# Check if already linked
if [ -f ".supabase/config.toml" ]; then
    echo -e "${GREEN}✅ المشروع مرتبط بالفعل${NC}"
else
    echo -e "${BLUE}📝 يرجى تسجيل الدخول إذا طُلب منك...${NC}"
    supabase link --project-ref $PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم ربط المشروع بنجاح${NC}"
    else
        echo -e "${RED}❌ فشل ربط المشروع${NC}"
        echo -e "${YELLOW}💡 تحقق من:${NC}"
        echo "   - أنك مسجل دخول: supabase login"
        echo "   - Project ID صحيح: $PROJECT_ID"
        exit 1
    fi
fi
echo ""

# Step 3: Set Environment Variables
echo -e "${YELLOW}[3/5] 🔐 تعيين المتغيرات البيئية...${NC}"

# Check if SERVICE_ROLE_KEY is set
echo -e "${BLUE}⚠️  يرجى إدخال SERVICE_ROLE_KEY:${NC}"
echo "   احصل عليه من: https://supabase.com/dashboard/project/$PROJECT_ID/settings/api"
echo "   (انسخ 'service_role' key - NOT anon key)"
echo ""
read -p "Service Role Key: " SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SERVICE_ROLE_KEY مطلوب!${NC}"
    exit 1
fi

echo -e "${BLUE}📝 تعيين المتغيرات...${NC}"

supabase secrets set SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_ANON_KEY="$ANON_KEY" \
    SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم تعيين المتغيرات البيئية${NC}"
else
    echo -e "${RED}❌ فشل تعيين المتغيرات البيئية${NC}"
    exit 1
fi
echo ""

# Step 4: Deploy Edge Function
echo -e "${YELLOW}[4/5] 🚀 نشر Edge Function...${NC}"
echo "Deploying function: server"

supabase functions deploy server

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم نشر Edge Function بنجاح${NC}"
else
    echo -e "${RED}❌ فشل نشر Edge Function${NC}"
    echo -e "${YELLOW}💡 تحقق من:${NC}"
    echo "   - ملف /supabase/functions/server/index.tsx موجود"
    echo "   - صلاحيات الوصول صحيحة"
    exit 1
fi
echo ""

# Step 5: Test Connection
echo -e "${YELLOW}[5/5] 🧪 اختبار الاتصال...${NC}"
echo "Testing endpoint: $SUPABASE_URL/functions/v1/make-server-90ad488b/health"

RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/make-server-90ad488b/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo -e "${BLUE}Response Code: $HTTP_CODE${NC}"
echo -e "${BLUE}Response Body:${NC}"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Edge Function يعمل بنجاح!${NC}"
else
    echo -e "${YELLOW}⚠️  تحذير: استجابة غير متوقعة (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}   قد تحتاج إلى بضع ثوانٍ للتفعيل الكامل${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 اكتمل النشر!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📊 الخطوات التالية:${NC}"
echo ""
echo "1. تنفيذ SQL Schema:"
echo "   - افتح: https://supabase.com/dashboard/project/$PROJECT_ID/sql"
echo "   - انسخ محتوى /database_schema.sql وألصقه"
echo "   - اضغط Run"
echo ""
echo "2. اختبار النظام:"
echo "   - افتح التطبيق في المتصفح"
echo "   - حاول إنشاء حساب جديد"
echo "   - تسجيل الدخول"
echo ""
echo "3. التحقق من البيانات:"
echo "   - Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "   - Table Editor: https://supabase.com/dashboard/project/$PROJECT_ID/editor"
echo ""
echo -e "${GREEN}✨ النظام جاهز للاستخدام!${NC}"
echo ""
echo "=================================================="