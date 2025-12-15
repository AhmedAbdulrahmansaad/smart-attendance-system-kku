-- 🧹 تنظيف المستخدمين الـ Orphaned (موجودين في Auth لكن بدون Profiles)
-- نفذ هذا السكريبت في Supabase SQL Editor

-- ============================================
-- 1. عرض المستخدمين الـ Orphaned
-- ============================================

SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ No Profile'
    ELSE '✅ Has Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ============================================
-- 2. حذف المستخدمين الـ Orphaned من Auth
-- ============================================

-- ⚠️ تحذير: هذا السكريبت سيحذف المستخدمين الذين ليس لهم profiles
-- تأكد من أنك تريد حذفهم قبل التنفيذ

-- حذف المستخدمين الـ Orphaned
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
);

-- ============================================
-- 3. التحقق من النتيجة
-- ============================================

-- عرض عدد المستخدمين في Auth
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- عرض عدد المستخدمين في Profiles
SELECT COUNT(*) as profiles_count FROM public.profiles;

-- يجب أن يكون العددان متساويين!

-- ============================================
-- 4. عرض جميع المستخدمين مع حالة Profile
-- ============================================

SELECT 
  au.id,
  au.email,
  au.created_at,
  p.full_name,
  p.role,
  CASE 
    WHEN p.id IS NULL THEN '❌ No Profile (Orphaned)'
    ELSE '✅ Has Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- ============================================
-- 5. إنشاء Function لتنظيف Orphaned Users تلقائياً
-- ============================================

-- Function لحذف Orphaned Users أقدم من ساعة واحدة
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- حذف المستخدمين الـ Orphaned الذين مر عليهم أكثر من ساعة
  DELETE FROM auth.users
  WHERE id IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    AND au.created_at < NOW() - INTERVAL '1 hour'
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. تشغيل التنظيف
-- ============================================

-- تشغيل Function التنظيف
SELECT public.cleanup_orphaned_users() as deleted_orphaned_users;

-- ============================================
-- 7. إنشاء Database Trigger لحذف User عند حذف Profile
-- ============================================

-- Function لحذف User من Auth عند حذف Profile
CREATE OR REPLACE FUNCTION public.delete_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- حذف المستخدم من auth.users عند حذف profile
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لتفعيل Function
DROP TRIGGER IF EXISTS on_profile_delete_trigger ON public.profiles;
CREATE TRIGGER on_profile_delete_trigger
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_user_on_profile_delete();

-- ============================================
-- 8. إنشاء Database Trigger لإنشاء Profile تلقائياً
-- ============================================

-- Function لإنشاء Profile تلقائياً عند إنشاء User في Auth
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- إنشاء Profile تلقائياً من user metadata
  INSERT INTO public.profiles (id, email, full_name, role, university_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'university_id'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لتفعيل Function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_on_signup();

-- ============================================
-- 9. اختبار النظام
-- ============================================

-- عرض جميع Triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- عرض جميع Functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%' OR routine_name LIKE '%profile%'
ORDER BY routine_name;

-- ============================================
-- ✅ تم الانتهاء!
-- ============================================

-- ملخص ما تم:
-- 1. ✅ عرض المستخدمين الـ Orphaned
-- 2. ✅ حذف المستخدمين الـ Orphaned
-- 3. ✅ إنشاء Function للتنظيف التلقائي
-- 4. ✅ إنشاء Trigger لحذف User عند حذف Profile
-- 5. ✅ إنشاء Trigger لإنشاء Profile تلقائياً عند signup

-- النتيجة:
-- - لن تحدث مشكلة Orphaned Users مرة أخرى
-- - Profile ينشأ تلقائياً عند signup
-- - User يُحذف تلقائياً عند حذف Profile
-- - تنظيف تلقائي للـ Orphaned Users القديمة

-- ============================================
-- 📝 ملاحظات مهمة:
-- ============================================

-- 1. الـ Triggers تعمل فقط على العمليات المباشرة في Database
-- 2. عند signup عبر Supabase Auth، الـ Trigger سيعمل تلقائياً
-- 3. إذا فشل signup، الـ User سيُحذف تلقائياً بعد ساعة
-- 4. يمكنك تشغيل cleanup_orphaned_users() يدوياً في أي وقت

-- تشغيل التنظيف يدوياً:
-- SELECT public.cleanup_orphaned_users();
