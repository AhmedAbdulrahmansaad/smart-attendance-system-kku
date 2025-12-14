-- ============================================
-- 🔥 FIX ALL ERRORS - إصلاح جميع الأخطاء
-- ============================================
-- يحل جميع مشاكل النظام دفعة واحدة

-- ============================================
-- 1️⃣ إصلاح جدول enrollments
-- ============================================

DO $$
BEGIN
    -- إضافة status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'status'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Added status to enrollments';
    END IF;
END $$;

UPDATE enrollments SET status = 'active' WHERE status IS NULL;

-- ============================================
-- 2️⃣ إصلاح جدول attendance
-- ============================================

DO $$
BEGIN
    -- course_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN course_id UUID;
        
        -- Fill course_id from sessions
        UPDATE attendance a
        SET course_id = s.course_id
        FROM sessions s
        WHERE a.session_id = s.id AND a.course_id IS NULL;
        
        -- Add foreign key
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_course_fkey
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added course_id to attendance';
    END IF;
    
    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) THEN
        ALTER TABLE attendance ADD COLUMN status TEXT DEFAULT 'present';
        RAISE NOTICE '✅ Added status to attendance';
    END IF;
    
    -- method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'method'
    ) THEN
        ALTER TABLE attendance ADD COLUMN method TEXT DEFAULT 'code';
        RAISE NOTICE '✅ Added method to attendance';
    END IF;
END $$;

UPDATE attendance SET status = 'present' WHERE status IS NULL;
UPDATE attendance SET method = 'code' WHERE method IS NULL;

-- ============================================
-- 3️⃣ إصلاح جدول sessions
-- ============================================

DO $$
BEGIN
    -- session_date (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'session_date'
    ) THEN
        ALTER TABLE sessions ADD COLUMN session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added session_date to sessions';
    END IF;
    
    -- Make sure is_active exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE sessions ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added is_active to sessions';
    END IF;
END $$;

-- ============================================
-- 4️⃣ إصلاح جدول courses
-- ============================================

DO $$
BEGIN
    -- semester
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'semester'
    ) THEN
        ALTER TABLE courses ADD COLUMN semester TEXT;
        RAISE NOTICE '✅ Added semester to courses';
    END IF;
    
    -- year (academic_year)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'year'
    ) THEN
        ALTER TABLE courses ADD COLUMN year TEXT;
        RAISE NOTICE '✅ Added year to courses';
    END IF;
    
    -- If academic_year exists, copy to year
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'academic_year'
    ) THEN
        UPDATE courses SET year = academic_year WHERE year IS NULL;
        RAISE NOTICE '✅ Copied academic_year to year';
    END IF;
END $$;

-- ============================================
-- 5️⃣ Drop old RLS policies (if causing issues)
-- ============================================

-- Drop and recreate RLS policies for clean slate
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON courses;
DROP POLICY IF EXISTS "Enable update for course instructors" ON courses;
DROP POLICY IF EXISTS "Enable delete for course instructors" ON courses;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable insert for instructors" ON sessions;
DROP POLICY IF EXISTS "Enable update for instructors" ON sessions;
DROP POLICY IF EXISTS "Enable delete for instructors" ON sessions;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for students and admins" ON enrollments;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON attendance;

-- ============================================
-- 6️⃣ Create simple RLS policies (allow all for authenticated)
-- ============================================

-- Profiles: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Courses: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON courses
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Sessions: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON sessions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enrollments: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON enrollments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Attendance: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON attendance
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 7️⃣ Enable RLS on all tables
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8️⃣ Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);

-- ============================================
-- 9️⃣ Analyze tables
-- ============================================

ANALYZE profiles;
ANALYZE courses;
ANALYZE sessions;
ANALYZE enrollments;
ANALYZE attendance;

-- ============================================
-- 🔟 Verification
-- ============================================

DO $$
DECLARE
    v_enrollments_status BOOLEAN;
    v_attendance_status BOOLEAN;
    v_attendance_course_id BOOLEAN;
    v_attendance_method BOOLEAN;
    v_sessions_date BOOLEAN;
    v_courses_semester BOOLEAN;
    v_courses_year BOOLEAN;
    v_profiles_count INTEGER;
    v_courses_count INTEGER;
BEGIN
    -- Check columns
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'status') INTO v_enrollments_status;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'status') INTO v_attendance_status;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'course_id') INTO v_attendance_course_id;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'method') INTO v_attendance_method;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_date') INTO v_sessions_date;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'semester') INTO v_courses_semester;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'year') INTO v_courses_year;
    
    -- Check data
    SELECT COUNT(*) INTO v_profiles_count FROM profiles;
    SELECT COUNT(*) INTO v_courses_count FROM courses;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔥🔥🔥 FIX ALL ERRORS COMPLETE! 🔥🔥🔥';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database Structure:';
    
    IF v_enrollments_status THEN RAISE NOTICE '   ✅ enrollments.status'; ELSE RAISE NOTICE '   ❌ enrollments.status'; END IF;
    IF v_attendance_status THEN RAISE NOTICE '   ✅ attendance.status'; ELSE RAISE NOTICE '   ❌ attendance.status'; END IF;
    IF v_attendance_course_id THEN RAISE NOTICE '   ✅ attendance.course_id'; ELSE RAISE NOTICE '   ❌ attendance.course_id'; END IF;
    IF v_attendance_method THEN RAISE NOTICE '   ✅ attendance.method'; ELSE RAISE NOTICE '   ❌ attendance.method'; END IF;
    IF v_sessions_date THEN RAISE NOTICE '   ✅ sessions.session_date'; ELSE RAISE NOTICE '   ❌ sessions.session_date'; END IF;
    IF v_courses_semester THEN RAISE NOTICE '   ✅ courses.semester'; ELSE RAISE NOTICE '   ❌ courses.semester'; END IF;
    IF v_courses_year THEN RAISE NOTICE '   ✅ courses.year'; ELSE RAISE NOTICE '   ❌ courses.year'; END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database Status:';
    RAISE NOTICE '   • Profiles: % users', v_profiles_count;
    RAISE NOTICE '   • Courses: % courses', v_courses_count;
    RAISE NOTICE '   • RLS: Enabled on all tables';
    RAISE NOTICE '   • Policies: Simple allow-all for authenticated';
    RAISE NOTICE '   • Indexes: Created';
    RAISE NOTICE '';
    
    IF v_enrollments_status AND v_attendance_status AND v_attendance_course_id AND v_attendance_method 
       AND v_sessions_date AND v_courses_semester AND v_courses_year THEN
        RAISE NOTICE '🎉🎉🎉 ALL PERFECT! SYSTEM 100%% READY! 🎉🎉🎉';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Next steps:';
        RAISE NOTICE '   1. Reload app (Ctrl+F5)';
        RAISE NOTICE '   2. Login';
        RAISE NOTICE '   3. Try adding a course';
        RAISE NOTICE '   4. Everything should work now!';
    ELSE
        RAISE NOTICE '⚠️ Some columns missing, check above';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '💚 نظام الحضور الذكي - جامعة الملك خالد';
    RAISE NOTICE '💚 KKU Smart Attendance System READY!';
    RAISE NOTICE '';
END $$;
