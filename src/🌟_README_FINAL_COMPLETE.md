# 🎓 نظام الحضور الذكي لجامعة الملك خالد
# KKU Smart Attendance System

<div align="center">

![KKU Logo](https://www.kku.edu.sa/sites/default/files/logo_0.png)

**نظام حضور متكامل مع قاعدة بيانات حقيقية وأمان متقدم**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

[العربية](#العربية) | [English](#english)

</div>

---

<div dir="rtl">

# العربية

## 📋 نظرة عامة

نظام الحضور الذكي هو حل متكامل لإدارة الحضور والغياب في جامعة الملك خالد، يتميز بـ:

### ✨ الميزات الرئيسية

#### 🔒 أمان متقدم
- **Device Fingerprinting** - بصمة فريدة لكل جهاز
- **منع تسجيل الدخول المتزامن** - جلسة واحدة فقط لكل مستخدم
- **Session Management** - إدارة محكمة للجلسات
- **Activity Logging** - تسجيل جميع الأنشطة
- **RLS Policies** - 30+ سياسة أمنية على مستوى قاعدة البيانات

#### 🎯 التحقق من البيانات
- **البريد الإلكتروني**: يجب أن ينتهي بـ `@kku.edu.sa`
- **الرقم الجامعي**: 9 أرقام تبدأ بـ `44` (للطلاب فقط)
- **الاسم الكامل**: يجب أن يحتوي على اسمين على الأقل
- **التحقق الثلاثي**: Frontend + Backend + Database

#### 👥 الأدوار المدعومة
- **👨‍💼 المدير (Admin)**: إدارة كاملة للنظام
- **👨‍🏫 المدرس (Instructor)**: إدارة المقررات والجلسات
- **🎓 الطالب (Student)**: تسجيل الحضور ومتابعة السجلات
- **👁️ المشرف (Supervisor)**: عرض التقارير والإحصائيات

#### 📊 قاعدة بيانات حقيقية
- **10 جداول** رئيسية في PostgreSQL
- **30+ فهرس** لتحسين الأداء
- **30+ سياسة RLS** للأمان
- **5 محفزات** تلقائية
- **3 دوال** متقدمة
- **2 عرض** للتقارير والإحصائيات
- **Realtime Updates** مفعلة

#### 🎥 جلسات البث المباشر
- إنشاء جلسات بث مباشر باستخدام Jitsi Meet
- إشعارات فورية للطلاب عند بدء الجلسة
- تسجيل حضور تلقائي عند الانضمام

#### 🌐 دعم لغتين
- **العربية** (RTL)
- **English** (LTR)
- تبديل سلس بين اللغتين

---

## 🗂️ هيكل قاعدة البيانات

### الجداول الرئيسية (10 جداول)

#### 1️⃣ **users** - المستخدمون
```sql
- id, auth_id, email, full_name
- role, university_id, phone, department
- status, created_at, updated_at, last_login
```
**Constraints:**
- `email` يجب أن ينتهي بـ `@kku.edu.sa`
- `university_id` للطلاب: 9 أرقام تبدأ بـ `44`
- `full_name` لا يقل عن 3 أحرف

#### 2️⃣ **device_sessions** - جلسات الأجهزة
```sql
- id, user_id, device_fingerprint
- device_info, ip_address, location
- session_token, is_active, last_activity, expires_at
```
**الغرض:** منع تسجيل الدخول المتزامن

#### 3️⃣ **courses** - المقررات الدراسية
```sql
- id, course_code, course_name, course_name_ar
- instructor_id, department, semester
- academic_year, credit_hours, max_students, status
```

#### 4️⃣ **enrollments** - التسجيل في المقررات
```sql
- id, student_id, course_id
- enrolled_at, status, grade
```

#### 5️⃣ **schedules** - الجداول الدراسية
```sql
- id, course_id, day_of_week
- start_time, end_time, location
- building, room_number
```

#### 6️⃣ **sessions** - الجلسات الدراسية
```sql
- id, course_id, instructor_id
- session_type, title, description, code
- start_time, end_time, is_active
- stream_active, stream_url, recording_url
```

#### 7️⃣ **attendance_records** - سجلات الحضور
```sql
- id, session_id, student_id, course_id
- check_in_time, check_out_time, status
- verification_method, device_fingerprint
- ip_address, location, notes
```

#### 8️⃣ **notifications** - الإشعارات
```sql
- id, user_id, title, title_ar
- message, message_ar, type
- is_read, priority, created_at, read_at
```

#### 9️⃣ **activity_logs** - سجلات النشاط
```sql
- id, user_id, action, entity_type, entity_id
- details, ip_address, device_fingerprint
- status, created_at
```

#### 🔟 **system_settings** - إعدادات النظام
```sql
- id, key, value (JSONB)
- description, category
```

---

## 🔒 نظام Device Fingerprinting

### كيف يعمل؟

#### المرحلة 1: جمع المعلومات
```javascript
1. Canvas Fingerprint     → رسم فريد على Canvas
2. WebGL Fingerprint      → معلومات كرت الشاشة
3. Audio Fingerprint      → تحليل الصوت
4. Font Detection         → الخطوط المثبتة
5. Plugin Detection       → الإضافات المثبتة
6. Hardware Info          → المعالج، الذاكرة، الشاشة
7. Geolocation           → الموقع الجغرافي
8. IP Address            → عنوان IP
```

#### المرحلة 2: إنشاء Hash
```javascript
// دمج جميع المعلومات
const fingerprintData = [
  canvasFingerprint,
  webglFingerprint,
  audioFingerprint,
  fonts.join(','),
  plugins.join(','),
  hardwareInfo,
  // ... المزيد
].join('|');

// إنشاء SHA-256 hash
const fingerprint = await SHA256(fingerprintData);
// مثال: "a7f3e8d9c4b2f1a0..."
```

#### المرحلة 3: التحقق
```javascript
// عند تسجيل الدخول:
1. إنشاء بصمة جديدة للجهاز الحالي
2. مقارنتها مع البصمات المسجلة
3. إذا وجدت جلسة نشطة لبصمة مختلفة → رفض
4. إذا نفس البصمة → تحديث الجلسة
5. إذا لا توجد جلسة → إنشاء جلسة جديدة
```

### مثال عملي
```typescript
// في AuthContext.tsx
const signIn = async (email, password) => {
  // 1. إنشاء بصمة الجهاز
  const deviceInfo = await generateDeviceFingerprint();
  
  // 2. تسجيل الدخول في Supabase
  const { session } = await supabase.auth.signInWithPassword({
    email, password
  });
  
  // 3. تسجيل الجلسة في قاعدة البيانات
  const response = await registerDeviceSession({
    device_fingerprint: deviceInfo.fingerprint,
    device_info: deviceInfo,
    session_token: session.access_token
  });
  
  // 4. إذا كان هناك تعارض
  if (response.conflict) {
    throw new Error('جلسة نشطة على جهاز آخر');
  }
  
  // 5. حفظ البصمة محلياً
  saveFingerprintToStorage(deviceInfo);
};
```

---

## 🚀 البدء السريع

### المتطلبات الأساسية
- Node.js 16+ (للتطوير المحلي)
- حساب Supabase
- حساب Vercel (للنشر)
- Git

### 1️⃣ إعداد قاعدة البيانات

#### أ. تنفيذ ملف SQL
```sql
-- في Supabase SQL Editor
-- نفذ محتوى ملف: /SUPABASE_REAL_DATABASE_SETUP.sql
```

#### ب. تفعيل Realtime
```
Database → Replication → Enable for:
✅ users
✅ courses
✅ enrollments
✅ sessions
✅ attendance_records
✅ notifications
```

#### ج. إنشاء مستخدمين اختباريين
```sql
-- مدير
Email: admin@kku.edu.sa
Password: Admin@123456

-- مدرس
Email: instructor@kku.edu.sa
Password: Instructor@123

-- طالب
Email: student@kku.edu.sa
Password: Student@123
University ID: 441234567
```

### 2️⃣ رفع على GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/kku-attendance-system.git
git push -u origin main
```

### 3️⃣ النشر على Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. **Import** مشروعك من GitHub
3. أضف **Environment Variables**:
   ```
   SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```
4. اضغط **Deploy**
5. ✅ **جاهز!**

---

## 📖 دليل الاستخدام

### للمدير (Admin)

#### إضافة مستخدم جديد
```
1. لوحة التحكم → إدارة المستخدمين
2. اضغط "إضافة مستخدم"
3. املأ البيانات (Email, Name, Role, University ID)
4. احفظ
```

#### إدارة المقررات
```
1. لوحة التحكم → إدارة المقررات
2. اضغط "إضافة مقرر"
3. املأ البيانات (Code, Name, Instructor, Credits)
4. احفظ
```

#### تسجيل طالب في مقرر
```
1. لوحة التحكم → إدارة التسجيل
2. اختر الطالب
3. اختر المقرر
4. اضغط "تسجيل"
```

### للمدرس (Instructor)

#### إنشاء جلسة حضور
```
1. لوحة التحكم → إدارة الجلسات
2. اضغط "جلسة جديدة"
3. اختر المقرر
4. حدد المدة (افتراضي: 15 دقيقة)
5. احصل على رمز الحضور
6. شارك الرمز مع الطلاب
```

#### بدء جلسة بث مباشر
```
1. لوحة التحكم → جلسات البث المباشر
2. اضغط "جلسة بث جديدة"
3. اختر المقرر
4. أدخل العنوان والوصف
5. اضغط "بدء البث"
6. سيتم إرسال إشعار للطلاب تلقائياً
```

### للطالب (Student)

#### تسجيل الحضور
```
1. لوحة التحكم → تسجيل الحضور
2. أدخل رمز الحضور
3. اضغط "تسجيل"
4. ✅ تم! سيتم حفظ:
   - وقت التسجيل
   - بصمة الجهاز
   - عنوان IP
   - الموقع الجغرافي (إن أمكن)
```

#### الانضمام لجلسة بث مباشر
```
1. عند بدء جلسة → ستحصل على إشعار
2. اضغط على الإشعار أو اذهب إلى "الجلسات المباشرة"
3. اضغط "انضمام"
4. سينقلك إلى Jitsi Meet
5. يتم تسجيل حضورك تلقائياً
```

#### عرض سجل الحضور
```
1. لوحة التحكم → سجلات الحضور
2. اختر المقرر
3. شاهد:
   - عدد الجلسات
   - الحضور / الغياب
   - نسبة الحضور
   - التاريخ والوقت لكل جلسة
```

---

## 🔍 التقارير والإحصائيات

### للمدراء والمشرفين

#### تقرير نسبة الحضور لكل مقرر
```sql
SELECT * FROM course_attendance_stats;
```
**النتيجة:**
```
course_name | total_students | total_sessions | attendance_percentage
CS101       | 45             | 12             | 87.5%
CS201       | 38             | 10             | 92.3%
```

#### تقرير حضور طالب معين
```sql
SELECT * FROM student_attendance_summary
WHERE university_id = '441234567';
```
**النتيجة:**
```
course_name | sessions_attended | attendance_percentage
CS101       | 11/12             | 91.7%
CS201       | 9/10              | 90.0%
```

#### الجلسات النشطة حالياً
```sql
SELECT 
  u.full_name,
  ds.device_info->>'summary' as device,
  ds.last_activity
FROM device_sessions ds
JOIN users u ON u.id = ds.user_id
WHERE ds.is_active = true 
  AND ds.expires_at > NOW();
```

#### سجل النشاط
```sql
SELECT 
  created_at,
  u.full_name,
  action,
  status
FROM activity_logs al
JOIN users u ON u.id = al.user_id
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🛡️ الأمان والخصوصية

### ما يتم تسجيله

عند تسجيل الدخول:
- ✅ البصمة الفريدة للجهاز (Hash غير قابل للعكس)
- ✅ عنوان IP
- ✅ الموقع الجغرافي التقريبي (إن وافق المستخدم)
- ✅ وقت وتاريخ التسجيل

عند تسجيل الحضور:
- ✅ وقت وتاريخ التسجيل الدقيق
- ✅ البصمة الفريدة للجهاز
- ✅ عنوان IP
- ✅ الموقع الجغرافي (إن وافق المستخدم)

### ما لا يتم تسجيله

- ❌ كلمات المرور (مشفرة بـ Supabase Auth)
- ❌ بيانات شخصية حساسة
- ❌ محتوى التصفح
- ❌ ملفات cookies

### سياسات الخصوصية

- جميع البيانات محفوظة في قاعدة بيانات مشفرة (Supabase)
- RLS Policies تمنع الوصول غير المصرح به
- كل مستخدم يرى بياناته الخاصة فقط
- المدراء لديهم صلاحيات محدودة ومسجلة

---

## 📁 بنية المشروع

```
kku-attendance-system/
├── 📄 App.tsx                          # المكون الرئيسي
├── 📁 components/                      # جميع المكونات
│   ├── AuthContext.tsx                 # إدارة المصادقة
│   ├── AdminDashboard.tsx              # لوحة تحكم المدير
│   ├── InstructorDashboard.tsx         # لوحة تحكم المدرس
│   ├── StudentDashboard.tsx            # لوحة تحكم الطالب
│   ├── LoginPage.tsx                   # صفحة تسجيل الدخول
│   ├── SessionManagement.tsx           # إدارة الجلسات
│   ├── StudentAttendance.tsx           # تسجيل الحضور
│   ├── LiveStreamHost.tsx              # بث مباشر (مدرس)
│   ├── LiveStreamViewer.tsx            # بث مباشر (طالب)
│   └── ...
├── 📁 utils/                           # الأدوات المساعدة
│   ├── supabaseClient.ts               # عميل Supabase
│   ├── deviceFingerprint.ts            # نظام البصمة
│   ├── api.ts                          # استدعاءات API
│   └── i18n.ts                         # الترجمة
├── 📁 supabase/functions/server/       # Edge Functions
│   ├── index.tsx                       # Server الرئيسي
│   ├── db.ts                           # دوال قاعدة البيانات
│   └── kv_store.tsx                    # KV Store (احتياطي)
├── 📄 SUPABASE_REAL_DATABASE_SETUP.sql # إعداد قاعدة البيانات (650+ سطر)
├── 📄 vercel.json                      # إعدادات Vercel
└── 📁 styles/                          # الأنماط
    └── globals.css                     # أنماط عامة
```

---

## 🧪 الاختبار

### اختبارات يدوية

#### ✅ اختبار 1: تسجيل الدخول
```
1. افتح التطبيق
2. اذهب إلى "تسجيل الدخول"
3. جرب: admin@kku.edu.sa / Admin@123456
4. تحقق: ظهور لوحة تحكم المدير
```

#### ✅ اختبار 2: Device Fingerprinting
```
1. سجل الدخول على Chrome
2. افتح Console (F12)
3. ابحث عن: "Device fingerprint generated"
4. لا تسجل الخروج
5. افتح Firefox
6. حاول تسجيل الدخول بنفس الحساب
7. تحقق: رسالة "جلسة نشطة على جهاز آخر"
```

#### ✅ اختبار 3: التحقق من البيانات
```
تسجيل حساب جديد:
❌ test@gmail.com → خطأ
✅ student@kku.edu.sa → صحيح

❌ 12345678 → خطأ
✅ 441234567 → صحيح

❌ "Ali" → خطأ
✅ "Ali Mohammed" → صحيح
```

---

## 🤝 المساهمة

### إضافة ميزة جديدة

1. Fork المشروع
2. أنشئ branch جديد: `git checkout -b feature/new-feature`
3. Commit التغييرات: `git commit -m 'Add new feature'`
4. Push إلى Branch: `git push origin feature/new-feature`
5. افتح Pull Request

### الإبلاغ عن مشكلة

افتح Issue جديد وحدد:
- عنوان واضح
- خطوات إعادة إنتاج المشكلة
- النتيجة المتوقعة
- النتيجة الفعلية
- لقطات شاشة (إن أمكن)

---

## 📞 الدعم

- 📧 البريد الإلكتروني: support@kku.edu.sa
- 📱 الواتساب: +966-XX-XXX-XXXX
- 🌐 الموقع: https://www.kku.edu.sa

---

## 📜 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 👥 الفريق المطور

### فريق التطوير الأساسي
- 👨‍💻 **[اسم الطالب 1]** - Full Stack Developer
- 👨‍💻 **[اسم الطالب 2]** - Backend Developer
- 👨‍💻 **[اسم الطالب 3]** - Frontend Developer
- 👨‍💻 **[اسم الطالب 4]** - Database Administrator
- 👨‍💻 **[اسم الطالب 5]** - UI/UX Designer

### الإشراف الأكاديمي
- 👩‍🏫 **[اسم الدكتورة المشرفة]** - المشرف الرئيسي

---

## 🎉 شكر وتقدير

- جامعة الملك خالد
- Supabase
- Vercel
- React و TypeScript Community
- Jitsi Meet

---

## 📊 إحصائيات المشروع

- 📝 **أكثر من 10,000 سطر** من الكود
- 🗂️ **10 جداول** في قاعدة البيانات
- 🔒 **30+ سياسة أمنية** (RLS)
- 📱 **25+ صفحة ومكون**
- 🌐 **دعم لغتين** كامل
- ⚡ **Realtime Updates** مفعلة
- 🎯 **100%** جاهز للإنتاج

---

## 🔄 آخر التحديثات

### الإصدار 2.0 (ديسمبر 2024)
- ✅ قاعدة بيانات PostgreSQL حقيقية
- ✅ نظام Device Fingerprinting متقدم
- ✅ Session Management محكم
- ✅ منع تسجيل الدخول المتزامن
- ✅ Activity Logging شامل
- ✅ Realtime Updates
- ✅ جلسات البث المباشر
- ✅ تحسينات الأمان

### الإصدار 1.0 (نوفمبر 2024)
- ✅ النسخة الأولية
- ✅ تسجيل الدخول والخروج
- ✅ تسجيل الحضور بالرمز
- ✅ لوحات التحكم الأساسية

---

<div align="center">

**صنع بـ ❤️ في جامعة الملك خالد**

**Made with ❤️ at King Khalid University**

[⬆ العودة للأعلى](#نظام-الحضور-الذكي-لجامعة-الملك-خالد)

</div>

</div>

---

# English

## 📋 Overview

KKU Smart Attendance System is a comprehensive solution for managing attendance at King Khalid University, featuring:

### ✨ Key Features

- ✅ Real PostgreSQL database
- ✅ Advanced Device Fingerprinting
- ✅ Concurrent login prevention
- ✅ Session Management
- ✅ Activity Logging
- ✅ 30+ RLS security policies
- ✅ Realtime updates
- ✅ Live streaming sessions
- ✅ Bilingual support (Arabic/English)

### 🎯 Data Validation

- **Email**: Must end with `@kku.edu.sa`
- **University ID**: 9 digits starting with `44` (students only)
- **Full Name**: At least 2 names required
- **Triple verification**: Frontend + Backend + Database

### 📊 Database Structure

- **10 main tables**
- **30+ indexes** for performance
- **30+ RLS policies** for security
- **5 triggers** for automation
- **3 functions** for advanced logic
- **2 views** for reports

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Supabase account
- Vercel account
- Git

### 1️⃣ Database Setup

```sql
-- Execute in Supabase SQL Editor
-- File: /SUPABASE_REAL_DATABASE_SETUP.sql
```

### 2️⃣ Deploy to Vercel

```bash
git push origin main
# Then import project in Vercel
# Add environment variables
# Deploy!
```

### 3️⃣ Test

```
Admin: admin@kku.edu.sa / Admin@123456
Instructor: instructor@kku.edu.sa / Instructor@123
Student: student@kku.edu.sa / Student@123
```

---

## 📖 Documentation

- 🎯 [Complete Implementation Guide](/🎯_دليل_التطبيق_الشامل_للدكتورة_المشرفة.md)
- 🚀 [Vercel Deployment Guide](/🚀_دليل_النشر_على_Vercel_الكامل.md)
- 📚 [Database Setup](/SUPABASE_REAL_DATABASE_SETUP.sql)

---

## 📞 Support

- 📧 Email: support@kku.edu.sa
- 📱 WhatsApp: +966-XX-XXX-XXXX
- 🌐 Website: https://www.kku.edu.sa

---

## 📜 License

MIT License - See [LICENSE](LICENSE)

---

<div align="center">

**Made with ❤️ at King Khalid University**

[⬆ Back to top](#kku-smart-attendance-system)

</div>
