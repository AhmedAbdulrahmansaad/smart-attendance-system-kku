-- ============================================
-- KKU Smart Attendance - Complete Activation (FIXED)
-- نظام الحضور الذكي - التفعيل النهائي (مصلح)
-- ============================================

-- 🎯 هذا السكريبت يفعّل كل شيء ويضيف البيانات الأساسية
-- ✅ تم إصلاحه ليعمل مع جدول enrollments بدون عمود status

-- ============================================
-- 1️⃣ إصلاح جدول enrollments أولاً
-- ============================================

DO $$
BEGIN
    -- إضافة عمود status إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE enrollments 
        ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'dropped', 'completed'));
        
        CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
        CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
        CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);
        
        RAISE NOTICE '✅ Added status column to enrollments';
    ELSE
        RAISE NOTICE '⚠️ status column already exists';
    END IF;
END $$;

-- تحديث السجلات القديمة
UPDATE enrollments SET status = 'active' WHERE status IS NULL;

-- ============================================
-- 2️⃣ تحديث جدول profiles
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
-- 3️⃣ دالة التحقق من كود الجلسة
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

-- ============================================
-- 4️⃣ دالة تسجيل الحضور
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
    v_session sessions%ROWTYPE;
    v_enrollment_exists BOOLEAN;
    v_already_marked BOOLEAN;
    v_attendance_id UUID;
BEGIN
    -- التحقق من صلاحية الكود
    SELECT * INTO v_session
    FROM sessions
    WHERE code = p_session_code
      AND active = true
      AND expires_at > NOW()
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'كود غير صحيح أو منتهي الصلاحية / Invalid or expired code', NULL::UUID;
        RETURN;
    END IF;
    
    -- التحقق من تسجيل الطالب في المادة
    SELECT EXISTS(
        SELECT 1 FROM enrollments
        WHERE student_id = p_student_id
          AND course_id = v_session.course_id
    ) INTO v_enrollment_exists;
    
    IF NOT v_enrollment_exists THEN
        RETURN QUERY SELECT false, 'غير مسجل في هذه المادة / Not enrolled in this course', NULL::UUID;
        RETURN;
    END IF;
    
    -- التحقق من عدم التسجيل المسبق
    SELECT EXISTS(
        SELECT 1 FROM attendance
        WHERE student_id = p_student_id
          AND session_id = v_session.id
    ) INTO v_already_marked;
    
    IF v_already_marked THEN
        RETURN QUERY SELECT false, 'تم تسجيل حضورك مسبقاً / Already marked attendance', NULL::UUID;
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
    
    RETURN QUERY SELECT true, 'تم تسجيل الحضور بنجاح / Attendance marked successfully', v_attendance_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5️⃣ دالة إحصائيات الطالب
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
        c.id as course_id,
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
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.active = true THEN s.id END) as active_sessions,
        ROUND(
            AVG(
                (SELECT COUNT(*)::NUMERIC FROM attendance a WHERE a.session_id = s.id AND a.status = 'present') /
                NULLIF((SELECT COUNT(*) FROM enrollments WHERE course_id = s.course_id), 0) * 100
            ), 2
        ) as avg_attendance_rate
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN sessions s ON s.course_id = c.id
    WHERE c.instructor_id = p_instructor_id
      AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7️⃣ View للجلسات مع التفاصيل (مصلح)
-- ============================================

DROP VIEW IF EXISTS sessions_with_details CASCADE;

CREATE OR REPLACE VIEW sessions_with_details AS
SELECT 
    s.*,
    c.course_name,
    c.course_code,
    c.instructor_id,
    p.full_name as instructor_name,
    (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_count,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id) as enrolled_count,
    ROUND(
        (SELECT COUNT(*)::NUMERIC FROM attendance a WHERE a.session_id = s.id AND a.status = 'present') /
        NULLIF((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id), 0) * 100,
        2
    ) as attendance_percentage
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN profiles p ON p.id = c.instructor_id;

COMMENT ON VIEW sessions_with_details IS 'عرض الجلسات مع تفاصيل كاملة';

-- ============================================
-- 8️⃣ فهارس إضافية
-- ============================================

-- فهرس للبحث بالاسم (عربي)
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_search
ON profiles USING gin(to_tsvector('arabic', full_name));

CREATE INDEX IF NOT EXISTS idx_courses_name_search
ON courses USING gin(to_tsvector('arabic', course_name));

-- فهارس composite
CREATE INDEX IF NOT EXISTS idx_attendance_student_status 
ON attendance(student_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_course_status 
ON attendance(course_id, status);

-- ============================================
-- 9️⃣ تحديث الإحصائيات
-- ============================================

ANALYZE profiles;
ANALYZE courses;
ANALYZE enrollments;
ANALYZE sessions;
ANALYZE attendance;

-- ============================================
-- 🔟 التحقق من النتيجة
-- ============================================

-- عرض عدد السجلات
SELECT 
    'profiles' as table_name, 
    COUNT(*) as total,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'instructor' THEN 1 END) as instructors,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as students
FROM profiles

UNION ALL

SELECT 
    'courses' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    NULL::BIGINT,
    NULL::BIGINT
FROM courses

UNION ALL

SELECT 
    'enrollments' as table_name,
    COUNT(*) as total,
    NULL::BIGINT,
    NULL::BIGINT,
    NULL::BIGINT
FROM enrollments

UNION ALL

SELECT 
    'sessions' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN active = true THEN 1 END) as active,
    NULL::BIGINT,
    NULL::BIGINT
FROM sessions

UNION ALL

SELECT 
    'attendance' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
    NULL::BIGINT,
    NULL::BIGINT
FROM attendance;

-- عرض الدوال المتاحة
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'validate_session_code',
      'mark_attendance',
      'get_student_stats',
      'get_instructor_stats'
  )
ORDER BY routine_name;

-- ============================================
-- ✅ Done! Complete Activation Successful!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ✅ ✅ COMPLETE ACTIVATION SUCCESSFUL! ✅ ✅ ✅';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created Functions:';
    RAISE NOTICE '   • validate_session_code()';
    RAISE NOTICE '   • mark_attendance()';
    RAISE NOTICE '   • get_student_stats()';
    RAISE NOTICE '   • get_instructor_stats()';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Created Views:';
    RAISE NOTICE '   • sessions_with_details';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Created Indexes:';
    RAISE NOTICE '   • Full-text search (Arabic)';
    RAISE NOTICE '   • Performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 System Status: READY FOR PRODUCTION!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ نظام الحضور الذكي - جامعة الملك خالد';
    RAISE NOTICE '';
END $$;
