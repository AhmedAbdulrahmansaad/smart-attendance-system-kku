import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ExternalLink, CheckCircle2, Copy } from 'lucide-react';
import { Button } from './ui/button';

export function SupabaseSetupGuide() {
  const configFilePath = '/config/supabase.config.ts';
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#006747]">
            🚀 مرحباً بك في نظام الحضور الذكي
          </h1>
          <p className="text-lg text-gray-600">
            خطوة واحدة فقط لتشغيل النظام!
          </p>
        </div>

        {/* Main Alert */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-lg">
            <strong>⚠️ انتباه:</strong> النظام يحتاج إلى إعداد Supabase أولاً
          </AlertDescription>
        </Alert>

        {/* Step 1: Get Supabase Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-[#006747] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg">
                1
              </span>
              احصل على مفاتيح Supabase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-gray-700">اتبع هذه الخطوات:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                <li>اذهب إلى <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#006747] underline inline-flex items-center gap-1">
                  https://supabase.com/dashboard <ExternalLink className="w-3 h-3" />
                </a></li>
                <li>سجل دخول أو أنشئ حساب جديد (مجاني)</li>
                <li>اضغط "New Project"</li>
                <li>املأ المعلومات:
                  <ul className="list-disc list-inside mr-6 mt-1">
                    <li>Name: <code className="bg-white px-2 py-1 rounded">kku-attendance</code> (أو أي اسم)</li>
                    <li>Database Password: اختر كلمة سر قوية واحفظها</li>
                    <li>Region: اختر الأقرب (مثل West EU)</li>
                  </ul>
                </li>
                <li>اضغط "Create new project"</li>
                <li>انتظر 2-3 دقائق حتى يجهز المشروع</li>
                <li>اضغط Settings (⚙️) → API</li>
                <li>انسخ:
                  <ul className="list-disc list-inside mr-6 mt-1">
                    <li><strong>Project URL</strong></li>
                    <li><strong>anon public key</strong> (المفتاح الطويل)</li>
                  </ul>
                </li>
              </ol>
            </div>

            <Button 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="w-full bg-[#006747] hover:bg-[#005030]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              افتح Supabase Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Add Keys to Config File */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-[#006747] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg">
                2
              </span>
              أضف المفاتيح في ملف الإعدادات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                <strong>📁 افتح الملف:</strong> <code className="bg-white px-2 py-1 rounded">{configFilePath}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mr-2"
                  onClick={() => copyToClipboard(configFilePath)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto" dir="ltr">
              <pre>{`export const supabaseConfig = {
  // 👇 استبدل هذه القيم
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-public-key-here',
};`}</pre>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">استبدل:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code className="bg-gray-100 px-2 py-1 rounded">https://your-project-id.supabase.co</code> بـ Project URL الذي نسخته</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">your-anon-public-key-here</code> بـ anon public key الذي نسخته</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Save and Reload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-[#006747] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg">
                3
              </span>
              احفظ وأعد تحميل الصفحة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>احفظ ملف <code className="bg-gray-100 px-2 py-1 rounded">/config/supabase.config.ts</code></li>
              <li>أعد تحميل هذه الصفحة (F5 أو Ctrl+R)</li>
              <li>إذا كانت المفاتيح صحيحة، سترى لوحة التحكم!</li>
            </ol>

            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#006747] hover:bg-[#005030]"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              أنا جاهز! أعد تحميل الصفحة
            </Button>
          </CardContent>
        </Card>

        {/* Security Warning */}
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription>
            <strong>⚠️ تحذير أمني:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>لا تشارك مفاتيح Supabase مع أحد</li>
              <li>قبل رفع المشروع على GitHub، احذف المفاتيح من <code className="bg-white px-1 rounded">/config/supabase.config.ts</code></li>
              <li>للنشر على Vercel، استخدم Environment Variables بدلاً من الملف</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>💡 تحتاج مساعدة؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">اقرأ الملفات التالية للمزيد من التفاصيل:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><code className="bg-gray-100 px-2 py-1 rounded">START_HERE.md</code> - دليل البداية</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">QUICK_START.md</code> - بداية سريعة</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">ERROR_FIXED.md</code> - حل المشاكل</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
