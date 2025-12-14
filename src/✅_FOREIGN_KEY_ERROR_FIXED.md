# ✅ إصلاح خطأ Foreign Key في جدول Courses

## 🎯 المشكلة الأصلية

```
❌ [createCourse] Supabase error: {
  "code": "23503",
  "details": "Key (instructor_id)=(aae004f8-2c6f-45ac-8578-379332dcb06b) is not present in table \"users\".",
  "hint": null,
  "message": "insert or update on table \"courses\" violates foreign key constraint \"courses_instructor_id_fkey\""
}
```

## 🔍 السبب

جدول `courses` يحتوي على Foreign Key يشير إلى جدول `users`:

```sql
-- ❌ الخطأ
ALTER TABLE courses 
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES users(id);
```

لكن النظام يستخدم جدول `profiles` وليس `users`:

| الجدول الخاطئ | الجدول الصحيح |
|---------------|---------------|
| `users` ❌ | `profiles` ✅ |

## 🔧 الحل المطبق

### الملف: `/🔥_FIX_COURSES_FOREIGN_KEY.sql`

هذا السكريبت يقوم بـ:

1. ✅ **حذف Foreign Key القديم**
   - يحذف `courses_instructor_id_fkey` الذي يشير إلى `users`
   - يحذف أي Foreign Keys أخرى متعلقة بـ `instructor_id`

2. ✅ **إنشاء Foreign Key جديد**
   - ينشئ `courses_instructor_id_fkey_profiles`
   - يشير إلى `profiles(id)` بدلاً من `users(id)`
   - يستخدم `ON DELETE SET NULL` (إذا حُذف المدرس، يصبح instructor_id = NULL)

3. ✅ **إصلاح جداول أخرى**
   - يصلح جدول `sessions` (إذا كان موجوداً)
   - يصلح جدول `live_sessions` (إذا كان موجوداً)

## 📊 البنية الصحيحة

### قبل الإصلاح:
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  course_name TEXT,
  course_code TEXT,
  instructor_id UUID REFERENCES users(id), -- ❌ خطأ
  ...
);
```

### بعد الإصلاح:
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  course_name TEXT,
  course_code TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- ✅ صحيح
  ...
);
```

## 🚀 كيفية التطبيق

### الطريقة 1: تطبيق SQL Script (موصى به)

1. افتح **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. انسخ محتوى `/🔥_FIX_COURSES_FOREIGN_KEY.sql`
4. الصق في SQL Editor
5. اضغط **Run**
6. ستظهر رسائل تأكيد:
   ```
   ✅ Dropped old foreign key: courses_instructor_id_fkey
   ✅ Created new foreign key: courses_instructor_id_fkey_profiles → profiles(id)
   ```

### الطريقة 2: تطبيق يدوي (بديل)

إذا أردت تطبيق الإصلاح يدوياً:

```sql
-- 1. حذف Foreign Key القديم
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

-- 2. إنشاء Foreign Key جديد
ALTER TABLE courses 
ADD CONSTRAINT courses_instructor_id_fkey_profiles 
FOREIGN KEY (instructor_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- 3. التحقق
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'courses' 
  AND constraint_type = 'FOREIGN KEY';
```

## ✅ النتيجة النهائية

بعد الإصلاح، يمكنك الآن:

1. ✅ **إضافة مقررات جديدة** بدون أخطاء
2. ✅ **ربط المقررات بالمدرسين** من جدول `profiles`
3. ✅ **حذف المدرسين** بأمان (instructor_id يصبح NULL تلقائياً)

### مثال على إضافة مقرر:

```typescript
// في واجهة إضافة المقررات
const result = await supabase
  .from('courses')
  .insert({
    course_code: 'CS101',
    course_name: 'مقدمة في البرمجة',
    instructor_id: 'aae004f8-2c6f-45ac-8578-379332dcb06b', // من جدول profiles
    semester: 'Fall 2024',
    academic_year: '2024-2025'
  });

// ✅ سيعمل الآن بدون أخطاء!
```

## 🔍 كيفية التحقق

### 1. في SQL Editor:

```sql
-- عرض Foreign Keys في جدول courses
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'courses' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'instructor_id';
```

**النتيجة المتوقعة:**
```
constraint_name                         | column_name   | references_table | references_column
----------------------------------------|---------------|------------------|------------------
courses_instructor_id_fkey_profiles     | instructor_id | profiles         | id
```

### 2. في Console المتصفح:

**قبل الإصلاح:**
```
❌ [createCourse] Supabase error: violates foreign key constraint "courses_instructor_id_fkey"
```

**بعد الإصلاح:**
```
✅ [createCourse] Course created successfully!
```

## 📝 ملاحظات إضافية

### لماذا `ON DELETE SET NULL`؟

عند حذف مدرس من جدول `profiles`:
- ✅ `ON DELETE SET NULL`: المقررات تبقى موجودة، لكن `instructor_id` يصبح `NULL`
- ❌ `ON DELETE CASCADE`: المقررات تُحذف تلقائياً (خطير!)
- ❌ `ON DELETE RESTRICT`: لا يمكن حذف المدرس إذا كان لديه مقررات (مزعج!)

### ماذا عن جدول `users`؟

جدول `users` هو جدول داخلي في Supabase Auth. جدول `profiles` هو الجدول المخصص للمستخدمين في التطبيق.

**البنية الصحيحة:**
```
auth.users (Supabase Auth) ← لا نستخدمه مباشرة
     ↓
public.profiles (جدولنا المخصص) ← نستخدم هذا
     ↑
courses.instructor_id → profiles.id
```

### جداول أخرى تم إصلاحها

السكريبت يصلح أيضاً:
- ✅ `sessions.instructor_id → profiles(id)`
- ✅ `live_sessions.instructor_id → profiles(id)`

## 🎊 جاهز الآن!

بعد تطبيق السكريبت:
- ✅ يمكنك إضافة مقررات بدون أخطاء
- ✅ جميع Foreign Keys تشير إلى `profiles`
- ✅ النظام متسق وآمن

---

## 📚 ملفات ذات صلة

- 📄 `/🔥_FIX_COURSES_FOREIGN_KEY.sql` - سكريبت الإصلاح
- 📄 `/database_schema.sql` - البنية الصحيحة للجداول
- 📄 `/DATABASE_READY_TO_EXECUTE.sql` - جميع الجداول

---

## ⚠️ تحذير هام

**لا تقم بإنشاء جدول `users` يدوياً!**

Supabase يُنشئ جدول `auth.users` تلقائياً. استخدم جدول `profiles` لتخزين بيانات المستخدمين الإضافية.

```sql
-- ✅ صحيح
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT,
  ...
);

-- ✅ صحيح
CREATE TABLE courses (
  instructor_id UUID REFERENCES profiles(id)
);

-- ❌ خطأ
CREATE TABLE courses (
  instructor_id UUID REFERENCES users(id) -- users لا يوجد في public schema
);
```
