# 📊 Useful SQL Queries - نظام الحضور الذكي
## استعلامات SQL مفيدة

---

## 📋 جدول المحتويات

1. [التحقق من النظام](#التحقق-من-النظام)
2. [إدارة المستخدمين](#إدارة-المستخدمين)
3. [إدارة المواد](#إدارة-المواد)
4. [التسجيل والحضور](#التسجيل-والحضور)
5. [التقارير والإحصائيات](#التقارير-والإحصائيات)
6. [الصيانة والتنظيف](#الصيانة-والتنظيف)

---

## 1️⃣ التحقق من النظام

### التحقق من جميع الجداول
```sql
-- عرض جميع الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### عدد الجداول (يجب أن يكون 6)
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### التحقق من الفهارس (Indexes)
```sql
-- عرض جميع الفهارس
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- عدد الفهارس (يجب أن يكون > 20)
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';
```

### التحقق من RLS Policies
```sql
-- عرض جميع السياسات
SELECT 
  tablename, 
  policyname, 
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- عدد السياسات (يجب أن يكون > 20)
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- عدد السياسات لكل جدول
SELECT 
  tablename, 
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

### التحقق من Triggers
```sql
-- عرض جميع المحفزات
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- عدد المحفزات (يجب أن يكون 3)
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### التحقق من Views
```sql
-- عرض جميع الـ Views
SELECT 
  table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public';
```

---

## 2️⃣ إدارة المستخدمين

### عرض جميع المستخدمين
```sql
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  university_id,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
```

### عدد المستخدمين حسب الدور
```sql
SELECT 
  role, 
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;
```

### البحث عن مستخدم بالإيميل
```sql
SELECT * 
FROM public.profiles
WHERE email LIKE '%@kku.edu.sa';
```

### البحث عن طالب بالرقم الجامعي
```sql
SELECT * 
FROM public.profiles
WHERE university_id = '441234567';
```

### عرض جميع المدرسين
```sql
SELECT 
  id, 
  full_name, 
  email, 
  university_id
FROM public.profiles
WHERE role = 'instructor'
ORDER BY full_name;
```

### عرض جميع الطلاب
```sql
SELECT 
  id, 
  full_name, 
  email, 
  university_id
FROM public.profiles
WHERE role = 'student'
ORDER BY university_id;
```

### إنشاء مستخدم Admin (بعد إنشائه من Auth)
```sql
-- استبدل UUID-HERE بالـ UUID الحقيقي
INSERT INTO public.profiles (id, email, full_name, role) 
VALUES 
  ('UUID-HERE', 'admin@kku.edu.sa', 'مدير النظام', 'admin');
```

### إنشاء مدرس (بعد إنشائه من Auth)
```sql
-- استبدل UUID-HERE بالـ UUID الحقيقي
INSERT INTO public.profiles (id, email, full_name, role, university_id) 
VALUES 
  ('UUID-HERE', 'instructor@kku.edu.sa', 'د. أحمد علي', 'instructor', 'INS001');
```

### إنشاء طالب (بعد إنشائه من Auth)
```sql
-- استبدل UUID-HERE بالـ UUID الحقيقي
INSERT INTO public.profiles (id, email, full_name, role, university_id) 
VALUES 
  ('UUID-HERE', '441234567@kku.edu.sa', 'محمد حسن', 'student', '441234567');
```

### تحديث دور مستخدم
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'user@kku.edu.sa';
```

### حذف مستخدم (احذر!)
```sql
-- هذا سيحذف المستخدم وجميع بياناته المرتبطة
DELETE FROM public.profiles
WHERE id = 'user-uuid-here';
```

---

## 3️⃣ إدارة المواد

### عرض جميع المواد
```sql
SELECT 
  c.id,
  c.course_code,
  c.course_name,
  c.semester,
  c.year,
  p.full_name as instructor_name,
  p.email as instructor_email,
  c.created_at
FROM public.courses c
LEFT JOIN public.profiles p ON c.instructor_id = p.id
ORDER BY c.created_at DESC;
```

### عدد المواد حسب المدرس
```sql
SELECT 
  p.full_name as instructor_name,
  COUNT(c.id) as course_count
FROM public.profiles p
LEFT JOIN public.courses c ON p.id = c.instructor_id
WHERE p.role = 'instructor'
GROUP BY p.id, p.full_name
ORDER BY course_count DESC;
```

### البحث عن مادة بالكود
```sql
SELECT * 
FROM public.courses
WHERE course_code = 'CS101';
```

### إنشاء مادة جديدة
```sql
-- استبدل instructor-uuid بالـ UUID الحقيقي
INSERT INTO public.courses (course_code, course_name, instructor_id, semester, year) 
VALUES 
  ('CS101', 'مقدمة في علوم الحاسب', 'instructor-uuid', 'Fall 2025', 2025);
```

### تحديث مادة
```sql
UPDATE public.courses
SET 
  course_name = 'Introduction to Computer Science',
  semester = 'Spring 2025'
WHERE course_code = 'CS101';
```

### حذف مادة (احذر!)
```sql
-- هذا سيحذف المادة وجميع البيانات المرتبطة
DELETE FROM public.courses
WHERE id = 'course-uuid-here';
```

### المواد التي ليس لها مدرس
```sql
SELECT 
  course_code,
  course_name,
  semester,
  year
FROM public.courses
WHERE instructor_id IS NULL;
```

---

## 4️⃣ التسجيل والحضور

### عرض جميع التسجيلات
```sql
SELECT 
  e.id,
  s.full_name as student_name,
  s.university_id,
  c.course_code,
  c.course_name,
  e.enrolled_at,
  e.status
FROM public.enrollments e
JOIN public.profiles s ON e.student_id = s.id
JOIN public.courses c ON e.course_id = c.id
ORDER BY e.enrolled_at DESC;
```

### تسجيل طالب في مادة
```sql
-- استبدل student-uuid و course-uuid بالقيم الحقيقية
INSERT INTO public.enrollments (student_id, course_id, status) 
VALUES 
  ('student-uuid', 'course-uuid', 'active');
```

### عرض الطلاب المسجلين في مادة معينة
```sql
-- استبدل course-uuid
SELECT 
  p.full_name,
  p.email,
  p.university_id,
  e.enrolled_at,
  e.status
FROM public.enrollments e
JOIN public.profiles p ON e.student_id = p.id
WHERE e.course_id = 'course-uuid'
AND e.status = 'active'
ORDER BY p.full_name;
```

### عرض المواد التي سجل فيها طالب
```sql
-- استبدل student-uuid
SELECT 
  c.course_code,
  c.course_name,
  c.semester,
  c.year,
  i.full_name as instructor_name,
  e.enrolled_at,
  e.status
FROM public.enrollments e
JOIN public.courses c ON e.course_id = c.id
LEFT JOIN public.profiles i ON c.instructor_id = i.id
WHERE e.student_id = 'student-uuid'
ORDER BY e.enrolled_at DESC;
```

### عدد الطلاب في كل مادة
```sql
SELECT 
  c.course_code,
  c.course_name,
  COUNT(e.id) as student_count
FROM public.courses c
LEFT JOIN public.enrollments e ON c.id = e.course_id AND e.status = 'active'
GROUP BY c.id, c.course_code, c.course_name
ORDER BY student_count DESC;
```

### عرض جميع جلسات الحضور
```sql
SELECT 
  s.id,
  s.code as session_code,
  c.course_code,
  c.course_name,
  i.full_name as instructor_name,
  s.session_type,
  s.title,
  s.created_at,
  s.expires_at,
  s.active,
  s.stream_active
FROM public.sessions s
JOIN public.courses c ON s.course_id = c.id
JOIN public.profiles i ON s.created_by = i.id
ORDER BY s.created_at DESC;
```

### الجلسات النشطة حالياً
```sql
SELECT 
  s.code,
  c.course_name,
  s.session_type,
  s.expires_at
FROM public.sessions s
JOIN public.courses c ON s.course_id = c.id
WHERE s.active = true
AND s.expires_at > NOW()
ORDER BY s.created_at DESC;
```

### عرض سجلات الحضور
```sql
SELECT 
  a.id,
  s.full_name as student_name,
  s.university_id,
  c.course_code,
  c.course_name,
  a.status,
  a.marked_at,
  ses.code as session_code
FROM public.attendance a
JOIN public.profiles s ON a.student_id = s.id
JOIN public.courses c ON a.course_id = c.id
JOIN public.sessions ses ON a.session_id = ses.id
ORDER BY a.marked_at DESC;
```

### حضور طالب معين
```sql
-- استبدل student-uuid
SELECT 
  c.course_name,
  a.status,
  a.marked_at,
  ses.code
FROM public.attendance a
JOIN public.courses c ON a.course_id = c.id
JOIN public.sessions ses ON a.session_id = ses.id
WHERE a.student_id = 'student-uuid'
ORDER BY a.marked_at DESC;
```

---

## 5️⃣ التقارير والإحصائيات

### ملخص الحضور (باستخدام View)
```sql
-- عرض ملخص حضور جميع الطلاب
SELECT * FROM attendance_summary
ORDER BY attendance_percentage DESC;
```

### ملخص حضور طالب معين
```sql
-- استبدل student-uuid
SELECT * FROM attendance_summary
WHERE student_id = 'student-uuid'
ORDER BY attendance_percentage DESC;
```

### إحصائيات المواد (باستخدام View)
```sql
SELECT * FROM course_statistics
ORDER BY enrolled_students DESC;
```

### الطلاب الأكثر حضوراً
```sql
SELECT 
  student_name,
  university_id,
  AVG(attendance_percentage) as avg_attendance
FROM attendance_summary
GROUP BY student_id, student_name, university_id
HAVING AVG(attendance_percentage) >= 75
ORDER BY avg_attendance DESC;
```

### الطلاب الأقل حضوراً
```sql
SELECT 
  student_name,
  university_id,
  AVG(attendance_percentage) as avg_attendance
FROM attendance_summary
GROUP BY student_id, student_name, university_id
HAVING AVG(attendance_percentage) < 75
ORDER BY avg_attendance ASC;
```

### المواد الأكثر حضوراً
```sql
SELECT 
  course_name,
  course_code,
  AVG(attendance_percentage) as avg_attendance
FROM attendance_summary
GROUP BY course_id, course_name, course_code
ORDER BY avg_attendance DESC;
```

### عدد الجلسات لكل مادة
```sql
SELECT 
  c.course_code,
  c.course_name,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN s.session_type = 'live' THEN s.id END) as live_sessions,
  COUNT(DISTINCT CASE WHEN s.session_type = 'attendance' THEN s.id END) as attendance_sessions
FROM public.courses c
LEFT JOIN public.sessions s ON c.id = s.course_id
GROUP BY c.id, c.course_code, c.course_name
ORDER BY total_sessions DESC;
```

### تقرير شامل لمادة معينة
```sql
-- استبدل course-uuid
SELECT 
  c.course_code,
  c.course_name,
  c.semester,
  c.year,
  i.full_name as instructor_name,
  COUNT(DISTINCT e.student_id) as enrolled_students,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT a.id) as total_attendance_records,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT s.id) > 0 
      THEN (COUNT(DISTINCT a.id)::DECIMAL / COUNT(DISTINCT s.id) / COUNT(DISTINCT e.student_id) * 100)
      ELSE 0 
    END, 2
  ) as avg_attendance_rate
FROM public.courses c
LEFT JOIN public.profiles i ON c.instructor_id = i.id
LEFT JOIN public.enrollments e ON c.id = e.course_id AND e.status = 'active'
LEFT JOIN public.sessions s ON c.id = s.course_id
LEFT JOIN public.attendance a ON c.id = a.course_id
WHERE c.id = 'course-uuid'
GROUP BY c.id, c.course_code, c.course_name, c.semester, c.year, i.full_name;
```

### إحصائيات يومية للحضور
```sql
SELECT 
  DATE(marked_at) as attendance_date,
  COUNT(*) as total_attendance,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT course_id) as unique_courses
FROM public.attendance
WHERE marked_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(marked_at)
ORDER BY attendance_date DESC;
```

### إحصائيات شهرية للتسجيلات
```sql
SELECT 
  DATE_TRUNC('month', enrolled_at) as month,
  COUNT(*) as enrollments_count
FROM public.enrollments
GROUP BY DATE_TRUNC('month', enrolled_at)
ORDER BY month DESC;
```

---

## 6️⃣ الصيانة والتنظيف

### حذف الجلسات المنتهية
```sql
-- حذف الجلسات التي انتهت منذ أكثر من 7 أيام
DELETE FROM public.sessions
WHERE expires_at < NOW() - INTERVAL '7 days'
AND active = false;
```

### إلغاء تفعيل الجلسات المنتهية
```sql
-- إلغاء تفعيل الجلسات المنتهية
UPDATE public.sessions
SET active = false
WHERE expires_at < NOW()
AND active = true;
```

### حذف التسجيلات الملغاة القديمة
```sql
-- حذف التسجيلات الملغاة منذ أكثر من 6 أشهر
DELETE FROM public.enrollments
WHERE status = 'dropped'
AND enrolled_at < NOW() - INTERVAL '6 months';
```

### عرض حجم كل جدول
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### عرض الفهارس غير المستخدمة
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY tablename, indexname;
```

### إعادة بناء الفهارس (Reindex)
```sql
-- إعادة بناء فهارس جدول معين
REINDEX TABLE public.attendance;

-- إعادة بناء جميع الفهارس
REINDEX SCHEMA public;
```

### تحليل الجداول (ANALYZE)
```sql
-- تحليل جدول معين
ANALYZE public.attendance;

-- تحليل جميع الجداول
ANALYZE;
```

### تنظيف الجداول (VACUUM)
```sql
-- تنظيف جدول معين
VACUUM public.attendance;

-- تنظيف جميع الجداول
VACUUM;

-- تنظيف كامل
VACUUM FULL;
```

---

## 🔍 استعلامات متقدمة

### البحث عن طلاب لم يحضروا أي جلسة
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.university_id,
  COUNT(e.id) as enrolled_courses,
  COUNT(a.id) as attendance_count
FROM public.profiles p
JOIN public.enrollments e ON p.id = e.student_id
LEFT JOIN public.attendance a ON p.id = a.student_id
WHERE p.role = 'student'
AND e.status = 'active'
GROUP BY p.id, p.full_name, p.email, p.university_id
HAVING COUNT(a.id) = 0;
```

### مدرسين بدون مواد
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  COUNT(c.id) as course_count
FROM public.profiles p
LEFT JOIN public.courses c ON p.id = c.instructor_id
WHERE p.role = 'instructor'
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(c.id) = 0;
```

### مواد بدون طلاب
```sql
SELECT 
  c.id,
  c.course_code,
  c.course_name,
  COUNT(e.id) as student_count
FROM public.courses c
LEFT JOIN public.enrollments e ON c.id = e.course_id AND e.status = 'active'
GROUP BY c.id, c.course_code, c.course_name
HAVING COUNT(e.id) = 0;
```

### جلسات بدون حضور
```sql
SELECT 
  s.id,
  s.code,
  c.course_name,
  s.created_at,
  s.expires_at,
  COUNT(a.id) as attendance_count
FROM public.sessions s
JOIN public.courses c ON s.course_id = c.id
LEFT JOIN public.attendance a ON s.id = a.session_id
WHERE s.session_type = 'attendance'
GROUP BY s.id, s.code, c.course_name, s.created_at, s.expires_at
HAVING COUNT(a.id) = 0
ORDER BY s.created_at DESC;
```

---

## 📝 نصائح مهمة

### ⚠️ تحذيرات:
- **احذر** من استخدام `DELETE` بدون `WHERE`
- **احذف نسخة احتياطية** قبل أي عملية حذف كبيرة
- **اختبر** الاستعلامات أولاً باستخدام `SELECT` قبل `UPDATE` أو `DELETE`

### ✅ أفضل الممارسات:
- استخدم `EXPLAIN ANALYZE` لتحليل أداء الاستعلامات
- أنشئ Indexes على الأعمدة المستخدمة في `WHERE` و `JOIN`
- استخدم Views للاستعلامات المتكررة
- نظف البيانات القديمة بانتظام

### 🔧 للأداء:
```sql
-- تحليل استعلام
EXPLAIN ANALYZE
SELECT * FROM public.attendance WHERE student_id = 'uuid';

-- عرض الاستعلامات البطيئة
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

**📅 تم الإنشاء: ديسمبر 2025**  
**🎓 نظام الحضور الذكي - جامعة الملك خالد**
