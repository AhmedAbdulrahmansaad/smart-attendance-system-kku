# 🚀 دليل النشر والرفع الكامل

<div align="center">

# دليل رفع المشروع على GitHub و Vercel

**نظام الحضور الذكي - جامعة الملك خالد**

</div>

---

## 📋 المتطلبات قبل البدء

### 1. حسابات مطلوبة:
```
✅ حساب GitHub (github.com)
✅ حساب Vercel (vercel.com)
✅ حساب Supabase (supabase.com) - موجود بالفعل
```

### 2. معلومات Supabase الضرورية:
```
احفظ هذه المعلومات من مشروعك في Supabase:

1. SUPABASE_URL
   → من: Project Settings → API → Project URL
   → مثال: https://abcdefgh12345678.supabase.co

2. SUPABASE_ANON_KEY  
   → من: Project Settings → API → anon/public key
   → مثال: eyJhbGciOiJIUzI1NiIs...

3. SUPABASE_SERVICE_ROLE_KEY
   → من: Project Settings → API → service_role key
   → ⚠️ احتفظ بهذا سرياً!

4. SUPABASE_DB_URL (اختياري)
   → من: Project Settings → Database → Connection String
   → مثال: postgresql://postgres:[password]@...
```

---

## 📥 الخطوة 1: تحميل المشروع من Figma Make

### الطريقة:

```
1. في Figma Make → اضغط زر "Download" أو "Export"
2. سيتم تحميل ملف ZIP
3. استخرج الملفات في مجلد على جهازك
4. سمّ المجلد مثلاً: "kku-attendance-system"
```

### التحقق:
```bash
يجب أن يحتوي المجلد على:
□ /components
□ /utils
□ /supabase
□ /styles
□ App.tsx
□ package.json
□ README.md
```

---

## 🔧 الخطوة 2: إعداد المشروع محلياً (اختياري)

### إذا أردت اختباره قبل الرفع:

#### 1. افتح Terminal/Command Prompt:
```bash
cd kku-attendance-system
```

#### 2. ثبّت المكتبات:
```bash
npm install
# أو
yarn install
```

#### 3. أنشئ ملف `.env.local`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_URL=your-database-url-here
```

#### 4. شغّل المشروع محلياً:
```bash
npm run dev
# أو
yarn dev
```

#### 5. افتح المتصفح:
```
http://localhost:3000
```

#### 6. اختبر:
```
✅ تسجيل الدخول
✅ Dashboard
✅ البث المباشر
✅ تسجيل الحضور
```

---

## 📤 الخطوة 3: رفع على GitHub

### الطريقة 1: عبر GitHub Desktop (سهلة)

#### 1. حمّل GitHub Desktop:
```
من: desktop.github.com
```

#### 2. سجّل دخول:
```
File → Options → Sign in to GitHub
```

#### 3. أنشئ Repository:
```
File → New Repository
Name: kku-attendance-system
Description: Smart Attendance System for King Khalid University
Local Path: اختر المجلد
✅ Initialize with README
```

#### 4. ارفع الملفات:
```
1. Commit to main
2. Message: "Initial commit - Smart Attendance System"
3. Publish repository
4. ✅ Public أو Private (حسب رغبتك)
```

---

### الطريقة 2: عبر Git Command Line

#### 1. افتح Terminal في مجلد المشروع:
```bash
cd kku-attendance-system
```

#### 2. ابدأ Git:
```bash
git init
```

#### 3. أضف جميع الملفات:
```bash
git add .
```

#### 4. Commit أول:
```bash
git commit -m "Initial commit - Smart Attendance System"
```

#### 5. أنشئ Repository في GitHub:
```
1. اذهب إلى github.com
2. اضغط "+" → New repository
3. اسم: kku-attendance-system
4. Description: Smart Attendance System for King Khalid University
5. Public أو Private
6. لا تضف README (موجود بالفعل)
7. Create repository
```

#### 6. اربط بـ GitHub:
```bash
git remote add origin https://github.com/YOUR-USERNAME/kku-attendance-system.git
git branch -M main
git push -u origin main
```

#### 7. تحقق:
```
افتح رابط Repository في GitHub
تأكد من ظهور جميع الملفات
```

---

## 🌐 الخطوة 4: نشر على Vercel

### 1. اذهب إلى Vercel:
```
افتح: vercel.com
سجل دخول (استخدم حساب GitHub للربط التلقائي)
```

### 2. أنشئ مشروع جديد:
```
1. اضغط "Add New" → Project
2. Import Git Repository
3. اختر repository: kku-attendance-system
4. اضغط "Import"
```

### 3. إعدادات المشروع:

#### Framework Preset:
```
✅ اختر "Vite" أو "React"
✅ Vercel سيكتشفه تلقائياً
```

#### Build Settings:
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### Root Directory:
```
✅ ./ (الجذر)
```

### 4. Environment Variables:

#### ⚠️ مهم جداً! أضف المتغيرات:

```
اضغط "Environment Variables"

