#!/bin/bash

# 🚀 نشر سريع للنظام - Quick Deploy Script
# King Khalid University Smart Attendance System
# يستغرق 3 دقائق فقط - Takes only 3 minutes

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 King Khalid University - Smart Attendance System"
echo "🚀 Quick Deployment Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# التحقق من Supabase CLI
echo "📦 Step 1/4: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Supabase CLI"
        echo "💡 Try manually: npm install -g supabase"
        exit 1
    fi
    echo "✅ Supabase CLI installed successfully!"
else
    echo "✅ Supabase CLI already installed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Step 2/4: Login to Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 سيتم فتح المتصفح - ادخل على Supabase وسجل الدخول"
echo "💡 Browser will open - Login to Supabase"
echo ""

supabase login

if [ $? -ne 0 ]; then
    echo "❌ Login failed!"
    echo "💡 Try again: supabase login"
    exit 1
fi

echo "✅ Login successful!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Step 3/4: Linking to Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project ID: pcymgqdjbdklrikdquih"
echo ""

supabase link --project-ref pcymgqdjbdklrikdquih

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project!"
    echo ""
    echo "💡 Enter your database password when prompted"
    echo "💡 You can find it in Supabase Dashboard > Settings > Database"
    exit 1
fi

echo "✅ Project linked successfully!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 4/4: Deploying Edge Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Function name: server"
echo "Path: /supabase/functions/server/"
echo ""

supabase functions deploy server --no-verify-jwt

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    echo ""
    echo "💡 Common issues:"
    echo "   1. Check if database password is correct"
    echo "   2. Make sure you're connected to internet"
    echo "   3. Try again: supabase functions deploy server --no-verify-jwt"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Edge Function deployed successfully!"
echo ""
echo "Edge Function URL:"
echo "https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Test the backend:"
echo "   curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health"
echo ""
echo "2. 📊 Setup database schema:"
echo "   psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -d postgres -U postgres.pcymgqdjbdklrikdquih -f database_schema.sql"
echo ""
echo "3. 🌐 Start your application:"
echo "   npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ تم النشر بنجاح! يمكنك الآن استخدام النظام بكامل ميزاته!"
echo "✨ Deployment complete! You can now use the system with all features!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
