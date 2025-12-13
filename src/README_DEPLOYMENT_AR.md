# 🎓 نظام الحضور الذكي - جامعة الملك خالد
## دليل النشر الكامل | Complete Deployment Guide

---

## 🚀 البدء السريع (5 دقائق)

### الطريقة الأسهل - السكربت التلقائي:

```bash
# 1. امنح صلاحيات التنفيذ
chmod +x deploy-complete.sh verify-setup.sh

# 2. شغّل سكربت النشر
./deploy-complete.sh

# 3. تحقق من النجاح
./verify-setup.sh
```

✅ **هذا كل شيء!** السكربت سيقوم بكل شيء تلقائياً.

---

## 📋 إذا فشل السكربت - النشر اليدوي

### الخطوة 1: تثبيت Supabase CLI

```bash
npm install -g supabase
```

### الخطوة 2: تسجيل الدخول

```bash
supabase login
```

سيفتح متصفح - سجل دخولك بحساب Supabase.

### الخطوة 3: ربط المشروع

```bash
supabase link --project-ref pcymgqdjbdklrikdquih
```

### الخطوة 4: الحصول على SERVICE_ROLE_KEY

1. افتح: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/settings/api
2. انسخ **service_role** key (تحذير: ليس anon key!)
3. احتفظ به في مكان آمن

### الخطوة 5: تعيين المتغيرات البيئية

```bash
# استبدل YOUR_SERVICE_ROLE_KEY بالقيمة الحقيقية
supabase secrets set SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"

supabase secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ"

supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

### الخطوة 6: نشر Edge Function

```bash
supabase functions deploy server
```

انتظر حتى تظهر رسالة النجاح:
```
✅ Deployed Function server
```

### الخطوة 7: التحقق من النشر

```bash
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/health
```

يجب أن ترى:
```json
{
  "status": "healthy",
  "database": true,
  "message": "Backend is running correctly with SQL database"
}
```

---

## 🗄️ تنفيذ قاعدة البيانات

### الطريقة الأولى: من Dashboard (الأسهل)

1. افتح SQL Editor:
   ```
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql
   ```

2. انقر **+ New query**

3. افتح ملف `/database_schema.sql` وانسخ كل محتواه

4. الصقه في المحرر

5. انقر **Run** أو اضغط `Ctrl+Enter`

6. انتظر حتى تظهر رسالة النجاح:
   ```
   ✅ Success. No rows returned
   ```

7. تحقق من الجداول:
   ```
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/editor
   ```
   
   يجب أن ترى:
   - ✅ profiles
   - ✅ courses
   - ✅ enrollments
   - ✅ sessions
   - ✅ attendance
   - ✅ schedules

### الطريقة الثانية: من CLI

```bash
supabase db push
```

---

## ✅ التحقق من النجاح الكامل

### اختبار 1: Edge Function

```bash
# اختبار health endpoint
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/health

# اختبار stats endpoint
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/stats/public
```

### اختبار 2: قاعدة البيانات

في Supabase Dashboard → Table Editor، تحقق من:
- [ ] جدول `profiles` موجود
- [ ] جدول `courses` موجود
- [ ] جدول `enrollments` موجود
- [ ] جدول `sessions` موجود
- [ ] جدول `attendance` موجود
- [ ] جدول `schedules` موجود

### اختبار 3: التطبيق

1. افتح التطبيق في المتصفح

2. افتح Console (اضغط F12)

3. تحقق من عدم وجود أخطاء 404

4. حاول إنشاء حساب جديد:
   - الاسم الكامل: محمد أحمد
   - البريد الإلكتروني: (سيظهر تلقائياً) `mohammad.ahmed@kku.edu.sa`
   - الرقم الجامعي: `441234567`
   - الدور: طالب
   - كلمة المرور: `Test@123456`

5. انقر "إنشاء حساب"

6. **✅ متوقع:** رسالة "تم إنشاء الحساب بنجاح"

7. سجل الدخول بنفس البيانات

8. **✅ متوقع:** توجيه إلى Student Dashboard

---

## 🔧 استكشاف الأخطاء

### ❌ خطأ: "supabase: command not found"

**الحل:**
```bash
npm install -g supabase

# أو إذا كنت تستخدم yarn
yarn global add supabase

# تحقق من التثبيت
supabase --version
```

---

### ❌ خطأ: "Not logged in"

**الحل:**
```bash
supabase login
```

سيفتح متصفح - سجل الدخول.

---

### ❌ خطأ: "404 Not Found" عند فتح التطبيق

**السبب:** Edge Function غير منشورة.

**الحل:**
```bash
supabase functions deploy server
```

---

### ❌ خطأ: "Profile not found"

**السبب:** SQL Schema لم يتم تنفيذها.

**الحل:**
1. افتح SQL Editor في Supabase Dashboard
2. نفذ محتوى `/database_schema.sql`

أو:
```bash
supabase db push
```

---

### ❌ خطأ: "Email already registered"

**السبب:** البريد مسجل مسبقاً.

**الحل:**

**الطريقة 1:** استخدم "تسجيل الدخول" بدلاً من "إنشاء حساب"

**الطريقة 2:** احذف المستخدم:
1. افتح: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/auth/users
2. ابحث عن البريد
3. احذف المستخدم
4. حاول التسجيل مرة أخرى

---

### ❌ خطأ: "University ID already registered"

**السبب:** الرقم الجامعي مسجل مسبقاً.

**الحل:**
1. استخدم رقم جامعي مختلف
2. أو احذف الطالب من جدول `profiles` في Table Editor

---

### ❌ Dashboard لا يعرض بيانات

**السبب:** لا توجد بيانات في قاعدة البيانات.

**الحل:**
1. أنشئ حسابات جديدة (طلاب، مدرسين)
2. من لوحة Admin، أنشئ مقررات
3. سجل الطلاب في المقررات
4. أنشئ جلسات

---

## 📊 إضافة بيانات تجريبية (اختياري)

إذا أردت اختبار النظام بسرعة، نفّذ هذا SQL:

```sql
-- إنشاء مدرس تجريبي
INSERT INTO profiles (id, email, full_name, role) 
SELECT 
  gen_random_uuid(),
  'instructor@kku.edu.sa',
  'د. عبدالله محمد',
  'instructor'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'instructor@kku.edu.sa'
);

