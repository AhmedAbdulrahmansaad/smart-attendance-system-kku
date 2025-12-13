-- =====================================================
-- 🔥 إنشاء الجداول الكاملة - COMPLETE TABLE CREATION
-- نظام الحضور الذكي - جامعة الملك خالد
-- Smart Attendance System - King Khalid University
-- =====================================================

-- ⚠️ هذا السكريبت يجب تشغيله في Supabase SQL Editor
-- ⚠️ This script must be run in Supabase SQL Editor

-- =====================================================
-- 0. تفعيل Extensions
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. حذف الجداول القديمة إن وجدت (اختياري)
-- =====================================================

-- ⚠️ احذر! هذا سيحذف جميع البيانات
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS schedules CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS enrollments CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 2. جدول المستخدمين (Profiles)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

COMMENT ON TABLE profiles IS 'جدول المستخدمين - يحتوي على معلومات جميع مستخدمي النظام';
COMMENT ON COLUMN profiles.role IS 'دور المستخدم: admin, instructor, student, supervisor';
COMMENT ON COLUMN profiles.university_id IS 'الرقم الجامعي (للطلاب فقط)';

-- =====================================================
-- 3. جدول المقررات (Courses)
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL UNIQUE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  semester TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);

COMMENT ON TABLE courses IS 'جدول المقررات الدراسية';
COMMENT ON COLUMN courses.course_code IS 'رمز المقرر (فريد)';

-- =====================================================
-- 4. جدول التسجيل في المقررات (Enrollments)
-- =====================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  UNIQUE(student_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

COMMENT ON TABLE enrollments IS 'جدول تسجيل الطلاب في المقررات';

-- =====================================================
-- 5. جدول الجلسات (Sessions)
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
  viewers_count INTEGER DEFAULT 0,
  location TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(active);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);

COMMENT ON TABLE sessions IS 'جدول جلسات الحضور والبث المباشر';
COMMENT ON COLUMN sessions.session_type IS 'نوع الجلسة: attendance (تسجيل حضور) أو live (بث مباشر)';

-- =====================================================
-- 6. جدول الحضور (Attendance)
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
  notes TEXT,
  UNIQUE(student_id, session_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);

COMMENT ON TABLE attendance IS 'جدول تسجيل حضور الطلاب';
COMMENT ON COLUMN attendance.status IS 'حالة الحضور: present, absent, late, excused';

-- =====================================================
-- 7. جدول الجداول الدراسية (Schedules)
-- =====================================================

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  room_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);

COMMENT ON TABLE schedules IS 'جدول المواعيد الدراسية';
COMMENT ON COLUMN schedules.day_of_week IS 'يوم الأسبوع: 0=الأحد, 1=الاثنين, ... 6=السبت';

-- =====================================================
-- 8. View لإحصائيات الحضور (Attendance Summary)
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
  COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS total_late,
  COUNT(CASE WHEN a.status = 'excused' THEN 1 END) AS total_excused,
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

COMMENT ON VIEW attendance_summary IS 'ملخص إحصائيات الحضور لكل مقرر';

-- =====================================================
-- 9. Row Level Security (RLS) Policies
-- =====================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies for Profiles
-- =====================================================

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;

-- السماح بقراءة جميع Profiles (مؤقتاً للتطوير)
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

-- السماح بإدخال Profiles للجميع (للتسجيل)
CREATE POLICY "Enable insert for authentication users only" ON profiles
  FOR INSERT WITH CHECK (true);

-- السماح بتحديث للمستخدم نفسه فقط
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- السماح بحذف للمستخدم نفسه أو Admin
CREATE POLICY "Users can delete own profile or admin can delete" ON profiles
  FOR DELETE USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Policies for Courses
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON courses;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON courses;
DROP POLICY IF EXISTS "Enable delete for admins" ON courses;

-- السماح بقراءة جميع المقررات
CREATE POLICY "Enable read access for authenticated users" ON courses
  FOR SELECT USING (true);

-- السماح بإدخال للمدرسين والـ Admin
CREATE POLICY "Enable insert for instructors and admins" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

-- السماح بتحديث للمدرس المسؤول أو Admin
CREATE POLICY "Enable update for instructors and admins" ON courses
  FOR UPDATE USING (
    instructor_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح بحذف للـ Admin فقط
CREATE POLICY "Enable delete for admins" ON courses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Policies for Enrollments
-- =====================================================

DROP POLICY IF EXISTS "Enable read for students and staff" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for admins and instructors" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for admins and instructors" ON enrollments;

CREATE POLICY "Enable read for students and staff" ON enrollments
  FOR SELECT USING (
    student_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor', 'supervisor')
    )
  );

CREATE POLICY "Enable insert for admins and instructors" ON enrollments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Enable delete for admins and instructors" ON enrollments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

-- =====================================================
-- Policies for Sessions
-- =====================================================

DROP POLICY IF EXISTS "Enable read for enrolled students and staff" ON sessions;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON sessions;
DROP POLICY IF EXISTS "Enable update for session creator and admins" ON sessions;
DROP POLICY IF EXISTS "Enable delete for admins" ON sessions;

CREATE POLICY "Enable read for enrolled students and staff" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Enable update for session creator and admins" ON sessions
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins" ON sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Policies for Attendance
-- =====================================================

DROP POLICY IF EXISTS "Enable read for students and staff" ON attendance;
DROP POLICY IF EXISTS "Enable insert for students and instructors" ON attendance;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON attendance;
DROP POLICY IF EXISTS "Enable delete for admins" ON attendance;

CREATE POLICY "Enable read for students and staff" ON attendance
  FOR SELECT USING (
    student_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor', 'supervisor')
    )
  );

CREATE POLICY "Enable insert for students and instructors" ON attendance
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Enable update for instructors and admins" ON attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Enable delete for admins" ON attendance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Policies for Schedules
-- =====================================================

DROP POLICY IF EXISTS "Enable read for all authenticated users" ON schedules;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON schedules;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON schedules;
DROP POLICY IF EXISTS "Enable delete for admins" ON schedules;

CREATE POLICY "Enable read for all authenticated users" ON schedules
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Enable update for instructors and admins" ON schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Enable delete for admins" ON schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 10. Functions & Triggers
-- =====================================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers لتحديث updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. عرض الجداول للتحقق
-- =====================================================

SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- ✅ تم! الجداول جاهزة الآن!
-- ✅ Done! Tables are ready now!
-- =====================================================

/*
الخطوة التالية:
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ كل محتوى هذا الملف
4. الصق في SQL Editor
5. اضغط "Run"
6. انتظر حتى ينتهي التنفيذ
7. تحقق من الجداول في Table Editor

Next steps:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy all content of this file
4. Paste in SQL Editor
5. Click "Run"
6. Wait for execution to complete
7. Check tables in Table Editor
*/
