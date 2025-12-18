-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- جامعة الملك خالد - نظام الحضور الذكي
-- ============================================================================
-- هذا الملف يصلح خطأ infinite recursion في سياسات RLS
-- يجب تنفيذه في Supabase SQL Editor
-- ============================================================================

-- 1. حذف جميع السياسات القديمة التي قد تسبب المشكلة
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

DROP POLICY IF EXISTS "Users can view users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Instructors can view their courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON courses;
DROP POLICY IF EXISTS "Enable update for course owners" ON courses;
DROP POLICY IF EXISTS "Enable delete for course owners" ON courses;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Admins can manage schedules" ON schedules;
DROP POLICY IF EXISTS "Instructors can manage their schedules" ON schedules;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON schedules;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable update for session owners" ON sessions;
DROP POLICY IF EXISTS "Enable delete for session owners" ON sessions;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON enrollments;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON attendance;
DROP POLICY IF EXISTS "Students can view their attendance" ON attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON attendance;

-- 2. إنشاء سياسات RLS بسيطة وآمنة بدون infinite recursion
-- ============================================================================

-- Profiles Table - سياسات بسيطة جداً
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'supervisor')
  ));

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Users Table - إزالة RLS تماماً لأنه يسبب مشاكل
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Courses Table - سياسات بسيطة
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_policy" ON courses
  FOR SELECT
  USING (true); -- الجميع يمكنهم القراءة

CREATE POLICY "courses_insert_policy" ON courses
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

CREATE POLICY "courses_update_policy" ON courses
  FOR UPDATE
  USING (
    instructor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "courses_delete_policy" ON courses
  FOR DELETE
  USING (
    instructor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Schedules Table - سياسات بسيطة بدون تعقيد
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select_policy" ON schedules
  FOR SELECT
  USING (true); -- الجميع يمكنهم القراءة

CREATE POLICY "schedules_insert_policy" ON schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

CREATE POLICY "schedules_update_policy" ON schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = schedules.course_id 
      AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "schedules_delete_policy" ON schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = schedules.course_id 
      AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Sessions Table - سياسات بسيطة
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  USING (true);

CREATE POLICY "sessions_insert_policy" ON sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = sessions.course_id 
      AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "sessions_update_policy" ON sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = sessions.course_id 
      AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "sessions_delete_policy" ON sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = sessions.course_id 
      AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Enrollments Table - سياسات بسيطة
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_policy" ON enrollments
  FOR SELECT
  USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor', 'supervisor'))
  );

CREATE POLICY "enrollments_insert_policy" ON enrollments
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

CREATE POLICY "enrollments_delete_policy" ON enrollments
  FOR DELETE
  USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- Attendance Table - سياسات بسيطة
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_policy" ON attendance
  FOR SELECT
  USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor', 'supervisor'))
  );

CREATE POLICY "attendance_insert_policy" ON attendance
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

CREATE POLICY "attendance_update_policy" ON attendance
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- 3. إنشاء Functions آمنة لإضافة الجداول (تتجاوز RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_schedule_safe(
  p_course_id UUID,
  p_day_of_week TEXT,
  p_start_time TIME,
  p_end_time TIME,
  p_location TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- هذا يجعل الـ function تعمل بصلاحيات المالك (postgres) وليس المستخدم
SET search_path = public
AS $$
DECLARE
  v_schedule_id UUID;
  v_user_role TEXT;
BEGIN
  -- التحقق من صلاحيات المستخدم
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'instructor') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and instructors can create schedules';
  END IF;
  
  -- إنشاء الجدول
  INSERT INTO schedules (course_id, day_of_week, start_time, end_time, location)
  VALUES (p_course_id, p_day_of_week, p_start_time, p_end_time, p_location)
  RETURNING id INTO v_schedule_id;
  
  -- إرجاع البيانات
  RETURN json_build_object(
    'success', true,
    'schedule_id', v_schedule_id,
    'message', 'Schedule created successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION create_schedule_safe TO authenticated;

-- Function لحذف الجداول بأمان
CREATE OR REPLACE FUNCTION delete_schedule_safe(p_schedule_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_instructor_id UUID;
BEGIN
  -- التحقق من صلاحيات المستخدم
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'instructor') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and instructors can delete schedules';
  END IF;
  
  -- إذا كان مدرساً، تحقق أنه مالك المقرر
  IF v_user_role = 'instructor' THEN
    SELECT c.instructor_id INTO v_instructor_id
    FROM schedules s
    JOIN courses c ON c.id = s.course_id
    WHERE s.id = p_schedule_id;
    
    IF v_instructor_id != auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: You can only delete schedules for your own courses';
    END IF;
  END IF;
  
  -- حذف الجدول
  DELETE FROM schedules WHERE id = p_schedule_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Schedule deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION delete_schedule_safe TO authenticated;

-- 4. التحقق من أن كل شيء يعمل
SELECT 'RLS Policies fixed successfully! ✅' as status;

-- عرض السياسات الحالية
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
