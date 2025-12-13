# 🚀 دليل النشر الكامل - Complete Deployment Guide

## نظام الحضور الذكي - جامعة الملك خالد
## Smart Attendance System - King Khalid University

---

## 🎯 نظرة عامة

هذا الدليل يشرح كيفية نشر النظام بالكامل على Supabase ليعمل بشكل فعلي.

---

## 📋 المتطلبات الأساسية

- ✅ حساب Supabase
- ✅ مشروع Supabase موجود (ID: `pcymgqdjbdklrikdquih`)
- ✅ Supabase CLI مثبت (اختياري لكن موصى به)

---

## 🏗️ بنية المشروع

```
project/
├── supabase/
│   └── functions/
│       └── server/
│           └── index.tsx         ← Backend (Edge Function)
├── components/                   ← React Components
├── utils/
│   └── api.ts                    ← API Client
├── DATABASE_READY_TO_EXECUTE.sql ← SQL Schema
└── deploy.sh                     ← Deployment Script
```

---

## 🚀 خطوات النشر

### الخطوة 1: نشر Edge Function

#### الطريقة الأولى: Supabase CLI (موصى بها)

```bash
# تثبيت CLI إذا لم يكن مثبتاً
npm install -g supabase

# أو باستخدام Homebrew (Mac)
brew install supabase/tap/supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref pcymgqdjbdklrikdquih

# نشر Function
supabase functions deploy server

# أو استخدم السكريبت الجاهز
chmod +x deploy.sh
./deploy.sh
```

#### الطريقة الثانية: من Supabase Dashboard

1. **افتح Dashboard:**
   ```
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih
   ```

2. **اذهب إلى Edge Functions** من القائمة الجانبية

3. **أنشئ Function جديدة:**
   - اضغط "Create a new function"
   - Function name: `server`
   - اضغط "Create function"

4. **انسخ الكود:**
   - افتح `/supabase/functions/server/index.tsx`
   - انسخ المحتوى بالكامل (Ctrl+A, Ctrl+C)
   - الصق في Code Editor
   - اضغط "Deploy"

---

### الخطوة 2: إضافة Environment Variables

**في Supabase Dashboard:**

1. اذهب إلى **Settings** → **Edge Functions**
2. في قسم **Secrets**, اضغط **"Add new secret"**
3. أضف المتغيرات التالية:

#### SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://pcymgqdjbdklrikdquih.supabase.co
```

#### SUPABASE_ANON_KEY
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ
```

#### SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: <get from Settings → API → service_role key>
```

**⚠️ للحصول على SERVICE_ROLE_KEY:**
1. Settings → API
2. انزل للأسفل
3. انسخ "service_role" key (المفتاح السري)

---

### الخطوة 3: تنفيذ Database Schema

**في Supabase Dashboard:**

1. **اذهب إلى SQL Editor**
2. **اضغط "New query"**
3. **افتح ملف** `/DATABASE_READY_TO_EXECUTE.sql`
4. **انسخ كل المحتوى** (Ctrl+A, Ctrl+C)
5. **الصق في SQL Editor**
6. **اضغط "Run"** (أو Ctrl+Enter)

**تحقق من النجاح:**
```
✅ DATABASE SCHEMA CREATED SUCCESSFULLY!
```

---

### الخطوة 4: اختبار النشر

#### Test 1: Health Check

افتح في المتصفح:
```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": true,
  "message": "Backend is running correctly with SQL database",
  "timestamp": "2025-12-11T..."
}
```

✅ إذا رأيت `"database": true` = النشر ناجح!

---

#### Test 2: Public Stats

```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/stats/public
```

**Expected Response:**
```json
{
  "stats": {
    "studentsCount": 0,
    "instructorsCount": 0,
    "coursesCount": 0,
    "attendanceRate": 99.8
  }
}
```

---

#### Test 3: من التطبيق

1. **أعد تحميل صفحتك** (F5)
2. **تحقق:**
   - ✅ رسالة "404 Not Found" اختفت
   - ✅ الإحصائيات تظهر
   - ✅ لا أخطاء في Console

---

## 🧪 اختبار الميزات

### Test 1: Sign Up

1. اذهب إلى صفحة Sign Up
2. أدخل:
   - الاسم: `محمد أحمد السعيد`
   - البريد سيظهر تلقائياً: `mohammad.alsaid@kku.edu.sa`
   - كلمة المرور: `Test123!@#`
   - الدور: طالب
   - الرقم الجامعي: `441234567`
3. اضغط "إنشاء حساب"

**Expected:**
- ✅ رسالة نجاح
- ✅ Account created in database
- ✅ Redirect to login

---

### Test 2: Login

1. استخدم الحساب الذي أنشأته
2. البريد: `mohammad.alsaid@kku.edu.sa`
3. كلمة المرور: `Test123!@#`
4. اضغط "دخول"

**Expected:**
- ✅ تسجيل دخول ناجح
- ✅ Redirect to dashboard
- ✅ اسمك يظهر في الهيدر

---

### Test 3: Dashboard

في لوحة التحكم:
- ✅ الإحصائيات تظهر من SQL
- ✅ بطاقات النشاط تعمل
- ✅ يمكنك التنقل بين الصفحات

---

## 🗄️ Database Schema

### الجداول المنشأة:

1. **profiles** - بيانات المستخدمين
   - id, email, full_name, role, university_id
   - Relations: courses, sessions, attendance

2. **courses** - المقررات الدراسية
   - id, course_name, course_code, instructor_id
   - Relations: instructor (profiles), enrollments, sessions

3. **enrollments** - تسجيل الطلاب
   - id, student_id, course_id, status
   - Relations: student (profiles), course (courses)

4. **sessions** - جلسات الحضور/البث
   - id, course_id, code, session_type, active
   - Relations: course (courses), creator (profiles)

