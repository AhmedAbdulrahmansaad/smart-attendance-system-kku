-- ============================================
-- ✅ INSPECT AND FIX - فحص وإصلاح شامل
-- ============================================
-- هذا السكريبت يفحص البنية الحقيقية ويصلح بناءً عليها

-- ============================================
-- 1️⃣ فحص البنية الحقيقية للجداول
-- ============================================

-- فحص جدول sessions
SELECT 
    'sessions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- فحص جدول attendance
SELECT 
    'attendance' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- فحص جدول enrollments
SELECT 
    'enrollments' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'enrollments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- فحص جدول courses
SELECT 
    'courses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- فحص جدول profiles
SELECT 
    'profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 2️⃣ عرض جميع الجداول الموجودة
-- ============================================

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
