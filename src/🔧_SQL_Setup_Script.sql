-- 🔧 SQL Setup Script for KKU Smart Attendance System
-- نفذ هذا السكريبت في Supabase SQL Editor

-- ============================================
-- 1. إنشاء جدول profiles (إذا لم يكن موجوداً)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'supervisor')),
  university_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. إنشاء جدول courses
-- ============================================

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. إنشاء جدول sessions
-- ============================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN DEFAULT false,
  stream_active BOOLEAN DEFAULT false,
  meeting_url TEXT,
  attendance_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. إنشاء جدول enrollments (تسجيل الطلاب في المقررات)
-- ============================================

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ============================================
-- 5. إنشاء جدول attendance (سجل الحضور)
-- ============================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  UNIQUE(session_id, student_id)
);

-- ============================================
-- 6. تفعيل Row Level Security (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. إنشاء RLS Policies - Profiles
-- ============================================

-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- السماح للجميع بقراءة Profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

-- السماح للمستخدمين بإنشاء profiles الخاصة بهم
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- السماح للمستخدمين بتحديث profiles الخاصة بهم
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 8. إنشاء RLS Policies - Courses
-- ============================================

DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;

-- السماح للجميع بقراءة المقررات
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT USING (true);

-- السماح للمدرسين والمسؤولين بإنشاء مقررات
CREATE POLICY "courses_insert_policy" ON public.courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('instructor', 'admin')
    )
  );

-- السماح للمدرسين بتحديث مقرراتهم
CREATE POLICY "courses_update_policy" ON public.courses
  FOR UPDATE USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 9. إنشاء RLS Policies - Sessions
-- ============================================

DROP POLICY IF EXISTS "sessions_select_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON public.sessions;

-- السماح للجميع بقراءة الجلسات
CREATE POLICY "sessions_select_policy" ON public.sessions
  FOR SELECT USING (true);

-- السماح للمدرسين بإنشاء جلسات
CREATE POLICY "sessions_insert_policy" ON public.sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('instructor', 'admin')
    )
  );

-- السماح للمدرسين بتحديث جلساتهم
CREATE POLICY "sessions_update_policy" ON public.sessions
  FOR UPDATE USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 10. إنشاء RLS Policies - Enrollments
-- ============================================

DROP POLICY IF EXISTS "enrollments_select_policy" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_policy" ON public.enrollments;

-- السماح للجميع بقراءة التسجيلات
CREATE POLICY "enrollments_select_policy" ON public.enrollments
  FOR SELECT USING (true);

-- السماح للطلاب بالتسجيل في المقررات
CREATE POLICY "enrollments_insert_policy" ON public.enrollments
  FOR INSERT WITH CHECK (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- ============================================
-- 11. إنشاء RLS Policies - Attendance
-- ============================================

DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;

-- السماح للجميع بقراءة الحضور
CREATE POLICY "attendance_select_policy" ON public.attendance
  FOR SELECT USING (true);

-- السماح للطلاب بتسجيل حضورهم
CREATE POLICY "attendance_insert_policy" ON public.attendance
  FOR INSERT WITH CHECK (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- ============================================
-- 12. إنشاء Indexes للأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles(university_id);

CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);

CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON public.sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_instructor_id ON public.sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON public.sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);

-- ============================================
-- 13. إنشاء Function لتحديث updated_at تلقائياً
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. إنشاء Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 15. إدراج بيانات تجريبية (اختياري)
-- ============================================

-- ملاحظة: هذه البيانات للاختبار فقط
-- يمكنك حذف هذا القسم إذا كنت تريد بيانات حقيقية فقط

-- إدراج مقرر تجريبي (سيتم ربطه بالمدرس بعد تسجيل الدخول)
INSERT INTO public.courses (code, name, name_en)
VALUES ('CS300', 'برمجة متقدمة', 'Advanced Programming')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.courses (code, name, name_en)
VALUES ('MATH101', 'رياضيات عامة', 'General Mathematics')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ✅ تم الانتهاء!
-- ============================================

-- تحقق من الجداول
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- تحقق من RLS Policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
