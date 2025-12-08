# 🗄️ دليل تفعيل قاعدة البيانات | Database Activation Guide

## ⚠️ ملاحظة مهمة جداً | VERY IMPORTANT NOTE

**للأسف، هناك قيد تقني في بيئة Figma Make الحالية:**

Unfortunately, there is a technical limitation in the current Figma Make environment:

---

## 🚫 القيود الحالية | Current Limitations

### ❌ لا يمكن تشغيل SQL Migrations
### ❌ Cannot Run SQL Migrations

بيئة Figma Make **لا تدعم** تشغيل:
- DDL Statements (CREATE TABLE, ALTER TABLE, etc.)
- Migration Files
- SQL Schema Files

Figma Make environment **does NOT support** running:
- DDL Statements (CREATE TABLE, ALTER TABLE, etc.)
- Migration Files  
- SQL Schema Files

---

## ✅ ما هو متاح | What is Available

### نظام KV Store (Key-Value Store)

النظام الحالي يستخدم جدول **Key-Value** مدمج في Supabase يُسمى `kv_store_90ad488b`:

The current system uses a built-in **Key-Value** table in Supabase called `kv_store_90ad488b`:

```typescript
// المتاح في /supabase/functions/server/kv_store.tsx
kv.get(key)              // الحصول على قيمة
kv.set(key, value)       // تعيين قيمة
kv.del(key)              // حذف قيمة
kv.mget(keys)            // الحصول على عدة قيم
kv.mset(data)            // تعيين عدة قيم
kv.mdel(keys)            // حذف عدة قيم
kv.getByPrefix(prefix)   // الحصول على القيم بالبادئة
```

---

## 📋 البيانات المخزنة حالياً | Currently Stored Data

### 1. بيانات المستخدمين | User Data
```typescript
Key: `user:${userId}`
Value: {
  id: string,
  email: string,
  full_name: string,
  role: 'student' | 'instructor' | 'admin' | 'supervisor',
  university_id: string | null,
  created_at: string,
  active_session: {
    session_id: string,
    timestamp: string,
    access_token: string
  } | null
}
```

### 2. بيانات المقررات | Course Data
```typescript
Key: `course:${courseId}`
Value: {
  id: string,
  name: string,
  code: string,
  instructor_id: string,
  created_at: string
}
```

### 3. تسجيل الطلاب في المقررات | Student Enrollments
```typescript
Key: `enrollment:${studentId}:${courseId}`
Value: {
  student_id: string,
  course_id: string,
  enrolled_at: string
}
```

### 4. جلسات الحضور | Attendance Sessions
```typescript
Key: `session:${sessionId}`
Value: {
  id: string,
  course_id: string,
  date: string,
  start_time: string,
  end_time: string,
  status: 'scheduled' | 'active' | 'completed',
  attendance_code: string
}
```

### 5. سجلات الحضور | Attendance Records
```typescript
Key: `attendance:${sessionId}:${studentId}`
Value: {
  session_id: string,
  student_id: string,
  status: 'present' | 'absent' | 'late',
  timestamp: string,
  verification_data: {
    biometricScore: number,
    verificationMethod: string,
    checks: object
  }
}
```

---

## 🔧 كيفية العمل مع النظام الحالي | How to Work with Current System

### ✅ النظام يعمل بالكامل | System is Fully Functional

النظام الحالي **لا يحتاج** إلى إنشاء جداول SQL إضافية. نظام KV Store مرن وكافٍ لجميع العمليات:

The current system **does NOT need** additional SQL tables. The KV Store system is flexible and sufficient for all operations:

1. **✓** تسجيل المستخدمين | User Registration
2. **✓** تسجيل الدخول/الخروج | Login/Logout
3. **✓** إدارة الجلسات | Session Management
4. **✓** إنشاء المقررات | Course Creation
5. **✓** تسجيل الطلاب | Student Enrollment
6. **✓** تسجيل الحضور | Attendance Marking
7. **✓** التحقق البيومتري | Biometric Verification
8. **✓** التقارير والإحصائيات | Reports & Statistics

---

## 🚀 خطوات التشغيل | Activation Steps

### الخطوة 1: تكوين Supabase | Step 1: Configure Supabase

1. انتقل إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. احصل على المفاتيح التالية:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### الخطوة 2: إعداد Environment Variables

في إعدادات المشروع، أضف:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### الخطوة 3: التحقق من الاتصال | Step 3: Verify Connection

افتح صفحة "Backend Health Check" في التطبيق للتحقق من:
- ✓ اتصال Supabase
- ✓ عمل KV Store
- ✓ عمل Authentication

### الخطوة 4: إنشاء حساب مدير | Step 4: Create Admin Account

1. انتقل إلى صفحة التسجيل
2. سجل حساب جديد بدور "Admin"
3. استخدم بريد جامعي: `admin@kku.edu.sa`

---

## 📊 هيكل البيانات الكامل | Complete Data Structure

```
kv_store_90ad488b (KV Table)
│
├── user:*                     المستخدمون | Users
│   ├── user:uuid-1           (Admin)
│   ├── user:uuid-2           (Instructor)
│   └── user:uuid-3           (Student)
│
├── course:*                   المقررات | Courses
│   ├── course:course-1       (CS101)
│   └── course:course-2       (MATH201)
│
├── enrollment:*               التسجيلات | Enrollments
│   ├── enrollment:student-1:course-1
│   └── enrollment:student-2:course-1
│
├── session:*                  الجلسات | Sessions
│   ├── session:session-1     (CS101 - Dec 5)
│   └── session:session-2     (MATH201 - Dec 5)
│
└── attendance:*               الحضور | Attendance
    ├── attendance:session-1:student-1
    └── attendance:session-1:student-2
```