-- إنشاء مقرر تجريبي
INSERT INTO courses (course_name, course_code, instructor_id)
SELECT 
  'برمجة الويب',
  'CS101',
  (SELECT id FROM profiles WHERE email = 'instructor@kku.edu.sa')
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE course_code = 'CS101'
);

-- إنشاء طالب تجريبي
INSERT INTO profiles (id, email, full_name, role, university_id) 
SELECT 
  gen_random_uuid(),
  'student@kku.edu.sa',
  'محمد أحمد',
  'student',
  '441234567'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'student@kku.edu.sa'
);

-- تسجيل الطالب في المقرر
INSERT INTO enrollments (student_id, course_id)
SELECT 
  (SELECT id FROM profiles WHERE email = 'student@kku.edu.sa'),
  (SELECT id FROM courses WHERE course_code = 'CS101')
WHERE NOT EXISTS (
  SELECT 1 FROM enrollments 
  WHERE student_id = (SELECT id FROM profiles WHERE email = 'student@kku.edu.sa')
    AND course_id = (SELECT id FROM courses WHERE course_code = 'CS101')
);
```

---

## 🎯 Checklist النهائي

قبل الاعتبار بأن النظام جاهز، تأكد من:

### Backend:
- [ ] Supabase CLI مثبت
- [ ] تم تسجيل الدخول (`supabase login`)
- [ ] تم ربط المشروع (`supabase link`)
- [ ] تم تعيين المتغيرات البيئية
- [ ] Edge Function منشورة
- [ ] `/health` endpoint يعمل (HTTP 200)
- [ ] `/stats/public` endpoint يعمل

### Database:
- [ ] SQL Schema تم تنفيذها
- [ ] جدول `profiles` موجود
- [ ] جدول `courses` موجود
- [ ] جدول `enrollments` موجود
- [ ] جدول `sessions` موجود
- [ ] جدول `attendance` موجود
- [ ] جدول `schedules` موجود

### Frontend:
- [ ] التطبيق يفتح بدون أخطاء
- [ ] Landing Page تعرض إحصائيات
- [ ] يمكن إنشاء حساب جديد
- [ ] يمكن تسجيل الدخول
- [ ] Dashboard يظهر بعد تسجيل الدخول
- [ ] البريد يتولد تلقائياً من الاسم
- [ ] التحقق من الرقم الجامعي يعمل

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. **استخدم سكربت التحقق:**
   ```bash
   ./verify-setup.sh
   ```

2. **افتح Console في المتصفح (F12)**
   - انسخ جميع الأخطاء الحمراء

3. **تحقق من Logs في Supabase:**
   - https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/logs/edge-functions

4. **راجع الأدلة:**
   - `/⚡_ابدأ_هنا_الآن_START_HERE_NOW.md`
   - `/✅_تقرير_الإصلاحات_الكاملة.md`

5. **راسلنا:**
   - Email: mnafisah668@gmail.com

---

## 🎉 تهانينا!

إذا اكتملت جميع الخطوات بنجاح، فالنظام الآن:

✅ **منشور بالكامل**  
✅ **قاعدة البيانات جاهزة**  
✅ **جميع الميزات تعمل**  
✅ **جاهز للاستخدام الفعلي**

---

## 🚀 الخطوات التالية

### للمدراء (Admin):
1. أنشئ حساب بدور "admin"
2. أضف مقررات دراسية
3. أضف مستخدمين (طلاب، مدرسين)

### للمدرسين (Instructors):
1. أنشئ حساب بدور "instructor"
2. عرض المقررات المخصصة
3. إنشاء جلسات حضور
4. إنشاء جلسات بث مباشر
5. عرض تقارير الحضور

### للطلاب (Students):
1. أنشئ حساب بدور "student"
2. التسجيل في المقررات
3. تسجيل الحضور عبر Session Code
4. الانضمام للجلسات المباشرة
5. عرض سجل الحضور الشخصي

---

**تم بحمد الله! 🎊**

النظام جاهز تماماً للاستخدام الإنتاجي! 💪

---

**📅 آخر تحديث:** 11 ديسمبر 2025  
**🎓 المشروع:** نظام الحضور الذكي - جامعة الملك خالد  
**💻 المطور:** فريق التطوير  
**📧 التواصل:** mnafisah668@gmail.com
