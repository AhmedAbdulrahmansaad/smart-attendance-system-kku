# 🗄️ دليل التحقق من قاعدة البيانات

<div align="center">

![Database](https://img.shields.io/badge/database-supabase-green?style=for-the-badge&logo=supabase)
![Status](https://img.shields.io/badge/status-configured-success?style=for-the-badge)

**دليل شامل للتحقق من تكوين قاعدة البيانات وجاهزيتها**

</div>

---

## 📋 نظرة عامة

نظام الحضور الذكي يستخدم **Supabase** مع معماريّة KV Store (Key-Value) بسيطة وفعّالة.

### لماذا KV Store؟

- ✅ **بساطة**: جدول واحد يخزن كل شيء
- ✅ **مرونة**: لا حاجة لـ migrations معقدة
- ✅ **سرعة**: أداء ممتاز للنماذج الأولية
- ✅ **سهولة الصيانة**: لا schema معقد

---

## 🔍 التحقق من التكوين الحالي

### الخطوة 1: فحص الاتصال

افتح Console المتصفح (F12) وابحث عن:

```
✅ Supabase connection successful
```

إذا رأيت:
```
❌ Supabase not configured
```

اتبع الخطوات في [GITHUB_SETUP_GUIDE.md](/GITHUB_SETUP_GUIDE.md)

### الخطوة 2: التحقق من الجدول الأساسي

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. افتح مشروعك
3. **Table Editor**
4. ابحث عن جدول: `kv_store_90ad488b`

**هل الجدول موجود؟**

#### ✅ نعم - ممتاز!
النظام جاهز للاستخدام فوراً.

#### ❌ لا - إنشاء الجدول

الجدول سيُنشأ تلقائياً عند أول استخدام للنظام. أو يمكنك إنشاؤه يدوياً:

##### عبر SQL Editor:

1. في Supabase Dashboard → **SQL Editor**
2. اضغط **"New query"**
3. الصق هذا الكود:

```sql
-- إنشاء جدول KV Store الأساسي
CREATE TABLE IF NOT EXISTS kv_store_90ad488b (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_90ad488b(key text_pattern_ops);

-- تفعيل Row Level Security (RLS)
ALTER TABLE kv_store_90ad488b ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بالقراءة والكتابة (للاختبار فقط)
CREATE POLICY "Allow all operations for authenticated users" 
ON kv_store_90ad488b
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- سياسة للسماح بالقراءة للمستخدمين غير المصادقين (للتطوير فقط)
CREATE POLICY "Allow read for anon users" 
ON kv_store_90ad488b
FOR SELECT
TO anon
USING (true);

-- إضافة trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kv_store_updated_at 
BEFORE UPDATE ON kv_store_90ad488b
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

4. اضغط **"Run"**
5. يجب أن ترى: **"Success. No rows returned"**

---

## 📊 بنية البيانات

### نموذج KV Store

```typescript
{
  key: string,      // المفتاح الفريد (مثل: "user:abc123")
  value: object,    // البيانات بصيغة JSON
  created_at: Date, // تاريخ الإنشاء
  updated_at: Date  // تاريخ آخر تحديث
}
```

### أنواع المفاتيح المستخدمة

| النوع | المفتاح | مثال | الاستخدام |
|------|---------|------|-----------|
| **المستخدمين** | `user:{userId}` | `user:abc-123` | بيانات المستخدم |
| **المواد** | `course:{courseId}` | `course:course_1234` | بيانات المادة |
| **التسجيل** | `enrollment:{studentId}:{courseId}` | `enrollment:abc:course_1` | تسجيل طالب في مادة |
| **الجلسات** | `session:{sessionId}` | `session:sess_5678` | جلسة حضور/بث |
| **أكواد الجلسات** | `session_code:{code}` | `session_code:ABC123` | ربط الكود بالجلسة |
| **الجداول** | `schedule:{scheduleId}` | `schedule:sched_9012` | جدول المحاضرات |
| **الحضور** | `attendance:{recordId}` | `attendance:att_3456` | سجل حضور |

### مثال: بيانات مستخدم

```json
{
  "key": "user:550e8400-e29b-41d4-a716-446655440000",
  "value": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "student@kku.edu.sa",
    "full_name": "أحمد محمد",
    "role": "student",
    "university_id": "441234567",
    "created_at": "2025-12-05T10:30:00.000Z",
    "active_session": null
  }
}
```

### مثال: جلسة بث مباشر

```json
{
  "key": "session:session_1733396400_xyz789",
  "value": {
    "id": "session_1733396400_xyz789",
    "course_id": "course_1733390000_abc123",
    "code": "LIVE01",
    "created_by": "instructor-id",
    "created_at": "2025-12-05T14:00:00.000Z",
    "expires_at": "2025-12-05T15:30:00.000Z",
    "active": true,
    "session_type": "live",
    "title": "محاضرة البرمجة المتقدمة",
    "stream_active": true,
    "viewers_count": 15
  }
}
```

---

## 🧪 اختبار قاعدة البيانات

### اختبار 1: قراءة البيانات

في Supabase Dashboard → **SQL Editor**:

```sql
-- عرض جميع المستخدمين
SELECT * FROM kv_store_90ad488b 
WHERE key LIKE 'user:%' 
LIMIT 10;

-- عرض جميع المواد
SELECT * FROM kv_store_90ad488b 
WHERE key LIKE 'course:%' 
LIMIT 10;

-- عرض الجلسات النشطة
SELECT * FROM kv_store_90ad488b 
WHERE key LIKE 'session:%' 
AND value->>'active' = 'true';
```

### اختبار 2: إضافة بيانات تجريبية

```sql
-- إضافة مستخدم تجريبي
INSERT INTO kv_store_90ad488b (key, value)
VALUES (
  'user:test-admin-001',
  '{
    "id": "test-admin-001",
    "email": "admin@kku.edu.sa",
    "full_name": "مدير النظام",
    "role": "admin",
    "created_at": "2025-12-05T00:00:00.000Z"
  }'::jsonb
);

