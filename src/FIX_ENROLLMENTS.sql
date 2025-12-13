-- ============================================
-- إصلاح سريع لجدول enrollments
-- Quick Fix for enrollments table
-- ============================================

-- 🔧 إضافة عمود status إلى جدول enrollments

DO $$
BEGIN
    -- تحقق من وجود عمود status
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'status'
    ) THEN
        -- إضافة عمود status
        ALTER TABLE enrollments 
        ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'dropped', 'completed'));
        
        -- إضافة index
        CREATE INDEX idx_enrollments_status ON enrollments(status);
        CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
        CREATE INDEX idx_enrollments_course_status ON enrollments(course_id, status);
        
        RAISE NOTICE '✅ Added status column to enrollments';
    ELSE
        RAISE NOTICE '⚠️ status column already exists in enrollments';
    END IF;
END $$;

-- ============================================
-- تحديث السجلات الموجودة
-- ============================================

-- تحديث جميع السجلات القديمة لتكون active
UPDATE enrollments 
SET status = 'active' 
WHERE status IS NULL;

-- ============================================
-- التحقق من النتيجة
-- ============================================

SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- عرض عدد السجلات
SELECT 
    status,
    COUNT(*) as count
FROM enrollments
GROUP BY status;

-- ============================================
-- ✅ Done!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ enrollments table fixed!';
    RAISE NOTICE '✅ status column added';
    RAISE NOTICE '✅ indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next: Run COMPLETE_ACTIVATION.sql again';
    RAISE NOTICE '';
END $$;
