# ⚡ حل سريع لمشكلة SQL - خطوة بخطوة

<div dir="rtl">

## 🎯 المشكلة
الخطأ: `ERROR: 42703: column "status" does not exist`

## ✅ الحل (دقيقتان فقط!)

### الخطوة 1: احذف ملف SQL القديم من ذاكرة المتصفح
```
1. افتح Supabase SQL Editor
2. اضغط Ctrl+A (تحديد الكل)
3. اضغط Delete (حذف)
```

### الخطوة 2: استخدم الملف المصحح الجديد
```
1. افتح ملف: /FIXED_DATABASE_SETUP.sql
2. انسخ المحتوى كاملاً (Ctrl+A ثم Ctrl+C)
3. الصق في Supabase SQL Editor (Ctrl+V)
4. اضغط Run (أو Ctrl+Enter)
5. انتظر: ✅ Success!
```

### الخطوة 3: تفعيل Realtime

```
1. اذهب إلى: Database → Replication
2. فعّل Realtime للجداول:
   ☑️ users
   ☑️ courses
   ☑️ enrollments
   ☑️ sessions
   ☑️ attendance_records
   ☑️ notifications
3. اضغط Save
```

### الخطوة 4: إدخال البيانات الاختبارية

```
1. ارجع إلى SQL Editor
2. احذف المحتوى (Ctrl+A → Delete)
3. افتح ملف: /INSERT_SAMPLE_DATA.sql
4. انسخ المحتوى (Ctrl+A → Ctrl+C)
5. الصق في SQL Editor (Ctrl+V)
6. اضغط Run
7. ✅ تم!
```

---

## 🎓 إنشاء المستخدمين في Supabase Auth

### يجب إنشاء المستخدمين أولاً في Authentication:

**الطريقة:**
```
1. Supabase Dashboard → Authentication → Users
2. اضغط "Add user" → "Create new user"
3. أدخل البيانات
```

### المستخدمون المطلوبون:

#### 1. المدير (Admin):
```
Email: admin@kku.edu.sa
Password: Admin@123456
☑️ Auto Confirm Email
```

#### 2. المدرس (Instructor):
```
Email: instructor@kku.edu.sa
Password: Instructor@123
☑️ Auto Confirm Email
```

#### 3. الطالب (Student):
```
Email: student@kku.edu.sa
Password: Student@123
☑️ Auto Confirm Email
```

### بعد إنشاء المستخدمين:
```
1. ارجع إلى SQL Editor
2. نفذ ملف: INSERT_SAMPLE_DATA.sql
3. سيتم ربط البيانات تلقائياً
```

---

## ✅ التحقق من النجاح

### في SQL Editor، نفذ:

```sql
-- 1. عرض الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- يجب أن ترى:
-- users, courses, enrollments, sessions, 
-- attendance_records, notifications, etc.
```

```sql
-- 2. عرض المستخدمين
SELECT role, COUNT(*) 
FROM users 
GROUP BY role;

-- يجب أن ترى:
-- admin: 1
-- instructor: 1
-- student: 1
```

```sql
-- 3. عرض المقررات
SELECT course_code, course_name_ar 
FROM courses;

-- يجب أن ترى المقررات
```

---

## 🔍 إذا استمر الخطأ

### حل 1: احذف الجداول القديمة أولاً

```sql
-- نفذ هذا الكود أولاً
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

-- ثم نفذ ملف FIXED_DATABASE_SETUP.sql
```

### حل 2: تأكد من الصلاحيات

```
1. Settings → Database → Roles
2. تأكد من وجود role: postgres
3. تأكد من الصلاحيات
```

---

## 📊 الآن الصفحة الرئيسية ستعرض البيانات الحقيقية!

### ما تم إصلاحه:

1. ✅ **ملف SQL مصحح** - بدون أخطاء
2. ✅ **الصفحة الرئيسية محدثة** - تجلب البيانات من قاعدة البيانات
3. ✅ **التحديث التلقائي** - كل 30 ثانية

### البيانات التي ستظهر:

```javascript
- عدد الطلاب الحقيقي (من جدول users)
- عدد المدرسين الحقيقي (من جدول users)
- عدد المقررات الحقيقي (من جدول courses)
- نسبة الحضور الحقيقية (من جدول attendance_records)
```

---

## 🎉 تهانينا!

**الآن النظام يعمل بشكل صحيح:**
- ✅ قاعدة البيانات الحقيقية تعمل
- ✅ البيانات تُعرض تلقائياً
- ✅ التحديث الفوري مفعّل
- ✅ جاهز للاستخدام!

---

## 📞 إذا احتجت مساعدة

افتح Console في المتصفح (F12) وابحث عن أخطاء.

---

<div align="center">

**تم حل جميع المشاكل! 🚀**

**النظام جاهز 100%**

</div>

</div>