-- إضافة مادة تجريبية
INSERT INTO kv_store_90ad488b (key, value)
VALUES (
  'course:test-course-001',
  '{
    "id": "test-course-001",
    "course_name": "مقدمة في البرمجة",
    "course_code": "CS101",
    "instructor_id": "test-admin-001",
    "created_at": "2025-12-05T00:00:00.000Z"
  }'::jsonb
);
```

### اختبار 3: البحث

```sql
-- البحث عن مستخدم بالبريد
SELECT * FROM kv_store_90ad488b
WHERE value->>'email' = 'admin@kku.edu.sa';

-- البحث عن مادة بالكود
SELECT * FROM kv_store_90ad488b
WHERE value->>'course_code' = 'CS101';

-- عدّ الطلاب
SELECT COUNT(*) FROM kv_store_90ad488b
WHERE key LIKE 'user:%' 
AND value->>'role' = 'student';
```

---

## 📈 مراقبة الأداء

### في Supabase Dashboard

1. **Database → Logs**
   - راقب استعلامات SQL
   - ابحث عن استعلامات بطيئة

2. **Database → Query Performance**
   - عرض أبطأ الاستعلامات
   - تحسين الفهارس

3. **Reports**
   - استخدام القرص
   - عدد الصفوف
   - الأداء العام

### مؤشرات صحة قاعدة البيانات

```sql
-- عدد السجلات الإجمالي
SELECT COUNT(*) as total_records FROM kv_store_90ad488b;

-- حجم قاعدة البيانات
SELECT pg_size_pretty(pg_total_relation_size('kv_store_90ad488b')) as table_size;

-- توزيع أنواع البيانات
SELECT 
  CASE 
    WHEN key LIKE 'user:%' THEN 'Users'
    WHEN key LIKE 'course:%' THEN 'Courses'
    WHEN key LIKE 'session:%' THEN 'Sessions'
    WHEN key LIKE 'enrollment:%' THEN 'Enrollments'
    WHEN key LIKE 'attendance:%' THEN 'Attendance'
    WHEN key LIKE 'schedule:%' THEN 'Schedules'
    ELSE 'Other'
  END as data_type,
  COUNT(*) as count
FROM kv_store_90ad488b
GROUP BY data_type
ORDER BY count DESC;
```

---

## 🔒 الأمان والخصوصية

### Row Level Security (RLS)

النظام يستخدم RLS لحماية البيانات:

```sql
-- عرض السياسات الحالية
SELECT * FROM pg_policies 
WHERE tablename = 'kv_store_90ad488b';
```

### سياسات موصى بها للإنتاج

```sql
-- حذف سياسات التطوير
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON kv_store_90ad488b;
DROP POLICY IF EXISTS "Allow read for anon users" ON kv_store_90ad488b;

