-- =============================================================================
-- نظام الحضور الذكي لجامعة الملك خالد - قاعدة البيانات النظيفة
-- KKU Smart Attendance System - CLEAN Database Setup
-- بدون أي بيانات تجريبية - فقط الجداول والهيكل
-- =============================================================================

-- تفعيل الامتدادات
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- حذف الجداول القديمة إذا كانت موجودة (للبدء من جديد)
-- =============================================================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS device_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- حذف جميع الـ Indexes القديمة إذا كانت موجودة
DROP INDEX IF EXISTS idx_users_auth_id CASCADE;
DROP INDEX IF EXISTS idx_users_email CASCADE;
DROP INDEX IF EXISTS idx_users_university_id CASCADE;
DROP INDEX IF EXISTS idx_users_role CASCADE;
DROP INDEX IF EXISTS idx_device_sessions_user CASCADE;
DROP INDEX IF EXISTS idx_device_sessions_fingerprint CASCADE;
DROP INDEX IF EXISTS idx_device_sessions_active CASCADE;
DROP INDEX IF EXISTS idx_device_sessions_token CASCADE;
DROP INDEX IF EXISTS idx_courses_code CASCADE;
DROP INDEX IF EXISTS idx_courses_instructor CASCADE;
DROP INDEX IF EXISTS idx_courses_department CASCADE;
DROP INDEX IF EXISTS idx_enrollments_student CASCADE;
DROP INDEX IF EXISTS idx_enrollments_course CASCADE;
DROP INDEX IF EXISTS idx_schedules_course CASCADE;
DROP INDEX IF EXISTS idx_schedules_day CASCADE;
DROP INDEX IF EXISTS idx_sessions_course CASCADE;
DROP INDEX IF EXISTS idx_sessions_instructor CASCADE;
DROP INDEX IF EXISTS idx_sessions_code CASCADE;
DROP INDEX IF EXISTS idx_sessions_active CASCADE;
DROP INDEX IF EXISTS idx_sessions_type CASCADE;
DROP INDEX IF EXISTS idx_attendance_session CASCADE;
DROP INDEX IF EXISTS idx_attendance_student CASCADE;
DROP INDEX IF EXISTS idx_attendance_course CASCADE;
DROP INDEX IF EXISTS idx_attendance_status CASCADE;
DROP INDEX IF EXISTS idx_attendance_date CASCADE;
DROP INDEX IF EXISTS idx_notifications_user CASCADE;
DROP INDEX IF EXISTS idx_notifications_read CASCADE;
DROP INDEX IF EXISTS idx_notifications_created CASCADE;
DROP INDEX IF EXISTS idx_notifications_type CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_user CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_action CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_created CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_status CASCADE;
DROP INDEX IF EXISTS idx_system_settings_key CASCADE;
DROP INDEX IF EXISTS idx_system_settings_category CASCADE;

-- حذف Functions القديمة
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- 1. جدول المستخدين
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin', 'supervisor')),
    university_id TEXT UNIQUE,
    phone TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@kku\.edu\.sa$'),
    CONSTRAINT valid_university_id CHECK (
        (role = 'student' AND university_id ~ '^44[0-9]{7}$') OR
        (role != 'student')
    ),
    CONSTRAINT valid_name CHECK (length(trim(full_name)) >= 3)
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_university_id ON users(university_id) WHERE university_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'جدول المستخدمين - يحتوي على بيانات جميع مستخدمي النظام (طلاب، مدرسين، مدراء، مشرفين)';
COMMENT ON COLUMN users.university_id IS 'الرقم الجامعي - إلزامي للطلاب فقط (9 أرقام تبدأ بـ 44)';

-- =============================================================================
-- 2. جدول جلسات الأجهزة (منع تسجيل الدخول المتزامن)
-- =============================================================================
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_info JSONB,
    ip_address TEXT,
    location JSONB,
    session_token TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '12 hours'
);

CREATE INDEX idx_device_sessions_user ON device_sessions(user_id);
CREATE INDEX idx_device_sessions_fingerprint ON device_sessions(device_fingerprint);
CREATE INDEX idx_device_sessions_active ON device_sessions(is_active, expires_at);
CREATE INDEX idx_device_sessions_token ON device_sessions(session_token);

COMMENT ON TABLE device_sessions IS 'جدول جلسات الأجهزة - لمنع تسجيل الدخول المتزامن وتتبع أمان الحسابات';

-- =============================================================================
-- 3. جدول المقررات
-- =============================================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT UNIQUE NOT NULL,
    course_name TEXT NOT NULL,
    course_name_ar TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department TEXT,
    semester TEXT,
    academic_year TEXT,
    credit_hours INTEGER DEFAULT 3,
    max_students INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_course_code CHECK (length(trim(course_code)) >= 3),
    CONSTRAINT valid_credit_hours CHECK (credit_hours > 0 AND credit_hours <= 6)
);

CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_department ON courses(department);

COMMENT ON TABLE courses IS 'جدول المقررات الدراسية';

-- =============================================================================
-- 4. جدول التسجيل في المقررات
-- =============================================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    grade TEXT,
    
    CONSTRAINT unique_enrollment UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

COMMENT ON TABLE enrollments IS 'جدول تسجيل الطلاب في المقررات';

-- =============================================================================
-- 5. جدول الجداول الدراسية
-- =============================================================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    building TEXT,
    room_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_schedules_course ON schedules(course_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);

COMMENT ON TABLE schedules IS 'جدول مواعيد المحاضرات الأسبوعية';

