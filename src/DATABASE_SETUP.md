# 📊 King Khalid University Attendance System - Database Setup

## نظرة عامة | Overview

هذا الملف يحتوي على الـ SQL Schema الكامل لنظام الحضور الذكي. 
This file contains the complete SQL schema for the Smart Attendance System.

**⚠️ ملاحظة مهمة | Important Note:**
النظام الحالي يستخدم **KV Store** في Supabase (جدول key-value واحد) وهو مناسب للـ prototyping.
إذا أردت التحويل لجداول SQL حقيقية للإنتاج، اتبع التعليمات أدناه.

The current system uses **KV Store** in Supabase (a single key-value table) which is suitable for prototyping.
If you want to convert to real SQL tables for production, follow the instructions below.

---

## 📋 الجداول المطلوبة | Required Tables

### 1. Users Table (الموجود في Supabase Auth + metadata)

```sql
-- لا حاجة لإنشاء جدول users منفصل، Supabase Auth يوفره
-- User metadata stored in auth.users table
-- Additional profile data in profiles table below
```

### 2. Profiles Table (معلومات المستخدمين الإضافية)

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'supervisor')),
  university_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles(university_id);
```

### 3. Courses Table (المواد الدراسية)

```sql
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description TEXT,
  semester TEXT,
  year INTEGER DEFAULT 2025,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view courses" 
  ON public.courses FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can create courses" 
  ON public.courses FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Instructors can update their courses" 
  ON public.courses FOR UPDATE 
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Instructors can delete their courses" 
  ON public.courses FOR DELETE 
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(course_code);
```

### 4. Enrollments Table (تسجيل الطلاب في المواد)

```sql
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their enrollments" 
  ON public.enrollments FOR SELECT 
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses" 
  ON public.enrollments FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND instructor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Admins can manage enrollments" 
  ON public.enrollments FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
```

### 5. Sessions Table (جلسات الحضور والبث المباشر)

```sql
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  session_type TEXT NOT NULL CHECK (session_type IN ('attendance', 'live')) DEFAULT 'attendance',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  stream_active BOOLEAN DEFAULT false,
  viewers_count INTEGER DEFAULT 0,
  location TEXT,
  recording_url TEXT
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view active sessions" 
  ON public.sessions FOR SELECT 
  TO authenticated
  USING (active = true);

CREATE POLICY "Instructors can create sessions" 
  ON public.sessions FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage their sessions" 
  ON public.sessions FOR ALL 
  TO authenticated
  USING (created_by = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_course ON public.sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.sessions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_type ON public.sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);
```

### 6. Attendance Table (سجلات الحضور)

```sql
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')) DEFAULT 'present',
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  fingerprint_data TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  UNIQUE(student_id, session_id)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their attendance" 
  ON public.attendance FOR SELECT 
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can mark their attendance" 
  ON public.attendance FOR INSERT 
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can view attendance for their courses" 
  ON public.attendance FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND instructor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(marked_at);
```

### 7. Schedules Table (جداول المحاضرات)

```sql
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view schedules" 
  ON public.schedules FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can manage schedules for their courses" 
  ON public.schedules FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND instructor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_schedules_course ON public.schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON public.schedules(day_of_week);
```

---

## 🔄 Enable Realtime

```sql
-- Enable Realtime for sessions (for live stream updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- Enable Realtime for attendance (for real-time attendance updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
```

---

## 🔧 Functions & Triggers

### Auto-update updated_at

```sql
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON public.courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create profile on signup

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 📝 كيفية تطبيق الـ Schema | How to Apply Schema

### الطريقة 1: من خلال Supabase Dashboard

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اذهب إلى مشروعك
3. اضغط على **SQL Editor** من القائمة الجانبية
4. انسخ والصق كل الـ SQL أعلاه في محرر SQL
5. اضغط **Run** لتنفيذ الأوامر

### الطريقة 2: من خلال Supabase CLI

```bash
# إنشاء migration جديدة
supabase migration new setup_schema

# انسخ الـ SQL أعلاه في الملف المُنشأ
# ثم قم بتطبيقها:
supabase db push

# أو للتطبيق المباشر:
supabase db reset
```

---

## ⚙️ بعد تطبيق الـ Schema

بعد تطبيق الـ schema أعلاه، ستحتاج إلى:

1. **تحديث الكود** ليستخدم Supabase client للاتصال بالجداول بدلاً من KV store
2. **حذف** الاعتماد على `/supabase/functions/server/kv_store.tsx`
3. **استخدام** Supabase SDK مباشرة في Frontend والـ Backend

### مثال: جلب المواد (Courses)

**قبل (KV Store):**
```typescript
const courses = await kv.getByPrefix('course:');
```

**بعد (SQL Tables):**
```typescript
const { data: courses, error } = await supabase
  .from('courses')
  .select('*');
```

---

## 🔒 Security Notes

1. جميع الجداول محمية بـ **Row Level Security (RLS)**
2. كل مستخدم يرى فقط البيانات المسموح له برؤيتها
3. Admin لديه صلاحية كاملة
4. Instructor يرى فقط المواد والطلاب التابعين له
5. Student يرى فقط بياناته الشخصية ومواده المسجلة

---

## 📊 Views للتقارير (اختياري)

```sql
-- View: Attendance Summary per Student per Course
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
  e.student_id,
  p.full_name AS student_name,
  p.university_id,
  e.course_id,
  c.course_name,
  c.course_code,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT a.id) AS attended_sessions,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT s.id) > 0 
      THEN (COUNT(DISTINCT a.id)::DECIMAL / COUNT(DISTINCT s.id) * 100)
      ELSE 0 
    END, 2
  ) AS attendance_percentage
FROM enrollments e
JOIN profiles p ON e.student_id = p.id
JOIN courses c ON e.course_id = c.id
LEFT JOIN sessions s ON s.course_id = c.id AND s.session_type = 'attendance'
LEFT JOIN attendance a ON a.student_id = e.student_id AND a.session_id = s.id
WHERE e.status = 'active'
GROUP BY e.student_id, p.full_name, p.university_id, e.course_id, c.course_name, c.course_code;
```

---

## ✅ النظام الحالي (KV Store)

النظام الحالي يعمل بكفاءة باستخدام KV Store ولا يحتاج تغيير فوري. 
KV Store مناسب للـ:
- ✅ Prototyping سريع
- ✅ Testing
- ✅ Demo purposes

لكن للإنتاج الفعلي (Production)، يُفضل استخدام SQL tables أعلاه.

---

## 🆘 الدعم

إذا واجهت أي مشكلة أثناء التطبيق، تواصل معنا أو راجع:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**تم إنشاء هذا الملف في: 2025**  
**نظام الحضور الذكي - جامعة الملك خالد**
