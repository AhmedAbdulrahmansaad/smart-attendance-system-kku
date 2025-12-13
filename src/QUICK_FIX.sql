-- ============================================
-- QUICK FIX for "Could not find 'year' column"
-- إصلاح سريع لخطأ عدم وجود عمود year
-- ============================================

-- 🚨 إذا ظهر الخطأ:
-- "Could not find the 'year' column of 'courses' in the schema cache"

-- 🔧 الحل السريع (إذا لم ترد تنفيذ DATABASE_SETUP.sql كاملاً):

-- ============================================
-- خيار 1: إضافة الأعمدة الناقصة فقط
-- ============================================

-- تحقق أولاً من وجود الأعمدة
DO $$
BEGIN
    -- إضافة عمود semester إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'semester'
    ) THEN
        ALTER TABLE courses ADD COLUMN semester TEXT;
        RAISE NOTICE '✅ Added semester column';
    ELSE
        RAISE NOTICE '⚠️ semester column already exists';
    END IF;

    -- إضافة عمود year إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'year'
    ) THEN
        ALTER TABLE courses ADD COLUMN year TEXT;
        RAISE NOTICE '✅ Added year column';
    ELSE
        RAISE NOTICE '⚠️ year column already exists';
    END IF;

    -- إضافة عمود description إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'description'
    ) THEN
        ALTER TABLE courses ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added description column';
    ELSE
        RAISE NOTICE '⚠️ description column already exists';
    END IF;

    -- إضافة عمود department إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'department'
    ) THEN
        ALTER TABLE courses ADD COLUMN department TEXT;
        RAISE NOTICE '✅ Added department column';
    ELSE
        RAISE NOTICE '⚠️ department column already exists';
    END IF;

    -- إضافة عمود credits إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'credits'
    ) THEN
        ALTER TABLE courses ADD COLUMN credits INTEGER DEFAULT 3;
        RAISE NOTICE '✅ Added credits column';
    ELSE
        RAISE NOTICE '⚠️ credits column already exists';
    END IF;

    -- إضافة عمود is_active إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added is_active column';
    ELSE
        RAISE NOTICE '⚠️ is_active column already exists';
    END IF;
END $$;

-- ============================================
-- إضافة القيود (Constraints)
-- ============================================

-- إضافة constraint لـ semester
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'courses' AND constraint_name = 'courses_semester_check'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_semester_check 
        CHECK (semester IN ('Fall', 'Spring', 'Summer'));
        RAISE NOTICE '✅ Added semester constraint';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ semester constraint already exists';
END $$;

-- ============================================
-- تحديث البيانات الموجودة (إذا كانت فارغة)
-- ============================================

-- تحديث المواد التي لا تحتوي على semester/year
UPDATE courses 
SET 
    semester = 'Fall',
    year = '2024'
WHERE semester IS NULL OR year IS NULL;

-- ============================================
-- إضافة Indexes للأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_courses_semester_year ON courses(semester, year);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

-- ============================================
-- التحقق من النتيجة
-- ============================================

-- عرض structure جدول courses
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- عد الأعمدة
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'courses';

-- ============================================
-- ✅ Done! Quick Fix Complete!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Quick fix complete!';
    RAISE NOTICE '✅ semester column added/exists';
    RAISE NOTICE '✅ year column added/exists';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Refresh your browser (Ctrl+F5)';
    RAISE NOTICE '2. Try adding a course';
    RAISE NOTICE '3. If it works, you are done!';
    RAISE NOTICE '';
    RAISE NOTICE '📌 If you still see errors:';
    RAISE NOTICE '   Run the full DATABASE_SETUP.sql instead';
END $$;
