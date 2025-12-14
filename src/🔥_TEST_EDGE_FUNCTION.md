# 🔥 اختبر الـ Edge Function الآن!

## 🧪 اختبار سريع:

### الخطوة 1: افتح Console (F12)

### الخطوة 2: انسخ والصق هذا الكود:

```javascript
// Test 1: Basic fetch (بدون headers)
fetch('https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server')
  .then(r => {
    console.log('📊 Status:', r.status);
    return r.text();
  })
  .then(text => console.log('📄 Response:', text))
  .catch(err => console.error('❌ Error:', err));
```

### يجب أن ترى:
- Status: 404 أو 200
- Response: HTML أو JSON

---

### الخطوة 3: اختبر الـ health endpoint:

```javascript
// Test 2: Health check
fetch('https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health')
  .then(r => {
    console.log('✅ Status:', r.status);
    return r.json();
  })
  .then(data => console.log('✅ Data:', data))
  .catch(err => console.error('❌ Error:', err));
```

### يجب أن ترى:
```json
{
  "status": "healthy",
  "message": "Server is running"
}
```

---

## 📋 النتائج المحتملة:

### ✅ إذا رأيت: `{"status":"healthy"}`
```
🎉 الـ Edge Function يعمل!
المشكلة في الكود الخاص بالبث المباشر
```

### ❌ إذا رأيت: `404 Not Found`
```
🚨 الـ Edge Function غير deployed أو اسمه خطأ
الحل:
1. Supabase Dashboard
2. Edge Functions
3. تأكد من وجود "server"
```

### ❌ إذا رأيت: `CORS Error`
```
🚨 مشكلة CORS
الحل: تحقق من أن الـ Edge Function فيه:
app.use("/*", cors({ origin: "*" }))
```

### ❌ إذا رأيت: `Failed to fetch`
```
🚨 مشكلة اتصال
الحل:
1. تحقق من الإنترنت
2. تحقق من project ID صحيح
3. تحقق من الـ Edge Function deployed
```

---

## 🔍 معلومات المشروع:

```
Project ID: pcymgqdjbdklrikdquih
Supabase URL: https://pcymgqdjbdklrikdquih.supabase.co
Edge Function Name: server
Full URL: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server
Health Check: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

---

## 📸 أرسل لي Screenshots:

1. **من Console:**
   - النتيجة من Test 1
   - النتيجة من Test 2

2. **من Supabase Dashboard:**
   - Edge Functions page
   - هل الـ "server" موجود؟

3. **من Edge Function Logs:**
   - Supabase Dashboard > Edge Functions > server > Logs
   - آخر 10-20 سطر

---

**🔥 جرّب الآن وأرسل لي النتائج! 🚀**
