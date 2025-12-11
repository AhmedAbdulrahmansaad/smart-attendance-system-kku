# 🧪 دليل الاختبار الشامل - Comprehensive Testing Guide

## نظام الحضور الذكي - جامعة الملك خالد
## Smart Attendance System - King Khalid University

---

## 📋 نظرة عامة / Overview

هذا الدليل يساعدك على اختبار جميع ميزات النظام بشكل منهجي.
This guide helps you systematically test all system features.

---

## 🎯 الأدوار المتاحة / Available Roles

| الدور / Role | البريد / Email | الوصول / Access |
|-------------|----------------|-----------------|
| Admin       | `admin@kku.edu.sa` | جميع الصفحات / All pages |
| Instructor  | `instructor@kku.edu.sa` | المقررات والجلسات / Courses & Sessions |
| Student     | `student@kku.edu.sa` + رقم جامعي / University ID | الحضور والجدول / Attendance & Schedule |
| Supervisor  | `supervisor@kku.edu.sa` | التقارير والإحصائيات / Reports & Statistics |

---

## 🔐 اختبار التسجيل / Sign Up Testing

### ✅ حالات نجاح التسجيل / Successful Registration Cases

#### 1️⃣ تسجيل طالب / Student Registration
```json
{
  "email": "ahmad.mohammed@kku.edu.sa",
  "password": "SecurePass123!",
  "full_name": "أحمد محمد علي",
  "role": "student",
  "university_id": "441234567"
}
```

**التحقق المطلوب / Required Verification:**
- ✅ البريد ينتهي بـ `@kku.edu.sa`
- ✅ Email ends with `@kku.edu.sa`
- ✅ الرقم الجامعي 9 خانات ويبدأ بـ 44
- ✅ University ID is 9 digits starting with 44
- ✅ الاسم كامل وحقيقي
- ✅ Full real name

---

#### 2️⃣ تسجيل مدرس / Instructor Registration
```json
{
  "email": "dr.khalid@kku.edu.sa",
  "password": "InstructorPass123!",
  "full_name": "د. خالد أحمد السعيد",
  "role": "instructor"
}
```

**ملاحظة / Note:**
- المدرس لا يحتاج رقم جامعي
- Instructor doesn't need university ID

---

#### 3️⃣ تسجيل مشرف / Supervisor Registration
```json
{
  "email": "supervisor@kku.edu.sa",
  "password": "SuperPass123!",
  "full_name": "د. فاطمة محمد",
  "role": "supervisor"
}
```

---

### ❌ حالات فشل التسجيل / Failed Registration Cases

#### 1️⃣ بريد خاطئ / Wrong Email
```json
{
  "email": "test@gmail.com",  // ❌ يجب @kku.edu.sa
  "password": "Pass123!",
  "full_name": "اسم المستخدم",
  "role": "student",
  "university_id": "441234567"
}
```

**الرسالة المتوقعة / Expected Message:**
```
"Must use university email @kku.edu.sa"
```

---

#### 2️⃣ رقم جامعي خاطئ / Wrong University ID
```json
{
  "email": "student@kku.edu.sa",
  "password": "Pass123!",
  "full_name": "اسم الطالب",
  "role": "student",
  "university_id": "12345678"  // ❌ لا يبدأ بـ 44
}
```

**الرسالة المتوقعة / Expected Message:**
```
"University ID must be 9 digits starting with 44"
```

---

#### 3️⃣ بريد مكرر / Duplicate Email
```json
{
  "email": "ahmad.mohammed@kku.edu.sa",  // ❌ مسجل مسبقاً
  "password": "Pass123!",
  "full_name": "اسم آخر",
  "role": "student",
  "university_id": "441234568"
}
```

**الرسالة المتوقعة / Expected Message:**
```json
{
  "error": "Email already registered",
  "message": "This email is already registered. Please use Sign In instead.",
  "messageAr": "هذا البريد مسجل مسبقاً. الرجاء استخدام تسجيل الدخول."
}
```

---