-- سياسة قراءة آمنة
CREATE POLICY "Users can read their own data"
ON kv_store_90ad488b
FOR SELECT
TO authenticated
USING (
  -- يمكن للمستخدم قراءة بياناته الخاصة
  key LIKE 'user:' || auth.uid() || '%'
  OR
  -- أو بيانات المواد المسجل فيها
  key LIKE 'course:%'
  OR
  -- أو الجلسات
  key LIKE 'session:%'
);

-- سياسة كتابة محدودة
CREATE POLICY "Only admins can write"
ON kv_store_90ad488b
FOR ALL
TO authenticated
USING (
  -- التحقق من دور المستخدم
  EXISTS (
    SELECT 1 FROM kv_store_90ad488b
    WHERE key = 'user:' || auth.uid()
    AND value->>'role' IN ('admin', 'instructor')
  )
);
```

---

## 🛠️ الصيانة الدورية

### تنظيف البيانات القديمة

```sql
-- حذف الجلسات المنتهية (أقدم من 30 يوم)
DELETE FROM kv_store_90ad488b
WHERE key LIKE 'session:%'
AND (value->>'expires_at')::timestamptz < NOW() - INTERVAL '30 days';

-- حذف أكواد الجلسات المنتهية
DELETE FROM kv_store_90ad488b
WHERE key LIKE 'session_code:%'
AND key NOT IN (
  SELECT value->>'code' FROM kv_store_90ad488b WHERE key LIKE 'session:%'
);
```

### النسخ الاحتياطي

في Supabase Dashboard:
1. **Database → Backups**
2. تفعيل **Point-in-Time Recovery (PITR)**
3. جدولة نسخ احتياطية يومية

### التصدير

```sql
-- تصدير جميع البيانات إلى CSV
\copy (SELECT * FROM kv_store_90ad488b) TO '/tmp/kv_store_backup.csv' CSV HEADER;
```

---

## 📊 إحصائيات نموذجية

### لجامعة بـ 10,000 طالب

| النوع | العدد المتوقع | الحجم التقريبي |
|------|---------------|----------------|
| **المستخدمين** | 10,550 | ~10 MB |
| **المواد** | 500 | ~500 KB |
| **التسجيلات** | 50,000 | ~25 MB |
| **الجلسات** | 2,000/شهر | ~5 MB/شهر |
| **سجلات الحضور** | 100,000/شهر | ~50 MB/شهر |
| **الجداول** | 2,000 | ~2 MB |

**المجموع السنوي**: ~700 MB

**خطة Supabase المجانية**: 500 MB  
**موصى به**: Pro Plan ($25/شهر) - 8 GB

---

## 🔧 استكشاف المشاكل

### مشكلة: "relation does not exist"

**السبب:** الجدول غير موجود

**الحل:**
```sql
-- التحقق من وجود الجدول
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'kv_store_90ad488b'
);

-- إنشاء الجدول (راجع القسم أعلاه)
```

### مشكلة: "permission denied"

**السبب:** RLS يمنع الوصول

**الحل:**
```sql
-- تعطيل RLS مؤقتاً (للتطوير فقط!)
ALTER TABLE kv_store_90ad488b DISABLE ROW LEVEL SECURITY;

-- أو راجع السياسات
SELECT * FROM pg_policies WHERE tablename = 'kv_store_90ad488b';
```

### مشكلة: بطء في الاستعلامات

**الحل:**
```sql
-- إنشاء فهارس إضافية
CREATE INDEX idx_user_email ON kv_store_90ad488b((value->>'email'));
CREATE INDEX idx_course_code ON kv_store_90ad488b((value->>'course_code'));
CREATE INDEX idx_session_active ON kv_store_90ad488b((value->>'active')) 
WHERE key LIKE 'session:%';
```

---

## 📚 موارد إضافية

- 📖 [Supabase Documentation](https://supabase.com/docs)
- 🔧 [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- 🛡️ [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

<div align="center">

**قاعدة البيانات جاهزة! 🎉**

[العودة للدليل الرئيسي](/README.md)

</div>
