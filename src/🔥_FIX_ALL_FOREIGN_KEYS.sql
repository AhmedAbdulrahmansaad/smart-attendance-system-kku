-- =====================================================
-- 🔥 إصلاح جميع Foreign Keys - تطبيق فوري شامل
-- Fix All Foreign Keys - Complete Immediate Solution
-- =====================================================
-- 
-- المشكلة: جداول متعددة تشير إلى users بدلاً من profiles
-- Problem: Multiple tables reference users instead of profiles
-- 
-- ✅ نفّذ هذا الكود في Supabase SQL Editor
-- ✅ Execute this code in Supabase SQL Editor
--
-- =====================================================

-- 🔍 عرض جميع Foreign Keys التي تشير إلى users
-- Show all Foreign Keys pointing to users
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 1️⃣ إصلاح جدول enrollments
-- Fix enrollments table
-- =====================================================

-- حذف Foreign Key القديم لـ student_id
DO $$ 
BEGIN
    -- حذف جميع Foreign Keys المتعلقة بـ student_id
    DECLARE
        constraint_rec RECORD;
    BEGIN
        FOR constraint_rec IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'enrollments' 
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name LIKE '%student%'
        LOOP
            BEGIN
                EXECUTE 'ALTER TABLE enrollments DROP CONSTRAINT ' || constraint_rec.constraint_name;
                RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
            END;
        END LOOP;
    END;
END $$;

-- حذف Foreign Key القديم لـ course_id (إذا كان يشير لـ users)
DO $$ 
BEGIN
    DECLARE
        constraint_rec RECORD;
    BEGIN
        FOR constraint_rec IN 
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'enrollments' 
              AND tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'users'
        LOOP
            BEGIN
                EXECUTE 'ALTER TABLE enrollments DROP CONSTRAINT ' || constraint_rec.constraint_name;
                RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
            END;
        END LOOP;
    END;
END $$;

-- التأكد من وجود أعمدة enrollments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
          AND column_name = 'student_id'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN student_id UUID;
        RAISE NOTICE '✅ Added column: enrollments.student_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
          AND column_name = 'course_id'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN course_id UUID;
        RAISE NOTICE '✅ Added column: enrollments.course_id';
    END IF;
END $$;

-- إنشاء Foreign Keys جديدة لـ enrollments
DO $$ 
BEGIN
    -- student_id → profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'enrollments_student_id_fkey_profiles' 
          AND table_name = 'enrollments'
    ) THEN
        ALTER TABLE enrollments 
        ADD CONSTRAINT enrollments_student_id_fkey_profiles 
        FOREIGN KEY (student_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        RAISE NOTICE '✅ Created: enrollments.student_id → profiles(id)';
    END IF;

    -- course_id → courses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'enrollments_course_id_fkey_courses' 
          AND table_name = 'enrollments'
    ) THEN
        ALTER TABLE enrollments 
        ADD CONSTRAINT enrollments_course_id_fkey_courses 
        FOREIGN KEY (course_id) 
        REFERENCES courses(id) 
        ON DELETE CASCADE;
        RAISE NOTICE '✅ Created: enrollments.course_id → courses(id)';
    END IF;
END $$;

-- =====================================================
-- 2️⃣ إصلاح جدول courses
-- Fix courses table
-- =====================================================

-- حذف Foreign Keys القديمة في courses
DO $$ 
BEGIN
    DECLARE
        constraint_rec RECORD;
    BEGIN
        FOR constraint_rec IN 
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'courses' 
              AND tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'users'
        LOOP
            BEGIN
                EXECUTE 'ALTER TABLE courses DROP CONSTRAINT ' || constraint_rec.constraint_name;
                RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
            END;
        END LOOP;
    END;
END $$;

-- إنشاء Foreign Key جديد في courses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_instructor_id_fkey_profiles' 
          AND table_name = 'courses'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_instructor_id_fkey_profiles 
        FOREIGN KEY (instructor_id) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        RAISE NOTICE '✅ Created: courses.instructor_id → profiles(id)';
    END IF;
END $$;

