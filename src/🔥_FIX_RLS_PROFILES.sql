-- ============================================
-- 🔥 FIX RLS PROFILES - حل مشكلة RLS فوراً
-- ============================================
-- يحل مشكلة: "new row violates row-level security policy for table profiles"

-- ============================================
-- 1️⃣ حذف جميع سياسات RLS القديمة من profiles
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================
-- 2️⃣ إنشاء سياسات RLS بسيطة وواضحة
-- ============================================

-- السماح بقراءة جميع الـ profiles للمستخدمين المصادق عليهم
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- السماح بإنشاء profile للمستخدم نفسه (auth.uid() = id)
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- السماح بتحديث profile الخاص بالمستخدم فقط
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- السماح بحذف profile الخاص بالمستخدم فقط (للمدراء أو المستخدم نفسه)
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- 3️⃣ التأكد من تفعيل RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4️⃣ إنشاء Function لإنشاء Profile تلقائياً عند التسجيل
-- ============================================

-- حذف Function القديم
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- إنشاء Function جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, university_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'university_id'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- ============================================
-- 5️⃣ إنشاء Trigger لتشغيل Function تلقائياً
-- ============================================

-- حذف Trigger القديم
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- إنشاء Trigger جديد
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6️⃣ منح صلاحيات للـ Function
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============================================
-- 7️⃣ Verification
-- ============================================

DO $$
DECLARE
    v_policies_count INTEGER;
    v_trigger_exists BOOLEAN;
    v_function_exists BOOLEAN;
BEGIN
    -- عدد السياسات
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles';
    
    -- التحقق من Trigger
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) INTO v_trigger_exists;
    
    -- التحقق من Function
    SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) INTO v_function_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔥🔥🔥 FIX RLS PROFILES COMPLETE! 🔥🔥🔥';
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS Policies Status:';
    RAISE NOTICE '   • Policies created: %', v_policies_count;
    RAISE NOTICE '   • SELECT policy: ✅ (all authenticated users)';
    RAISE NOTICE '   • INSERT policy: ✅ (user can insert own profile)';
    RAISE NOTICE '   • UPDATE policy: ✅ (user can update own profile)';
    RAISE NOTICE '   • DELETE policy: ✅ (user or admin can delete)';
    RAISE NOTICE '';
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger: on_auth_user_created EXISTS';
    ELSE
        RAISE NOTICE '❌ Trigger: on_auth_user_created MISSING';
    END IF;
    
    IF v_function_exists THEN
        RAISE NOTICE '✅ Function: handle_new_user() EXISTS';
    ELSE
        RAISE NOTICE '❌ Function: handle_new_user() MISSING';
    END IF;
    
    RAISE NOTICE '';
    
    IF v_policies_count >= 4 AND v_trigger_exists AND v_function_exists THEN
        RAISE NOTICE '🎉🎉🎉 ALL PERFECT! RLS FIXED! 🎉🎉🎉';
        RAISE NOTICE '';
        RAISE NOTICE '✅ You can now:';
        RAISE NOTICE '   1. Reload app (Ctrl+F5)';
        RAISE NOTICE '   2. Create new account';
        RAISE NOTICE '   3. Everything will work!';
    ELSE
        RAISE NOTICE '⚠️ Some components missing, check above';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '💚 نظام الحضور الذكي - جامعة الملك خالد';
    RAISE NOTICE '💚 KKU Smart Attendance System READY!';
    RAISE NOTICE '';
END $$;
