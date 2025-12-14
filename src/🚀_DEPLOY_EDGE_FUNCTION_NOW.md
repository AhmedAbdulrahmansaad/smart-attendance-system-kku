# 🚀 Deploy Edge Function - دليل النشر الفوري

## ⚠️ حل مشكلة EDGE_FUNCTION_NOT_DEPLOYED

النظام يواجه خطأ `EDGE_FUNCTION_NOT_DEPLOYED` لأن Edge Function غير منشور على Supabase.

---

## ✅ الحل السريع (3 دقائق)

### الخطوة 1: تثبيت Supabase CLI

```bash
# على macOS/Linux
npm install -g supabase

# أو باستخدام Homebrew (macOS)
brew install supabase/tap/supabase

# على Windows
npm install -g supabase
```

### الخطوة 2: تسجيل الدخول

```bash
supabase login
```

### الخطوة 3: ربط المشروع

```bash
# استخدم Project ID الموجود
supabase link --project-ref pcymgqdjbdklrikdquih
```

ستحتاج إلى:
- Database Password الخاص بمشروعك

### الخطوة 4: نشر Edge Function

```bash
# نشر الـFunction
supabase functions deploy server --no-verify-jwt

# أو إذا فشل الأمر أعلاه، استخدم:
cd supabase/functions
supabase functions deploy server
```

### الخطوة 5: التحقق من النشر

بعد النشر، اختبر الـEdge Function:

```bash
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

يجب أن تحصل على استجابة:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": true,
  "message": "Backend is running correctly with SQL database"
}
```

---

## 🔧 الحل البديل: نشر عبر Supabase Dashboard

إذا واجهت مشاكل مع CLI، يمكنك النشر عبر Dashboard:

### 1. افتح Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih

### 2. انتقل إلى Edge Functions
- من القائمة الجانبية، اختر **Edge Functions**

### 3. أنشئ Function جديد
- اضغط على **New Function**
- اسم الـFunction: `server`
- انسخ محتوى الملف `/supabase/functions/server/index.tsx`
- الصق المحتوى في المحرر
- اضغط **Deploy**

### 4. اختبر الـFunction
- بعد النشر، اضغط على **Invoke** للاختبار
- يجب أن يعمل بدون أخطاء

---

## 📋 متطلبات Environment Variables

تأكد أن الـEdge Function لديه هذه المتغيرات:

```env
SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=... (احصل عليه من Project Settings > API)
```

### كيفية إضافة Environment Variables:

1. افتح Dashboard > Settings > Edge Functions
2. اضغط على **Function Settings**
3. أضف المتغيرات في قسم **Secrets**

---

## ✅ بعد النشر

بعد نشر الـEdge Function بنجاح:

1. ✅ سيعمل نظام الحضور بالكامل
2. ✅ ستختفي رسالة EDGE_FUNCTION_NOT_DEPLOYED
3. ✅ سيتم تحميل البيانات من Backend بدلاً من Fallback
4. ✅ جميع الميزات (إنشاء مستخدمين، مقررات، جلسات) ستعمل

---

## 🔍 استكشاف الأخطاء

### إذا ظهرت أخطاء أثناء النشر:

#### 1. خطأ "Invalid token"
```bash
# أعد تسجيل الدخول
supabase logout
supabase login
```

#### 2. خطأ "Project not found"
```bash
# تأكد من Project ID
supabase link --project-ref pcymgqdjbdklrikdquih
```

#### 3. خطأ "Permission denied"
- تأكد أنك مالك المشروع أو لديك صلاحيات Admin
- راجع Supabase Dashboard > Settings > Team

#### 4. خطأ أثناء التشغيل
- افحص Logs في Dashboard > Edge Functions > Logs
- تأكد من وجود Environment Variables

---

## 🆘 الحل الأخير: استخدام Fallback فقط

إذا لم تتمكن من نشر Edge Function حالياً، النظام سيعمل تلقائياً باستخدام **Direct Supabase Fallback**:

✅ **ما يعمل:**
- تسجيل الدخول
- عرض المقررات
- عرض الجلسات
- تسجيل الحضور
- جميع القراءات من قاعدة البيانات

❌ **ما لا يعمل:**
- إنشاء مستخدمين جدد (يتطلب Backend)
- إنشاء جلسات Live مع Jitsi
- بعض الميزات المتقدمة

**لكن:** معظم النظام سيعمل بدون مشاكل!

---

## 📞 الدعم

إذا واجهت مشاكل:

1. **راجع الوثائق الرسمية:**
   https://supabase.com/docs/guides/functions/deploy

2. **اتصل بدعم Supabase:**
   https://supabase.com/support

3. **راجع Community:**
   https://github.com/supabase/supabase/discussions

---

## ✅ الخلاصة

النظام مصمم للعمل مع أو بدون Edge Function:

- ✅ **مع Edge Function:** جميع الميزات تعمل 100%
- ✅ **بدون Edge Function:** معظم الميزات تعمل (عبر Fallback)

اختر الحل المناسب حسب احتياجاتك!

---

**تم التحديث:** 2024-12-13
