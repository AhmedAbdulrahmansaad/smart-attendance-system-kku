# 🚀 دليل رفع المشروع على GitHub

<div align="center">

![GitHub](https://img.shields.io/badge/github-ready-success?style=for-the-badge&logo=github)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen?style=for-the-badge)

**دليل شامل لرفع نظام الحضور الذكي على GitHub**

</div>

---

## 📋 المحتويات

1. [التحضير قبل الرفع](#-التحضير-قبل-الرفع)
2. [إنشاء Repository جديد](#-إنشاء-repository-جديد)
3. [رفع المشروع](#-رفع-المشروع)
4. [إعداد Supabase](#-إعداد-supabase)
5. [التحقق من النجاح](#-التحقق-من-النجاح)

---

## 🔐 التحضير قبل الرفع

### الخطوة 1: إزالة المفاتيح السرية

**⚠️ هام جداً:** لا ترفع المفاتيح السرية على GitHub!

#### 1.1 نسخ ملف التكوين احتياطياً

```bash
# انسخ مفاتيحك في مكان آمن (ليس في المشروع)
# سوف تحتاجها لاحقاً
```

#### 1.2 إعادة ملف التكوين للحالة الافتراضية

افتح الملف `/config/supabase.config.ts` واجعله يبدو هكذا:

```typescript
export const supabaseConfig = {
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-public-key-here',
};
```

#### 1.3 إعادة ملف المعلومات للحالة الافتراضية

افتح الملف `/utils/supabase/info.tsx` واجعله يبدو هكذا:

```typescript
export const projectId = "your-project-id"
export const publicAnonKey = "your-anon-public-key-here"
```

### الخطوة 2: مراجعة .gitignore

تأكد أن الملف `.gitignore` موجود ويحتوي على:

```
# Supabase keys (important!)
config/supabase.config.ts
utils/supabase/info.tsx

# Keep example files
!config/supabase.config.example.ts
!utils/supabase/info.example.tsx
```

✅ **تم إنشاء هذا الملف تلقائياً**

---

## 🆕 إنشاء Repository جديد

### الطريقة 1: عبر GitHub Website

1. اذهب إلى [GitHub](https://github.com)
2. اضغط على **"New repository"**
3. املأ المعلومات:
   - **Repository name:** `kku-smart-attendance`
   - **Description:** `نظام الحضور الذكي لجامعة الملك خالد - KKU Smart Attendance System`
   - **Visibility:** Public أو Private (اختر حسب رغبتك)
   - **❌ لا تضف README** (لأنه موجود بالفعل)
   - **❌ لا تضف .gitignore** (موجود بالفعل)
4. اضغط **"Create repository"**

### الطريقة 2: عبر GitHub CLI

```bash
gh repo create kku-smart-attendance --public --description "نظام الحضور الذكي - KKU Smart Attendance System"
```

---

## 📤 رفع المشروع

### الطريقة 1: من Figma Make

إذا كنت تستخدم Figma Make:

1. اضغط على **Download** لتحميل المشروع
2. فك الضغط عن الملف
3. افتح Terminal/Command Prompt في مجلد المشروع
4. اتبع الخطوات التالية:

```bash
# 1. تهيئة Git
git init

# 2. إضافة جميع الملفات
git add .

# 3. إنشاء Commit أول
git commit -m "Initial commit: KKU Smart Attendance System v2.0"

# 4. ربط مع Repository على GitHub
git remote add origin https://github.com/YOUR_USERNAME/kku-smart-attendance.git

# 5. رفع الملفات
git branch -M main
git push -u origin main
```

### الطريقة 2: استخدام GitHub Desktop

1. حمّل [GitHub Desktop](https://desktop.github.com/)
2. **File → Add Local Repository**
3. اختر مجلد المشروع
4. **Publish repository**

---

## 🗄️ إعداد Supabase

### لماذا Supabase؟

هذا المشروع يستخدم **Supabase** كقاعدة بيانات و backend. النظام مُعد للعمل مع جدول KV Store بشكل افتراضي.

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. **"New project"**
3. املأ المعلومات:
   - **Name:** KKU Attendance System
   - **Database Password:** اختر كلمة سر قوية (احتفظ بها!)
   - **Region:** اختر أقرب منطقة لك
4. **"Create new project"**
5. انتظر 2-3 دقائق حتى يكتمل الإعداد

### الخطوة 2: الحصول على المفاتيح

1. في مشروعك على Supabase:
2. اذهب إلى **Settings → API**
3. انسخ:
   - **Project URL** (مثل: `https://abcd1234.supabase.co`)
   - **anon public** key (تحت "Project API keys")
   - **service_role** key (سوف نحتاجها للـ Backend)

### الخطوة 3: التحقق من جدول KV Store

النظام يستخدم جدول `kv_store_90ad488b` بشكل افتراضي. هذا الجدول:
- ✅ **مرن جداً** - يخزن أي بيانات
- ✅ **لا يحتاج إعداد معقد**
- ✅ **مناسب للنماذج الأولية**

**ملاحظة هامة:** وفقاً لمحددات نظام Figma Make، لا يمكن إنشاء جداول جديدة أو تعديل schema عبر الكود. الجدول الافتراضي `kv_store_90ad488b` كافٍ لجميع احتياجات النظام.

إذا أردت إنشاء جداول إضافية يدوياً (اختياري):

1. في Supabase Dashboard → **Table Editor**
2. **"Create a new table"** (اختياري فقط)
3. لكن تذكر: **النظام الحالي لا يتطلب جداول إضافية**

---

## 🌐 نشر المشروع

### النشر على Vercel (موصى به)

#### الخطوة 1: ربط مع GitHub

1. اذهب إلى [Vercel](https://vercel.com)
2. **"Import Project"**
3. **"Import Git Repository"**
4. اختر `kku-smart-attendance`
5. **"Import"**

#### الخطوة 2: إعداد Environment Variables

في صفحة الإعداد على Vercel:

1. اذهب إلى **"Environment Variables"**
2. أضف المتغيرات التالية:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
```

#### الخطوة 3: Deploy

1. اضغط **"Deploy"**
2. انتظر 2-3 دقائق
3. استمتع بموقعك الحي! 🎉

---

## 🔧 إعداد Supabase Edge Functions

النظام يستخدم **Supabase Edge Functions** للـ Backend. لتفعيلها:

### الخطوة 1: تثبيت Supabase CLI

```bash
npm install -g supabase
```

### الخطوة 2: تسجيل الدخول

```bash
supabase login
```

### الخطوة 3: ربط المشروع

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### الخطوة 4: نشر Edge Functions

```bash
supabase functions deploy server
```

### الخطوة 5: إعداد Environment Variables للـ Backend

Edge Functions تحصل تلقائياً على:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_DB_URL`

**لا حاجة لإعداد يدوي!** ✨

---

## ✅ التحقق من النجاح

### اختبار محلي

```bash
# في مجلد المشروع
npm install
npm run dev
```

افتح المتصفح على `http://localhost:5173`

### اختبار Supabase Connection

1. افتح Console في المتصفح (F12)
2. سجل دخول بحساب تجريبي
3. ابحث عن رسالة: **"✅ Supabase connection successful"**

### اختبار Backend

```bash
# اختبار صحة Backend
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/me
```

يجب أن ترى استجابة (حتى لو كانت 401 Unauthorized - هذا طبيعي بدون token)

---

## 🎯 الخطوات التالية

### 1. إنشاء حسابات تجريبية

```typescript
// Admin
email: admin@kku.edu.sa
password: Admin@123

// Instructor  
email: instructor@kku.edu.sa
password: Inst@123

// Student
email: student@kku.edu.sa
university_id: 441234567
password: Stud@123
```

### 2. إضافة مواد تجريبية

1. سجل دخول كـ Admin
2. اذهب إلى "إدارة المواد"
3. أضف مادة تجريبية

### 3. اختبار جميع الميزات

- ✅ تسجيل الدخول
- ✅ إنشاء جلسة حضور
- ✅ بث مباشر
- ✅ التقارير

---

## 🆘 حل المشاكل الشائعة

### مشكلة: "Supabase not configured"

**الحل:**
1. تأكد من وجود المفاتيح في `.env` أو `supabase.config.ts`
2. أعد تشغيل الخادم المحلي

### مشكلة: "Failed to fetch"

**الحل:**
1. تحقق من اتصال الإنترنت
2. تأكد أن مشروع Supabase ليس في حالة "Paused"
3. راجع Supabase Dashboard → Settings → API

### مشكلة: "401 Unauthorized"

**الحل:**
1. تأكد من صحة `SUPABASE_ANON_KEY`
2. جرب تسجيل دخول جديد
3. امسح Cache المتصفح

### مشكلة: Edge Functions لا تعمل

**الحل:**
```bash
# تحقق من الـ deployment
supabase functions list

# أعد النشر
supabase functions deploy server

# اختبر
supabase functions serve server
```

---

## 📚 موارد إضافية

- 📖 [دليل الاستخدام الشامل](/README.md)
- 🎥 [دليل البث المباشر](/LIVE_STREAMING_GUIDE_AR.md)
- 🔧 [دليل استكشاف الأخطاء](/TROUBLESHOOTING_AR.md)
- 🗄️ [دليل قاعدة البيانات](/DATABASE_SETUP.md)
- 🚀 [دليل النشر على Vercel](/DEPLOYMENT_GUIDE_AR.md)

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. **راجع الأدلة** المذكورة أعلاه
2. **افتح Console** في المتصفح (F12) لرؤية الأخطاء
3. **تحقق من Supabase Logs** في Dashboard → Logs
4. **ارجع إلى الوثائق** في `/guidelines/Guidelines.md`

---

<div align="center">

## 🎉 مبروك!

**نظامك الآن على GitHub وجاهز للنشر**

Made with ❤️ for King Khalid University

</div>
