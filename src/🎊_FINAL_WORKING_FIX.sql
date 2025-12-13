-- ============================================
-- 🎊 FINAL WORKING FIX - الإصلاح النهائي الشغال
-- ============================================
-- يستخدم is_active بدلاً من active
-- لا يستخدم session_date

-- ============================================
-- 1️⃣ إصلاح enrollments
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'status'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Added status to enrollments';
    END IF;
END $$;

UPDATE enrollments SET status = 'active' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);

-- ============================================
-- 2️⃣ إصلاح attendance
-- ============================================

DO $$
BEGIN
    -- course_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN course_id UUID;
        
        UPDATE attendance a
        SET course_id = s.course_id
        FROM sessions s
        WHERE a.session_id = s.id AND a.course_id IS NULL;
        
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

CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(method);

-- ============================================
-- 3️⃣ دالة التحقق من كود الجلسة (باستخدام is_active)
-- ============================================

CREATE OR REPLACE FUNCTION validate_session_code(p_code TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    session_id UUID,
    course_id UUID,
    course_name TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    remaining_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (s.is_active = true AND s.expires_at > NOW()) as is_valid,
        s.id as session_id,
        s.course_id,
        c.course_name,
        s.expires_at,
        EXTRACT(EPOCH FROM (s.expires_at - NOW()))::INTEGER as remaining_seconds
    FROM sessions s
    JOIN courses c ON c.id = s.course_id
    WHERE s.code = p_code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4️⃣ دالة تسجيل الحضور (باستخدام is_active)
-- ============================================

CREATE OR REPLACE FUNCTION mark_attendance(
    p_student_id UUID,
    p_session_code TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    attendance_id UUID
) AS $$
DECLARE
    v_session RECORD;
    v_enrollment_exists BOOLEAN;
    v_already_marked BOOLEAN;
    v_attendance_id UUID;
BEGIN
    -- التحقق من الكود
    SELECT s.*, c.course_name INTO v_session
    FROM sessions s
    JOIN courses c ON c.id = s.course_id
    WHERE s.code = p_session_code
      AND s.is_active = true
      AND s.expires_at > NOW()
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'كود غير صحيح أو منتهي', NULL::UUID;
        RETURN;
    END IF;
    
    -- التحقق من التسجيل
    SELECT EXISTS(
        SELECT 1 FROM enrollments
        WHERE student_id = p_student_id AND course_id = v_session.course_id
    ) INTO v_enrollment_exists;
    
    IF NOT v_enrollment_exists THEN
        RETURN QUERY SELECT false, 'غير مسجل في المادة', NULL::UUID;
        RETURN;
    END IF;
    
    -- التحقق من الحضور السابق
    SELECT EXISTS(
        SELECT 1 FROM attendance
        WHERE student_id = p_student_id AND session_id = v_session.id
    ) INTO v_already_marked;
    
    IF v_already_marked THEN
        RETURN QUERY SELECT false, 'تم تسجيل حضورك مسبقاً', NULL::UUID;
        RETURN;
    END IF;
    
    -- تسجيل الحضور
    INSERT INTO attendance (session_id, student_id, course_id, status, method, recorded_at)
    VALUES (v_session.id, p_student_id, v_session.course_id, 'present', 'code', NOW())
    RETURNING id INTO v_attendance_id;
    
    RETURN QUERY SELECT true, 'تم تسجيل الحضور بنجاح', v_attendance_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5️⃣ دالة إحصائيات الطالب (باستخدام is_active)
-- ============================================

CREATE OR REPLACE FUNCTION get_student_stats(p_student_id UUID)
RETURNS TABLE(
    course_id UUID,
    course_name TEXT,
    course_code TEXT,
    total_sessions BIGINT,
    attended_sessions BIGINT,
    attendance_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.course_name,
        c.course_code,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT a.id) as attended_sessions,
        ROUND((COUNT(DISTINCT a.id)::NUMERIC / NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2)
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN sessions s ON s.course_id = c.id AND s.is_active = false
    LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = p_student_id
    WHERE e.student_id = p_student_id
    GROUP BY c.id, c.course_name, c.course_code
    ORDER BY c.course_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6️⃣ دالة إحصائيات المدرس
-- ============================================

CREATE OR REPLACE FUNCTION get_instructor_stats(p_instructor_id UUID)
RETURNS TABLE(
    total_courses BIGINT,
    total_students BIGINT,
    total_sessions BIGINT,
    active_sessions BIGINT,
    avg_attendance_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id)::BIGINT,
        COUNT(DISTINCT e.student_id)::BIGINT,
        COUNT(DISTINCT s.id)::BIGINT,
        COUNT(DISTINCT CASE WHEN s.is_active = true THEN s.id END)::BIGINT,
        COALESCE(ROUND(AVG(
            (SELECT COUNT(*)::NUMERIC FROM attendance a WHERE a.session_id = s.id) /
            NULLIF((SELECT COUNT(*) FROM enrollments WHERE course_id = s.course_id), 0) * 100
        ), 2), 0)
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN sessions s ON s.course_id = c.id
    WHERE c.instructor_id = p_instructor_id AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7️⃣ View للجلسات (باستخدام is_active، بدون session_date)
-- ============================================

DROP VIEW IF EXISTS sessions_with_details CASCADE;

CREATE OR REPLACE VIEW sessions_with_details AS
SELECT 
    s.id,
    s.course_id,
    s.code,
    s.title,
    s.description,
    s.session_type,
    s.is_active,
    s.expires_at,
    s.location,
    s.meeting_url,
    s.created_at,
    s.updated_at,
    c.course_name,
    c.course_code,
    c.instructor_id,
    p.full_name as instructor_name,
    (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_count,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id) as enrolled_count
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN profiles p ON p.id = c.instructor_id;

-- ============================================
-- 8️⃣ Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_course_is_active ON sessions(course_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);

-- ============================================
-- 9️⃣ تحديث الإحصائيات
-- ============================================

ANALYZE courses;
ANALYZE sessions;
ANALYZE attendance;
ANALYZE enrollments;
ANALYZE profiles;

-- ============================================
-- 🔟 التحقق النهائي
-- ============================================

DO $$
DECLARE
    v_enrollments_status BOOLEAN;
    v_attendance_status BOOLEAN;
    v_attendance_course_id BOOLEAN;
    v_attendance_method BOOLEAN;
    v_functions_count INTEGER;
    v_view_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'status'
    ) INTO v_enrollments_status;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) INTO v_attendance_status;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'course_id'
    ) INTO v_attendance_course_id;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'method'
    ) INTO v_attendance_method;
    
    SELECT COUNT(*) INTO v_functions_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name IN ('validate_session_code', 'mark_attendance', 'get_student_stats', 'get_instructor_stats');
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'sessions_with_details'
    ) INTO v_view_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎊🎊🎊 FINAL WORKING FIX COMPLETE! 🎊🎊🎊';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table Columns Check:';
    
    IF v_enrollments_status THEN
        RAISE NOTICE '   ✅ enrollments.status EXISTS';
    ELSE
        RAISE NOTICE '   ❌ enrollments.status MISSING';
    END IF;
    
    IF v_attendance_course_id THEN
        RAISE NOTICE '   ✅ attendance.course_id EXISTS';
    ELSE
        RAISE NOTICE '   ❌ attendance.course_id MISSING';
    END IF;
    
    IF v_attendance_status THEN
        RAISE NOTICE '   ✅ attendance.status EXISTS';
    ELSE
        RAISE NOTICE '   ❌ attendance.status MISSING';
    END IF;
    
    IF v_attendance_method THEN
        RAISE NOTICE '   ✅ attendance.method EXISTS';
    ELSE
        RAISE NOTICE '   ❌ attendance.method MISSING';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database Objects:';
    RAISE NOTICE '   • Functions: % created', v_functions_count;
    
    IF v_view_exists THEN
        RAISE NOTICE '   • View: sessions_with_details ✅';
    ELSE
        RAISE NOTICE '   • View: sessions_with_details ❌';
    END IF;
    
    RAISE NOTICE '   • Indexes: created ✅';
    RAISE NOTICE '';
    
    IF v_enrollments_status AND v_attendance_status AND v_attendance_course_id AND v_attendance_method AND v_functions_count = 4 AND v_view_exists THEN
        RAISE NOTICE '🎉🎉🎉 ALL PERFECT! SYSTEM 100%% READY! 🎉🎉🎉';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Next Steps:';
        RAISE NOTICE '   1. Reload your app (Ctrl+F5)';
        RAISE NOTICE '   2. Login to the system';
        RAISE NOTICE '   3. Try adding a course';
        RAISE NOTICE '   4. Check Console (F12) - should be clean!';
        RAISE NOTICE '';
        RAISE NOTICE '✅ نظام الحضور الذكي - جامعة الملك خالد';
        RAISE NOTICE '✅ KKU Smart Attendance System is READY!';
    ELSE
        RAISE NOTICE '⚠️ Some items missing, please check above.';
    END IF;
    
    RAISE NOTICE '';
END $$;
