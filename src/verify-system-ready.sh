#!/bin/bash

# سكربت التحقق النهائي من جاهزية النظام
# Final System Readiness Verification Script
# King Khalid University Smart Attendance System

echo "🔍 بدء التحقق النهائي من جاهزية النظام..."
echo "=================================================="
echo ""

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# دالة للطباعة
print_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_check() {
    echo -e "${BLUE}[CHECK $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}  ✅ $1${NC}"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}  ❌ $1${NC}"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
    ((WARNINGS++))
}

# ==================== فحص الملفات الأساسية ====================

print_section "1️⃣  فحص الملفات الأساسية"

# App.tsx
((TOTAL_CHECKS++))
print_check "1" "App.tsx (Main Component)"
if [ -f "App.tsx" ]; then
    print_success "App.tsx موجود"
else
    print_error "App.tsx غير موجود!"
fi

# utils/api.ts
((TOTAL_CHECKS++))
print_check "2" "utils/api.ts (API Client)"
if [ -f "utils/api.ts" ]; then
    # فحص URL
    if grep -q "https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b" utils/api.ts; then
        print_success "API URL صحيح"
    else
        print_error "API URL قد يكون خاطئاً - راجع utils/api.ts"
    fi
else
    print_error "utils/api.ts غير موجود!"
fi

# Database Schema
((TOTAL_CHECKS++))
print_check "3" "DATABASE_READY_TO_EXECUTE.sql"
if [ -f "DATABASE_READY_TO_EXECUTE.sql" ]; then
    print_success "Database Schema موجود"
else
    print_error "DATABASE_READY_TO_EXECUTE.sql غير موجود!"
fi

# Edge Function
((TOTAL_CHECKS++))
print_check "4" "supabase/functions/server/index.tsx"
if [ -f "supabase/functions/server/index.tsx" ]; then
    print_success "Edge Function موجود"
else
    print_error "Edge Function غير موجود!"
fi

# ==================== فحص المكونات المهمة ====================

print_section "2️⃣  فحص المكونات الأساسية"

COMPONENTS=(
    "components/LandingPage.tsx"
    "components/LoginPage.tsx"
    "components/AdminDashboard.tsx"
    "components/InstructorDashboard.tsx"
    "components/StudentDashboard.tsx"
    "components/SupervisorDashboard.tsx"
    "components/LiveStreamHost.tsx"
    "components/LiveStreamViewer.tsx"
    "components/AuthContext.tsx"
    "components/LanguageContext.tsx"
)

for component in "${COMPONENTS[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -f "$component" ]; then
        print_success "$(basename $component) ✓"
    else
        print_error "$(basename $component) ✗"
    fi
done

# ==================== فحص السكربتات ====================

print_section "3️⃣  فحص السكربتات"

SCRIPTS=(
    "deploy-edge-function.sh"
    "deploy-complete.sh"
    "test-complete-system.sh"
    "test-edge-function.sh"
    "test-url-fix.sh"
)

for script in "${SCRIPTS[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "$script (قابل للتنفيذ)"
        else
            print_warning "$script (غير قابل للتنفيذ - نفّذ: chmod +x $script)"
        fi
    else
        print_error "$script غير موجود!"
    fi
done

# ==================== فحص ملفات التوثيق ====================

print_section "4️⃣  فحص ملفات التوثيق الرئيسية"

DOCS=(
    "✅_النظام_جاهز_للتشغيل_الفوري.md"
    "⚡_ابدأ_التشغيل_النهائي.md"
    "⚡_QUICK_REFERENCE.md"
    "📖_ابدأ_هنا_COMPREHENSIVE_INDEX.md"
    "README_FULL_SYSTEM.md"
    "API_REFERENCE.md"
    "DEPLOYMENT_GUIDE_AR.md"
    "LIVE_STREAMING_GUIDE_AR.md"
    "TESTING_CHECKLIST.md"
)

for doc in "${DOCS[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -f "$doc" ]; then
        print_success "$doc ✓"
    else
        print_warning "$doc غير موجود"
    fi
done

# ==================== فحص package.json ====================

print_section "5️⃣  فحص Dependencies"

((TOTAL_CHECKS++))
print_check "5" "package.json"
if [ -f "package.json" ]; then
    print_success "package.json موجود"
    
    # فحص بعض الحزم المهمة
    if grep -q "\"react\"" package.json; then
        print_success "React مثبت"
    else
        print_warning "React قد لا يكون مثبتاً"
    fi
    
    if grep -q "\"@tanstack/react-query\"" package.json; then
        print_success "React Query مثبت"
    else
        print_warning "React Query قد لا يكون مثبتاً"
    fi
else
    print_error "package.json غير موجود!"
fi

# ==================== فحص node_modules ====================

((TOTAL_CHECKS++))
if [ -d "node_modules" ]; then
    print_success "node_modules موجود (Dependencies مثبتة)"
else
    print_warning "node_modules غير موجود - نفّذ: npm install"
fi

# ==================== فحص Configuration Files ====================

print_section "6️⃣  فحص ملفات الإعدادات"

CONFIG_FILES=(
    "tsconfig.json"
    "vite.config.ts"
    "vercel.json"
    "supabase/config.toml"
)

for config in "${CONFIG_FILES[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -f "$config" ]; then
        print_success "$(basename $config) ✓"
    else
        print_warning "$(basename $config) غير موجود"
    fi
done