#### 4️⃣ رقم جامعي مكرر / Duplicate University ID
```json
{
  "email": "new.student@kku.edu.sa",
  "password": "Pass123!",
  "full_name": "طالب جديد",
  "role": "student",
  "university_id": "441234567"  // ❌ مستخدم مسبقاً
}
```

**الرسالة المتوقعة / Expected Message:**
```json
{
  "error": "University ID already registered",
  "message": "This University ID is already registered. Please use Sign In instead.",
  "messageAr": "هذا الرقم الجامعي مسجل مسبقاً. الرجاء استخدام تسجيل الدخول."
}
```

---

## 🔑 اختبار تسجيل الدخول / Sign In Testing

### ✅ تسجيل دخول ناجح / Successful Login

#### استخدام Supabase Client:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'ahmad.mohammed@kku.edu.sa',
  password: 'SecurePass123!'
});

if (!error) {
  console.log('✅ Login successful');
  console.log('Access Token:', data.session.access_token);
}
```

---

### ❌ تسجيل دخول فاشل / Failed Login

#### بيانات خاطئة / Wrong Credentials:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'ahmad.mohammed@kku.edu.sa',
  password: 'WrongPassword'  // ❌
});

if (error) {
  console.log('❌ Invalid login credentials');
}
```

---

## 🛡️ اختبار الأمان / Security Testing

### 1️⃣ منع تسجيل الدخول المتزامن / Prevent Concurrent Login

**الخطوات / Steps:**
1. سجل دخول على جهاز/متصفح أول
   Login on first device/browser
2. حاول تسجيل دخول على جهاز/متصفح ثاني
   Try to login on second device/browser

**النتيجة المتوقعة / Expected Result:**
```json
{
  "error": "Another session is active",
  "messageAr": "يوجد جلسة نشطة على جهاز آخر"
}
```

---

### 2️⃣ البصمة الرقمية / Device Fingerprint

**التحقق / Verification:**
```typescript
import { generateDeviceFingerprint } from './utils/deviceFingerprint';

const fingerprint = await generateDeviceFingerprint();
console.log('Device Fingerprint:', fingerprint);

// يجب أن تكون فريدة لكل جهاز
// Should be unique per device
```

---

## 👨‍💼 اختبار لوحة المدير / Admin Dashboard Testing

### الصفحة الرئيسية / Main Dashboard

**ما يجب التحقق منه / What to Verify:**
- ✅ عرض الإحصائيات الأساسية
- ✅ Display basic statistics
  - عدد الطلاب / Students count
  - عدد المدرسين / Instructors count
  - عدد المقررات / Courses count
  - إجمالي الجلسات / Total sessions

- ✅ الرسوم البيانية / Charts
  - Bar Chart - الحضور الأسبوعي
  - Pie Chart - توزيع المستخدمين
  - Line Chart - الاتجاهات

- ✅ النشاط الأخير / Recent Activity
  - آخر 5-10 أنشطة
  - Last 5-10 activities

---

### إدارة المستخدمين / User Management

**الاختبارات / Tests:**

1. **عرض جميع المستخدمين / View All Users**
   ```
   GET /make-server-90ad488b/users
   ```
   - ✅ يجب عرض جميع المستخدمين
   - ✅ Should display all users

2. **إنشاء مستخدم جديد / Create New User**
   ```
   POST /make-server-90ad488b/users
   ```
   - ✅ نموذج التسجيل يعمل
   - ✅ Registration form works

3. **تحديث مستخدم / Update User**
   ```
   PUT /make-server-90ad488b/users/:id
   ```
   - ✅ تعديل البيانات يعمل
   - ✅ Data editing works

---

### إدارة المقررات / Course Management

**الاختبارات / Tests:**

1. **إنشاء مقرر / Create Course**
   ```json
   {
     "code": "CS101",
     "name": "مقدمة في البرمجة",
     "description": "أساسيات البرمجة",
     "credits": 3,
     "semester": "Fall 2025"
   }
   ```

2. **تحديث مقرر / Update Course**
   - ✅ تعديل معلومات المقرر
   - ✅ Edit course information

