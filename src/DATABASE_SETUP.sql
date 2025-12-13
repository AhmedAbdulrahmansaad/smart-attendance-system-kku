-- ============================================
-- KKU Smart Attendance System - Database Setup
-- جامعة الملك خالد - نظام الحضور الذكي
-- ============================================

-- 🗑️ حذف الجداول القديمة إذا كانت موجودة (بترتيب عكسي)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1️⃣ جدول المستخدمين (Profiles)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'supervisor')),
    university_id TEXT UNIQUE,
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index للبحث السريع
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_university_id ON profiles(university_id);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

COMMENT ON TABLE profiles IS 'جدول بيانات المستخدمين - الطلاب والمدرسين والإداريين';
COMMENT ON COLUMN profiles.role IS 'دور المستخدم: admin, instructor, student, supervisor';
COMMENT ON COLUMN profiles.university_id IS 'الرقم الجامعي (9 أرقام للطلاب، اختياري للآخرين)';

-- ============================================
-- 2️⃣ جدول المقررات (Courses)
-- ============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department TEXT,
    credits INTEGER DEFAULT 3,
    semester TEXT NOT NULL CHECK (semester IN ('Fall', 'Spring', 'Summer')),
    year TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_code, semester, year)
);

-- Indexes للأداء
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_semester_year ON courses(semester, year);
CREATE INDEX idx_courses_is_active ON courses(is_active);

COMMENT ON TABLE courses IS 'جدول المقررات الدراسية';
COMMENT ON COLUMN courses.semester IS 'الفصل الدراسي: Fall, Spring, Summer';
COMMENT ON COLUMN courses.year IS 'السنة الدراسية: 2024, 2025, إلخ';

-- ============================================
-- 3️⃣ جدول التسجيل في المقررات (Enrollments)
-- ============================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    UNIQUE(student_id, course_id)
);

-- Indexes للأداء العالي
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_enrollments_course_status ON enrollments(course_id, status);

COMMENT ON TABLE enrollments IS 'جدول تسجيل الطلاب في المقررات';

-- ============================================
-- 4️⃣ جدول جلسات الحضور (Sessions)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    session_type TEXT DEFAULT 'attendance' CHECK (session_type IN ('attendance', 'live')),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    meeting_url TEXT,
    viewers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_active ON sessions(active);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_type ON sessions(session_type);
CREATE INDEX idx_sessions_course_active ON sessions(course_id, active);
CREATE INDEX idx_sessions_course_date ON sessions(course_id, session_date);

COMMENT ON TABLE sessions IS 'جدول جلسات الحضور (حضور عادي أو بث مباشر)';
COMMENT ON COLUMN sessions.code IS 'كود الجلسة الفريد (6 أحرف)';
COMMENT ON COLUMN sessions.session_type IS 'نوع الجلسة: attendance (حضور) أو live (بث مباشر)';

-- ============================================
-- 5️⃣ جدول سجلات الحضور (Attendance)
-- ============================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    method TEXT CHECK (method IN ('code', 'fingerprint', 'nfc', 'live_session')),
    device_info JSONB,
    location_info JSONB,
    notes TEXT,
    UNIQUE(session_id, student_id)
);

-- Indexes للأداء الممتاز
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_date ON attendance(recorded_at);
CREATE INDEX idx_attendance_student_course ON attendance(student_id, course_id);
CREATE INDEX idx_attendance_course_status ON attendance(course_id, status);
CREATE INDEX idx_attendance_student_status ON attendance(student_id, status);

COMMENT ON TABLE attendance IS 'جدول سجلات الحضور';
COMMENT ON COLUMN attendance.method IS 'طريقة التسجيل: code, fingerprint, nfc, live_session';

-- ============================================
-- 6️⃣ Triggers لتحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7️⃣ Row Level Security (RLS) - الأمان المتقدم
-- ============================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ===== Profiles Policies =====
-- الجميع يمكنهم قراءة الملفات الشخصية
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);

-- المستخدم يمكنه تحديث ملفه الشخصي فقط
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- المسؤولون يمكنهم إدراج مستخدمين جدد
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== Courses Policies =====
-- الجميع يمكنهم قراءة المقررات
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);

-- المدرسون والمسؤولون يمكنهم إنشاء مقررات
CREATE POLICY "Instructors and admins can insert courses" ON courses FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin', 'supervisor')
        )
    );

-- المدرس يمكنه تحديث مقرراته فقط، والمسؤول يمكنه تحديث أي مقرر
CREATE POLICY "Instructors can update own courses" ON courses FOR UPDATE 
    USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- المدرس يمكنه حذف مقرراته فقط، والمسؤول يمكنه حذف أي مقرر
CREATE POLICY "Instructors can delete own courses" ON courses FOR DELETE 
    USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- ===== Enrollments Policies =====
-- الجميع يمكنهم قراءة التسجيلات (لفحص التسجيل)
CREATE POLICY "Anyone can view enrollments" ON enrollments FOR SELECT USING (true);

-- المدرسون والمسؤولون يمكنهم تسجيل الطلاب
CREATE POLICY "Instructors can insert enrollments" ON enrollments FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin', 'supervisor')
        )
    );

-- المدرسون والمسؤولون يمكنهم حذف التسجيلات
CREATE POLICY "Instructors can delete enrollments" ON enrollments FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin', 'supervisor')
        )
    );

-- ===== Sessions Policies =====
-- الجميع يمكنهم قراءة الجلسات
CREATE POLICY "Anyone can view sessions" ON sessions FOR SELECT USING (true);

-- المدرسون يمكنهم إنشاء جلسات لمقرراتهم
CREATE POLICY "Instructors can insert sessions" ON sessions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- المدرسون يمكنهم تحديث جلساتهم
CREATE POLICY "Instructors can update sessions" ON sessions FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- المدرسون يمكنهم حذف جلساتهم
CREATE POLICY "Instructors can delete sessions" ON sessions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- ===== Attendance Policies =====
-- الجميع يمكنهم قراءة سجلات الحضور
CREATE POLICY "Anyone can view attendance" ON attendance FOR SELECT USING (true);

-- الطلاب يمكنهم تسجيل حضورهم
CREATE POLICY "Students can insert own attendance" ON attendance FOR INSERT 
    WITH CHECK (student_id = auth.uid());

-- المدرسون يمكنهم تسجيل الحضور لطلابهم
CREATE POLICY "Instructors can insert attendance" ON attendance FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- المدرسون يمكنهم تحديث سجلات الحضور
CREATE POLICY "Instructors can update attendance" ON attendance FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- ============================================
-- 8️⃣ بيانات تجريبية (Optional - يمكنك حذفها)
-- ============================================

-- مستخدم مسؤول (Admin) - يتم إنشاؤه بعد التسجيل الأول
-- INSERT INTO profiles (id, email, full_name, role, is_active)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'admin@kku.edu.sa', 'System Admin', 'admin', true);

-- ============================================
-- ✅ انتهى! Database Setup Complete!
-- ============================================

-- للتحقق من الجداول:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- للتحقق من الـ Indexes:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- للتحقق من الـ Policies:
-- SELECT tablename, policyname FROM pg_policies;
