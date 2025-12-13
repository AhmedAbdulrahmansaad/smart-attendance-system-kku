# 🔥 حل خطأ 404 - Edge Function غير منشور
# Fix 404 Error - Edge Function Not Deployed

---

## ⚠️ المشكلة | The Problem

```
❌ API Error Response: 404 Not Found
⚠️ Edge Functions might not be deployed yet. Using fallback data.
```

**السبب | Cause:** Edge Function موجود في الكود لكنه **غير منشور** على Supabase.

---

## ✅ الحل السريع (5 دقائق) | Quick Fix (5 Minutes)

### الخطوة 1: تثبيت Supabase CLI
**Step 1: Install Supabase CLI**

```bash
npm install -g supabase
```

**التحقق | Verify:**
```bash
supabase --version
```

---

### الخطوة 2: تسجيل الدخول
**Step 2: Login**

```bash
supabase login
```

سيفتح المتصفح لتسجيل الدخول. اتبع التعليمات.  
*Browser will open for login. Follow instructions.*

---

### الخطوة 3: ربط المشروع
**Step 3: Link Project**

```bash
supabase link --project-ref pcymgqdjbdklrikdquih
```

**إذا طلب منك Access Token:**  
احصل عليه من: https://supabase.com/dashboard/account/tokens

---

### الخطوة 4: تعيين Environment Variables
**Step 4: Set Environment Variables**

احصل على **Service Role Key** من:
```
https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/settings/api
```

**⚠️ تأكد من نسخ `service_role` key وليس `anon` key!**

```bash
supabase secrets set \
  SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"
```

**استبدل `YOUR_SERVICE_ROLE_KEY_HERE` بالـ Service Role Key الخاص بك.**

---

### الخطوة 5: نشر Edge Function
**Step 5: Deploy Edge Function**

```bash
supabase functions deploy server
```

**انتظر حتى يكتمل النشر... | Wait for deployment to complete...**

---

### الخطوة 6: اختبار Edge Function
**Step 6: Test Edge Function**

```bash
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/health
```

**يجب أن تحصل على رد مثل:**  
**You should get a response like:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-11T...",
  "database": true,
  "message": "Backend is running correctly with SQL database",
  "messageAr": "الخادم يعمل بشكل صحيح مع قاعدة البيانات"
}
```

---

## 🎯 استخدام السكربت التلقائي | Use Automated Script

بدلاً من الخطوات اليدوية، يمكنك استخدام السكربت الجاهز:

```bash
chmod +x deploy-complete.sh
./deploy-complete.sh
```

السكربت سيقوم بكل شيء تلقائياً! 🚀

---

## 🔍 التحقق من النشر | Verify Deployment

### 1. من المتصفح | From Browser

افتح:
```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/health
```

يجب أن ترى JSON response صحيح.

### 2. من Dashboard

افتح:
```
https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/functions
```

يجب أن ترى `server` في قائمة Functions مع حالة **Deployed**.

### 3. من التطبيق | From App

افتح التطبيق في المتصفح → افتح Console (F12)  
يجب أن تختفي رسائل الخطأ 404.

---

## 🚨 حل المشاكل الشائعة | Common Issues

### مشكلة 1: Command not found: supabase
**الحل:**
```bash
npm install -g supabase
# أو | or
brew install supabase/tap/supabase  # macOS
```

### مشكلة 2: Authentication failed
**الحل:**
```bash
supabase logout
supabase login
```

### مشكلة 3: Project not linked
**الحل:**
```bash
supabase unlink
supabase link --project-ref pcymgqdjbdklrikdquih
```

### مشكلة 4: Permission denied
**الحل:**
```bash
chmod +x deploy-complete.sh
```

### مشكلة 5: Still getting 404 after deployment
**الحل:**  
انتظر 30-60 ثانية. قد يستغرق Supabase بعض الوقت لتفعيل Function.

---

## 📊 بعد النشر | After Deployment

### الخطوة التالية: تطبيق SQL Schema

1. افتح SQL Editor:
   ```
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql
   ```

2. افتح ملف `/database_schema.sql` في محرر النصوص

3. انسخ المحتوى كاملاً

4. الصقه في SQL Editor

5. اضغط **Run**

6. انتظر حتى يكتمل التنفيذ ✅

---

## ✅ تأكيد النجاح | Success Confirmation

عندما يعمل كل شيء بشكل صحيح، ستشاهد:

✅ في Console:
```
🌐 API Request: GET /stats/public
📍 Full URL: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/stats/public
📥 Response status: 200 OK
✅ Success for /stats/public
```

✅ في التطبيق:
- الصفحة الرئيسية تعرض إحصائيات حقيقية
- يمكنك التسجيل وتسجيل الدخول
- لا توجد رسائل خطأ 404

---

## 🎓 ملاحظات مهمة | Important Notes

1. **Service Role Key** حساس جداً - لا تشاركه أبداً!  
   *Very sensitive - never share it!*

2. Edge Function يستخدم **Deno** وليس Node.js  
   *Uses Deno, not Node.js*

3. التغييرات على الكود تتطلب **إعادة نشر**  
   *Code changes require re-deployment*

4. يمكنك مشاهدة اللوغ في Dashboard → Functions → server → Logs

---

## 📞 الدعم | Support

إذا استمرت المشكلة:

1. تحقق من اللوغ في Supabase Dashboard
2. راجع ملف [TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md)
3. تواصل: mnafisah668@gmail.com

---

## 🚀 الأوامر السريعة | Quick Commands

```bash
# نشر كامل | Full Deploy
./deploy-complete.sh

# نشر Function فقط | Deploy Function Only
supabase functions deploy server

# مشاهدة اللوغ المباشر | Watch Live Logs
supabase functions logs server --tail

# اختبار الاتصال | Test Connection
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/health
```

---

**⏱️ الوقت المتوقع | Expected Time:** 5 دقائق | 5 minutes

**🎯 النتيجة | Result:** نظام كامل يعمل بدون أخطاء | Fully working system with no errors

---

✨ **بالتوفيق! Good Luck!** ✨
