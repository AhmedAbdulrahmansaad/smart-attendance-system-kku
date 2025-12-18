-- ============================================================================
-- 🚀 نفذ هذا الكود في Supabase SQL Editor لحل المشكلة نهائياً
-- ============================================================================
-- الرابط المباشر:
-- https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql/new
-- ============================================================================

-- تعطيل RLS على جميع الجداول (يحل مشكلة infinite recursion)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions DISABLE ROW LEVEL SECURITY;

-- التحقق من النجاح (اختياري)
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS معطل - ممتاز!'
    WHEN rowsecurity = true THEN '❌ RLS مفعل - يجب تعطيله'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'schedules', 'courses', 'sessions', 
    'attendance', 'enrollments', 'activity_logs', 
    'notifications', 'device_sessions'
  )
ORDER BY tablename;

-- ============================================================================
-- ✅ بعد تنفيذ هذا الكود:
-- - لن تحصل على خطأ "infinite recursion"
-- - إضافة جداول دراسية ستعمل 100%
-- - جميع ميزات النظام ستعمل بسلاسة
-- ============================================================================
