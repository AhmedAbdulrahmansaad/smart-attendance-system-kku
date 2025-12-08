/**
 * ⚙️ Supabase Configuration Example
 * 
 * ⚠️ هام: قم بنسخ هذا الملف إلى supabase.config.ts وأضف مفاتيحك الحقيقية
 * 
 * كيفية الحصول على المفاتيح:
 * 1. اذهب إلى: https://supabase.com/dashboard
 * 2. اختر مشروعك (أو أنشئ مشروع جديد)
 * 3. Settings → API
 * 4. انسخ:
 *    • Project URL → ضعه في SUPABASE_URL
 *    • anon public key → ضعه في SUPABASE_ANON_KEY
 */

export const supabaseConfig = {
  // 👇 استبدل هذه القيم بمفاتيحك الحقيقية من Supabase Dashboard
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-public-key-here',
};

/**
 * ⚠️ تحذيرات أمنية:
 * 
 * ✅ للاختبار المحلي: انسخ هذا الملف إلى supabase.config.ts وعدّله
 * ❌ لا ترفع المفاتيح الحقيقية على GitHub
 * ✅ للنشر على Vercel/Production: استخدم Environment Variables
 * 
 * للنشر الآمن على Vercel:
 * 1. في Vercel Dashboard → Settings → Environment Variables
 * 2. أضف VITE_SUPABASE_URL
 * 3. أضف VITE_SUPABASE_ANON_KEY
 * 4. أضف SUPABASE_SERVICE_ROLE_KEY (للـ Backend فقط)
 */