3. **حذف مقرر / Delete Course**
   - ✅ حذف المقرر
   - ✅ Delete course
   - ⚠️ التأكد من الإشعار بحذف البيانات المرتبطة
   - ⚠️ Confirm deletion of related data

---

## 👨‍🏫 اختبار لوحة المدرس / Instructor Dashboard Testing

### المقررات / Courses

**ما يجب التحقق منه / What to Verify:**
- ✅ عرض المقررات المسندة
- ✅ Display assigned courses
- ✅ عدد الطلاب في كل مقرر
- ✅ Number of students per course
- ✅ نسبة الحضور لكل مقرر
- ✅ Attendance rate per course

---

### إدارة الجلسات / Session Management

**الاختبارات / Tests:**

1. **إنشاء جلسة عادية / Create Regular Session**
   ```json
   {
     "course_id": "course-123",
     "date": "2025-12-09",
     "start_time": "10:00",
     "end_time": "11:30",
     "topic": "المتغيرات والثوابت"
   }
   ```

2. **تسجيل الحضور / Record Attendance**
   ```json
   {
     "session_id": "session-123",
     "student_id": "student-456",
     "status": "present",
     "notes": "حضر في الوقت"
   }
   ```

---

### جلسات البث المباشر / Live Sessions

**الاختبارات / Tests:**

1. **إنشاء جلسة مباشرة / Create Live Session**
   ```json
   {
     "course_id": "course-123",
     "title": "محاضرة مباشرة - الفصل الأول",
     "description": "شرح المتغيرات",
     "scheduled_time": "2025-12-09T10:00:00Z"
   }
   ```

2. **بدء الجلسة / Start Session**
   - ✅ فتح واجهة Jitsi Meet
   - ✅ Open Jitsi Meet interface
   - ✅ تسجيل حضور تلقائي للطلاب
   - ✅ Automatic attendance for students

3. **إنهاء الجلسة / End Session**
   ```
   POST /make-server-90ad488b/live-sessions/:sessionId/end
   ```

---

## 👨‍🎓 اختبار لوحة الطالب / Student Dashboard Testing

### عرض المقررات / View Courses

**ما يجب التحقق منه / What to Verify:**
- ✅ المقررات المسجل فيها
- ✅ Enrolled courses
- ✅ معلومات المدرس
- ✅ Instructor information
- ✅ نسبة الحضور الشخصية
- ✅ Personal attendance rate

---

### تسجيل الحضور / Mark Attendance

**الاختبارات / Tests:**

1. **الحضور عبر البصمة / Fingerprint Attendance**
   ```typescript
   // Component: FingerprintAttendance.tsx
   - ✅ توليد بصمة فريدة
   - ✅ Generate unique fingerprint
   - ✅ التحقق من الجلسة النشطة
   - ✅ Verify active session
   - ✅ تسجيل الحضور
   - ✅ Record attendance
   ```

2. **الانضمام لجلسة مباشرة / Join Live Session**
   ```typescript
   // Component: LiveStreamViewer.tsx
   - ✅ عرض الجلسات النشطة
   - ✅ Display active sessions
   - ✅ الانضمام للجلسة
   - ✅ Join session
   - ✅ تسجيل تلقائي للحضور
   - ✅ Automatic attendance recording
   ```

---

### الجدول الدراسي / Class Schedule

**ما يجب التحقق منه / What to Verify:**
- ✅ عرض جميع الجلسات القادمة
- ✅ Display all upcoming sessions
- ✅ ترتيب حسب التاريخ والوقت
- ✅ Sort by date and time
- ✅ إشعارات قبل الجلسة
- ✅ Notifications before session

---

## 👨‍💼 اختبار لوحة المشرف / Supervisor Dashboard Testing

### الإحصائيات الشاملة / Comprehensive Statistics

**ما يجب التحقق منه / What to Verify:**
- ✅ إجمالي الطلاب / Total students
- ✅ إجمالي المدرسين / Total instructors
- ✅ إجمالي المقررات / Total courses
- ✅ متوسط الحضور / Average attendance
- ✅ الجلسات النشطة / Active sessions
- ✅ حضور اليوم / Today's attendance

