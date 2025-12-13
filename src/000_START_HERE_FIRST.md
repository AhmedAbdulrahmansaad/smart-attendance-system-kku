# 🔴 ابدأ من هنا أولاً! START HERE FIRST!

<div align="center">

# ⚠️ Backend غير منشور - يجب نشره الآن!

**Backend NOT Deployed - Must Deploy Now!**

---

**النظام لن يعمل بدون نشر Backend!**

</div>

---

## 📋 ملخص سريع

**المشكلة:**
```
⚠️ Edge Function not deployed yet
❌ EDGE_FUNCTION_NOT_DEPLOYED
```

**الحل:** اتبع الخطوات أدناه (5 دقائق)

---

## ⚡ الخطوات (انسخ والصق)

### 1️⃣ تثبيت Supabase CLI

```bash
npm install -g supabase
```

---

### 2️⃣ تسجيل الدخول

```bash
supabase login
```

(سيفتح المتصفح - اضغط **Authorize**)

---

### 3️⃣ ربط المشروع

```bash
supabase link --project-ref pcymgqdjbdklrikdquih
```

---

### 4️⃣ احصل على Service Role Key

**أ. افتح:**
```
https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/settings/api
```

**ب. انزل لأسفل وابحث عن:**

```
┌────────────────────────────┐
│ anon public                │ ❌ لا تنسخ
│ eyJhbG...                  │
├────────────────────────────┤
│ service_role secret        │ ✅ انسخ هذا!
│ eyJhbG...        [Copy]    │
└────────────────────────────┘
```

**ج. اضغط [Copy]** بجانب `service_role`

**للشرح الكامل:** [`GET_SERVICE_ROLE_KEY.md`](./GET_SERVICE_ROLE_KEY.md)

---

### 5️⃣ تعيين Secrets

**⚠️ استبدل `YOUR_KEY` بما نسخته!**

```bash
supabase secrets set SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co" SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ" SUPABASE_SERVICE_ROLE_KEY="YOUR_KEY"
```

---

### 6️⃣ نشر Edge Function

```bash
supabase functions deploy server --no-verify-jwt
```

(انتظر 30 ثانية)

---

### 7️⃣ اختبار

```bash
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health
```

**المتوقع:**
```json
{"status":"healthy","database":true}
```

✅ **إذا رأيت هذا → Backend يعمل!**

---

### 8️⃣ تطبيق Database

1. **افتح:** https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql
2. **انسخ** محتوى ملف `database_schema.sql`
3. **الصق** في SQL Editor
4. **اضغط** "Run"
5. **انتظر** حتى ترى: `Success`

---

### 9️⃣ ابدأ التطوير

```bash
npm run dev
```

**افتح:** http://localhost:5173

✅ **انتهى! يجب ألا تظهر أي أخطاء الآن!**

---

## 📚 أدلة تفصيلية

إذا احتجت لمزيد من التفاصيل:

| الملف | الوصف |
|------|-------|
| **[🚨_DEPLOY_STEP_BY_STEP.md](./🚨_DEPLOY_STEP_BY_STEP.md)** | دليل مفصل مع الشرح |
| **[GET_SERVICE_ROLE_KEY.md](./GET_SERVICE_ROLE_KEY.md)** | كيفية الحصول على المفتاح |
| **[DEPLOY_NOW.txt](./DEPLOY_NOW.txt)** | أوامر سريعة للنسخ |
| **[🔴_CRITICAL_MUST_DEPLOY.txt](./🔴_CRITICAL_MUST_DEPLOY.txt)** | ملخص حرج |

---

## ❓ لماذا هذا مهم؟

**بدون Backend:**
- ❌ لا تسجيل
- ❌ لا تسجيل دخول
- ❌ لا مقررات
- ❌ لا حضور
- ❌ لا شيء يعمل!

**مع Backend:**
- ✅ كل شيء يعمل!

---

## 🆘 مشاكل؟

### "command not found: supabase"
```bash
npm install -g supabase
```

### "Not logged in"
```bash
supabase login
```

### "404 Not Found" بعد النشر
انتظر 60 ثانية وأعد الاختبار

---

<div align="center">

## 🚀 ابدأ الآن!

**انسخ الخطوة 1 ونفذها →**

```bash
npm install -g supabase
```

---

**⏱️ 5 دقائق فقط وكل شيء سيعمل!**

**🎓 جامعة الملك خالد**

</div>
