-- =====================================================
-- سكربت تنظيف المستخدمين المكررين
-- Cleanup Duplicate Users Script
-- =====================================================
-- 
-- ⚠️ تحذير / WARNING:
-- هذا السكربت سيحذف المستخدمين المكررين من auth.users
-- الذين لديهم profiles في جدول profiles
-- 
-- استخدمه بحذر!
-- Use with caution!
-- 
-- =====================================================

-- 1. عرض المستخدمين المكررين (بدون حذف)
-- Show duplicate users (without deleting)

SELECT 
    email,
    COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- =====================================================

-- 2. عرض تفاصيل المستخدمين المكررين
-- Show details of duplicate users

SELECT 
    u.id,
    u.email,
    u.created_at,
    p.id as profile_id,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN (
    SELECT email
    FROM auth.users
    GROUP BY email
    HAVING COUNT(*) > 1
)
ORDER BY u.email, u.created_at;

-- =====================================================

-- 3. حذف المستخدمين الذين ليس لديهم profiles
-- Delete users without profiles

-- ⚠️ احذف علامات التعليق من السطور التالية إذا كنت متأكداً
-- Uncomment the following lines if you're sure

/*
DELETE FROM auth.users
WHERE id NOT IN (
    SELECT id FROM profiles
);
*/

-- =====================================================

-- 4. حذف profiles بدون auth users (نادر)
-- Delete profiles without auth users (rare)

/*
DELETE FROM profiles
WHERE id NOT IN (
    SELECT id FROM auth.users
);
*/

-- =====================================================

-- 5. إذا كنت تريد البدء من جديد تماماً
-- If you want to start completely fresh

-- ⚠️ خطير جداً! سيحذف جميع البيانات!
-- Very dangerous! Will delete all data!

/*
-- حذف جميع الحضور
TRUNCATE TABLE attendance CASCADE;

-- حذف جميع الجلسات
TRUNCATE TABLE sessions CASCADE;

-- حذف جميع التسجيلات
TRUNCATE TABLE enrollments CASCADE;

-- حذف جميع المقررات
TRUNCATE TABLE courses CASCADE;

-- حذف جميع الملفات الشخصية
DELETE FROM profiles;

-- حذف جميع المستخدمين من Auth
-- (يجب تنفيذه من Dashboard أو عبر API)
*/

-- =====================================================

-- 6. فحص سريع للحالة
-- Quick status check

SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'courses' as table_name,
    COUNT(*) as count
FROM courses
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as count
FROM sessions
UNION ALL
SELECT 
    'attendance' as table_name,
    COUNT(*) as count
FROM attendance;

-- =====================================================

-- 7. عرض آخر 10 مستخدمين تم إنشاؤهم
-- Show last 10 created users

SELECT 
    u.id,
    u.email,
    u.created_at as auth_created,
    p.id as profile_id,
    p.full_name,
    p.role,
    p.university_id,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- نهاية السكربت
-- End of Script
-- =====================================================
