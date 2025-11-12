# 🚀 دليل النشر الكامل - نظام الحضور الذكي

<div align="center">

![Deployment](https://img.shields.io/badge/deployment-guide-blue)
![Time](https://img.shields.io/badge/time-30%20min-green)
![Difficulty](https://img.shields.io/badge/difficulty-medium-yellow)

**دليل خطوة بخطوة لنشر النظام على Vercel و Supabase**

</div>

---

## 📋 المتطلبات قبل البدء

- [ ] حساب GitHub (مجاني)
- [ ] حساب Supabase (مجاني)
- [ ] حساب Vercel (مجاني)
- [ ] Node.js 18+ مثبّت على جهازك
- [ ] Git مثبّت

**الوقت المتوقع**: حوالي 30 دقيقة

---

## 🗺️ خطة النشر

```
┌─────────────────────┐
│  1. تجهيز الكود     │
│     (5 دقائق)       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  2. نشر Backend     │
│  (Supabase Function)│
│     (10 دقائق)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  3. نشر Frontend    │
│     (Vercel)        │
│     (10 دقائق)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  4. الاختبار النهائي│
│     (5 دقائق)       │
└─────────────────────┘
```

---

## 📦 الجزء 1: تجهيز الكود

### الخطوة 1.1: تأكد من Environment Variables

افتح ملف `/utils/supabase/info.tsx` وتأكد من أن المعلومات صحيحة:

```typescript
export const projectId = "YOUR_PROJECT_ID"; // مثال: "abcdefgh"
export const publicAnonKey = "YOUR_ANON_KEY"; // مفتاح طويل يبدأ بـ eyJ...
```

> **أين أجد هذه المعلومات؟**
> 
> 1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
> 2. اذهب لمشروعك
> 3. Settings → API
> 4. **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
> 5. **anon public**: انسخ المفتاح

### الخطوة 1.2: اختبر محلياً

```bash
# تأكد أن كل شيء يعمل قبل النشر
npm install
npm run dev

# افتح http://localhost:5173
# جرّب تسجيل الدخول
```

إذا كان كل شيء يعمل، انتقل للخطوة التالية.

---

## 🔧 الجزء 2: نشر Backend (Supabase Function)

### الخطوة 2.1: تثبيت Supabase CLI

```bash
# Windows/Mac/Linux
npm install -g supabase

# تأكد من التثبيت
supabase --version
```

### الخطوة 2.2: تسجيل الدخول

```bash
supabase login

# سيفتح متصفح للمصادقة
# سجّل دخول بحساب Supabase الخاص بك
```

### الخطوة 2.3: ربط المشروع

```bash
# ستحتاج لـ Project Reference ID
# أين أجده؟
# Supabase Dashboard → Settings → General → Reference ID

supabase link --project-ref YOUR_PROJECT_REF

# مثال:
# supabase link --project-ref abcdefghijklmn
```

**ستُسأل:**
- Database password: أدخل كلمة المرور التي وضعتها عند إنشاء المشروع

### الخطوة 2.4: نشر الـ Function

```bash
supabase functions deploy server

# انتظر حتى تنتهي العملية...
# ✅ Function deployed successfully!
```

### الخطوة 2.5: اختبار الـ Function

```bash
# افتح هذا الرابط في المتصفح:
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/health

# يجب أن تشاهد:
{"status":"ok"}
```

**إذا رأيت أي خطأ:**
1. تأكد من أن Environment Variables محفوظة في Supabase:
   - Supabase Dashboard → Edge Functions → server → Settings
   - يجب أن ترى: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
   
2. هذه Variables تُضاف تلقائياً، لكن تحقق من وجودها

---

## 🌐 الجزء 3: نشر Frontend (Vercel)

### الطريقة 1: النشر عبر GitHub (الأسهل) ✅ موصى بها

#### الخطوة 3.1: رفع الكود لـ GitHub

```bash
# إذا لم تكن قد فعلت ذلك بعد

# 1. أنشئ repository جديد على GitHub
# اذهب لـ https://github.com/new
# أنشئ repo باسم: kku-attendance-system

# 2. ارفع الكود
git init
git add .
git commit -m "Initial commit - KKU Attendance System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kku-attendance-system.git
git push -u origin main
```

#### الخطوة 3.2: ربط Vercel بـ GitHub

1. اذهب لـ [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط **"Add New..." → Project**
3. اختر **Import Git Repository**
4. اختر الـ repository: `kku-attendance-system`
5. اضغط **Import**

#### الخطوة 3.3: تكوين المشروع

في صفحة الإعدادات:

**Framework Preset**: Vite (سيُكتشف تلقائياً)

**Build Command**: `npm run build`

**Output Directory**: `dist`

**Install Command**: `npm install`

#### الخطوة 3.4: إضافة Environment Variables

في قسم "Environment Variables":

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **مهم**: تأكد من أن الاسم يبدأ بـ `VITE_` (كبيرة)

#### الخطوة 3.5: نشر

اضغط **Deploy** وانتظر...

⏳ جارٍ النشر... (1-3 دقائق)

✅ **Deployment successful!**

سترى رابط موقعك مثل: `https://kku-attendance-system.vercel.app`

---

### الطريقة 2: النشر عبر Vercel CLI (بديل)

```bash
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
vercel

# 4. أجب على الأسئلة:
# ✓ Set up and deploy "~/kku-attendance-system"? [Y/n] y
# ✓ Which scope do you want to deploy to? (اختر حسابك)
# ✓ Link to existing project? [y/N] n
# ✓ What's your project's name? kku-attendance-system
# ✓ In which directory is your code located? ./
# ✓ Want to override the settings? [y/N] n

# 5. انتظر...
# ✅ Deployed!

# 6. إضافة Environment Variables
vercel env add VITE_SUPABASE_URL
# أدخل القيمة: https://YOUR_PROJECT_ID.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# أدخل المفتاح

# 7. إعادة النشر
vercel --prod
```

---

## 🧪 الجزء 4: الاختبار النهائي

### الخطوة 4.1: اختبار Backend

```bash
# 1. افتح في المتصفح:
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/health

# النتيجة المتوقعة:
{"status":"ok"}
```

### الخطوة 4.2: اختبار Frontend

```bash
# 1. افتح موقعك:
https://kku-attendance-system.vercel.app

# 2. جرّب:
✅ الصفحة الرئيسية تُفتح
✅ زر اللغة يعمل (عربي/إنجليزي)
✅ زر الثيم يعمل (فاتح/داكن)
```

### الخطوة 4.3: اختبار التسجيل

```bash
# 1. اذهب لـ "إنشاء حساب جديد"
# 2. أدخل:
#    - البريد: test@kku.edu.sa
#    - الاسم: Test User
#    - الرقم الجامعي: 123456
#    - الدور: Student
#    - كلمة المرور: Test123!@#
# 3. اضغط "إنشاء حساب"

# ✅ يجب أن يتم التسجيل بنجاح
```

### الخطوة 4.4: اختبار تسجيل الدخول

```bash
# 1. سجّل دخول بالحساب السابق
# 2. يجب أن ترى لوحة التحكم

# ✅ تسجيل الدخول يعمل
# ✅ لوحة التحكم تظهر
```

### الخطوة 4.5: اختبار إنشاء بيانات

**كمدرس:**
```bash
# 1. أنشئ حساب مدرس (Instructor)
# 2. اذهب لـ "المواد الدراسية"
# 3. اضغط "إضافة مادة جديدة"
# 4. أدخل:
#    - اسم المادة: مقدمة في الحاسب
#    - كود المادة: CS101
# 5. اضغط "حفظ"

# ✅ المادة أُضيفت
# ✅ تظهر في القائمة
```

**إنشاء جلسة:**
```bash
# 1. اذهب لـ "جلسات الحضور"
# 2. اضغط "إنشاء جلسة جديدة"
# 3. اختر المادة والمدة
# 4. اضغط "إنشاء"

# ✅ الجلسة أُنشئت
# ✅ الكود ظهر
```

### الخطوة 4.6: اختبار البث المباشر

**المدرس:**
```bash
# 1. أنشئ جلسة "بث مباشر"
# 2. اضغط "بدء البث المباشر"
# 3. اسمح للكاميرا والمايك
# 4. يجب أن ترى نفسك في الفيديو
# 5. يجب أن يظهر 🔴 LIVE

# ✅ البث يعمل
```

**الطالب:**
```bash
# 1. سجّل دخول كطالب (من متصفح آخر أو Incognito)
# 2. اذهب للوحة التحكم
# 3. يجب أن ترى الجلسة المباشرة
# 4. اضغط "الانضمام"
# 5. يجب أن تشاهد بث المدرس

# ✅ المشاهدة تعمل
```

---

## ✅ Checklist النشر النهائي

قبل اعتبار النشر كاملاً، تأكد من:

### Backend ✅
- [x] Supabase Function منشورة
- [x] `/health` endpoint يعمل ويرجع `{"status":"ok"}`
- [x] Environment Variables محفوظة

### Frontend ✅
- [x] الموقع منشور على Vercel
- [x] Domain يعمل ويفتح الموقع
- [x] Environment Variables محفوظة
- [x] لا توجد أخطاء في Console

### الميزات ✅
- [x] التسجيل/تسجيل الدخول يعمل
- [x] إنشاء المواد يعمل
- [x] إنشاء الجلسات يعمل
- [x] تسجيل الحضور يعمل
- [x] البث المباشر يعمل
- [x] التقارير تظهر بيانات حقيقية

### الأداء ✅
- [x] الموقع سريع (< 3 ثواني للتحميل الأول)
- [x] لا توجد memory leaks
- [x] الصور محمّلة بشكل صحيح
- [x] لا توجد console errors

### الأمان ✅
- [x] HTTPS مُفعّل (تلقائي في Vercel)
- [x] Environment Variables محمية
- [x] لا يوجد Service Role Key في Frontend
- [x] RLS مُفعّل (إذا استخدمت SQL)

---

## 🎨 تخصيص Domain (اختياري)

### إضافة Domain مخصص

إذا كان لديك domain خاص (مثل `attendance.kku.edu.sa`):

1. اذهب لـ Vercel Dashboard → Project → Settings → Domains
2. اضغط **Add Domain**
3. أدخل `attendance.kku.edu.sa`
4. اتبع التعليمات لإضافة DNS records
5. انتظر حتى يتم التحقق (5-10 دقائق)

**DNS Records المطلوبة:**
```
Type: CNAME
Name: attendance
Value: cname.vercel-dns.com
```

---

## 🔄 التحديثات المستقبلية

### كيف أنشر تحديث جديد؟

#### إذا استخدمت GitHub + Vercel:
```bash
# 1. عدّل الكود محلياً
# 2. ارفع التحديثات لـ GitHub
git add .
git commit -m "Feature: Add new feature"
git push

# 3. Vercel سيكتشف التحديث تلقائياً
# 4. سيُنشر automatically في 1-2 دقيقة
# ✅ تم التحديث!
```

#### إذا استخدمت Vercel CLI:
```bash
# 1. عدّل الكود
# 2. نشر
vercel --prod

# ✅ تم التحديث!
```

#### تحديث Backend Function:
```bash
# عند تعديل /supabase/functions/server/index.tsx
supabase functions deploy server

# ✅ Function محدّثة!
```

---

## 🐛 حل مشاكل النشر

### مشكلة 1: Vercel Build فشل

**الخطأ**: `Build failed`

**الحل:**
1. تأكد من أن `package.json` صحيح
2. تأكد من أن Environment Variables محفوظة
3. راجع Build Logs في Vercel Dashboard
4. تأكد من أن `npm run build` يعمل محلياً

### مشكلة 2: Supabase Function لا تستجيب

**الخطأ**: `Failed to fetch` أو 404

**الحل:**
1. تأكد من أن Function منشورة:
   ```bash
   supabase functions list
   ```
2. اختبر الـ health endpoint
3. راجع Logs في Supabase Dashboard → Edge Functions → server → Logs

### مشكلة 3: Environment Variables لا تعمل

**الخطأ**: `undefined` في Console

**الحل:**
1. تأكد من أن الاسم يبدأ بـ `VITE_`
2. في Vercel: أعد Deploy بعد إضافة Variables
3. تأكد من حفظ القيم الصحيحة (بدون مسافات إضافية)

### مشكلة 4: CORS Error

**الخطأ**: `CORS policy: No 'Access-Control-Allow-Origin'`

**الحل:**
- الـ Backend يدعم CORS بالفعل
- تأكد من أن Function منشورة بشكل صحيح
- أعد نشر Function:
  ```bash
  supabase functions deploy server
  ```

---

## 📊 مراقبة الأداء

### Vercel Analytics (مجاني)

1. اذهب لـ Vercel Dashboard → Project → Analytics
2. سترى:
   - عدد الزوار
   - وقت التحميل
   - Errors
   - Top pages

### Supabase Logs

1. اذهب لـ Supabase Dashboard → Logs
2. سترى:
   - API requests
   - Errors
   - Slow queries
   - Auth events

---

## 🎉 تمت العملية بنجاح!

إذا وصلت هنا، **تهانينا!** 🎊

النظام الآن:
- ✅ منشور على الإنترنت
- ✅ Backend يعمل
- ✅ Frontend يعمل
- ✅ جميع الميزات فعّالة

**الموقع الآن على:**
```
https://kku-attendance-system.vercel.app
```

أو Domain المخصص إذا أضفته:
```
https://attendance.kku.edu.sa
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. 📖 راجع [SYSTEM_GUIDE.md](SYSTEM_GUIDE.md)
2. ⚡ راجع [QUICK_ACTION_STEPS.md](QUICK_ACTION_STEPS.md)
3. 🔍 راجع Logs في Vercel و Supabase
4. 💬 تواصل مع فريق التطوير

---

## 📚 موارد إضافية

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

<div align="center">

**🚀 النظام الآن مباشر (Live) على الإنترنت! 🚀**

**آخر تحديث**: نوفمبر 2025  
**جامعة الملك خالد - نظام الحضور الذكي**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Backend on Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

</div>
