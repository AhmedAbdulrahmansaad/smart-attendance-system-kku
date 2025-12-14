# 🔐 إنشاء مستخدمين اختباريين - Create Test Users

## ❌ **المشكلة الحالية:**
```
❌ [AuthContext] Supabase auth error: Invalid login credentials
```

**السبب:** لا توجد مستخدمين في قاعدة البيانات!

---

## ✅ **الحل: إنشاء مستخدمين اختباريين**

### **الطريقة 1: من Supabase Dashboard (الأسهل)** ⭐

#### **A. أنشئ Admin:**

1. **افتح Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih
   ```

2. **اذهب إلى: Authentication → Users**

3. **اضغط: "Add User" (+ Add User)**

4. **املأ البيانات:**
   ```
   Email: admin@kku.edu.sa
   Password: Admin123!
   Auto Confirm Email: ✅ YES (مهم!)
   ```

5. **اضغط: "Create User"**

6. **انسخ الـUser ID** (ستحتاجه في الخطوة التالية)

7. **افتح: SQL Editor → New Query**

8. **الصق ونفذ:**
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES (
     'الصق-الـID-هنا',  -- استبدل بالـID الفعلي
     'admin@kku.edu.sa',
     'مدير النظام',
     'admin'
   );
   ```

9. **اضغط: Run**

---

#### **B. أنشئ Instructor (مدرس):**

```sql
-- 1. أنشئ المستخدم من Authentication → Users:
-- Email: instructor@kku.edu.sa
-- Password: Instructor123!
-- Auto Confirm: ✅

-- 2. أضف Profile:
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'الصق-الـID-هنا',
  'instructor@kku.edu.sa',
  'د. أحمد محمد',
  'instructor'
);
```

---

#### **C. أنشئ Student (طالب):**

```sql
-- 1. أنشئ المستخدم من Authentication → Users:
-- Email: student@kku.edu.sa
-- Password: Student123!
-- Auto Confirm: ✅

-- 2. أضف Profile:
INSERT INTO profiles (id, email, full_name, role, university_id)
VALUES (
  'الصق-الـID-هنا',
  'student@kku.edu.sa',
  'علي أحمد',
  'student',
  '441234567'  -- رقم جامعي صحيح
);
```

---

### **الطريقة 2: SQL Script (للخبراء)**

```sql
-- ⚠️ ملاحظة: هذه الطريقة تتطلب Backend لأن
-- supabase.auth.admin غير متاح من المتصفح

-- ستحتاج لإنشاء المستخدمين يدوياً من Dashboard
-- ثم تشغيل هذا SQL لإضافة الـProfiles:

-- Admin
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'مدير النظام',
  'admin'
FROM auth.users 
WHERE email = 'admin@kku.edu.sa';

-- Instructor
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'د. أحمد محمد',
  'instructor'
FROM auth.users 
WHERE email = 'instructor@kku.edu.sa';

-- Student
INSERT INTO profiles (id, email, full_name, role, university_id)
SELECT 
  id, 
  email, 
  'علي أحمد',
  'student',
  '441234567'
FROM auth.users 
WHERE email = 'student@kku.edu.sa';
```

---

## 🧪 **اختبر الآن:**

### **1. سجل دخول كـAdmin:**
```
افتح التطبيق
→ تسجيل دخول
→ Email: admin@kku.edu.sa
→ Password: Admin123!
→ دخول
```

**النتيجة المتوقعة:**
```
✅ تم تسجيل الدخول بنجاح
→ Dashboard للـAdmin
```

---

### **2. سجل دخول كـInstructor:**
```
Email: instructor@kku.edu.sa
Password: Instructor123!
```

**النتيجة المتوقعة:**
```
✅ تم تسجيل الدخول بنجاح
→ Dashboard للـInstructor
```

---

### **3. سجل دخول كـStudent:**
```
Email: student@kku.edu.sa
Password: Student123!
```

**النتيجة المتوقعة:**
```
✅ تم تسجيل الدخول بنجاح
→ Dashboard للـStudent
```

---

## 🔍 **تحقق من النجاح:**

### **في /diagnostic.html:**
```
أعد تحميل الصفحة
→ جدول profiles: 3 سجلات ✅
```

### **في Console (F12):**
```
✅ [AuthContext] Sign in successful
✅ [AuthContext] User profile loaded
✅ [AuthContext] Token valid
```

---

## ⚠️ **حل الأخطاء الأخرى:**

### **1. EDGE_FUNCTION_NOT_DEPLOYED**
```
✅ هذا طبيعي!
النظام يستخدم Supabase Fallback تلقائياً
البيانات ستعمل بشكل صحيح
```

### **2. Fingerprint NotAllowedError**
```
⚠️ WebAuthn يتطلب HTTPS أو localhost

الحل المؤقت:
- استخدم "Code" أو "NFC" بدلاً من Fingerprint
- أو شغّل على localhost

الحل الدائم:
- Deploy على Netlify/Vercel (يدعمون HTTPS تلقائياً)
```

---

## 📊 **بيانات اختبار إضافية (اختياري):**

### **إضافة مادة دراسية:**
```sql
INSERT INTO courses (
  course_code, 
  course_name, 
  instructor_id, 
  semester, 
  year
)
SELECT 
  'CS101',
  'مقدمة في البرمجة',
  id,
  'Fall',
  '2024'
FROM profiles
WHERE role = 'instructor'
LIMIT 1;
```

### **تسجيل طالب في المادة:**
```sql
INSERT INTO enrollments (student_id, course_id)
SELECT 
  s.id,
  c.id
FROM profiles s
CROSS JOIN courses c
WHERE s.role = 'student'
  AND c.course_code = 'CS101'
LIMIT 1;
```

### **إنشاء جلسة حضور:**
```sql
INSERT INTO sessions (
  course_id,
  code,
  title,
  session_type,
  session_date,
  active,
  expires_at
)
SELECT 
  id,
  'ABC123',
  'المحاضرة الأولى',
  'attendance',
  CURRENT_DATE,
  true,
  NOW() + INTERVAL '2 hours'
FROM courses
WHERE course_code = 'CS101'
LIMIT 1;
```

---

## ✅ **Checklist:**

- [ ] أنشأت مستخدم Admin
- [ ] أنشأت Profile للـAdmin  
- [ ] سجلت دخول كـAdmin بنجاح
- [ ] أنشأت مستخدم Instructor (اختياري)
- [ ] أنشأت مستخدم Student (اختياري)
- [ ] جميع المستخدمين يظهرون في /diagnostic.html

---

## 💚 **بعد إنشاء المستخدمين:**

```
✅ يمكنك تسجيل الدخول
✅ يمكنك إضافة مواد
✅ يمكنك إنشاء جلسات
✅ يمكنك تسجيل حضور
✅ النظام جاهز للاستخدام!
```

---

## 🆘 **إذا واجهت مشكلة:**

### **"Email already exists"**
```
✅ المستخدم موجود بالفعل!
جرب تسجيل الدخول مباشرة
```

### **"Invalid JWT" أو "Unauthorized"**
```
✅ الحل:
1. سجل خروج
2. أعد تسجيل الدخول
3. سيتم تحديث الـToken تلقائياً
```

### **"User not found in profiles"**
```
❌ السبب: لم تنفذ INSERT INTO profiles

✅ الحل:
1. افتح SQL Editor
2. نفذ الـINSERT query أعلاه
3. تأكد من استخدام الـID الصحيح
```

---

**جرب الآن! سجل دخول وأخبرني!** 🚀
