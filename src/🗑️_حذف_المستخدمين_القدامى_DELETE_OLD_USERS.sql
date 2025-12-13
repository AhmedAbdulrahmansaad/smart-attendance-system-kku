-- ╔═══════════════════════════════════════════════════════════╗
-- ║                                                           ║
-- ║  🗑️ حذف المستخدمين القدامى - Delete Old Users 🗑️       ║
-- ║                                                           ║
-- ║     استخدم هذا السكريبت لحذف المستخدمين القدامى        ║
-- ║     Use this script to delete old users                  ║
-- ║                                                           ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ⚠️ تحذير / Warning:
-- هذا السكريبت يحذف جميع البيانات من جدول profiles
-- This script deletes all data from profiles table
-- استخدمه فقط إذا كنت متأكداً!
-- Use it only if you're sure!

-- ═══════════════════════════════════════════════════════════
--  الخيار 1: حذف الكل (Fresh Start)
-- ═══════════════════════════════════════════════════════════

-- حذف جميع المستخدمين من جدول profiles
-- Delete all users from profiles table

TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE device_fingerprints CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE live_sessions CASCADE;
TRUNCATE TABLE courses CASCADE;

-- بعد هذا، سيكون النظام نظيفاً تماماً
-- After this, the system will be completely clean

-- ═══════════════════════════════════════════════════════════
--  الخيار 2: حذف مستخدم محدد (Specific User)
-- ═══════════════════════════════════════════════════════════

-- إذا أردت حذف مستخدم محدد فقط، استخدم هذا:
-- If you want to delete a specific user only, use this:

/*
-- استبدل 'admin@kku.edu.sa' بالبريد الذي تريد حذفه
-- Replace 'admin@kku.edu.sa' with the email you want to delete

DELETE FROM device_fingerprints 
WHERE user_id IN (SELECT id FROM profiles WHERE email = 'admin@kku.edu.sa');

DELETE FROM enrollments 
WHERE student_id IN (SELECT id FROM profiles WHERE email = 'admin@kku.edu.sa');

DELETE FROM attendance 
WHERE student_id IN (SELECT id FROM profiles WHERE email = 'admin@kku.edu.sa');

DELETE FROM profiles 
WHERE email = 'admin@kku.edu.sa';
*/

-- ═══════════════════════════════════════════════════════════
--  الخيار 3: حذف المستخدمين غير المكتملين فقط
-- ═══════════════════════════════════════════════════════════

-- إذا أردت حذف المستخدمين الذين ليس لهم profiles فقط:
-- If you want to delete users without profiles only:

/*
-- هذا لن يعمل من SQL Editor لأن auth.users محمي
-- This won't work from SQL Editor because auth.users is protected

-- لكن يمكنك حذف profiles بدون بيانات كاملة:
-- But you can delete profiles without complete data:

DELETE FROM profiles 
WHERE full_name IS NULL 
   OR role IS NULL 
   OR email IS NULL;
*/

-- ═══════════════════════════════════════════════════════════
--  التحقق من النتيجة - Verify Result
-- ═══════════════════════════════════════════════════════════

-- بعد التنفيذ، شغّل هذا للتحقق:
-- After execution, run this to verify:

DO $$
DECLARE
    profiles_count INTEGER;
    courses_count INTEGER;
    sessions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    SELECT COUNT(*) INTO courses_count FROM courses;
    SELECT COUNT(*) INTO sessions_count FROM sessions;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '║  🗑️ تم الحذف بنجاح! Deleted Successfully! 🗑️          ║';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 البيانات المتبقية / Remaining Data:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '👥 المستخدمين / Users:        %', profiles_count;
    RAISE NOTICE '📚 المقررات / Courses:        %', courses_count;
    RAISE NOTICE '📅 الجلسات / Sessions:        %', sessions_count;
    RAISE NOTICE '';
    
    IF profiles_count = 0 THEN
        RAISE NOTICE '✅ النظام نظيف تماماً! System is completely clean!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 الخطوات التالية / Next Steps:';
        RAISE NOTICE '';
        RAISE NOTICE '1️⃣ أعد تحميل الصفحة (F5)';
        RAISE NOTICE '   Reload page (F5)';
        RAISE NOTICE '';
        RAISE NOTICE '2️⃣ سجل حساب مدير جديد:';
        RAISE NOTICE '   Register new admin account:';
        RAISE NOTICE '   • البريد: admin@kku.edu.sa';
        RAISE NOTICE '   • الاسم: مدير النظام';
        RAISE NOTICE '   • الدور: Admin';
        RAISE NOTICE '';
        RAISE NOTICE '3️⃣ ابدأ استخدام النظام!';
        RAISE NOTICE '   Start using the system!';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE 'ℹ️ بعض البيانات لا تزال موجودة';
        RAISE NOTICE '   Some data still exists';
        RAISE NOTICE '';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════
--  ملاحظات مهمة - Important Notes
-- ═══════════════════════════════════════════════════════════

/*
📝 ملاحظات / Notes:

1️⃣ هذا السكريبت يحذف البيانات من قاعدة البيانات فقط
   This script deletes data from database only
   
2️⃣ لحذف من auth.users، يجب استخدام Dashboard:
   To delete from auth.users, use Dashboard:
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/auth/users
   
3️⃣ أو تعطيل Email Confirmation لتجنب المشكلة:
   Or disable Email Confirmation to avoid the issue:
   Authentication → Settings → Disable "Enable email confirmations"
   
4️⃣ بعد الحذف، سجل حسابات جديدة بدون مشاكل! ✅
   After deletion, register new accounts without issues! ✅

🎯 الهدف / Purpose:
   - تنظيف البيانات القديمة / Clean old data
   - إزالة المستخدمين المكررين / Remove duplicate users
   - بداية جديدة نظيفة / Fresh clean start

⚠️ تحذير / Warning:
   - هذا الإجراء لا يمكن التراجع عنه!
   - This action cannot be undone!
   - استخدمه بحذر! / Use carefully!

💚 نصيحة / Tip:
   - احفظ نسخة احتياطية قبل الحذف
   - Save a backup before deletion
   - أو ببساطة: شغّله بثقة! النظام للتطوير 😊
   - Or simply: run it confidently! It's a dev system 😊
*/
