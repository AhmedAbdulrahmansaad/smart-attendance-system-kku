-- =====================================================
-- إصلاح RLS البسيط - Simple RLS Fix
-- =====================================================

-- تعطيل RLS
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS live_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS device_fingerprints DISABLE ROW LEVEL SECURITY;

-- حذف Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;
DROP POLICY IF EXISTS "Allow all for service role" ON profiles;
DROP POLICY IF EXISTS "Everyone can view courses" ON courses;
DROP POLICY IF EXISTS "Instructors and admins can create courses" ON courses;
DROP POLICY IF EXISTS "Instructors can update their courses" ON courses;
DROP POLICY IF EXISTS "Allow all for service role" ON courses;
DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow all for service role" ON enrollments;
DROP POLICY IF EXISTS "Everyone can view active sessions" ON sessions;
DROP POLICY IF EXISTS "Instructors can create sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all for service role" ON sessions;
DROP POLICY IF EXISTS "Students can view their attendance" ON attendance;
DROP POLICY IF EXISTS "Students can record their attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all for service role" ON attendance;
DROP POLICY IF EXISTS "Everyone can view live sessions" ON live_sessions;
DROP POLICY IF EXISTS "Allow all for service role" ON live_sessions;
DROP POLICY IF EXISTS "Users can view their fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Allow all for service role" ON device_fingerprints;

-- منح الصلاحيات
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- رسالة النجاح
SELECT '✅ RLS Fixed Successfully!' as status;
