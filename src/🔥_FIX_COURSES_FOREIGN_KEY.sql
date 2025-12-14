-- =====================================================
-- 🔥 إصلاح Foreign Key في جدول Courses
-- Fix Foreign Key in Courses Table
-- =====================================================
-- 
-- المشكلة: جدول courses يشير إلى جدول users بدلاً من profiles
-- Problem: courses table references users instead of profiles
-- 
-- ✅ نفّذ هذا الكود في Supabase SQL Editor
-- ✅ Execute this code in Supabase SQL Editor
--
-- =====================================================

-- 🔍 التحقق من Foreign Keys الموجودة
-- Check existing foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'courses'
    AND tc.table_schema = 'public';

-- =====================================================
-- الحل 1: حذف Foreign Key القديم (إذا كان يشير لـ users)
-- Solution 1: Drop old foreign key (if it references users)
-- =====================================================

-- حذف courses_instructor_id_fkey إذا كان موجوداً
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_instructor_id_fkey' 
          AND table_name = 'courses'
    ) THEN
        ALTER TABLE courses DROP CONSTRAINT courses_instructor_id_fkey;
        RAISE NOTICE '✅ Dropped old foreign key: courses_instructor_id_fkey';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key courses_instructor_id_fkey does not exist';
    END IF;
END $$;

-- حذف أي Foreign Keys أخرى متعلقة بـ instructor_id
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'courses' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%instructor%'
    LOOP
        EXECUTE 'ALTER TABLE courses DROP CONSTRAINT ' || constraint_rec.constraint_name;
        RAISE NOTICE '✅ Dropped foreign key: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- =====================================================
-- الحل 2: إنشاء Foreign Key جديد يشير إلى profiles
-- Solution 2: Create new foreign key pointing to profiles
-- =====================================================

-- التأكد من وجود عمود instructor_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
          AND column_name = 'instructor_id'
    ) THEN
        ALTER TABLE courses ADD COLUMN instructor_id UUID;
        RAISE NOTICE '✅ Added column: instructor_id';
    ELSE
        RAISE NOTICE 'ℹ️ Column instructor_id already exists';
    END IF;
END $$;

-- إنشاء Foreign Key جديد يشير إلى profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_instructor_id_fkey_profiles' 
          AND table_name = 'courses'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_instructor_id_fkey_profiles 
        FOREIGN KEY (instructor_id) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Created new foreign key: courses_instructor_id_fkey_profiles → profiles(id)';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key courses_instructor_id_fkey_profiles already exists';
    END IF;
END $$;

-- =====================================================
-- الحل 3: إصلاح جدول sessions أيضاً
-- Solution 3: Fix sessions table as well
-- =====================================================

-- حذف Foreign Key القديم في sessions
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'sessions' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%instructor%'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE sessions DROP CONSTRAINT ' || constraint_rec.constraint_name;
            RAISE NOTICE '✅ Dropped foreign key from sessions: %', constraint_rec.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Could not drop constraint: % (table may not exist)', constraint_rec.constraint_name;
        END;
    END LOOP;
END $$;

-- إنشاء Foreign Key جديد في sessions (إذا كان الجدول موجوداً)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) THEN
        -- التأكد من وجود عمود instructor_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' 
              AND column_name = 'instructor_id'
        ) THEN
            ALTER TABLE sessions ADD COLUMN instructor_id UUID;
            RAISE NOTICE '✅ Added column instructor_id to sessions';
        END IF;
        
        -- إنشاء Foreign Key
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'sessions_instructor_id_fkey_profiles' 
              AND table_name = 'sessions'
        ) THEN
            ALTER TABLE sessions 
            ADD CONSTRAINT sessions_instructor_id_fkey_profiles 
            FOREIGN KEY (instructor_id) 
            REFERENCES profiles(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Created foreign key in sessions → profiles(id)';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Table sessions does not exist';
    END IF;
END $$;

-- =====================================================
-- الحل 4: إصلاح جدول live_sessions أيضاً
-- Solution 4: Fix live_sessions table as well
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'live_sessions'
    ) THEN
        -- حذف Foreign Keys القديمة
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'live_sessions' 
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%instructor%'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE live_sessions DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped foreign key from live_sessions: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop constraint: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;
        
        -- إنشاء Foreign Key جديد
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'live_sessions_instructor_id_fkey_profiles' 
              AND table_name = 'live_sessions'
        ) THEN
            ALTER TABLE live_sessions 
            ADD CONSTRAINT live_sessions_instructor_id_fkey_profiles 
            FOREIGN KEY (instructor_id) 
            REFERENCES profiles(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Created foreign key in live_sessions → profiles(id)';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Table live_sessions does not exist';
    END IF;
END $$;

-- =====================================================
-- التحقق النهائي - عرض Foreign Keys الجديدة
-- Final check - Display new foreign keys
-- =====================================================

SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('courses', 'sessions', 'live_sessions')
    AND kcu.column_name = 'instructor_id'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- ✅ انتهى الإصلاح
-- ✅ Fix Complete
-- =====================================================

/*
النتيجة المتوقعة | Expected Result:
------------------------------------------------
جدول courses:
- instructor_id → profiles(id) ON DELETE SET NULL

جدول sessions (إذا كان موجوداً):
- instructor_id → profiles(id) ON DELETE CASCADE

جدول live_sessions (إذا كان موجوداً):
- instructor_id → profiles(id) ON DELETE CASCADE

الآن يمكن إضافة مقررات بدون أخطاء! ✅
Now you can add courses without errors! ✅
*/
