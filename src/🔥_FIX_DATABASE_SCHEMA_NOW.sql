-- =====================================================
-- 🔥 إصلاح Database Schema - تطبيق فوري
-- Fix Database Schema - Apply Immediately
-- =====================================================
-- 
-- هذا الملف يصلح مشكلة course_name_ar/course_name_en
-- ويضيف الحقول المطلوبة للمقررات
--
-- ✅ نفّذ هذا الكود في Supabase SQL Editor
-- ✅ Execute this code in Supabase SQL Editor
--
-- =====================================================

-- 🔍 التحقق من الأعمدة الموجودة
-- Check existing columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- الحل 1: حذف الأعمدة course_name_ar و course_name_en إذا كانت موجودة
-- Solution 1: Drop course_name_ar and course_name_en if they exist
-- =====================================================

-- حذف course_name_ar إذا كان موجوداً
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'course_name_ar'
    ) THEN
        ALTER TABLE courses DROP COLUMN course_name_ar;
        RAISE NOTICE '✅ Dropped column: course_name_ar';
    ELSE
        RAISE NOTICE 'ℹ️ Column course_name_ar does not exist';
    END IF;
END $$;

-- حذف course_name_en إذا كان موجوداً
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'course_name_en'
    ) THEN
        ALTER TABLE courses DROP COLUMN course_name_en;
        RAISE NOTICE '✅ Dropped column: course_name_en';
    ELSE
        RAISE NOTICE 'ℹ️ Column course_name_en does not exist';
    END IF;
END $$;

-- =====================================================
-- الحل 2: التأكد من وجود course_name
-- Solution 2: Ensure course_name exists
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'course_name'
    ) THEN
        ALTER TABLE courses ADD COLUMN course_name TEXT NOT NULL DEFAULT 'Unnamed Course';
        RAISE NOTICE '✅ Added column: course_name';
    ELSE
        RAISE NOTICE 'ℹ️ Column course_name already exists';
    END IF;
END $$;

-- =====================================================
-- الحل 3: إضافة الحقول الإضافية المطلوبة
-- Solution 3: Add additional required fields
-- =====================================================

-- إضافة semester
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'semester'
    ) THEN
        ALTER TABLE courses ADD COLUMN semester TEXT;
        RAISE NOTICE '✅ Added column: semester';
    ELSE
        RAISE NOTICE 'ℹ️ Column semester already exists';
    END IF;
END $$;

-- إضافة year
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'year'
    ) THEN
        ALTER TABLE courses ADD COLUMN year TEXT;
        RAISE NOTICE '✅ Added column: year';
    ELSE
        RAISE NOTICE 'ℹ️ Column year already exists';
    END IF;
END $$;

-- إضافة department
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'department'
    ) THEN
        ALTER TABLE courses ADD COLUMN department TEXT;
        RAISE NOTICE '✅ Added column: department';
    ELSE
        RAISE NOTICE 'ℹ️ Column department already exists';
    END IF;
END $$;

-- إضافة credits
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'credits'
    ) THEN
        ALTER TABLE courses ADD COLUMN credits INTEGER;
        RAISE NOTICE '✅ Added column: credits';
    ELSE
        RAISE NOTICE 'ℹ️ Column credits already exists';
    END IF;
END $$;

-- إضافة description
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'description'
    ) THEN
        ALTER TABLE courses ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added column: description';
    ELSE
        RAISE NOTICE 'ℹ️ Column description already exists';
    END IF;
END $$;

-- إضافة is_active
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'is_active'
    ) THEN
        ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added column: is_active';
    ELSE
        RAISE NOTICE 'ℹ️ Column is_active already exists';
    END IF;
END $$;

-- إضافة updated_at إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added column: updated_at';
    ELSE
        RAISE NOTICE 'ℹ️ Column updated_at already exists';
    END IF;
END $$;

-- =====================================================
-- الحل 4: إنشاء Index للبحث السريع
-- Solution 4: Create indexes for fast search
-- =====================================================

-- Index لرمز المقرر
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- Index لحالة النشاط
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- =====================================================
-- الحل 5: تحديث Trigger للـ updated_at
-- Solution 5: Update trigger for updated_at
-- =====================================================

-- إنشاء أو تحديث function للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف Trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;

-- إنشاء Trigger جديد
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ✅ التحقق النهائي من البنية
-- Final verification of structure
-- =====================================================

SELECT 
    '✅ Final Structure of courses table:' AS message;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- عرض عدد المقررات
SELECT 
    COUNT(*) AS total_courses,
    COUNT(CASE WHEN is_active = true THEN 1 END) AS active_courses,
    COUNT(CASE WHEN is_active = false THEN 1 END) AS inactive_courses
FROM courses;

-- =====================================================
-- 🎉 تم الإصلاح بنجاح!
-- Successfully Fixed!
-- =====================================================
--
-- الآن يمكنك:
-- Now you can:
--
-- 1. ✅ إضافة مقررات جديدة بدون أخطاء
--    Add new courses without errors
--
-- 2. ✅ استخدام course_name فقط (لا حاجة لـ course_name_ar/en)
--    Use only course_name (no need for course_name_ar/en)
--
-- 3. ✅ إضافة معلومات إضافية (semester, year, department, etc.)
--    Add additional information (semester, year, department, etc.)
--
-- =====================================================
