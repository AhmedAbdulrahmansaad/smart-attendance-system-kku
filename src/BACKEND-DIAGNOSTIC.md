# 🔍 Backend Diagnostic Guide - تشخيص مشاكل Backend

## 🚨 المشكلة الحالية

```
❌ TypeError: Failed to fetch
```

هذا الخطأ يعني أن Frontend لا يستطيع الاتصال بالـBackend!

---

## 📋 الخطوات التشخيصية

### ✅ الخطوة 1: اختبار Backend مباشرة من المتصفح

افتح tab جديد في المتصفح وروح للرابط:

```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

**المتوقع:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-13T...",
  "database": true,
  "message": "Backend is running correctly with SQL database",
  "messageAr": "الخادم يعمل بشكل صحيح مع قاعدة البيانات"
}
```

**إذا طلع 404:**
- معناها Edge Function غير deployed صح
- أو الـURL خطأ

**إذا طلع CORS error:**
- معناها CORS غير مفعل صح في Backend

**إذا ما فتح نهائياً:**
- معناها Supabase project غير شغال
- أو Edge Functions غير شغالة

---

### ✅ الخطوة 2: استخدم صفحة Test API الداخلية

في التطبيق، غير الـURL في browser إلى:

```
?page=test-api
```

أو:
```javascript
// في Console:
window.location.hash = 'test-api'
```

بتفتح صفحة اختبار شاملة!

---

### ✅ الخطوة 3: افحص Console في Developer Tools

1. افتح Dev Tools: `F12` أو `Ctrl+Shift+I`
2. روح Tab "Console"
3. ابحث عن:

```
🌐 [API] GET https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/...
```

**إذا شفت هالرسالة:**
- URL صحيح! ✅

**إذا ما شفتها:**
- فيه مشكلة في apiRequest function

---

## 🛠️ الحلول الممكنة

### 🔥 الحل 1: تأكد أن Edge Function Deployed

1. روح Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih
   ```

2. من القائمة الجانبية، اختر: **Edge Functions**

3. تأكد أن فيه function اسمها: **`server`**

4. تأكد أنها: **Deployed** (لونها أخضر)

**إذا مو موجودة:**
- يجب تنزيل الكود ورفعه على Supabase

---

### 🔥 الحل 2: تأكد من CORS Settings

الـBackend لازم يرجع CORS headers صح!

في `/supabase/functions/server/index.tsx`:

```typescript
app.use(
  "/*",
  cors({
    origin: "*",  // ✅ مهم!
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);
```

---

### 🔥 الحل 3: تأكد من الـURL الصحيح

الـURL المفترض يكون:

```
Base: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server
Route: /make-server-90ad488b/health
Full: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

في `/utils/api.ts`:

```typescript
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

// Auto-prefix endpoints with /make-server-90ad488b
const formattedEndpoint = endpoint.startsWith('/make-server-90ad488b') 
  ? endpoint 
  : `/make-server-90ad488b${endpoint}`;

const url = `${BASE_URL}${formattedEndpoint}`;
```

---

### 🔥 الحل 4: فحص Environment Variables

Edge Function يحتاج هذه الـvariables:

```
SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**للتحقق:**
1. Supabase Dashboard
2. Settings → Edge Functions
3. Environment Variables
4. تأكد أن كلهم موجودين!

---

### 🔥 الحل 5: Redeploy Edge Function

إذا كل شيء صح وما زال الخطأ موجود:

```bash
# في Terminal:
cd /path/to/project
supabase functions deploy server
```

---

## 🧪 URLs للاختبار

### Health Check:
```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health
```

### Users (يحتاج auth):
```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/users
```

### Courses:
```
https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/courses
```

---

## 📊 Expected HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | ✅ Success | كل شيء يعمل! |
| 401 | ⚠️ Unauthorized | تحتاج token (متوقع للـroutes المحمية) |
| 403 | ❌ Forbidden | الـrole ما عنده صلاحيات |
| 404 | ❌ Not Found | Edge Function غير deployed |
| 500 | ❌ Server Error | مشكلة في Backend code |

---

## ⚡ Quick Test Script

افتح Console (F12) ونسخ والصق:

```javascript
// Test Health Check
fetch('https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server/make-server-90ad488b/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ'
  }
})
.then(r => r.json())
.then(data => console.log('✅ SUCCESS:', data))
.catch(err => console.error('❌ ERROR:', err));
```

---

## 🎯 الخلاصة

المشكلة الأساسية هي أن **Edge Function** إما:
1. ❌ غير deployed على Supabase
2. ❌ deployed بـURL خطأ
3. ❌ CORS غير مفعل صح
4. ❌ Environment variables ناقصة

**الحل:**
1. اختبر الـURL في المتصفح مباشرة
2. إذا 404 → redeploy Edge Function
3. إذا CORS error → فحص CORS settings
4. إذا شغال في المتصفح بس مو في التطبيق → فحص الـfetch headers

---

## 📞 Need Help?

إذا جربت كل شيء وما زال ما يعمل:

1. خذ screenshot من:
   - Browser console (F12)
   - Network tab في Dev Tools
   - الـURL test من المتصفح

2. تحقق من:
   - Supabase Edge Functions page
   - Environment variables

3. تأكد أن:
   - `/supabase/functions/server/index.tsx` موجود
   - الـfile ينتهي بـ `Deno.serve(app.fetch);`
   - الـroutes تبدأ بـ `/make-server-90ad488b`
