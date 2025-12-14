# ⚡ خطوات سريعة للـ Deployment (5 دقائق)

## 🚨 المشكلة:
```
❌ Edge Function غير deployed على Supabase
❌ النظام لن يعمل بدونه
```

---

## ✅ الحل السريع (5 خطوات فقط):

### 1️⃣ افتح Supabase Dashboard
```
https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih
```

### 2️⃣ اذهب لـ Edge Functions
```
من القائمة الجانبية → اضغط "Edge Functions"
```

### 3️⃣ أنشئ Function جديدة
```
اضغط "New Function"
Name: server
اضغط "Create Function"
```

### 4️⃣ انسخ الكود
```
1. افتح ملف: /supabase/functions/server/index.tsx
2. انسخ كل المحتوى (Ctrl+A ثم Ctrl+C)
3. الصقه في محرر Supabase
4. اضغط "Deploy"
```

### 5️⃣ أضف Environment Variables
```
في صفحة الـ Function → Settings → Environment Variables:

SUPABASE_URL = https://pcymgqdjbdklrikdquih.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ
SUPABASE_SERVICE_ROLE_KEY = [ابحث في Settings > API]
SUPABASE_DB_URL = [ابحث في Settings > Database]

اضغط "Save"
```

---

## 🧪 اختبر:

افتح في المتصفح:
```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

يجب أن ترى:
```json
{"status":"healthy","message":"Server is running"}
```

إذا رأيت ذلك ✅ → نجح!

---

## 🎬 الآن جرّب البث المباشر:

```
1. سجل دخول كمدرس
2. أنشئ جلسة بث مباشر
3. اضغط "بدء البث المباشر"
4. يجب أن يعمل! 🎉
```

---

## ❌ إذا لم يعمل:

### الخطأ: "404 Not Found"
```
الحل: تأكد أن اسم الـ Function هو "server" بالضبط
```

### الخطأ: "500 Internal Server Error"
```
الحل: افحص Environment Variables - تأكد أنها صحيحة
```

### الخطأ: "CORS Error"
```
الحل: الكود يجب أن يحتوي على CORS middleware (موجود بالفعل)
```

---

## 📝 ملاحظة مهمة:

```
⚠️ يجب نسخ 3 ملفات على الأقل:
   1. index.tsx (الملف الرئيسي)
   2. db.ts (Database functions)
   3. kv_store.tsx (KV Store)

لكن Supabase Dashboard قد لا يدعم multiple files.
في هذه الحالة، استخدم Terminal:

supabase functions deploy server
```

---

## 🚀 الطريقة البديلة (Terminal):

```bash
# 1. تثبيت Supabase CLI
npm install -g supabase

# 2. تسجيل دخول
supabase login

# 3. ربط المشروع
supabase link --project-ref pcymgqdjbdklrikdquih

# 4. Deploy
supabase functions deploy server

# 5. إضافة Secrets
supabase secrets set SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>
supabase secrets set SUPABASE_DB_URL=<your-url>
```

---

**✅ بعد الـ Deployment، النظام سيعمل 100%!**

---

**🔥 Deploy الآن! 🚀**
