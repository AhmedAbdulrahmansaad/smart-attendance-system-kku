-- =====================================================
-- 🔥 إصلاح جدول Attendance - تطبيق فوري
-- Fix Attendance Table - Apply Immediately
-- =====================================================
-- 
-- هذا الملف يصلح مشكلة اسم الأعمدة في جدول attendance
-- 
-- ✅ نفّذ هذا الكود في Supabase SQL Editor
-- ✅ Execute this code in Supabase SQL Editor
--
-- =====================================================

-- 🔍 التحقق من الأعمدة الموجودة في جدول attendance
-- Check existing columns in attendance table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'attendance' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- الحل: توحيد أسماء الأعمدة
-- Solution: Standardize column names
-- =====================================================

-- إضافة عمود status إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
          AND column_name = 'status'
    ) THEN
        ALTER TABLE attendance ADD COLUMN status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused'));
        RAISE NOTICE '✅ Added column: status';
    ELSE
        RAISE NOTICE 'ℹ️ Column status already exists';
    END IF;
END $$;

-- التأكد من وجود created_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE attendance ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added column: created_at';
    ELSE
        RAISE NOTICE 'ℹ️ Column created_at already exists';
    END IF;
END $$;

-- إضافة course_id إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
          AND column_name = 'course_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added column: course_id';
    ELSE
        RAISE NOTICE 'ℹ️ Column course_id already exists';
    END IF;
END $$;

-- إضافة device_fingerprint إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
          AND column_name = 'device_fingerprint'
    ) THEN
        ALTER TABLE attendance ADD COLUMN device_fingerprint TEXT;
        RAISE NOTICE '✅ Added column: device_fingerprint';
    ELSE
        RAISE NOTICE 'ℹ️ Column device_fingerprint already exists';
    END IF;
END $$;

-- =====================================================
-- حذف الأعمدة القديمة غير المستخدمة (إذا وُجدت)
-- Delete old unused columns (if they exist)
-- =====================================================

-- حذف timestamp إذا كان موجوداً (نستخدم created_at بدلاً منه)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
          AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE attendance DROP COLUMN timestamp;
        RAISE NOTICE '✅ Dropped column: timestamp (using created_at instead)';
    ELSE
        RAISE NOTICE 'ℹ️ Column timestamp does not exist';
    END IF;
END $$;

-- حذف attendance_time إذا كان موجوداً (نستخدم created_at بدلاً منه)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
          AND column_name = 'attendance_time'
    ) THEN
        -- انسخ البيانات أولاً إذا كانت موجودة
        UPDATE attendance SET created_at = attendance_time WHERE attendance_time IS NOT NULL AND created_at IS NULL;
        ALTER TABLE attendance DROP COLUMN attendance_time;
        RAISE NOTICE '✅ Dropped column: attendance_time (migrated to created_at)';
    ELSE
        RAISE NOTICE 'ℹ️ Column attendance_time does not exist';
    END IF;
END $$;

-- =====================================================
-- إنشاء Indexes للأداء الأفضل
-- Create indexes for better performance
-- =====================================================

-- Index على student_id
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

-- Index على session_id
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);

-- Index على course_id
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);

-- Index على status
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Index على created_at
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);

-- Index مركب لأداء أفضل
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance(student_id, session_id);

-- =====================================================
-- التحقق النهائي - عرض البنية النهائية
-- Final check - Display final structure
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'attendance' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- ✅ انتهى الإصلاح
-- ✅ Fix Complete
-- =====================================================

/*
البنية النهائية المتوقعة | Expected Final Structure:
-----------------------------------------------------
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key to sessions)
- student_id: UUID (Foreign Key to profiles)
- status: TEXT (present, absent, late, excused)
- course_id: UUID (Foreign Key to courses)
- device_fingerprint: TEXT
- location: TEXT
- created_at: TIMESTAMP WITH TIME ZONE

ملاحظة | Note:
- استُبدل timestamp و attendance_time بـ created_at
- timestamp and attendance_time replaced with created_at
*/
