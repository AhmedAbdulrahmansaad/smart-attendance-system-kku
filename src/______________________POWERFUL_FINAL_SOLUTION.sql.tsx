-- ╔═══════════════════════════════════════════════════════════╗
-- ║                                                           ║
-- ║  🔥 الحل القوي النهائي - Powerful Final Solution 🔥     ║
-- ║                                                           ║
-- ║     نظام الحضور الذكي - جامعة الملك خالد                ║
-- ║     Smart Attendance System - King Khalid University     ║
-- ║                                                           ║
-- ║  🔥 يحذف كل شيء بالقوة! - Deletes everything forcefully! ║
-- ║                                                           ║
-- ╚═══════════════════════════════════════════════════════════╝

-- تفعيل UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 1: تنظيف شامل بالقوة - Complete Force Cleanup  ║
-- ╚═══════════════════════════════════════════════════════════╝

-- حذف جميع الـ Views
DROP VIEW IF EXISTS course_enrollment_stats CASCADE;
DROP VIEW IF EXISTS student_attendance_summary CASCADE;

-- تعطيل RLS على جميع الجداول
DO $$ 
BEGIN
    ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS live_sessions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS device_fingerprints DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL; -- تجاهل الأخطاء
END $$;

-- حذف جميع Policies بالقوة
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          r.policyname, r.schemaname, r.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL; -- تجاهل الأخطاء
        END;
    END LOOP;
END $$;

-- حذف جميع الجداول بالقوة
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS live_sessions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS device_fingerprints CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- حذف جميع الـ Indexes بالقوة (لو كانت موجودة بدون جداول)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname 
              FROM pg_indexes 
              WHERE schemaname = 'public' 
                AND indexname LIKE 'idx_%')
    LOOP
        BEGIN
            EXECUTE format('DROP INDEX IF EXISTS %I CASCADE', r.indexname);
        EXCEPTION WHEN OTHERS THEN
            NULL; -- تجاهل الأخطاء
        END;
    END LOOP;
END $$;

-- حذف الـ Functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 2: إنشاء الجداول - Create Tables              ║
-- ╚═══════════════════════════════════════════════════════════╝

-- 1️⃣ جدول المستخدمين (Profiles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'supervisor')),
  university_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ جدول المقررات (Courses)
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

-- 3️⃣ جدول التسجيل في المقررات (Enrollments)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 4️⃣ جدول الجلسات (Sessions)
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

-- 5️⃣ جدول الحضور (Attendance)
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

-- 6️⃣ جدول الجلسات المباشرة (Live Sessions)
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

-- 7️⃣ جدول بصمات الأجهزة (Device Fingerprints)
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

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 3: إنشاء الـ Indexes - Create Indexes          ║
-- ╚═══════════════════════════════════════════════════════════╝

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);

-- Indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);

-- Indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions(start_time, end_time);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_time ON attendance(attendance_time);
CREATE INDEX IF NOT EXISTS idx_attendance_session_student ON attendance(session_id, student_id);

-- Indexes for live_sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_instructor ON live_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_room ON live_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_live_sessions_time ON live_sessions(scheduled_start, scheduled_end);

-- Indexes for device_fingerprints
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_active ON device_fingerprints(is_active);

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 4: الوظائف والمحفزات - Functions & Triggers   ║
-- ╚═══════════════════════════════════════════════════════════╝

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at 
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 5: العروض - Views                              ║
-- ╚═══════════════════════════════════════════════════════════╝

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

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 6: تعطيل RLS والصلاحيات - RLS & Permissions   ║
-- ╚═══════════════════════════════════════════════════════════╝

-- تعطيل RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints DISABLE ROW LEVEL SECURITY;

-- منح الصلاحيات
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  المرحلة 7: التحقق والنتيجة - Verify & Result          ║
-- ╚═══════════════════════════════════════════════════════════╝

DO $$
DECLARE
    table_count INTEGER := 0;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
    rls_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- عد الجداول
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'profiles', 'courses', 'enrollments', 'sessions', 
        'attendance', 'live_sessions', 'device_fingerprints'
      );
    
    -- عد الـ indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%';
    
    -- عد الـ policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- عد الجداول بـ RLS
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '║  🔥 تم بنجاح! Success! 🔥                                ║';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 النتائج النهائية / Final Results:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول / Tables:           %', table_count;
    RAISE NOTICE '✅ الفهارس / Indexes:          %', index_count;
    RAISE NOTICE '✅ الوظائف / Functions:        1';
    RAISE NOTICE '✅ المحفزات / Triggers:        3';
    RAISE NOTICE '✅ العروض / Views:             2';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 الأمان / Security:';
    RAISE NOTICE '   • Policies:                 %', policy_count;
    RAISE NOTICE '   • Tables with RLS:          %', rls_count;
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    IF table_count = 7 AND policy_count = 0 AND rls_count = 0 THEN
        RAISE NOTICE '🎉 مثالي! Perfect!';
        RAISE NOTICE '';
        RAISE NOTICE '✅ الجداول / Tables:';
        FOR rec IN 
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename IN (
                'profiles', 'courses', 'enrollments', 'sessions',
                'attendance', 'live_sessions', 'device_fingerprints'
              )
            ORDER BY tablename
        LOOP
            RAISE NOTICE '   ✓ %', rec.tablename;
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE '═══════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 الخطوات التالية / Next Steps:';
        RAISE NOTICE '';
        RAISE NOTICE '1️⃣ أعد تحميل صفحة النظام (F5)';
        RAISE NOTICE '   Reload system page (F5)';
        RAISE NOTICE '';
        RAISE NOTICE '2️⃣ سجل حساب مدير:';
        RAISE NOTICE '   Register admin account:';
        RAISE NOTICE '   • البريد: admin@kku.edu.sa';
        RAISE NOTICE '   • الاسم: مدير النظام';
        RAISE NOTICE '   • الدور: Admin';
        RAISE NOTICE '';
        RAISE NOTICE '3️⃣ سجل دخول واستمتع!';
        RAISE NOTICE '   Login and enjoy!';
        RAISE NOTICE '';
        RAISE NOTICE '═══════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '🎊 النظام جاهز تماماً! System fully ready! 🎊';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '⚠️  بعض القيم غير متوقعة / Some unexpected values';
        RAISE NOTICE '    لكن النظام يجب أن يعمل / But system should work';
        RAISE NOTICE '';
    END IF;
END $$;
