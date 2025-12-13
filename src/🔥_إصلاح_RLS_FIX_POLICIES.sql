-- =====================================================
-- 🔥 إصلاح سياسات RLS - FIX RLS POLICIES
-- حل مشكلة: infinite recursion detected in policy
-- =====================================================

-- ⚠️ شغل هذا في Supabase SQL Editor فوراً!

-- =====================================================
-- 1. حذف جميع السياسات القديمة
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile or admin can delete" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;

-- =====================================================
-- 2. تعطيل RLS مؤقتاً (للاختبار)
-- =====================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. إنشاء سياسات بسيطة بدون recursion
-- =====================================================

-- ⚠️ ملاحظة: لأغراض التطوير، نسمح بالوصول الكامل
-- في الإنتاج، يجب تفعيل RLS مع سياسات أكثر تقييداً

-- =====================================================
-- 4. (اختياري) تفعيل RLS مع سياسات بسيطة
-- =====================================================

-- افتح التعليق أدناه لتفعيل RLS مع سياسات بسيطة
-- بدون استخدام subqueries التي تسبب infinite recursion

/*
-- تفعيل RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Profiles: السماح بالقراءة والكتابة للجميع (للتطوير)
CREATE POLICY "Allow all for profiles" ON profiles
  FOR ALL USING (true);

-- Courses: السماح بالقراءة والكتابة للجميع
CREATE POLICY "Allow all for courses" ON courses
  FOR ALL USING (true);

-- Enrollments: السماح بالقراءة والكتابة للجميع
CREATE POLICY "Allow all for enrollments" ON enrollments
  FOR ALL USING (true);

-- Sessions: السماح بالقراءة والكتابة للجميع
CREATE POLICY "Allow all for sessions" ON sessions
  FOR ALL USING (true);

-- Attendance: السماح بالقراءة والكتابة للجميع
CREATE POLICY "Allow all for attendance" ON attendance
  FOR ALL USING (true);

-- Schedules: السماح بالقراءة والكتابة للجميع
CREATE POLICY "Allow all for schedules" ON schedules
  FOR ALL USING (true);
*/

-- =====================================================
-- ✅ تم! الآن RLS معطل والنظام سيعمل بدون مشاكل
-- =====================================================

-- للتحقق من الجداول:
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'courses', 'enrollments', 'sessions', 'attendance', 'schedules');

-- ✅ يجب أن تكون rowsecurity = false لكل الجداول

-- =====================================================
-- 📝 ملاحظات
-- =====================================================

/*
🔥 المشكلة الأصلية:
   السياسات القديمة كانت تحتوي على:
   
   CREATE POLICY "Admin can view all" ON profiles
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM profiles  -- 🔥 هنا المشكلة!
         WHERE id = auth.uid() AND role = 'admin'
       )
     );
   
   هذا يسبب infinite recursion لأن السياسة تقرأ من
   نفس الجدول الذي تحمي!

✅ الحل:
   تعطيل RLS مؤقتاً للتطوير
   
   في الإنتاج، يمكن استخدام:
   - Service Role Key في Backend
   - سياسات بسيطة بدون subqueries
   - استخدام auth.uid() فقط بدون JOIN
*/
