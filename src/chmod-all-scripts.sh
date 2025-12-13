#!/bin/bash

# 🔧 تفعيل جميع السكربتات
# Enable All Scripts

echo "=================================================="
echo "🔧 تفعيل جميع السكربتات"
echo "Enabling All Scripts"
echo "=================================================="
echo ""

# List of scripts
SCRIPTS=(
    "deploy-edge-function.sh"
    "deploy-complete.sh"
    "test-edge-function.sh"
    "verify-setup.sh"
    "deploy.sh"
    "check-files.sh"
    "chmod-scripts.sh"
    "chmod-all-scripts.sh"
)

echo "📋 السكربتات المتاحة:"
echo ""

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        echo "✅ $script"
    else
        echo "⚠️  $script (غير موجود)"
    fi
done

echo ""
echo "=================================================="
echo "✅ تم تفعيل جميع السكربتات بنجاح!"
echo "All scripts enabled successfully!"
echo "=================================================="
echo ""
echo "الآن يمكنك تشغيل أي سكربت:"
echo ""
echo "  ./deploy-edge-function.sh    - لنشر Edge Function"
echo "  ./test-edge-function.sh      - لاختبار Edge Function"
echo "  ./deploy-complete.sh         - للنشر الكامل"
echo "  ./verify-setup.sh            - للتحقق من النظام"
echo ""
