-- ============================================
-- 🎯 FINAL ULTIMATE FIX - الإصلاح النهائي الكامل
-- ============================================
-- يتحقق من البنية الفعلية ويضيف الأعمدة المفقودة فقط

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
        ALTER TABLE enrollments 
        ADD COLUMN status TEXT DEFAULT 'active';
        
        ALTER TABLE enrollments
        ADD CONSTRAINT enrollments_status_check 
        CHECK (status IN ('active', 'dropped', 'completed'));
        
        RAISE NOTICE '✅ Added status to enrollments';
    ELSE
        RAISE NOTICE '⚠️ enrollments.status already exists';
    END IF;
    
    -- تحديث السجلات القديمة
    UPDATE enrollments SET status = 'active' WHERE status IS NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);

-- ============================================
-- 2️⃣ إصلاح جدول attendance
-- ============================================

DO $$
BEGIN
    -- إضافة course_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'course_id'
    ) THEN
        -- إضافة عمود course_id بدون foreign key أولاً
        ALTER TABLE attendance 
        ADD COLUMN course_id UUID;
        
        -- تحديث course_id من sessions
        UPDATE attendance a
        SET course_id = s.course_id
        FROM sessions s
        WHERE a.session_id = s.id
          AND a.course_id IS NULL;
        
        -- إضافة foreign key constraint
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_course_id_fkey
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added course_id to attendance';
    ELSE
        RAISE NOTICE '⚠️ attendance.course_id already exists';
    END IF;
    
    -- إضافة status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) THEN
        ALTER TABLE attendance 
        ADD COLUMN status TEXT DEFAULT 'present';
        
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_status_check 
        CHECK (status IN ('present', 'absent', 'late', 'excused'));
        
        RAISE NOTICE '✅ Added status to attendance';
    ELSE
        RAISE NOTICE '⚠️ attendance.status already exists';
    END IF;
    
    -- إضافة method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'method'
    ) THEN
        ALTER TABLE attendance 
        ADD COLUMN method TEXT DEFAULT 'code';
        
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_method_check 
        CHECK (method IN ('code', 'fingerprint', 'nfc', 'live_session'));
        
        RAISE NOTICE '✅ Added method to attendance';
    ELSE
        RAISE NOTICE '⚠️ attendance.method already exists';
    END IF;
    
    -- إضافة device_info
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'device_info'
    ) THEN
        ALTER TABLE attendance ADD COLUMN device_info JSONB;
        RAISE NOTICE '✅ Added device_info to attendance';
    END IF;
    
    -- إضافة location_info
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'location_info'
    ) THEN
        ALTER TABLE attendance ADD COLUMN location_info JSONB;
        RAISE NOTICE '✅ Added location_info to attendance';
    END IF;
    
    -- إضافة notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'notes'
    ) THEN
        ALTER TABLE attendance ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Added notes to attendance';
    END IF;
    
    -- تحديث السجلات القديمة
    UPDATE attendance SET status = 'present' WHERE status IS NULL;
    UPDATE attendance SET method = 'code' WHERE method IS NULL;
END $$;

