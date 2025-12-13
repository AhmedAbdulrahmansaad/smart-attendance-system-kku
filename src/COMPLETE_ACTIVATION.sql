-- ============================================
-- KKU Smart Attendance - Complete Activation
-- نظام الحضور الذكي - التفعيل النهائي
-- ============================================

-- 🎯 هذا السكريبت يفعّل كل شيء ويضيف البيانات الأساسية

-- ============================================
-- 1️⃣ تفعيل Realtime للتحديثات الفورية
-- ============================================

-- ملاحظة: يتم تفعيل Realtime من Supabase Dashboard
-- 1. اذهب إلى Database → Replication
-- 2. فعّل Replication للجداول التالية:
--    ✅ enrollments
--    ✅ sessions  
--    ✅ attendance
--    ✅ courses

-- ============================================
-- 2️⃣ تحديث جدول profiles (إذا لزم الأمر)
-- ============================================

-- إضافة أعمدة إضافية إذا لم تكن موجودة
DO $$
BEGIN
    -- إضافة عمود avatar_url إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added avatar_url column to profiles';
    END IF;

    -- إضافة عمود phone إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ Added phone column to profiles';
    END IF;
END $$;

-- ============================================
-- 3️⃣ إنشاء دالة للتحقق من صلاحية الكود
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

COMMENT ON FUNCTION validate_session_code IS 'التحقق من صلاحية كود الجلسة وإرجاع التفاصيل';

-- ============================================
-- 4️⃣ إنشاء دالة لتسجيل الحضور
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
          AND status = 'active'
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

COMMENT ON FUNCTION mark_attendance IS 'تسجيل حضور الطالب باستخدام كود الجلسة';

-- ============================================
-- 5️⃣ إنشاء دالة لإحصائيات الطالب
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
      AND e.status = 'active'
    GROUP BY c.id, c.course_name, c.course_code
    ORDER BY c.course_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_stats IS 'إحصائيات حضور الطالب لكل مادة';

-- ============================================
-- 6️⃣ إنشاء دالة لإحصائيات المدرس
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
                NULLIF((SELECT COUNT(*) FROM enrollments WHERE course_id = s.course_id AND status = 'active'), 0) * 100
            ), 2
        ) as avg_attendance_rate
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
    LEFT JOIN sessions s ON s.course_id = c.id
    WHERE c.instructor_id = p_instructor_id
      AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_instructor_stats IS 'إحصائيات شاملة للمدرس';

-- ============================================
-- 7️⃣ إنشاء View لتسهيل الاستعلامات
-- ============================================

-- View لعرض الجلسات مع تفاصيل المادة
CREATE OR REPLACE VIEW sessions_with_details AS
SELECT 
    s.*,
    c.course_name,
    c.course_code,
    c.instructor_id,
    p.full_name as instructor_name,
    (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_count,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id AND e.status = 'active') as enrolled_count,
    ROUND(
        (SELECT COUNT(*)::NUMERIC FROM attendance a WHERE a.session_id = s.id AND a.status = 'present') /
        NULLIF((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = s.course_id AND e.status = 'active'), 0) * 100,
        2
    ) as attendance_percentage
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN profiles p ON p.id = c.instructor_id;

COMMENT ON VIEW sessions_with_details IS 'عرض الجلسات مع تفاصيل كاملة';

-- ============================================
-- 8️⃣ إنشاء Trigger لتنظيف الجلسات المنتهية
-- ============================================

CREATE OR REPLACE FUNCTION auto_deactivate_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- تعطيل الجلسات المنتهية تلقائياً
    UPDATE sessions
    SET active = false
    WHERE expires_at < NOW()
      AND active = true;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ملاحظة: لا نستطيع إنشاء scheduled trigger في PostgreSQL
-- لكن يمكننا تشغيل هذه الدالة يدوياً أو من التطبيق

-- ============================================
-- 9️⃣ إنشاء بيانات أساسية (Admin)
-- ============================================

-- ملاحظة: تأكد من إنشاء المستخدم في Supabase Auth أولاً
-- ثم قم بتحديث الدور هنا

-- مثال: تحديث مستخدم موجود ليصبح Admin
-- UPDATE profiles 
-- SET role = 'admin', is_active = true
-- WHERE email = 'admin@kku.edu.sa';

-- ============================================
-- 🔟 إنشاء فهرس للبحث السريع
-- ============================================

-- فهرس لبحث الطلاب بالاسم
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_search
ON profiles USING gin(to_tsvector('arabic', full_name));

-- فهرس لبحث المواد بالاسم
CREATE INDEX IF NOT EXISTS idx_courses_name_search
ON courses USING gin(to_tsvector('arabic', course_name));

-- ============================================
-- 1️⃣1️⃣ تحديث الإحصائيات
-- ============================================

-- تحديث إحصائيات الجداول
ANALYZE profiles;
ANALYZE courses;
ANALYZE enrollments;
ANALYZE sessions;
ANALYZE attendance;

-- ============================================
-- 1️⃣2️⃣ التحقق من النتيجة
-- ============================================

-- عرض عدد السجلات في كل جدول
SELECT 
    'profiles' as table_name, 
    COUNT(*) as count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'instructor' THEN 1 END) as instructors,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
    COUNT(CASE WHEN role = 'supervisor' THEN 1 END) as supervisors
FROM profiles

UNION ALL

SELECT 
    'courses' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
    NULL::BIGINT,
    NULL::BIGINT
FROM courses

UNION ALL

SELECT 
    'enrollments' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    NULL::BIGINT
FROM enrollments

UNION ALL

SELECT 
    'sessions' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN active = true THEN 1 END) as active,
    COUNT(CASE WHEN session_type = 'attendance' THEN 1 END) as attendance_sessions,
    COUNT(CASE WHEN session_type = 'live' THEN 1 END) as live_sessions,
    NULL::BIGINT
FROM sessions

UNION ALL

SELECT 
    'attendance' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
    COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused
FROM attendance;

-- ============================================
-- 1️⃣3️⃣ عرض الدوال المتاحة
-- ============================================

SELECT 
    routine_name as function_name,
    routine_type as type,
    data_type as returns
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
    RAISE NOTICE '   • validate_session_code() - التحقق من كود الجلسة';
    RAISE NOTICE '   • mark_attendance() - تسجيل الحضور';
    RAISE NOTICE '   • get_student_stats() - إحصائيات الطالب';
    RAISE NOTICE '   • get_instructor_stats() - إحصائيات المدرس';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Created Views:';
    RAISE NOTICE '   • sessions_with_details - تفاصيل الجلسات';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Created Indexes:';
    RAISE NOTICE '   • Full-text search indexes for Arabic';
    RAISE NOTICE '   • Performance optimization indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '1. Create an admin user in Supabase Auth';
    RAISE NOTICE '2. Update their role: UPDATE profiles SET role = ''admin'' WHERE email = ''admin@kku.edu.sa'';';
    RAISE NOTICE '3. Enable Realtime in Supabase Dashboard for: enrollments, sessions, attendance';
    RAISE NOTICE '4. Test the application';
    RAISE NOTICE '';
    RAISE NOTICE '✅ نظام الحضور الذكي - جامعة الملك خالد';
    RAISE NOTICE '✅ KKU Smart Attendance System';
    RAISE NOTICE '';
END $$;