-- =============================================================================
-- 6. جدول الجلسات (الحضور والبث المباشر)
-- =============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('attendance', 'live', 'hybrid')),
    title TEXT,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 15,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    stream_active BOOLEAN DEFAULT false,
    stream_url TEXT,
    recording_url TEXT,
    viewers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 180)
);

CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_sessions_instructor ON sessions(instructor_id);
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_active ON sessions(is_active);
CREATE INDEX idx_sessions_type ON sessions(session_type);

COMMENT ON TABLE sessions IS 'جدول الجلسات الدراسية (حضور عادي، بث مباشر، هجين)';

-- =============================================================================
-- 7. جدول سجلات الحضور
-- =============================================================================
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    attendance_status TEXT DEFAULT 'present' CHECK (attendance_status IN ('present', 'late', 'absent', 'excused')),
    verification_method TEXT CHECK (verification_method IN ('code', 'fingerprint', 'qr', 'face', 'live_session')),
    device_fingerprint TEXT NOT NULL,
    ip_address TEXT,
    location JSONB,
    notes TEXT,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_attendance UNIQUE (session_id, student_id)
);

CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_status ON attendance_records(attendance_status);
CREATE INDEX idx_attendance_date ON attendance_records(check_in_time);

COMMENT ON TABLE attendance_records IS 'جدول سجلات حضور الطلاب';

-- =============================================================================
-- 8. جدول الإشعارات
-- =============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    message TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('session_started', 'attendance_reminder', 'grade_posted', 'announcement', 'system')),
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

COMMENT ON TABLE notifications IS 'جدول الإشعارات للمستخدمين';

-- =============================================================================
-- 9. جدول سجلات النشاط والأمان
-- =============================================================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    log_status TEXT CHECK (log_status IN ('success', 'failed', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_status ON activity_logs(log_status);

COMMENT ON TABLE activity_logs IS 'جدول سجلات النشاط والأمان لتتبع جميع العمليات';

-- =============================================================================
-- 10. جدول إعدادات النظام
-- =============================================================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

COMMENT ON TABLE system_settings IS 'جدول إعدادات النظام العامة';

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة على الجداول
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- سياسات المستخدمين
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY users_select_admin ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'supervisor'))
);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY users_insert_on_signup ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- سياسات المقررات
CREATE POLICY courses_select_all ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY courses_insert_instructor ON courses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor'))
);
CREATE POLICY courses_update_own ON courses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND (u.role = 'admin' OR u.id = courses.instructor_id))
);
CREATE POLICY courses_delete_admin ON courses FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
);

-- سياسات التسجيلات
CREATE POLICY enrollments_select_own ON enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = enrollments.student_id)
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor', 'supervisor'))
);
CREATE POLICY enrollments_insert_student ON enrollments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = enrollments.student_id)
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor'))
);
CREATE POLICY enrollments_delete_admin ON enrollments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor'))
);

-- سياسات الجداول الدراسية
CREATE POLICY schedules_select_all ON schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY schedules_insert_instructor ON schedules FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor'))
);

-- سياسات الجلسات
CREATE POLICY sessions_select_all ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY sessions_insert_instructor ON sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor'))
);
CREATE POLICY sessions_update_instructor ON sessions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND (u.role = 'admin' OR u.id = sessions.instructor_id))
);

-- سياسات سجلات الحضور
CREATE POLICY attendance_select_own ON attendance_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = attendance_records.student_id)
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor', 'supervisor'))
);
CREATE POLICY attendance_insert_student ON attendance_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = attendance_records.student_id)
);
CREATE POLICY attendance_update_instructor ON attendance_records FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'instructor'))
);

-- سياسات الإشعارات
CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = notifications.user_id)
);
CREATE POLICY notifications_insert_system ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = notifications.user_id)
);

-- سياسات سجلات النشاط
CREATE POLICY activity_logs_select_admin ON activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'supervisor'))
);
CREATE POLICY activity_logs_insert_all ON activity_logs FOR INSERT WITH CHECK (true);

-- سياسات جلسات الأجهزة
CREATE POLICY device_sessions_select_own ON device_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = device_sessions.user_id)
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY device_sessions_insert_own ON device_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = device_sessions.user_id)
);
CREATE POLICY device_sessions_update_own ON device_sessions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.id = device_sessions.user_id)
);

-- سياسات إعدادات النظام
CREATE POLICY system_settings_select_all ON system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY system_settings_modify_admin ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
);

-- =============================================================================
-- إدراج الإعدادات الافتراضية للنظام فقط
-- =============================================================================

INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
    ('attendance_code_duration', '{"value": 15, "unit": "minutes"}', 'مدة صلاحية كود الحضور الافتراضية', 'attendance'),
    ('session_timeout', '{"value": 12, "unit": "hours"}', 'مدة انتهاء جلسة المستخدم', 'security'),
    ('max_concurrent_sessions', '{"value": 1}', 'عدد الجلسات المتزامنة المسموح بها', 'security'),
    ('late_arrival_threshold', '{"value": 15, "unit": "minutes"}', 'الحد الأقصى للتأخير قبل اعتباره غياب', 'attendance'),
    ('enable_device_fingerprint', '{"value": true}', 'تفعيل بصمة الجهاز للأمان', 'security'),
    ('enable_realtime_notifications', '{"value": true}', 'تفعيل الإشعارات الفورية', 'notifications')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- تم الانتهاء! قاعدة البيانات جاهزة ونظيفة
-- =============================================================================

-- عرض ملخص الجداول المنشأة
SELECT 
    table_name as "اسم الجدول",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "عدد الأعمدة"
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

COMMENT ON DATABASE postgres IS 'قاعدة بيانات نظام الحضور الذكي - جامعة الملك خالد';