---

### الرسوم البيانية / Charts

**الاختبارات / Tests:**

1. **اتجاهات الحضور / Attendance Trends**
   - ✅ Bar Chart يعرض الحضور/الغياب
   - ✅ Bar Chart shows present/absent
   - ✅ بيانات أسبوعية
   - ✅ Weekly data

2. **توزيع الحضور / Attendance Distribution**
   - ✅ Pie Chart للتوزيع
   - ✅ Pie Chart for distribution
   - ✅ نسب مئوية دقيقة
   - ✅ Accurate percentages

3. **أداء المقررات / Course Performance**
   - ✅ مقارنة بين المقررات
   - ✅ Compare courses
   - ✅ أعلى/أدنى حضور
   - ✅ Highest/lowest attendance

---

### الفلاتر / Filters

**الاختبارات / Tests:**

1. **فلتر الوقت / Time Filter**
   ```
   Options:
   - أسبوع / Week
   - شهر / Month
   - فصل دراسي / Semester
   - سنة / Year
   ```

2. **فلتر القسم / Department Filter**
   ```
   Options:
   - الكل / All
   - علوم الحاسب / CS
   - الرياضيات / Math
   - الهندسة / Engineering
   ```

---

### النشاط الأخير / Recent Activity

**ما يجب التحقق منه / What to Verify:**
- ✅ آخر 10 سجلات حضور
- ✅ Last 10 attendance records
- ✅ معلومات كاملة (الطالب، المقرر، الوقت)
- ✅ Complete info (student, course, time)
- ✅ حالة الحضور ملونة
- ✅ Colored attendance status

---

## 🔔 اختبار الإشعارات / Notifications Testing

### إنشاء إشعار / Create Notification

**السيناريو / Scenario:**
1. مدرس ينشئ جلسة مباشرة
   Instructor creates live session
2. النظام يرسل إشعارات للطلاب
   System sends notifications to students
3. الطلاب يستلمون الإشعار فوراً
   Students receive notification instantly

**التحقق / Verification:**
```
GET /make-server-90ad488b/notifications
```
- ✅ الإشعار موجود
- ✅ Notification exists
- ✅ البيانات صحيحة
- ✅ Data is correct

---

## 📊 اختبار التقارير / Reports Testing

### تقرير الحضور / Attendance Report

**الاختبارات / Tests:**

1. **تقرير طالب / Student Report**
   - ✅ جميع سجلات الحضور
   - ✅ All attendance records
   - ✅ نسبة الحضور
   - ✅ Attendance percentage

2. **تقرير مقرر / Course Report**
   - ✅ جميع الطلاب
   - ✅ All students
   - ✅ نسب الحضور الفردية
   - ✅ Individual attendance rates

3. **تقرير عام / General Report**
   - ✅ إحصائيات شاملة
   - ✅ Comprehensive statistics
   - ✅ تصدير PDF/Excel
   - ✅ Export PDF/Excel

---

## 🌍 اختبار اللغات / Language Testing

### تبديل اللغة / Switch Language

**الاختبارات / Tests:**

1. **العربية → الإنجليزية**
   ```typescript
   setLanguage('en');
   ```
   - ✅ جميع النصوص تتحول
   - ✅ All texts change
   - ✅ RTL → LTR
   - ✅ الأيقونات في الجهة الصحيحة
   - ✅ Icons on correct side

2. **الإنجليزية → العربية**
   ```typescript
   setLanguage('ar');
   ```
   - ✅ جميع النصوص بالعربية
   - ✅ All texts in Arabic
   - ✅ LTR → RTL
   - ✅ المحاذاة صحيحة
   - ✅ Alignment correct

---

## 📱 اختبار الاستجابة / Responsive Testing

### أحجام الشاشات / Screen Sizes

**الاختبارات / Tests:**

