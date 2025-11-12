/**
 * ⚙️ Supabase Configuration
 * 
 * ⚠️ هام: قم بتعديل هذا الملف وأضف مفاتيح Supabase الخاصة بك
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
  SUPABASE_URL: 'https://pcymgqdjbdklrikdquih.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ',
};

/**
 * ⚠️ تحذيرات أمنية:
 * 
 * ✅ للاختبار في Figma Make: عدّل هذا الملف مباشرة
 * ❌ قبل رفع على GitHub: احذف المفاتيح من هذا الملف
 * ✅ للنشر على Vercel: استخدم Environment Variables بدلاً من هذا الملف
 * 
 * للنشر الآمن على Vercel:
 * 1. أعد المفاتيح في هذا الملف إلى القيم الافتراضية
 * 2. في Vercel Dashboard → Settings → Environment Variables
 * 3. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
 */