5. **attendance** - سجل الحضور
   - id, student_id, session_id, status, timestamp
   - Relations: student, session, course

---

## 🔒 Security Features

### Row Level Security (RLS)

تم تفعيل RLS على جميع الجداول:

- **profiles:** المستخدمون يمكنهم رؤية بياناتهم، المدراء يرون الكل
- **courses:** الجميع يمكنهم رؤية المقررات
- **enrollments:** الطلاب يرون تسجيلاتهم فقط
- **sessions:** الجميع يرون الجلسات النشطة
- **attendance:** الطلاب يرون حضورهم فقط

---

## 📡 API Endpoints

### Authentication
```
POST /signup                  - تسجيل حساب جديد
GET  /me                      - بيانات المستخدم الحالي
```

### Public
```
GET  /health                  - فحص حالة النظام
GET  /stats/public            - إحصائيات عامة
POST /generate-email          - توليد بريد من اسم
```

### Admin
```
GET  /users                   - جميع المستخدمين (admin only)
GET  /courses                 - المقررات
POST /courses                 - إنشاء مقرر
```

### Sessions
```
GET  /sessions                - جميع الجلسات
POST /sessions                - إنشاء جلسة
POST /attendance              - تسجيل حضور
GET  /attendance              - سجلات الحضور
```

---

## 🐛 Troubleshooting

### مشكلة: 404 Not Found

**السبب:** Edge Function لم يتم نشرها

**الحل:**
```bash
supabase functions deploy server
```

أو من Dashboard → Edge Functions → Deploy

---

### مشكلة: Database connection failed

**السبب:** Environment Variables مفقودة

**الحل:**
1. Settings → Edge Functions → Secrets
2. تحقق من وجود:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

---

### مشكلة: Table does not exist

**السبب:** SQL Schema لم يتم تنفيذه

**الحل:**
1. SQL Editor → New query
2. نفذ `/DATABASE_READY_TO_EXECUTE.sql`

---

### مشكلة: Unauthorized / Profile not found

**السبب:** المستخدم موجود في Auth لكن ليس في profiles table

**الحل:**
```sql
-- في SQL Editor، تحقق من المستخدمين
SELECT id, email FROM auth.users;

-- إذا وجدت user موجود في auth لكن مفقود من profiles
-- أضفه يدوياً:
INSERT INTO profiles (id, email, full_name, role)
VALUES ('user-id-from-auth-users', 'email@kku.edu.sa', 'Full Name', 'student');
```

---

## 📊 Monitoring

### Edge Function Logs

```
Dashboard → Logs → Edge Function logs
```

راقب:
- ✅ Successful requests
- ❌ Errors
- ⏱️ Response times
- 📊 Usage statistics

---

### Database Queries

```
Dashboard → Database → Query Performance
```

راقب:
- ✅ Slow queries
- 📊 Most used tables
- 💾 Database size

---

## 🔄 Updates & Maintenance

### لتحديث Backend:

```bash
# بعد تعديل /supabase/functions/server/index.tsx
supabase functions deploy server
```

### لتحديث Database Schema:

1. اكتب SQL في ملف جديد
2. نفذه في SQL Editor
3. احذر من تغييرات تؤثر على البيانات الموجودة

---

## 📚 Resources

### Documentation:
- [🔥_FIX_404_NOW.md](./🔥_FIX_404_NOW.md) - إصلاح 404
- [⚡_QUICK_START_ARABIC.md](./⚡_QUICK_START_ARABIC.md) - بدء سريع
- [🔧_COMPLETE_FIX_GUIDE.md](./🔧_COMPLETE_FIX_GUIDE.md) - دليل شامل
- [🎉_SYSTEM_COMPLETELY_FIXED.md](./🎉_SYSTEM_COMPLETELY_FIXED.md) - ملخص

### Scripts:
- [deploy.sh](./deploy.sh) - سكريبت نشر تلقائي
- [DATABASE_READY_TO_EXECUTE.sql](./DATABASE_READY_TO_EXECUTE.sql) - Schema كامل

---

## ✅ Deployment Checklist

### Pre-deployment:
- [ ] Supabase project created
- [ ] Supabase CLI installed (optional)
- [ ] All files reviewed

### Deployment:
- [ ] Edge Function deployed
- [ ] Environment variables added (3 variables)
- [ ] SQL Schema executed
- [ ] Health check passes

### Post-deployment:
- [ ] Sign up tested
- [ ] Login tested
- [ ] Dashboard works
- [ ] No console errors

---

## 🎯 Success Criteria

عند نجاح النشر:

✅ **Health endpoint** يرجع `"database": true`
✅ **Stats endpoint** يرجع بيانات حقيقية
✅ **Sign up** يحفظ في SQL
✅ **Login** يعمل ويوجه للوحة التحكم
✅ **Dashboard** يعرض إحصائيات حقيقية
✅ **No 404 errors**
✅ **No console errors**

---

## 🆘 Support

### إذا واجهت مشكلة:

1. **راجع Logs:** Dashboard → Logs
2. **تحقق من الـ Checklist** أعلاه
3. **جرب الاختبارات** واحداً تلو الآخر
4. **اقرأ Troubleshooting** section

### الاتصال:
- Email: mnafisah668@gmail.com
- University: support@kku.edu.sa

---

## 🎉 Congratulations!

بعد إكمال جميع الخطوات:

**🎊 النظام الآن:**
- ✅ منشور بالكامل على Supabase
- ✅ متصل بقاعدة بيانات SQL حقيقية
- ✅ جاهز للاستخدام الفعلي
- ✅ جميع الميزات تعمل

**مبروك! 🎉**

---

**© 2025 جامعة الملك خالد**
**Smart Attendance System**
**Production Ready ✅**
