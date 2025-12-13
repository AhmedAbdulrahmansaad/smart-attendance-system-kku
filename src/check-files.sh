#!/bin/bash

# 📂 فحص الملفات المطلوبة
# Check Required Files

echo "=================================================="
echo "📂 فحص ملفات المشروع"
echo "Checking Project Files"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MISSING=0
FOUND=0

# Function to check file
check_file() {
    local file=$1
    local desc=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $desc"
        echo -e "   ${BLUE}$file${NC}"
        ((FOUND++))
    else
        echo -e "${RED}❌${NC} $desc - MISSING!"
        echo -e "   ${RED}$file${NC}"
        ((MISSING++))
    fi
    echo ""
}

echo -e "${YELLOW}=== Frontend Files ===${NC}"
echo ""

check_file "App.tsx" "Main App Component"
check_file "utils/api.ts" "API Utilities"
check_file "utils/supabase/info.tsx" "Supabase Config"
check_file "components/AuthContext.tsx" "Auth Context"
check_file "components/LoginPage.tsx" "Login Page"
check_file "components/LandingPage.tsx" "Landing Page"

echo -e "${YELLOW}=== Backend Files ===${NC}"
echo ""

check_file "supabase/functions/server/index.tsx" "Edge Function (Main)"
check_file "database_schema.sql" "Database Schema"

echo -e "${YELLOW}=== Deployment Files ===${NC}"
echo ""

check_file "deploy-complete.sh" "Deployment Script"
check_file "verify-setup.sh" "Verification Script"
check_file "check-files.sh" "Files Check Script (this)"

echo -e "${YELLOW}=== Documentation Files ===${NC}"
echo ""

check_file "⚡_ابدأ_هنا_الآن_START_HERE_NOW.md" "Quick Start Guide (AR/EN)"
check_file "🎯_ابدأ_من_هنا_فوراً.md" "Instant Start Guide (AR)"
check_file "README_DEPLOYMENT_AR.md" "Deployment Guide (AR)"
check_file "✅_تقرير_الإصلاحات_الكاملة.md" "Fixes Report (AR)"

echo "=================================================="
echo -e "${BLUE}📊 Summary / الملخص${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}Found: $FOUND files${NC}"
echo -e "${RED}Missing: $MISSING files${NC}"
echo ""

if [ $MISSING -eq 0 ]; then
    echo "=================================================="
    echo -e "${GREEN}✅ جميع الملفات موجودة!${NC}"
    echo -e "${GREEN}All files are present!${NC}"
    echo "=================================================="
    echo ""
    echo -e "${BLUE}الخطوة التالية / Next Step:${NC}"
    echo ""
    echo "شغّل سكربت النشر / Run deployment script:"
    echo -e "${YELLOW}./deploy-complete.sh${NC}"
    echo ""
    exit 0
else
    echo "=================================================="
    echo -e "${RED}⚠️  بعض الملفات مفقودة!${NC}"
    echo -e "${RED}Some files are missing!${NC}"
    echo "=================================================="
    echo ""
    echo -e "${YELLOW}يرجى التأكد من تحميل جميع ملفات المشروع${NC}"
    echo -e "${YELLOW}Please ensure all project files are downloaded${NC}"
    echo ""
    exit 1
fi
