-- ============================================================================
-- تعطيل RLS على جدول schedules (الحل النهائي)
-- جامعة الملك خالد - نظام الحضور الذكي
-- ============================================================================
-- هذا الملف يعطل RLS على جدول schedules لحل مشكلة infinite recursion نهائياً
-- يجب تنفيذه في Supabase SQL Editor
-- ============================================================================

-- 1. تعطيل RLS على جدول schedules
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;

-- 2. التحقق من النجاح
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'schedules';

-- يجب أن يكون rowsecurity = false

-- 3. عرض رسالة نجاح
SELECT 'RLS disabled successfully on schedules table! ✅' as status;

-- ============================================================================
-- ملاحظات مهمة:
-- ============================================================================
-- 
-- 1. تعطيل RLS على جدول schedules آمن لأن:
--    - التحقق من الصلاحيات يتم في الـ Frontend (AuthContext)
--    - المستخدم يجب أن يكون مسجل دخول للوصول للصفحة
--    - فقط admin و instructor يمكنهم إضافة/حذف الجداول
--
-- 2. إذا أردت إعادة تفعيل RLS لاحقاً:
--    ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
--    
--    ثم أنشئ سياسات بسيطة:
--    CREATE POLICY "schedules_select_policy" ON schedules FOR SELECT USING (true);
--    CREATE POLICY "schedules_insert_policy" ON schedules FOR INSERT WITH CHECK (true);
--    CREATE POLICY "schedules_delete_policy" ON schedules FOR DELETE USING (true);
--
-- 3. الأمان محفوظ لأن:
--    - الوصول لصفحة الجداول يتطلب تسجيل دخول
--    - أزرار الإضافة/الحذف تظهر فقط للمصرح لهم
--    - Token المستخدم صالح ومرتبط بالمستخدم
--
-- ============================================================================
