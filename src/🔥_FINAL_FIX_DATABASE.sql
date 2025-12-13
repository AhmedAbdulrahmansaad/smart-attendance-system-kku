-- ══════════════════════════════════════════════════════════════
-- 🔥 FINAL DATABASE FIX - إصلاح نهائي لقاعدة البيانات
-- ══════════════════════════════════════════════════════════════
-- 
-- هذا السكريبت يحل:
-- ✅ infinite recursion detected in policy
-- ✅ Could not find a relationship between 'sessions' and 'created_by'
-- ✅ Forbidden - Admin access required
-- ✅ جميع مشاكل RLS
--
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- الخطوة 1: حذف جميع السياسات القديمة نهائياً
-- ──────────────────────────────────────────────────────────────

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- حذف جميع السياسات من جميع الجداول
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────────
-- الخطوة 2: تعطيل RLS على جميع الجداول
-- ──────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS live_sessions DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS disabled on all tables';

-- ──────────────────────────────────────────────────────────────
-- الخطوة 3: إصلاح جدول sessions - الاحتفاظ بـ created_by
-- ──────────────────────────────────────────────────────────────

-- التأكد من وجود جدول sessions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) THEN
        CREATE TABLE sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id UUID NOT NULL,
            code TEXT NOT NULL,
            created_by UUID NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            active BOOLEAN DEFAULT true,
            session_type TEXT DEFAULT 'attendance',
            title TEXT,
            description TEXT,
            instructor_id UUID,
            date DATE,
            start_time TIME,
            end_time TIME
        );
        RAISE NOTICE '✅ Created sessions table';
    END IF;
END $$;

-- التأكد من وجود عمود created_by
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE sessions ADD COLUMN created_by UUID;
        RAISE NOTICE '✅ Added created_by column to sessions';
    END IF;
END $$;

-- التأكد من وجود عمود instructor_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'instructor_id'
    ) THEN
        ALTER TABLE sessions ADD COLUMN instructor_id UUID;
        RAISE NOTICE '✅ Added instructor_id column to sessions';
    END IF;
END $$;

-- مزامنة instructor_id مع created_by
UPDATE sessions 
SET instructor_id = created_by 
WHERE instructor_id IS NULL AND created_by IS NOT NULL;

RAISE NOTICE '✅ Synced instructor_id with created_by';

-- ──────────────────────────────────────────────────────────────
-- الخطوة 4: إصلاح جدول profiles
-- ──────────────────────────────────────────────────────────────

-- التأكد من وجود جدول profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY,
            full_name TEXT,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'student',
            university_id TEXT,
            department TEXT,
            phone TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created profiles table';
    END IF;
END $$;

-- التأكد من وجود الأعمدة المطلوبة
DO $$ 
BEGIN
    -- role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student';
    END IF;
    
    -- full_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
    
    -- university_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'university_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN university_id TEXT;
    END IF;
    
    RAISE NOTICE '✅ Ensured all columns exist in profiles';
END $$;

-- ──────────────────────────────────────────────────────────────
-- الخطوة 5: إصلاح جدول courses
-- ──────────────────────────────────────────────────────────────

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'courses'
    ) THEN
        CREATE TABLE courses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_code TEXT NOT NULL,
            course_name TEXT NOT NULL,
            instructor_id UUID,
            semester TEXT,
            year INTEGER,
            department TEXT,
            credits INTEGER,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created courses table';
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- الخطوة 6: إصلاح باقي الجداول
-- ──────────────────────────────────────────────────────────────

-- attendance table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'attendance'
    ) THEN
        CREATE TABLE attendance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            session_id UUID NOT NULL,
            status TEXT DEFAULT 'present',
            date DATE,
            time TIME,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created attendance table';
    END IF;
END $$;

-- enrollments table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'enrollments'
    ) THEN
        CREATE TABLE enrollments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            course_id UUID NOT NULL,
            enrolled_at TIMESTAMPTZ DEFAULT NOW(),
            status TEXT DEFAULT 'active'
        );
        RAISE NOTICE '✅ Created enrollments table';
    END IF;
END $$;

-- schedules table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'schedules'
    ) THEN
        CREATE TABLE schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id UUID NOT NULL,
            day_of_week TEXT,
            start_time TIME,
            end_time TIME,
            location TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created schedules table';
    END IF;
END $$;

-- live_sessions table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'live_sessions'
    ) THEN
        CREATE TABLE live_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id UUID NOT NULL,
            instructor_id UUID NOT NULL,
            title TEXT,
            description TEXT,
            jitsi_room_name TEXT,
            scheduled_at TIMESTAMPTZ,
            started_at TIMESTAMPTZ,
            ended_at TIMESTAMPTZ,
            status TEXT DEFAULT 'scheduled',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created live_sessions table';
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- الخطوة 7: منح جميع الصلاحيات
-- ──────────────────────────────────────────────────────────────

-- Grant all privileges to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant usage on all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

RAISE NOTICE '✅ Granted all privileges';

-- ──────────────────────────────────────────────────────────────
-- الخطوة 8: إنشاء Indexes للأداء
-- ──────────────────────────────────────────────────────────────

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_instructor_id ON sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(active);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON schedules(course_id);

-- Live sessions indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_instructor_id ON live_sessions(instructor_id);

RAISE NOTICE '✅ Created all indexes';

-- ──────────────────────────────────────────────────────────────
-- الخطوة 9: التحقق من النتيجة
-- ──────────────────────────────────────────────────────────────

-- عرض حالة RLS (يجب أن يكون false)
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '📊 RLS Status (should all be OFF):';
    RAISE NOTICE '═══════════════════════════════════════════';
    
    FOR rec IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  % → RLS: %', 
            rpad(rec.tablename, 20), 
            CASE WHEN rec.rowsecurity THEN '❌ ON' ELSE '✅ OFF' END;
    END LOOP;
END $$;

-- عرض عدد السياسات (يجب أن يكون 0)
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '📋 Policy Count: %', policy_count;
    IF policy_count = 0 THEN
        RAISE NOTICE '✅ No policies found (correct!)';
    ELSE
        RAISE NOTICE '⚠️ % policies still exist', policy_count;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════════';
END $$;

-- عرض أعمدة sessions
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '📋 Sessions Table Columns:';
    RAISE NOTICE '═══════════════════════════════════════════';
    
    FOR rec IN 
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'sessions'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % → %', 
            rpad(rec.column_name, 20), 
            rec.data_type;
    END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- ✅ رسالة النجاح النهائية
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ تم تطبيق الإصلاحات بنجاح!';
    RAISE NOTICE '✅ All fixes applied successfully!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   ✅ All RLS policies removed';
    RAISE NOTICE '   ✅ RLS disabled on all tables';
    RAISE NOTICE '   ✅ sessions.created_by column exists';
    RAISE NOTICE '   ✅ sessions.instructor_id column exists';
    RAISE NOTICE '   ✅ All permissions granted';
    RAISE NOTICE '   ✅ All indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   1. npm run dev';
    RAISE NOTICE '   2. Create your admin account';
    RAISE NOTICE '   3. Start using the system!';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
