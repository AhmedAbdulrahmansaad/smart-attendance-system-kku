-- ============================================
-- ✨ SIMPLE FIX - إصلاح بسيط فقط
-- ============================================
-- يضيف فقط الأعمدة المفقودة
-- بدون دوال أو views معقدة

-- ============================================
-- 1️⃣ إضافة status لـ enrollments
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'status'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Added status to enrollments';
    ELSE
        RAISE NOTICE '⚠️ enrollments.status already exists';
    END IF;
END $$;

-- تحديث القيم
UPDATE enrollments SET status = 'active' WHERE status IS NULL;

-- ============================================
-- 2️⃣ إضافة الأعمدة المفقودة لـ attendance
-- ============================================

DO $$
BEGIN
    -- course_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN course_id UUID;
        
        -- ملء course_id من sessions
        UPDATE attendance a
        SET course_id = s.course_id
        FROM sessions s
        WHERE a.session_id = s.id AND a.course_id IS NULL;
        
        -- إضافة foreign key
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_course_fkey
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added course_id to attendance';
    ELSE
        RAISE NOTICE '⚠️ attendance.course_id already exists';
    END IF;
    
    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) THEN
        ALTER TABLE attendance ADD COLUMN status TEXT DEFAULT 'present';
        RAISE NOTICE '✅ Added status to attendance';
    ELSE
        RAISE NOTICE '⚠️ attendance.status already exists';
    END IF;
    
    -- method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'method'
    ) THEN
        ALTER TABLE attendance ADD COLUMN method TEXT DEFAULT 'code';
        RAISE NOTICE '✅ Added method to attendance';
    ELSE
        RAISE NOTICE '⚠️ attendance.method already exists';
    END IF;
END $$;

-- تحديث القيم
UPDATE attendance SET status = 'present' WHERE status IS NULL;
UPDATE attendance SET method = 'code' WHERE method IS NULL;

-- ============================================
-- 3️⃣ Indexes فقط
-- ============================================

CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(method);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);

-- ============================================
-- 4️⃣ تحديث الإحصائيات
-- ============================================

ANALYZE enrollments;
ANALYZE attendance;

-- ============================================
-- 5️⃣ التحقق النهائي
-- ============================================

DO $$
DECLARE
    v_enrollments_status BOOLEAN;
    v_attendance_status BOOLEAN;
    v_attendance_course_id BOOLEAN;
    v_attendance_method BOOLEAN;
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
    
    RAISE NOTICE '';
    RAISE NOTICE '✨✨✨ SIMPLE FIX COMPLETE! ✨✨✨';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Columns Added:';
    
    IF v_enrollments_status THEN
        RAISE NOTICE '   ✅ enrollments.status';
    ELSE
        RAISE NOTICE '   ❌ enrollments.status FAILED';
    END IF;
    
    IF v_attendance_course_id THEN
        RAISE NOTICE '   ✅ attendance.course_id';
    ELSE
        RAISE NOTICE '   ❌ attendance.course_id FAILED';
    END IF;
    
    IF v_attendance_status THEN
        RAISE NOTICE '   ✅ attendance.status';
    ELSE
        RAISE NOTICE '   ❌ attendance.status FAILED';
    END IF;
    
    IF v_attendance_method THEN
        RAISE NOTICE '   ✅ attendance.method';
    ELSE
        RAISE NOTICE '   ❌ attendance.method FAILED';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Indexes: Created';
    RAISE NOTICE '';
    
    IF v_enrollments_status AND v_attendance_status AND v_attendance_course_id AND v_attendance_method THEN
        RAISE NOTICE '🎉🎉🎉 SUCCESS! ALL COLUMNS ADDED! 🎉🎉🎉';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Now reload your app (Ctrl+F5)';
        RAISE NOTICE '✅ Try adding a course';
        RAISE NOTICE '✅ System should work!';
    ELSE
        RAISE NOTICE '⚠️ Some columns failed, please check above';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================
-- 6️⃣ عرض البنية النهائية
-- ============================================

SELECT 
    'enrollments' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

SELECT 
    'attendance' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'attendance'
ORDER BY ordinal_position;