---

## 🔍 كيفية الاستعلام عن البيانات | How to Query Data

### Frontend (React Components):

```typescript
import { apiRequest } from '../utils/api';

// Get user data
const userData = await apiRequest('/me', { token });

// Get courses
const courses = await apiRequest('/courses', { token });

// Mark attendance
const result = await apiRequest('/attendance', {
  method: 'POST',
  token,
  body: {
    session_id: 'session-1',
    status: 'present',
    verification_data: { ... }
  }
});
```

### Backend (Hono Server):

```typescript
import * as kv from './kv_store.tsx';

// Get single user
const user = await kv.get(`user:${userId}`);

// Get all courses
const courses = await kv.getByPrefix('course:');

// Save attendance
await kv.set(`attendance:${sessionId}:${studentId}`, {
  status: 'present',
  timestamp: new Date().toISOString(),
  verification_data: { ... }
});

// Get all attendance for a session
const attendance = await kv.getByPrefix(`attendance:${sessionId}:`);
```

---

## 💡 مزايا نظام KV Store | KV Store Advantages

### ✅ المرونة | Flexibility
- لا حاجة لتعريف Schema مسبق
- سهولة إضافة حقول جديدة
- دعم JSON بشكل كامل

### ✅ السرعة | Speed
- استعلامات سريعة جداً
- لا حاجة لـ JOINs المعقدة
- كاش مدمج

### ✅ البساطة | Simplicity
- API بسيط وواضح
- لا حاجة لكتابة SQL
- سهولة الصيانة

---

## 🔄 ترحيل البيانات (إذا لزم الأمر) | Data Migration (If Needed)

إذا أردت لاحقاً الانتقال إلى جداول SQL حقيقية:

If you want to later migrate to real SQL tables:

### الخطوة 1: تصدير البيانات | Export Data

```typescript
// Get all data from KV store
const users = await kv.getByPrefix('user:');
const courses = await kv.getByPrefix('course:');
const enrollments = await kv.getByPrefix('enrollment:');
const sessions = await kv.getByPrefix('session:');
const attendance = await kv.getByPrefix('attendance:');

// Export to JSON
const exportData = {
  users,
  courses,
  enrollments,
  sessions,
  attendance
};
```

### الخطوة 2: إنشاء الجداول (في Supabase Dashboard)

```sql
-- في لوحة تحكم Supabase، قم بتشغيل:

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  university_id VARCHAR(9),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  instructor_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ... المزيد من الجداول
```

### الخطوة 3: استيراد البيانات | Import Data

```typescript
// في Supabase Dashboard - SQL Editor
INSERT INTO users (id, email, full_name, role, university_id)
VALUES 
  ('uuid-1', 'admin@kku.edu.sa', 'Admin User', 'admin', NULL),
  ('uuid-2', 'instructor@kku.edu.sa', 'Instructor Name', 'instructor', NULL);
  
-- ... المزيد من البيانات
```

---

## 🛠️ استكشاف الأخطاء | Troubleshooting

### مشكلة: البيانات لا تُحفظ | Issue: Data Not Saving

**الحل | Solution:**
1. تحقق من المفاتيح في Environment Variables
2. تحقق من Backend Health Check
3. راجع Console للأخطاء

### مشكلة: لا يمكن تسجيل الدخول | Issue: Cannot Login

**الحل | Solution:**
1. تأكد من تفعيل Email Authentication في Supabase
2. تحقق من SUPABASE_SERVICE_ROLE_KEY
3. تأكد من صحة البريد وكلمة المرور

### مشكلة: البيانات لا تظهر | Issue: Data Not Showing

**الحل | Solution:**
1. تحقق من الـ Token في الطلبات
2. تأكد من الـ Prefix الصحيح في استعلامات KV
3. راجع Backend Logs

---

## 📚 موارد إضافية | Additional Resources

1. **Supabase Documentation**: https://supabase.com/docs
2. **KV Store Implementation**: `/supabase/functions/server/kv_store.tsx`
3. **API Reference**: `/API_REFERENCE.md`
4. **Security Features**: `/SECURITY_FEATURES.md`

---

## ⚡ Quick Start Checklist

- [ ] إنشاء مشروع Supabase
- [ ] الحصول على المفاتيح الثلاثة
- [ ] إضافة المفاتيح إلى Environment Variables
- [ ] فتح Backend Health Check والتحقق من الاتصال
- [ ] تسجيل حساب مدير جديد
- [ ] إنشاء مقرر تجريبي
- [ ] تسجيل طالب وتجربة الحضور

---

## 🎯 الخلاصة | Summary

**النظام جاهز للعمل مباشرة بدون أي إعداد إضافي للجداول.**

**The system is ready to work immediately without any additional table setup.**

نظام KV Store المدمج كافٍ تماماً لجميع عمليات النظام:
- ✅ إدارة المستخدمين
- ✅ إدارة المقررات
- ✅ تسجيل الحضور
- ✅ التحقق البيومتري
- ✅ التقارير

The built-in KV Store system is completely sufficient for all system operations:
- ✅ User Management
- ✅ Course Management  
- ✅ Attendance Tracking
- ✅ Biometric Verification
- ✅ Reports

---

**آخر تحديث | Last Updated**: 5 ديسمبر 2024
**الحالة | Status**: ✅ جاهز للاستخدام | Ready to Use
