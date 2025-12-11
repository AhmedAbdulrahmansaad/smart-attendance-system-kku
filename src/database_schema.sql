-- =====================================================
-- نظام الحضور الذكي - جامعة الملك خالد
-- Smart Attendance System - King Khalid University
-- Database Schema (SQL)
-- =====================================================

-- تفعيل UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. جدول المستخدمين (Profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'supervisor')),
  university_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث حسب الدور
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index لتسريع البحث حسب الرقم الجامعي
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);

-- =====================================================
-- 2. جدول المقررات (Courses)
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL UNIQUE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث حسب المدرس
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);

-- =====================================================
-- 3. جدول التسجيل في المقررات (Enrollments)
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Index لتسريع البحث حسب الطالب
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);

-- Index لتسريع البحث حسب المقرر
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- =====================================================
-- 4. جدول الجلسات (Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  session_type TEXT DEFAULT 'attendance' CHECK (session_type IN ('attendance', 'live')),
  title TEXT,
  description TEXT,
  stream_active BOOLEAN DEFAULT false,
  viewers_count INTEGER DEFAULT 0
);

-- Index لتسريع البحث حسب المقرر
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);

-- Index لتسريع البحث حسب الكود
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);

-- Index لتسريع البحث حسب الحالة
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(active);

-- =====================================================
-- 5. جدول الحضور (Attendance)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_fingerprint TEXT,
  ip_address TEXT,
  UNIQUE(student_id, session_id)
);

-- Index لتسريع البحث حسب الطالب
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

-- Index لتسريع البحث حسب الجلسة
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);

-- Index لتسريع البحث حسب المقرر
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);

-- Index لتسريع البحث حسب الحالة
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- =====================================================
-- 6. جدول الجداول الدراسية (Schedules)
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث حسب المقرر
CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);

-- Index لتسريع البحث حسب اليوم
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);

-- =====================================================
-- 7. View لإحصائيات الحضور (Attendance Summary)
-- =====================================================
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
  c.id AS course_id,
  c.course_name,
  c.course_code,
  COUNT(DISTINCT e.student_id) AS total_students,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS total_present,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS total_absent,
  ROUND(
    CASE 
      WHEN COUNT(a.id) > 0 
      THEN (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::NUMERIC / COUNT(a.id)::NUMERIC) * 100 
      ELSE 0 
    END, 
    2
  ) AS attendance_rate
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN sessions s ON c.id = s.course_id
LEFT JOIN attendance a ON s.id = a.session_id
GROUP BY c.id, c.course_name, c.course_code;

-- =====================================================
-- 8. Row Level Security (RLS) Policies
-- =====================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- سياسة للـ Admin: يمكنه رؤية كل شيء
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- سياسة للمستخدمين: يمكنهم رؤية ملفهم الشخصي فقط
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- سياسة للطلاب: يمكنهم رؤية المقررات المسجلين فيها فقط
CREATE POLICY "Students can view enrolled courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = courses.id
      AND enrollments.student_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- =====================================================
-- 9. Triggers للتحديث التلقائي
-- =====================================================

-- Function للتحديث التلقائي لـ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger على جدول profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger على جدول courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. بيانات أولية للاختبار (Optional)
-- =====================================================

-- يمكنك إضافة بيانات تجريبية هنا إذا أردت
-- ملاحظة: تأكد من تعديل البيانات لتكون حقيقية حسب متطلبات الدكتورة

-- مثال: إضافة Admin
-- INSERT INTO profiles (id, email, full_name, role, university_id)
-- VALUES (
--   gen_random_uuid(),
--   'admin@kku.edu.sa',
--   'مدير النظام',
--   'admin',
--   NULL
-- );

-- =====================================================
-- تم بنجاح! ✨
-- يمكنك الآن تشغيل هذا الملف في Supabase SQL Editor
-- =====================================================

-- التحقق من إنشاء الجداول
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- التحقق من Indexes
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;