-- =====================================================
-- 3️⃣ إصلاح جدول sessions
-- Fix sessions table
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) THEN
        -- حذف Foreign Keys القديمة
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'sessions' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'users'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE sessions DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;

        -- إنشاء Foreign Key جديد
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' 
              AND column_name = 'instructor_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'sessions_instructor_id_fkey_profiles' 
                  AND table_name = 'sessions'
            ) THEN
                ALTER TABLE sessions 
                ADD CONSTRAINT sessions_instructor_id_fkey_profiles 
                FOREIGN KEY (instructor_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
                RAISE NOTICE '✅ Created: sessions.instructor_id → profiles(id)';
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4️⃣ إصلاح جدول attendance
-- Fix attendance table
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'attendance'
    ) THEN
        -- حذف Foreign Keys القديمة
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'attendance' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'users'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE attendance DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;

        -- إنشاء Foreign Key جديد
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'attendance' 
              AND column_name = 'student_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'attendance_student_id_fkey_profiles' 
                  AND table_name = 'attendance'
            ) THEN
                ALTER TABLE attendance 
                ADD CONSTRAINT attendance_student_id_fkey_profiles 
                FOREIGN KEY (student_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
                RAISE NOTICE '✅ Created: attendance.student_id → profiles(id)';
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5️⃣ إصلاح جدول live_sessions
-- Fix live_sessions table
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
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'live_sessions' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'users'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE live_sessions DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;

        -- إنشاء Foreign Key جديد
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'live_sessions' 
              AND column_name = 'instructor_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'live_sessions_instructor_id_fkey_profiles' 
                  AND table_name = 'live_sessions'
            ) THEN
                ALTER TABLE live_sessions 
                ADD CONSTRAINT live_sessions_instructor_id_fkey_profiles 
                FOREIGN KEY (instructor_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
                RAISE NOTICE '✅ Created: live_sessions.instructor_id → profiles(id)';
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 6️⃣ إصلاح جدول live_session_participants
-- Fix live_session_participants table
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'live_session_participants'
    ) THEN
        -- حذف Foreign Keys القديمة
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'live_session_participants' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'users'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE live_session_participants DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;

        -- إنشاء Foreign Key جديد
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'live_session_participants' 
              AND column_name = 'student_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'live_session_participants_student_id_fkey_profiles' 
                  AND table_name = 'live_session_participants'
            ) THEN
                ALTER TABLE live_session_participants 
                ADD CONSTRAINT live_session_participants_student_id_fkey_profiles 
                FOREIGN KEY (student_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
                RAISE NOTICE '✅ Created: live_session_participants.student_id → profiles(id)';
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 7️⃣ إصلاح جدول notifications
-- Fix notifications table
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications'
    ) THEN
        -- حذف Foreign Keys القديمة
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'notifications' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'users'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;

        -- إنشاء Foreign Key جديد
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
              AND column_name = 'user_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'notifications_user_id_fkey_profiles' 
                  AND table_name = 'notifications'
            ) THEN
                ALTER TABLE notifications 
                ADD CONSTRAINT notifications_user_id_fkey_profiles 
                FOREIGN KEY (user_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
                RAISE NOTICE '✅ Created: notifications.user_id → profiles(id)';
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 8️⃣ إصلاح جدول device_sessions
-- Fix device_sessions table
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'device_sessions'
    ) THEN
        -- حذف Foreign Keys القديمة
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'device_sessions' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'users'
            LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE device_sessions DROP CONSTRAINT ' || constraint_rec.constraint_name;
                    RAISE NOTICE '✅ Dropped: %', constraint_rec.constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not drop: %', constraint_rec.constraint_name;
                END;
            END LOOP;
        END;

        -- إنشاء Foreign Key جديد
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'device_sessions' 
              AND column_name = 'user_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'device_sessions_user_id_fkey_profiles' 
                  AND table_name = 'device_sessions'
            ) THEN
                ALTER TABLE device_sessions 
                ADD CONSTRAINT device_sessions_user_id_fkey_profiles 
                FOREIGN KEY (user_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
                RAISE NOTICE '✅ Created: device_sessions.user_id → profiles(id)';
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- التحقق النهائي - عرض جميع Foreign Keys الجديدة
-- Final check - Display all new Foreign Keys
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
    AND tc.table_name IN ('enrollments', 'courses', 'sessions', 'attendance', 
                          'live_sessions', 'live_session_participants', 
                          'notifications', 'device_sessions')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- ✅ انتهى الإصلاح الشامل
-- ✅ Complete Fix Done
-- =====================================================

/*
النتيجة النهائية | Final Result:
--------------------------------------------------
جميع الجداول الآن تشير إلى profiles بدلاً من users:

✅ enrollments.student_id → profiles(id)
✅ enrollments.course_id → courses(id)
✅ courses.instructor_id → profiles(id)
✅ sessions.instructor_id → profiles(id)
✅ attendance.student_id → profiles(id)
✅ live_sessions.instructor_id → profiles(id)
✅ live_session_participants.student_id → profiles(id)
✅ notifications.user_id → profiles(id)
✅ device_sessions.user_id → profiles(id)

الآن يمكنك استخدام النظام بدون أخطاء! ✅
Now you can use the system without errors! ✅
*/
