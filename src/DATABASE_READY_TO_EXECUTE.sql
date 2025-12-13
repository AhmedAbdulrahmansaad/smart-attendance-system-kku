-- =====================================================
-- حذف الجداول القديمة (إذا كانت موجودة)
-- Drop old tables (if exist)
-- =====================================================

-- أولاً: حذف جميع Policies القديمة
-- First: Drop all old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;
DROP POLICY IF EXISTS "Allow all for service role" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "Everyone can view courses" ON courses;
DROP POLICY IF EXISTS "Instructors and admins can create courses" ON courses;
DROP POLICY IF EXISTS "Instructors can update their courses" ON courses;
DROP POLICY IF EXISTS "Allow all for service role" ON courses;
DROP POLICY IF EXISTS "courses_select_policy" ON courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON courses;
DROP POLICY IF EXISTS "courses_update_policy" ON courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON courses;

DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow all for service role" ON enrollments;
DROP POLICY IF EXISTS "enrollments_select_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_delete_policy" ON enrollments;

DROP POLICY IF EXISTS "Everyone can view active sessions" ON sessions;
DROP POLICY IF EXISTS "Instructors can create sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all for service role" ON sessions;
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_delete_policy" ON sessions;

DROP POLICY IF EXISTS "Students can view their attendance" ON attendance;
DROP POLICY IF EXISTS "Students can record their attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all for service role" ON attendance;
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance;
DROP POLICY IF EXISTS "attendance_update_policy" ON attendance;
DROP POLICY IF EXISTS "attendance_delete_policy" ON attendance;

DROP POLICY IF EXISTS "Everyone can view live sessions" ON live_sessions;
DROP POLICY IF EXISTS "Allow all for service role" ON live_sessions;
DROP POLICY IF EXISTS "live_sessions_select_policy" ON live_sessions;
DROP POLICY IF EXISTS "live_sessions_insert_policy" ON live_sessions;
DROP POLICY IF EXISTS "live_sessions_update_policy" ON live_sessions;
DROP POLICY IF EXISTS "live_sessions_delete_policy" ON live_sessions;

DROP POLICY IF EXISTS "Users can view their fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Allow all for service role" ON device_fingerprints;
DROP POLICY IF EXISTS "device_fingerprints_select_policy" ON device_fingerprints;
DROP POLICY IF EXISTS "device_fingerprints_insert_policy" ON device_fingerprints;
DROP POLICY IF EXISTS "device_fingerprints_update_policy" ON device_fingerprints;
DROP POLICY IF EXISTS "device_fingerprints_delete_policy" ON device_fingerprints;

-- ثانياً: حذف الجداول
-- Second: Drop tables
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS live_sessions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS device_fingerprints CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 1. جدول المستخدمين (Profiles)
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'supervisor')),
  university_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_university_id ON profiles(university_id);

-- =====================================================
-- 2. جدول المقررات (Courses)
-- =====================================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_semester ON courses(semester);

-- =====================================================
-- 3. جدول التسجيل في المقررات (Enrollments)
-- =====================================================

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_student_course ON enrollments(student_id, course_id);

-- =====================================================
-- 4. جدول الجلسات (Sessions)
-- =====================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  session_type TEXT NOT NULL CHECK (session_type IN ('qr', 'nfc', 'fingerprint', 'code')),
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_sessions_code ON sessions(session_code);
CREATE INDEX idx_sessions_active ON sessions(is_active);
CREATE INDEX idx_sessions_time ON sessions(start_time, end_time);

-- =====================================================
-- 5. جدول الحضور (Attendance)
-- =====================================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attendance_method TEXT NOT NULL CHECK (attendance_method IN ('qr', 'nfc', 'fingerprint', 'code')),
  location TEXT,
  device_info TEXT,
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_time ON attendance(attendance_time);
CREATE INDEX idx_attendance_session_student ON attendance(session_id, student_id);

-- =====================================================
-- 6. جدول الجلسات المباشرة (Live Sessions)
-- =====================================================

CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_url TEXT NOT NULL,
  room_name TEXT NOT NULL UNIQUE,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  max_participants INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX idx_live_sessions_instructor ON live_sessions(instructor_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_room ON live_sessions(room_name);
CREATE INDEX idx_live_sessions_time ON live_sessions(scheduled_start, scheduled_end);

-- =====================================================
-- 7. جدول بصمات الأجهزة (Device Fingerprints)
-- =====================================================

CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  device_info JSONB,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fingerprint)
);

CREATE INDEX idx_device_fingerprints_user ON device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint);
CREATE INDEX idx_device_fingerprints_active ON device_fingerprints(is_active);

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Views
-- =====================================================

-- View: Course enrollment statistics
CREATE OR REPLACE VIEW course_enrollment_stats AS
SELECT 
  c.id,
  c.course_code,
  c.course_name,
  c.semester,
  c.academic_year,
  p.full_name as instructor_name,
  COUNT(DISTINCT e.student_id) as total_students,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT a.id) as total_attendance_records
FROM courses c
LEFT JOIN profiles p ON c.instructor_id = p.id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN sessions s ON c.id = s.course_id
LEFT JOIN attendance a ON s.id = a.session_id
GROUP BY c.id, c.course_code, c.course_name, c.semester, c.academic_year, p.full_name;

-- View: Student attendance summary
CREATE OR REPLACE VIEW student_attendance_summary AS
SELECT 
  p.id as student_id,
  p.full_name as student_name,
  p.university_id,
  c.id as course_id,
  c.course_code,
  c.course_name,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT a.id) as attended_sessions,
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN ROUND((COUNT(DISTINCT a.id)::NUMERIC / COUNT(DISTINCT s.id)::NUMERIC) * 100, 2)
    ELSE 0
  END as attendance_percentage
FROM profiles p
JOIN enrollments e ON p.id = e.student_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN sessions s ON c.id = s.course_id
LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.university_id, c.id, c.course_code, c.course_name;

-- =====================================================
-- تعطيل RLS تماماً (Disable RLS Completely)
-- =====================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- منح جميع الصلاحيات (Grant All Privileges)
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- رسالة النجاح (Success Message)
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- عد الجداول
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'profiles', 'courses', 'enrollments', 'sessions', 
        'attendance', 'live_sessions', 'device_fingerprints'
      );
    
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '║  ✅ قاعدة البيانات أُنشئت بنجاح!                        ║';
    RAISE NOTICE '║  ✅ Database Created Successfully!                        ║';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات / Statistics:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '  الجداول المنشأة / Tables Created:     %', table_count;
    RAISE NOTICE '  الفهارس / Indexes:                     18+';
    RAISE NOTICE '  الوظائف / Functions:                   1';
    RAISE NOTICE '  العروض / Views:                        2';
    RAISE NOTICE '  المحفزات / Triggers:                   3';
    RAISE NOTICE '  حالة RLS / RLS Status:                 ✅ OFF (معطلة)';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول المتاحة / Available Tables:';
    RAISE NOTICE '  1. profiles              (المستخدمين)';
    RAISE NOTICE '  2. courses               (المقررات)';
    RAISE NOTICE '  3. enrollments           (التسجيل)';
    RAISE NOTICE '  4. sessions              (الجلسات)';
    RAISE NOTICE '  5. attendance            (الحضور)';
    RAISE NOTICE '  6. live_sessions         (الجلسات المباشرة)';
    RAISE NOTICE '  7. device_fingerprints   (بصمات الأجهزة)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 الخطوات التالية / Next Steps:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '  1. أعد تحميل الصفحة (F5)';
    RAISE NOTICE '     Reload page (F5)';
    RAISE NOTICE '';
    RAISE NOTICE '  2. سجل حساب مدير جديد:';
    RAISE NOTICE '     Register new admin account:';
    RAISE NOTICE '     - البريد / Email: admin@kku.edu.sa';
    RAISE NOTICE '     - الدور / Role: Admin';
    RAISE NOTICE '';
    RAISE NOTICE '  3. سجل دخول واستمتع بالنظام!';
    RAISE NOTICE '     Login and enjoy the system!';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 النظام جاهز تماماً للاستخدام!';
    RAISE NOTICE '🎉 System is fully ready to use!';
    RAISE NOTICE '';
END $$;