أضف واحدة تلو الأخرى:

1. Name: SUPABASE_URL
   Value: https://your-project.supabase.co
   Environment: Production, Preview, Development
   ✅ Add

2. Name: SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIs...
   Environment: Production, Preview, Development
   ✅ Add

3. Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIs... (المفتاح الخاص)
   Environment: Production, Preview, Development
   ✅ Add

4. Name: SUPABASE_DB_URL (اختياري)
   Value: postgresql://postgres:[password]@...
   Environment: Production, Preview, Development
   ✅ Add
```

### 5. Deploy:
```
اضغط "Deploy"
انتظر 3-5 دقائق
```

### 6. بعد النشر:
```
✅ ستظهر رسالة نجاح
✅ ستحصل على رابط مثل:
   https://kku-attendance-system.vercel.app
```

---

## ✅ الخطوة 5: التحقق من النشر

### 1. افتح الموقع المنشور:
```
افتح الرابط الذي حصلت عليه من Vercel
```

### 2. افتح Console (F12):
```
1. اضغط F12
2. اذهب لتبويب Console
3. تحقق من عدم وجود أخطاء حمراء
```

### 3. اختبر تسجيل الدخول:
```
1. اضغط "تسجيل دخول"
2. سجل دخول بحساب موجود
   أو
3. أنشئ حساب جديد
```

### 4. اختبر Dashboard:
```
1. بعد تسجيل الدخول
2. يجب أن يظهر Dashboard
3. تحقق من ظهور البيانات (أو 0 إذا كان جديد)
```

### 5. اختبر البث المباشر:
```
كمدرس:
1. إدارة الجلسات
2. إنشاء جلسة بث مباشر
3. بدء البث
4. تفعيل الكاميرا

كطالب:
1. تسجيل الحضور
2. الانضمام للبث
3. مشاهدة المدرس
```

### 6. اختبر السرعة:
```
✅ التحميل يجب أن يكون سريع (1-3 ثوانٍ)
✅ لا "جاري التحميل" مستمر
✅ كل شيء يعمل بسلاسة
```

---

## 🐛 حل المشاكل الشائعة بعد النشر

### المشكلة 1: "502 Bad Gateway" أو "Function Error"

#### السبب:
```
Environment Variables غير مضبوطة
```

#### الحل:
```
1. Vercel Dashboard → Project Settings
2. Environment Variables
3. تحقق من:
   ✅ SUPABASE_URL صحيح
   ✅ SUPABASE_ANON_KEY صحيح
   ✅ SUPABASE_SERVICE_ROLE_KEY صحيح
4. إذا غيّرت شيء:
   → Deployments → ... → Redeploy
```

---

### المشكلة 2: "Cannot find module" أو Build Failed

#### السبب:
```
ملفات package.json غير كاملة
```

#### الحل:
```
1. تأكد من ملف package.json موجود
2. Vercel Dashboard → Deployments → Latest → View Build Logs
3. اقرأ الخطأ
4. غالباً: npm install فشل
5. الحل:
   → GitHub → تأكد من package.json موجود
   → Redeploy في Vercel
```

---

### المشكلة 3: الموقع يفتح لكن "401 Unauthorized"

#### السبب:
```
مشكلة في Auth أو Token
```

#### الحل:
```
1. تحقق من Console (F12)
2. إذا رأيت "401" → مشكلة في Supabase Keys
3. تأكد من:
   ✅ SUPABASE_ANON_KEY صحيح
   ✅ Supabase Project مفعّل (Active)
4. جرّب:
   → أعد تسجيل الدخول
   → امسح Cookies
   → جرّب Incognito/Private
```

---

### المشكلة 4: البث المباشر لا يعمل

#### السبب:
```
WebRTC أو Realtime غير مفعّل
```

#### الحل:
```
1. Supabase Dashboard → Project Settings
2. API Settings → Realtime
3. تأكد من:
   ✅ Realtime مفعّل
   ✅ لا توجد قيود IP
4. إذا غيّرت شيء:
   → انتظر دقيقة
   → أعد تحميل الصفحة
