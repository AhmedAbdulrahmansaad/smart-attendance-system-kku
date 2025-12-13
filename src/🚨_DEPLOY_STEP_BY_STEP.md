# 🚨 دليل النشر خطوة بخطوة - STEP BY STEP

<div align="center">

# ⚠️ Backend غير منشور - يجب نشره الآن!

**هذا الدليل سيأخذك خطوة بخطوة لنشر Backend**

</div>

---

## 📋 نظرة عامة

**المشكلة:** Edge Function غير منشور على Supabase  
**الحل:** اتبع الخطوات أدناه بالترتيب  
**الوقت:** 5 دقائق

---

## ✅ الخطوة 1: تثبيت Supabase CLI

### على macOS:

```bash
brew install supabase/tap/supabase
```

### على Windows/Linux/macOS (بديل):

```bash
npm install -g supabase
```

### التحقق من التثبيت:

```bash
supabase --version
```

**يجب أن ترى:** `1.x.x` أو أعلى

---

## ✅ الخطوة 2: تسجيل الدخول

```bash
supabase login
```

**ماذا سيحدث:**
1. سيفتح المتصفح تلقائياً
2. صفحة تسجيل دخول Supabase
3. اضغط **"Authorize"**
4. سترى رسالة نجاح

**في Terminal ستظهر:**
```
✓ Logged in successfully
```

---

## ✅ الخطوة 3: ربط المشروع

```bash
supabase link --project-ref pcymgqdjbdklrikdquih
```

**إذا طلب منك password:**
- هذا هو password حساب Supabase (البريد الذي سجلت به)

**النتيجة المتوقعة:**
```
✓ Linked to project pcymgqdjbdklrikdquih
```

---

## ✅ الخطوة 4: الحصول على Service Role Key

### أ. افتح هذا الرابط:

```
https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/settings/api
```

### ب. انزل لأسفل حتى تجد:

```
┌─────────────────────────────────────────────┐
│ Project API keys                            │
├─────────────────────────────────────────────┤
│                                             │
│ anon public                                 │
│ eyJhbG...                      [Copy]       │
│                                             │
│ service_role secret                         │
│ eyJhbG...                      [Copy]       │ ← اضغط هنا!
│ This key has the ability to bypass Row     │
│ Level Security                              │
└─────────────────────────────────────────────┘
```

### ج. ⚠️ مهم جداً:

- اضغط [Copy] بجانب **`service_role`** (الأسفل)
- **لا تنسخ** `anon` (الأعلى)

### د. احفظ المفتاح:

انسخه في ملف نصي مؤقت لأنك ستحتاجه في الخطوة التالية.

---

## ✅ الخطوة 5: تعيين Environment Variables

```bash
supabase secrets set \
  SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"
```

**⚠️ استبدل `YOUR_SERVICE_ROLE_KEY_HERE` بالمفتاح الذي نسخته!**

### مثال كامل:

إذا كان Service Role Key هو: `eyJhbG...xyz123`

```bash
supabase secrets set \
  SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ" \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbG...xyz123"
```

**النتيجة المتوقعة:**
```
✓ Set secret SUPABASE_URL
✓ Set secret SUPABASE_ANON_KEY
✓ Set secret SUPABASE_SERVICE_ROLE_KEY
```

---

## ✅ الخطوة 6: نشر Edge Function

```bash
supabase functions deploy server --no-verify-jwt
```

**ماذا سيحدث:**
```
Deploying function server...
Packaging function...
Uploading function...
```

**انتظر 10-30 ثانية...**

**النتيجة المتوقعة:**
```
✓ Deployed Function server successfully
URL: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server
```

---

## ✅ الخطوة 7: اختبار Backend

```bash
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health
```

**النتيجة المتوقعة:**
```json
{
  "status": "healthy",
  "database": true,
  "message": "Backend is running correctly"
}
```

**✅ إذا رأيت هذا → Backend يعمل!**

---

## ✅ الخطوة 8: تطبيق Database Schema

### أ. افتح SQL Editor:

```
https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql
```

### ب. اضغط "New query"

### ج. افتح ملف `database_schema.sql` من المشروع

### د. انسخ **كل** المحتوى:

- اضغط Ctrl+A (تحديد الكل)
- اضغط Ctrl+C (نسخ)

### هـ. الصق في SQL Editor:

- في صفحة Supabase
- اضغط Ctrl+V

### و. اضغط "Run":

- الزر الأخضر أسفل اليسار
- أو اضغط Ctrl+Enter

### ز. انتظر النتيجة:

**المتوقع:**
```
Success. No rows returned
```

أو

```
✓ Success
```

---

## ✅ الخطوة 9: ابدأ التطوير

```bash
npm run dev
```

### افتح المتصفح:

```
http://localhost:5173
```

**✅ يجب ألا ترى أي أخطاء الآن!**

---

## 🎉 انتهى!

### تحقق من:

- [ ] ✅ لا توجد أخطاء في Console (F12)
- [ ] ✅ يمكنك رؤية صفحة تسجيل الدخول
- [ ] ✅ يمكنك التسجيل
- [ ] ✅ يمكنك تسجيل الدخول

---

## ❌ استكشاف الأخطاء

### الخطأ: "command not found: supabase"

**الحل:**
```bash
npm install -g supabase
```

---

### الخطأ: "Not logged in"

**الحل:**
```bash
supabase login
```

---

### الخطأ: "Project not found"

**الحل:**
```bash
supabase link --project-ref pcymgqdjbdklrikdquih
```

---

### الخطأ: "404 Not Found" بعد النشر

**السبب:** Function يحتاج وقتاً للتفعيل

**الحل:** انتظر 30-60 ثانية وأعد الاختبار

---

### الخطأ: "500 Internal Server Error"

**السبب:** Database Schema غير مطبق

**الحل:** تأكد من الخطوة 8 (تطبيق database_schema.sql)

---

## 📊 ملخص الأوامر (للنسخ السريع)

```bash
# 1. تثبيت CLI
npm install -g supabase

# 2. تسجيل الدخول
supabase login

# 3. ربط المشروع
supabase link --project-ref pcymgqdjbdklrikdquih

# 4. تعيين Secrets (استبدل YOUR_SERVICE_ROLE_KEY_HERE)
supabase secrets set \
  SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"

# 5. نشر Function
supabase functions deploy server --no-verify-jwt

# 6. اختبار
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health

# 7. تطبيق Database (في Supabase SQL Editor)
# نسخ database_schema.sql ولصق وتشغيل

# 8. بدء التطوير
npm run dev
```

---

## 🔗 روابط سريعة

- **API Settings:** https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/settings/api
- **SQL Editor:** https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql
- **Functions:** https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/functions
- **Logs:** https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/functions/server/logs

---

<div align="center">

## 🎯 ابدأ من الخطوة 1!

**اتبع الخطوات بالترتيب**

**⏱️ 5 دقائق فقط**

---

**🎓 جامعة الملك خالد**

</div>