-- Indexes للـ attendance
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(method);
CREATE INDEX IF NOT EXISTS idx_attendance_student_status ON attendance(student_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_course_status ON attendance(course_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_session_student ON attendance(session_id, student_id);

-- ============================================
-- 3️⃣ تحديث جدول profiles
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added avatar_url to profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ Added phone to profiles';
    END IF;
END $$;

-- ============================================
-- 4️⃣ دالة التحقق من كود الجلسة
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
        (s.active = true AND s.expires_at > NOW()) as is_valid,
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

COMMENT ON FUNCTION validate_session_code IS 'التحقق من صلاحية كود الجلسة';

-- ============================================
-- 5️⃣ دالة تسجيل الحضور
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
    -- التحقق من صلاحية الكود
    SELECT s.*, c.course_name INTO v_session
    FROM sessions s
    JOIN courses c ON c.id = s.course_id
    WHERE s.code = p_session_code
      AND s.active = true
      AND s.expires_at > NOW()
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'كود غير صحيح أو منتهي الصلاحية', NULL::UUID;
        RETURN;
    END IF;
    
    -- التحقق من تسجيل الطالب
    SELECT EXISTS(
        SELECT 1 FROM enrollments
        WHERE student_id = p_student_id
          AND course_id = v_session.course_id
    ) INTO v_enrollment_exists;
    
    IF NOT v_enrollment_exists THEN
        RETURN QUERY SELECT false, 'غير مسجل في هذه المادة', NULL::UUID;
        RETURN;
    END IF;
    
    -- التحقق من عدم التسجيل المسبق
    SELECT EXISTS(
        SELECT 1 FROM attendance
        WHERE student_id = p_student_id
          AND session_id = v_session.id
    ) INTO v_already_marked;
    
    IF v_already_marked THEN
        RETURN QUERY SELECT false, 'تم تسجيل حضورك مسبقاً', NULL::UUID;
        RETURN;
    END IF;
    
    -- تسجيل الحضور
    INSERT INTO attendance (
        session_id,
        student_id,
        course_id,
        status,
        method,
        recorded_at
    ) VALUES (
        v_session.id,
        p_student_id,
        v_session.course_id,
        'present',
        'code',
        NOW()
    )
    RETURNING id INTO v_attendance_id;
    
    RETURN QUERY SELECT true, 'تم تسجيل الحضور بنجاح', v_attendance_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_attendance IS 'تسجيل حضور الطالب';

-- ============================================
-- 6️⃣ دالة إحصائيات الطالب
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
        ROUND(
            (COUNT(DISTINCT a.id)::NUMERIC / NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2
        ) as attendance_rate
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN sessions s ON s.course_id = c.id AND s.active = false
    LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = p_student_id
    WHERE e.student_id = p_student_id
    GROUP BY c.id, c.course_name, c.course_code
    ORDER BY c.course_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_stats IS 'إحصائيات حضور الطالب';

-- ============================================
-- 7️⃣ دالة إحصائيات المدرس
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
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.active = true THEN s.id END) as active_sessions,
        ROUND(
            COALESCE(
                AVG(
                    (SELECT COUNT(*)::NUMERIC FROM attendance a WHERE a.session_id = s.id) /
                    NULLIF((SELECT COUNT(*) FROM enrollments WHERE course_id = s.course_id), 0) * 100
                ),
                0
            ), 2
        ) as avg_attendance_rate
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN sessions s ON s.course_id = c.id
    WHERE c.instructor_id = p_instructor_id
      AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_instructor_stats IS 'إحصائيات المدرس';

-- ============================================
-- 8️⃣ View للجلسات
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
    s.session_date,
    s.start_time,
    s.end_time,
    s.active,
    s.expires_at,
    s.location,
    s.meeting_url,
    s.viewers_count,
    s.created_at,
    s.updated_at,
    c.course_name,
    c.course_code,
    c.instructor_id,
    p.full_name as instructor_name,
    (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_count,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id) as enrolled_count,
    ROUND(
        (SELECT COUNT(*)::NUMERIC FROM attendance a WHERE a.session_id = s.id) /
        NULLIF((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id), 0) * 100,
        2
    ) as attendance_percentage
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN profiles p ON p.id = c.instructor_id;

COMMENT ON VIEW sessions_with_details IS 'عرض الجلسات مع التفاصيل';

-- ============================================
-- 9️⃣ Indexes إضافية
-- ============================================

-- Full-text search (عربي)
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_search
ON profiles USING gin(to_tsvector('arabic', COALESCE(full_name, '')));

CREATE INDEX IF NOT EXISTS idx_courses_name_search
ON courses USING gin(to_tsvector('arabic', COALESCE(course_name, '')));

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_sessions_course_active_date 
ON sessions(course_id, active, session_date DESC);

-- ============================================
-- 🔟 تحديث الإحصائيات
-- ============================================

ANALYZE profiles;
ANALYZE courses;
ANALYZE enrollments;
ANALYZE sessions;
ANALYZE attendance;

-- ============================================
-- 1️⃣1️⃣ عرض البنية النهائية
-- ============================================

-- عرض أعمدة enrollments
SELECT 
    'enrollments' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- عرض أعمدة attendance
SELECT 
    'attendance' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- عرض الدوال
SELECT 
    routine_name as function_name,
    'Created ✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'validate_session_code',
      'mark_attendance',
      'get_student_stats',
      'get_instructor_stats'
  )
ORDER BY routine_name;

-- عرض الإحصائيات
SELECT 
    'profiles' as table_name, 
    COUNT(*) as total_records
FROM profiles

UNION ALL
SELECT 'courses', COUNT(*) FROM courses

UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments

UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions

UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance;

-- ============================================
-- ✅ FINAL ULTIMATE FIX COMPLETE!
-- ============================================

DO $$
DECLARE
    v_enrollments_has_status BOOLEAN;
    v_attendance_has_status BOOLEAN;
    v_attendance_has_course_id BOOLEAN;
    v_attendance_has_method BOOLEAN;
BEGIN
    -- التحقق النهائي
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'status'
    ) INTO v_enrollments_has_status;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) INTO v_attendance_has_status;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'course_id'
    ) INTO v_attendance_has_course_id;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'method'
    ) INTO v_attendance_has_method;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯🎯🎯 FINAL ULTIMATE FIX COMPLETE! 🎯🎯🎯';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table Structure Check:';
    
    IF v_enrollments_has_status THEN
        RAISE NOTICE '   ✅ enrollments.status EXISTS';
    ELSE
        RAISE NOTICE '   ❌ enrollments.status MISSING!';
    END IF;
    
    IF v_attendance_has_course_id THEN
        RAISE NOTICE '   ✅ attendance.course_id EXISTS';
    ELSE
        RAISE NOTICE '   ❌ attendance.course_id MISSING!';
    END IF;
    
    IF v_attendance_has_status THEN
        RAISE NOTICE '   ✅ attendance.status EXISTS';
    ELSE
        RAISE NOTICE '   ❌ attendance.status MISSING!';
    END IF;
    
    IF v_attendance_has_method THEN
        RAISE NOTICE '   ✅ attendance.method EXISTS';
    ELSE
        RAISE NOTICE '   ❌ attendance.method MISSING!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created Functions:';
    RAISE NOTICE '   • validate_session_code()';
    RAISE NOTICE '   • mark_attendance()';
    RAISE NOTICE '   • get_student_stats()';
    RAISE NOTICE '   • get_instructor_stats()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created Views:';
    RAISE NOTICE '   • sessions_with_details';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created Indexes:';
    RAISE NOTICE '   • Full-text search (Arabic)';
    RAISE NOTICE '   • Performance indexes';
    RAISE NOTICE '   • Composite indexes';
    RAISE NOTICE '';
    
    IF v_enrollments_has_status AND v_attendance_has_status AND 
       v_attendance_has_course_id AND v_attendance_has_method THEN
        RAISE NOTICE '🎊🎊🎊 ALL CHECKS PASSED! SYSTEM 100%% READY! 🎊🎊🎊';
    ELSE
        RAISE NOTICE '⚠️ Some columns are still missing. Please check above.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ نظام الحضور الذكي - جامعة الملك خالد';
    RAISE NOTICE '✅ KKU Smart Attendance System';
    RAISE NOTICE '';
END $$;