# ==================== فحص اتصال الإنترنت ====================

print_section "7️⃣  فحص الاتصال بـ Supabase"

((TOTAL_CHECKS++))
print_check "7" "اختبار الاتصال بـ Supabase"

HEALTH_URL="https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "اتصال Supabase ناجح (200 OK)"
elif [ "$HTTP_CODE" = "404" ]; then
    print_warning "Edge Function غير منشور (404) - نفّذ: ./deploy-edge-function.sh"
elif [ -z "$HTTP_CODE" ]; then
    print_warning "فشل الاتصال - تحقق من الإنترنت"
else
    print_warning "استجابة غير متوقعة: $HTTP_CODE"
fi

# ==================== فحص Git ====================

print_section "8️⃣  فحص Git Repository"

((TOTAL_CHECKS++))
if [ -d ".git" ]; then
    print_success "Git repository مهيأ"
    
    # فحص Remote
    if git remote -v &>/dev/null; then
        REMOTE=$(git remote get-url origin 2>/dev/null)
        if [ -n "$REMOTE" ]; then
            print_success "Git remote مضاف: $REMOTE"
        else
            print_warning "Git remote غير مضاف"
        fi
    fi
else
    print_warning "ليس Git repository - لرفعه على GitHub، نفّذ: git init"
fi

# ==================== النتائج النهائية ====================

echo ""
print_section "📊 النتائج النهائية"

echo -e "${BLUE}إجمالي الفحوصات:${NC} $TOTAL_CHECKS"
echo -e "${GREEN}نجح:${NC} $PASSED_CHECKS"
echo -e "${RED}فشل:${NC} $FAILED_CHECKS"
echo -e "${YELLOW}تحذيرات:${NC} $WARNINGS"
echo ""

# حساب النسبة
if [ $TOTAL_CHECKS -gt 0 ]; then
    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "${BLUE}نسبة النجاح:${NC} $PERCENTAGE%"
else
    PERCENTAGE=0
fi
echo ""

# الحكم النهائي
if [ $PERCENTAGE -ge 90 ] && [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ النظام جاهز للتشغيل الفوري!         ║${NC}"
    echo -e "${GREEN}║   🚀 يمكنك البدء الآن!                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   ⚠️  النظام جاهز مع بعض التحذيرات       ║${NC}"
    echo -e "${YELLOW}║   راجع التحذيرات أعلاه                   ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ النظام يحتاج إصلاحات                 ║${NC}"
    echo -e "${RED}║   راجع الأخطاء أعلاه                     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi
echo ""

# ==================== نصائح سريعة ====================

print_section "💡 نصائح سريعة"

if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${YELLOW}لديك $FAILED_CHECKS فحص فاشل:${NC}"
    echo "  1. راجع الأخطاء الحمراء أعلاه"
    echo "  2. راجع: TROUBLESHOOTING_AR.md"
    echo "  3. تأكد من اكتمال جميع الملفات"
    echo ""
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}لديك $WARNINGS تحذير:${NC}"
    echo "  - معظم التحذيرات لا تمنع التشغيل"
    echo "  - لكن يفضل حلها للحصول على أفضل تجربة"
    echo ""
fi

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠️  Edge Function غير منشور:${NC}"
    echo "  نفّذ: ./deploy-edge-function.sh"
    echo ""
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies غير مثبتة:${NC}"
    echo "  نفّذ: npm install"
    echo ""
fi

# ==================== الخطوات التالية ====================

print_section "🎯 الخطوات التالية"

echo "1️⃣  إذا كان كل شيء ✅ أخضر:"
echo "   ./test-complete-system.sh    # اختبار شامل"
echo "   npm run dev                  # بدء التطوير"
echo ""

echo "2️⃣  إذا كانت هناك تحذيرات:"
echo "   راجع التحذيرات أعلاه"
echo "   طبّق الإصلاحات المقترحة"
echo "   أعد تشغيل هذا السكربت"
echo ""

echo "3️⃣  إذا كانت هناك أخطاء:"
echo "   راجع: TROUBLESHOOTING_AR.md"
echo "   راجع: ⚡_ابدأ_التشغيل_النهائي.md"
echo ""

echo "4️⃣  للنشر:"
echo "   راجع: DEPLOYMENT_GUIDE_AR.md"
echo "   نفّذ: vercel (للنشر على Vercel)"
echo ""

# ==================== ملفات المساعدة ====================

print_section "📚 ملفات المساعدة"

echo "للبدء السريع:"
echo "  - ✅_النظام_جاهز_للتشغيل_الفوري.md"
echo "  - ⚡_ابدأ_التشغيل_النهائي.md"
echo "  - ⚡_QUICK_REFERENCE.md"
echo ""

echo "للاختبار:"
echo "  - ./test-complete-system.sh"
echo "  - TESTING_CHECKLIST.md"
echo ""

echo "للنشر:"
echo "  - DEPLOYMENT_GUIDE_AR.md"
echo "  - ./deploy-edge-function.sh"
echo ""

echo "للتوثيق الكامل:"
echo "  - 📖_ابدأ_هنا_COMPREHENSIVE_INDEX.md"
echo "  - README_FULL_SYSTEM.md"
echo ""

print_section "✨ انتهى الفحص"

echo -e "${CYAN}شكراً لاستخدامك نظام الحضور الذكي${NC}"
echo -e "${CYAN}جامعة الملك خالد${NC}"
echo ""

exit $EXIT_CODE