```

---

### المشكلة 5: بطء في التحميل

#### السبب:
```
- Supabase Project متوقف (Paused)
- أو Free Tier limits
```

#### الحل:
```
1. Supabase Dashboard
2. تحقق من حالة المشروع
3. إذا كان Paused:
   → Resume Project
   → انتظر 2-3 دقائق
4. إذا كان Free Tier:
   → راقب الـ Usage
   → Upgrade إذا لزم
```

---

## 📊 مراقبة الأداء بعد النشر

### 1. Vercel Analytics:
```
Vercel Dashboard → Analytics
→ شاهد:
  - عدد الزوار
  - سرعة التحميل
  - الأخطاء
```

### 2. Supabase Logs:
```
Supabase Dashboard → Logs
→ شاهد:
  - طلبات API
  - أخطاء Auth
  - أخطاء Database
```

### 3. Browser Console:
```
F12 → Console
→ راقب:
  - أخطاء JavaScript
  - طلبات فاشلة
  - تحذيرات
```

---

## 🔄 التحديثات المستقبلية

### إذا أردت تعديل الكود:

#### 1. عدّل محلياً:
```
1. افتح المجلد في VS Code
2. عدّل الملفات
3. اختبر محلياً (npm run dev)
```

#### 2. ارفع التعديلات على GitHub:
```bash
git add .
git commit -m "وصف التعديل"
git push
```

#### 3. Vercel سينشر تلقائياً:
```
1. Vercel يراقب GitHub
2. عند Push جديد → Deploy تلقائي
3. انتظر 2-3 دقائق
4. التحديث سيكون live!
```

---

## 🎯 Domain مخصص (اختياري)

### إذا أردت رابط مخصص مثل: attendance.kku.edu.sa

#### 1. في Vercel:
```
Project Settings → Domains
Add Domain → attendance.kku.edu.sa
```

#### 2. في إعدادات DNS للجامعة:
```
أضف CNAME record:
Name: attendance
Value: cname.vercel-dns.com
```

#### 3. انتظر:
```
التفعيل: 5-60 دقيقة
SSL Certificate: تلقائي من Vercel
```

---

## 📱 اختبار على الأجهزة

### بعد النشر، اختبر على:

#### 1. سطح المكتب:
```
✅ Chrome
✅ Firefox
✅ Edge
✅ Safari (Mac)
```

#### 2. الهاتف:
```
✅ Chrome (Android)
✅ Safari (iOS)
✅ Samsung Internet
```

#### 3. التابلت:
```
✅ iPad Safari
✅ Android Tablet
```

---

## 🎓 نصائح نهائية

### 1. الأمان:
```
⚠️ لا تشارك SUPABASE_SERVICE_ROLE_KEY أبداً
✅ احتفظ بها في Environment Variables فقط
✅ لا تضعها في الكود
```

### 2. النسخ الاحتياطي:
```
✅ احتفظ بنسخة من المشروع على جهازك
✅ GitHub يحفظ كل التاريخ
✅ Vercel يحفظ كل Deployment
```

### 3. المراقبة:
```
✅ راقب Vercel Analytics أسبوعياً
✅ راقب Supabase Usage شهرياً
✅ تحقق من الأخطاء في Logs
```

### 4. التوثيق:
```
✅ احتفظ بملف يحتوي على:
  - رابط الموقع المنشور
  - رابط GitHub Repository
  - معلومات Supabase
  - أي ملاحظات
```

---

## 📞 جهات الاتصال للدعم

### Vercel:
```
التوثيق: vercel.com/docs
الدعم: vercel.com/support
Community: vercel.com/community
```

### Supabase:
```
التوثيق: supabase.com/docs
الدعم: supabase.com/support
Community: supabase.com/community
```

### GitHub:
```
التوثيق: docs.github.com
الدعم: support.github.com
```

---

<div align="center">

## 🎉 مبروك! مشروعك الآن على الإنترنت!

### ✅ خطوات مكتملة:
```
✅ المشروع محمّل من Figma Make
✅ مرفوع على GitHub
✅ منشور على Vercel
✅ متصل بـ Supabase
✅ يعمل بكفاءة عالية!
```

### 🌟 شارك مشروعك:
```
الرابط: https://kku-attendance-system.vercel.app
GitHub: https://github.com/YOUR-USERNAME/kku-attendance-system
```

---

**نظام الحضور الذكي**  
**جامعة الملك خالد**  
**2025**

**بالتوفيق! 🚀🎓**

</div>

---

**آخر تحديث:** 11 نوفمبر 2025  
**الإصدار:** 2.0 - جاهز للنشر
