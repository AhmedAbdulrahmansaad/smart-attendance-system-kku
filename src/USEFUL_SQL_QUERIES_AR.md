# 📊 استعلامات SQL مفيدة
## Useful SQL Queries - نظام الحضور الذكي

<div dir="rtl">

---

## 🎯 الهدف
استعلامات SQL جاهزة للتنفيذ لعرض ومراقبة البيانات

---

## 📋 الفهرس

1. [عرض المستخدمين](#1-عرض-المستخدمين)
2. [عرض المقررات](#2-عرض-المقررات)
3. [عرض التسجيلات](#3-عرض-التسجيلات)
4. [عرض الجلسات النشطة](#4-عرض-الجلسات-النشطة)
5. [عرض سجلات الحضور](#5-عرض-سجلات-الحضور)
6. [التقارير والإحصائيات](#6-التقارير-والإحصائيات)
7. [مراقبة الأمان](#7-مراقبة-الأمان)

---

## 1. عرض المستخدمين

### 1.1 عرض جميع المستخدمين النشطين

```sql
SELECT 
  full_name as "الاسم",
  email as "البريد الإلكتروني",
  CASE role
    WHEN 'admin' THEN 'مدير'
    WHEN 'instructor' THEN 'مدرس'
    WHEN 'student' THEN 'طالب'
    WHEN 'supervisor' THEN 'مشرف'
  END as "الدور",
  university_id as "الرقم الجامعي",
  department as "القسم",
  created_at as "تاريخ الإنشاء"
FROM users
WHERE status = 'active'
ORDER BY role, created_at DESC;
```

### 1.2 عدد المستخدمين حسب الدور

```sql
SELECT 
  CASE role
    WHEN 'admin' THEN 'مدير'
    WHEN 'instructor' THEN 'مدرس'
    WHEN 'student' THEN 'طالب'
    WHEN 'supervisor' THEN 'مشرف'
  END as "الدور",
  COUNT(*) as "العدد"
FROM users
WHERE status = 'active'
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'instructor' THEN 2
    WHEN 'supervisor' THEN 3
    WHEN 'student' THEN 4
  END;
```

### 1.3 البحث عن طالب بالرقم الجامعي

```sql
SELECT 
  full_name as "الاسم",
  email as "البريد",
  university_id as "الرقم الجامعي",
  department as "القسم",
  phone as "الجوال",
  created_at as "تاريخ التسجيل"
FROM users
WHERE university_id = '441234567';
```

---

## 2. عرض المقررات

### 2.1 جميع المقررات النشطة

```sql
SELECT 
  c.course_code as "رمز المقرر",
  c.course_name_ar as "اسم المقرر",
  u.full_name as "المدرس",
  c.department as "القسم",
  c.credit_hours as "الساعات",
  (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as "عدد الطلاب",
  c.max_students as "الحد الأقصى"
FROM courses c
LEFT JOIN users u ON u.id = c.instructor_id
WHERE c.status = 'active'
ORDER BY c.course_code;
```

### 2.2 مقررات مدرس معين

```sql
-- استبدل البريد الإلكتروني
SELECT 
  c.course_code as "رمز المقرر",
  c.course_name_ar as "اسم المقرر",
  c.semester as "الفصل",
  c.academic_year as "السنة الأكاديمية",
  (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as "عدد الطلاب"
FROM courses c
JOIN users u ON u.id = c.instructor_id
WHERE u.email = 'instructor@kku.edu.sa'
  AND c.status = 'active'
ORDER BY c.course_code;
```

### 2.3 مقررات طالب معين

```sql
-- استبدل الرقم الجامعي
SELECT 
  c.course_code as "رمز المقرر",
  c.course_name_ar as "اسم المقرر",
  u.full_name as "المدرس",
  e.enrolled_at as "تاريخ التسجيل"
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN users u ON u.id = c.instructor_id
JOIN users s ON s.id = e.student_id
WHERE s.university_id = '441234567'
  AND e.status = 'active'
ORDER BY c.course_code;
```

---

## 3. عرض التسجيلات

### 3.1 جميع طلاب مقرر معين

```sql
-- استبدل رمز المقرر
SELECT 
  u.full_name as "اسم الطالب",
  u.university_id as "الرقم الجامعي",
  u.email as "البريد",
  e.enrolled_at as "تاريخ التسجيل",
  COALESCE(
    (SELECT COUNT(*) 
     FROM attendance_records ar
     WHERE ar.student_id = u.id 
       AND ar.course_id = c.id
       AND ar.status IN ('present', 'late')
    ), 0
  ) as "عدد الحضور"
FROM enrollments e
JOIN users u ON u.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE c.course_code = 'CS101'
  AND e.status = 'active'
ORDER BY u.full_name;
```

---

## 4. عرض الجلسات النشطة

### 4.1 جلسات الأجهزة النشطة حالياً

```sql
SELECT 
  u.full_name as "المستخدم",
  u.email as "البريد",
  CASE u.role
    WHEN 'admin' THEN 'مدير'
    WHEN 'instructor' THEN 'مدرس'
    WHEN 'student' THEN 'طالب'
    WHEN 'supervisor' THEN 'مشرف'
  END as "الدور",
  ds.device_info->>'summary' as "الجهاز",
  ds.ip_address as "عنوان IP",
  ds.last_activity as "آخر نشاط",
  EXTRACT(EPOCH FROM (ds.expires_at - NOW()))/3600 as "الساعات المتبقية"
FROM device_sessions ds
JOIN users u ON u.id = ds.user_id
WHERE ds.is_active = true 
  AND ds.expires_at > NOW()
ORDER BY ds.last_activity DESC;
```

### 4.2 جلسات دراسية نشطة

```sql
SELECT 
  c.course_code as "رمز المقرر",
  c.course_name_ar as "اسم المقرر",
  s.title as "عنوان الجلسة",
  s.code as "رمز الحضور",
  u.full_name as "المدرس",
  s.start_time as "وقت البدء",
  s.duration_minutes as "المدة (دقائق)",
  CASE 
    WHEN s.end_time > NOW() THEN 'نشطة'
    ELSE 'منتهية'
  END as "الحالة"
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN users u ON u.id = s.instructor_id
WHERE s.is_active = true
ORDER BY s.start_time DESC;
```

---

## 5. عرض سجلات الحضور

### 5.1 حضور جلسة معينة

```sql
-- استبدل رمز الجلسة
WITH session_info AS (
  SELECT id FROM sessions WHERE code = 'ABC123'
)
SELECT 
  u.full_name as "الطالب",
  u.university_id as "الرقم الجامعي",
  ar.check_in_time as "وقت التسجيل",
  CASE ar.status
    WHEN 'present' THEN 'حاضر'
    WHEN 'late' THEN 'متأخر'
    WHEN 'absent' THEN 'غائب'
    WHEN 'excused' THEN 'غائب بعذر'
  END as "الحالة",
  ar.ip_address as "عنوان IP",
  LEFT(ar.device_fingerprint, 16) || '...' as "بصمة الجهاز"
FROM attendance_records ar
JOIN users u ON u.id = ar.student_id
WHERE ar.session_id = (SELECT id FROM session_info)
ORDER BY ar.check_in_time;
```

### 5.2 سجل حضور طالب معين

```sql
-- استبدل الرقم الجامعي
SELECT 
  c.course_name_ar as "المقرر",
  s.title as "الجلسة",
  ar.check_in_time as "وقت التسجيل",
  CASE ar.status
    WHEN 'present' THEN 'حاضر'
    WHEN 'late' THEN 'متأخر'
    WHEN 'absent' THEN 'غائب'
  END as "الحالة",
  ar.verification_method as "طريقة التحقق"
FROM attendance_records ar
JOIN users u ON u.id = ar.student_id
JOIN courses c ON c.id = ar.course_id
JOIN sessions s ON s.id = ar.session_id
WHERE u.university_id = '441234567'
ORDER BY ar.check_in_time DESC;
```

---

## 6. التقارير والإحصائيات

### 6.1 نسبة الحضور لكل مقرر (من View)

```sql
SELECT 
  course_name as "المقرر",
  total_students as "عدد الطلاب",
  total_sessions as "عدد الجلسات",
  total_present as "مرات الحضور",
  attendance_percentage || '%' as "نسبة الحضور"
FROM course_attendance_stats
ORDER BY attendance_percentage DESC;
```

### 6.2 ملخص حضور طالب (من View)

```sql
-- استبدل الرقم الجامعي
SELECT 
  course_name as "المقرر",
  total_sessions as "إجمالي الجلسات",
  sessions_attended as "الحضور",
  sessions_late as "متأخر",
  sessions_absent as "الغياب",
  attendance_percentage || '%' as "النسبة"
FROM student_attendance_summary
WHERE university_id = '441234567'
ORDER BY attendance_percentage DESC;
```

### 6.3 أفضل 10 طلاب في الحضور

```sql
SELECT 
  student_name as "الطالب",
  university_id as "الرقم الجامعي",
  AVG(attendance_percentage) as "متوسط الحضور ٪"
FROM student_attendance_summary
GROUP BY student_id, student_name, university_id
HAVING AVG(attendance_percentage) > 0
ORDER BY "متوسط الحضور ٪" DESC
LIMIT 10;
```

### 6.4 الطلاب الذين نسبة حضورهم أقل من 75%

```sql
SELECT 
  student_name as "الطالب",
  university_id as "الرقم الجامعي",
  course_name as "المقرر",
  attendance_percentage || '%' as "نسبة الحضور",
  sessions_absent as "الغياب"
FROM student_attendance_summary
WHERE attendance_percentage < 75
ORDER BY attendance_percentage ASC;
```

---

## 7. مراقبة الأمان

### 7.1 سجل نشاط آخر 24 ساعة

```sql
SELECT 
  al.created_at as "الوقت",
  u.full_name as "المستخدم",
  al.action as "النشاط",
  CASE al.status
    WHEN 'success' THEN 'نجح'
    WHEN 'failed' THEN 'فشل'
    WHEN 'blocked' THEN 'محظور'
  END as "الحالة",
  al.ip_address as "IP",
  LEFT(al.device_fingerprint, 16) || '...' as "البصمة"
FROM activity_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 50;
```

### 7.2 محاولات تسجيل دخول فاشلة

```sql
SELECT 
  created_at as "الوقت",
  details->>'email' as "البريد المستخدم",
  ip_address as "عنوان IP",
  LEFT(device_fingerprint, 16) || '...' as "بصمة الجهاز",
  details->>'reason' as "السبب"
FROM activity_logs
WHERE action IN ('login_failed', 'login_blocked')
  AND status IN ('failed', 'blocked')
ORDER BY created_at DESC
LIMIT 20;
```

### 7.3 كشف نشاط مشبوه

```sql
-- المستخدمون الذين دخلوا من أجهزة متعددة في وقت قصير
SELECT 
  u.full_name as "المستخدم",
  u.email as "البريد",
  COUNT(DISTINCT ds.device_fingerprint) as "عدد الأجهزة",
  COUNT(DISTINCT ds.ip_address) as "عدد IP مختلفة",
  ARRAY_AGG(DISTINCT ds.ip_address) as "قائمة IP"
FROM users u
JOIN device_sessions ds ON ds.user_id = u.id
WHERE ds.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.id, u.full_name, u.email
HAVING COUNT(DISTINCT ds.device_fingerprint) > 2
   OR COUNT(DISTINCT ds.ip_address) > 3
ORDER BY "عدد الأجهزة" DESC;
```

### 7.4 عرض الإشعارات غير المقروءة

```sql
SELECT 
  u.full_name as "المستخدم",
  COUNT(*) as "عدد الإشعارات"
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.is_read = false
GROUP BY u.id, u.full_name
ORDER BY COUNT(*) DESC;
```

---

## 📊 استعلامات إدارية مفيدة

### 1. حجم قاعدة البيانات

```sql
SELECT 
  table_name as "الجدول",
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::text)) as "الحجم"
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)::text) DESC;
```

### 2. عدد السجلات في كل جدول

```sql
SELECT 
  'users' as "الجدول",
  COUNT(*) as "العدد"
FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'device_sessions', COUNT(*) FROM device_sessions
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings;
```

### 3. آخر تحديث لكل جدول

```sql
SELECT 
  schemaname as "Schema",
  tablename as "الجدول",
  last_vacuum as "آخر Vacuum",
  last_autovacuum as "آخر Auto-Vacuum",
  last_analyze as "آخر Analyze",
  last_autoanalyze as "آخر Auto-Analyze"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 4. الفهارس الموجودة

```sql
SELECT 
  tablename as "الجدول",
  indexname as "اسم الفهرس",
  indexdef as "التعريف"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 🔧 استعلامات الصيانة

### 1. تحسين أداء الجداول

```sql
-- تنفيذ VACUUM ANALYZE لجميع الجداول
VACUUM ANALYZE users;
VACUUM ANALYZE courses;
VACUUM ANALYZE enrollments;
VACUUM ANALYZE sessions;
VACUUM ANALYZE attendance_records;
VACUUM ANALYZE device_sessions;
VACUUM ANALYZE notifications;
VACUUM ANALYZE activity_logs;
```

### 2. حذف الجلسات المنتهية

```sql
-- حذف جلسات الأجهزة المنتهية (أقدم من 30 يوم)
DELETE FROM device_sessions
WHERE expires_at < NOW() - INTERVAL '30 days';

-- حذف سجلات النشاط القديمة (أقدم من 90 يوم)
DELETE FROM activity_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- حذف الإشعارات المقروءة القديمة (أقدم من 30 يوم)
DELETE FROM notifications
WHERE is_read = true 
  AND read_at < NOW() - INTERVAL '30 days';
```

---

## 💡 نصائح

### استخدام EXPLAIN لتحليل الأداء:

```sql
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'student@kku.edu.sa';
```

### استخدام COPY لتصدير البيانات:

```sql
-- تصدير المستخدمين إلى CSV
COPY (
  SELECT * FROM users WHERE status = 'active'
) TO '/tmp/users.csv' WITH CSV HEADER;
```

### النسخ الاحتياطي:

```sql
-- في Supabase Dashboard:
-- Settings → Database → Backups → Create Backup
```

---

## 📞 ملاحظات

- جميع الاستعلامات اختُبرت على قاعدة البيانات الحقيقية
- يمكن تنفيذها مباشرة في Supabase SQL Editor
- استبدل القيم الموضوعة بين علامات تنصيص حسب الحاجة
- تأكد من الصلاحيات قبل تنفيذ استعلامات الحذف

---

<div align="center">

**جميع الاستعلامات جاهزة للاستخدام! 📊**

[🎯 دليل التطبيق](/🎯_دليل_التطبيق_الشامل_للدكتورة_المشرفة.md) | 
[📚 README](/🌟_README_FINAL_COMPLETE.md)

</div>

</div>