1. **Mobile (< 768px)**
   - ✅ قوائم منسدلة
   - ✅ Collapsible menus
   - ✅ بطاقات عمودية
   - ✅ Vertical cards

2. **Tablet (768px - 1024px)**
   - ✅ شبكة 2 أعمدة
   - ✅ 2-column grid
   - ✅ Sidebar قابل للطي
   - ✅ Collapsible sidebar

3. **Desktop (> 1024px)**
   - ✅ شبكة كاملة
   - ✅ Full grid
   - ✅ Sidebar ثابت
   - ✅ Fixed sidebar

---

## ⚡ اختبار الأداء / Performance Testing

### تحميل الصفحة / Page Load

**المقاييس / Metrics:**
```
Target:
- First Paint: < 1s
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
```

### React Query Cache

**التحقق / Verification:**
```typescript
// يجب أن يستخدم cache بدلاً من إعادة الطلب
// Should use cache instead of re-fetching

queryClient.getQueryData(['admin-stats']);
// ✅ يجب أن يعيد البيانات من cache
// ✅ Should return data from cache
```

---

## 🐛 اختبار الأخطاء / Error Testing

### معالجة الأخطاء / Error Handling

**السيناريوهات / Scenarios:**

1. **Network Error**
   - ✅ رسالة خطأ واضحة
   - ✅ Clear error message
   - ✅ زر إعادة المحاولة
   - ✅ Retry button

2. **Unauthorized**
   - ✅ إعادة توجيه للتسجيل
   - ✅ Redirect to login
   - ✅ رسالة توضيحية
   - ✅ Explanatory message

3. **Server Error (500)**
   - ✅ رسالة خطأ عامة
   - ✅ Generic error message
   - ✅ لا تظهر تفاصيل تقنية
   - ✅ No technical details shown

---

## ✅ قائمة التحقق النهائية / Final Checklist

### قبل التسليم / Before Submission

- [ ] جميع الأدوار الأربعة تعمل
      All four roles work
- [ ] التسجيل والدخول يعملان
      Sign up and sign in work
- [ ] الأمان مفعّل (منع تسجيل دخول متزامن)
      Security enabled (prevent concurrent login)
- [ ] البصمة الرقمية تعمل
      Device fingerprint works
- [ ] جلسات البث المباشر تعمل
      Live sessions work
- [ ] الإشعارات تعمل
      Notifications work
- [ ] التقارير تعمل
      Reports work
- [ ] اللغتان تعملان بشكل صحيح
      Both languages work correctly
- [ ] التصميم responsive
      Design is responsive
- [ ] لا توجد أخطاء في console
      No console errors
- [ ] جميع الـ endpoints تعمل
      All endpoints work
- [ ] البيانات حقيقية فقط
      Real data only

---

## 📞 الإبلاغ عن المشاكل / Report Issues

### إذا وجدت مشكلة / If You Find an Issue:

1. **سجّل الخطوات / Record Steps:**
   - ماذا فعلت؟ / What did you do?
   - ماذا حدث؟ / What happened?
   - ماذا كان متوقعاً؟ / What was expected?

2. **التقط صورة / Take Screenshot:**
   - الشاشة / Screen
   - رسالة الخطأ / Error message
   - Console logs

3. **معلومات البيئة / Environment Info:**
   - المتصفح / Browser
   - نظام التشغيل / OS
   - حجم الشاشة / Screen size

---

## 🎯 النتيجة المتوقعة / Expected Result

### ✅ نظام كامل وعملي
### ✅ Complete and Functional System

- جميع الميزات تعمل
  All features work
- لا توجد أخطاء
  No errors
- تجربة مستخدم سلسة
  Smooth user experience
- أداء ممتاز
  Excellent performance

---

## 🏆 النظام جاهز للاختبار!
## 🏆 System Ready for Testing!

ابدأ الاختبار باتباع هذا الدليل خطوة بخطوة.
Start testing by following this guide step by step.

---

تم بحمد الله ✅
Completed with God's grace ✅

**King Khalid University - Smart Attendance System**
**نظام الحضور الذكي - جامعة الملك خالد**
