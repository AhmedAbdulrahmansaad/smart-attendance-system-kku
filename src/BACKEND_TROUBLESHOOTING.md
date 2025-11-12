# 🔧 حل مشكلة "Failed to fetch" - Backend Troubleshooting

## ❌ الخطأ الحالي:
```
⚠️ [Viewer] Connection timeout
❌ Fetch error for /sessions: TypeError: Failed to fetch
❌ Error name: TypeError
❌ Error message: Failed to fetch
❌ [Student] Error: TypeError: Failed to fetch
```

---

## 🎯 السبب المحتمل:

**"Failed to fetch"** يعني واحد من التالي:

1. ❌ **Supabase Edge Function لم يتم deploy**
2. ❌ **Environment variables غير موجودة**
3. ❌ **CORS مشكلة**
4. ❌ **URL خاطئ**
5. ❌ **Network timeout**

---

## ✅ الحل الكامل خطوة بخطوة:

### **الخطوة 1: تحقق من Supabase Project**

#### افتح Console (F12) في المتصفح:
```javascript
// تحقق من projectId و publicAnonKey
import { projectId, publicAnonKey } from './utils/supabase/info'
console.log('Project ID:', projectId)
console.log('Public Anon Key:', publicAnonKey)
```

#### يجب أن ترى:
```
✅ Project ID: (string طويل)
✅ Public Anon Key: (string طويل جداً يبدأ بـ eyJ...)
```

#### ❌ إذا رأيت `undefined`:
```
المشكلة: Environment variables غير موجودة
```

---

### **الخطوة 2: تحقق من Supabase Dashboard**

1. افتح: https://supabase.com/dashboard
2. اختر مشروعك
3. اذهب إلى: **Settings** → **API**
4. انسخ:
   - ✅ **Project URL** (مثل: https://xxxxx.supabase.co)
   - ✅ **anon/public key** (يبدأ بـ eyJ...)

---

### **الخطوة 3: تحقق من Edge Functions**

1. في Supabase Dashboard
2. اذهب إلى: **Edge Functions**
3. تحقق من وجود function اسمها: **`make-server-90ad488b`** أو **`server`**

#### ❌ إذا لم تجد أي function:
```
المشكلة: Edge Function لم يتم deploy بعد
```

#### ✅ إذا وجدت function:
```
- انقر عليها
- تحقق من Status: يجب أن يكون "Active" ✅
- اذهب إلى "Logs" - هل هناك أخطاء؟
```

---

### **الخطوة 4: Deploy Edge Function يدوياً**

إذا كانت Edge Function غير موجودة، اتبع هذه الخطوات:

#### **Option A: عبر Supabase CLI** (الأفضل)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# 4. Deploy the function
supabase functions deploy server

# 5. Set environment variables
supabase secrets set SUPABASE_URL="https://xxxxx.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="eyJ..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

#### **Option B: عبر Dashboard** (أسهل)

1. اذهب إلى **Edge Functions** في Dashboard
2. اضغط **"Create a new function"**
3. اسم الـ function: `server`
4. انسخ كل محتوى `/supabase/functions/server/index.tsx`
5. الصقه في الـ editor
6. اضغط **"Deploy"**

---

### **الخطوة 5: تحقق من Environment Variables**

#### في Supabase Dashboard:
1. **Edge Functions** → اختر function `server`
2. اذهب إلى **"Settings"**
3. تحقق من وجود:
   ```
   ✅ SUPABASE_URL
   ✅ SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ✅ SUPABASE_DB_URL (اختياري)
   ```

#### ❌ إذا لم تكن موجودة:
```bash
# أضفها عبر CLI:
supabase secrets set SUPABASE_URL="YOUR_URL"
supabase secrets set SUPABASE_ANON_KEY="YOUR_ANON_KEY"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

---

### **الخطوة 6: اختبر الـ Backend**

#### **Test 1: Health Check**

افتح في المتصفح:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/health
```

#### ✅ يجب أن ترى:
```json
{"status": "ok"}
```

#### ❌ إذا رأيت خطأ:
- 404 = Function اسمه غلط أو غير موجود
- 500 = خطأ في الكود
- CORS error = مشكلة CORS

---

#### **Test 2: Test /sessions endpoint**

في Console (F12):
```javascript
const projectId = 'YOUR_PROJECT_ID';
const publicAnonKey = 'YOUR_ANON_KEY';
const accessToken = 'YOUR_ACCESS_TOKEN'; // من localStorage

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-90ad488b/sessions`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Sessions:', data))
.catch(err => console.error('❌ Error:', err));
```

#### ✅ يجب أن ترى:
```
✅ Sessions: { data: { sessions: [...], courses: [...] } }
```

---

### **الخطوة 7: تحقق من /utils/supabase/info.tsx**

#### افتح الملف:
```typescript
// يجب أن يحتوي على:
export const projectId = Deno.env.get('SUPABASE_URL')
  ?.replace('https://', '')
  ?.replace('.supabase.co', '') || '';

export const publicAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
```

#### ❌ إذا كان فارغ:
المشكلة في Environment variables

---

## 🔍 استكشاف الأخطاء التفصيلي:

### **Error 1: "Failed to fetch"**

#### الأسباب المحتملة:
```
1. ❌ Network offline
   → تحقق من الإنترنت

2. ❌ Wrong URL
   → تحقق من projectId في /utils/supabase/info.tsx
   
3. ❌ Function not deployed
   → Deploy عبر CLI أو Dashboard
   
4. ❌ CORS issue
   → تحقق من أن السيرفر يحتوي cors middleware
   
5. ❌ Function crashed
   → تحقق من Logs في Dashboard
```

---

### **Error 2: "Unauthorized" أو 401**

#### الأسباب:
```
1. ❌ No access token
   → المستخدم لم يسجل دخول
   
2. ❌ Invalid token
   → Token expired أو غلط
   
3. ❌ Wrong header
   → تحقق من Authorization: Bearer TOKEN
```

---

### **Error 3: "Internal server error" أو 500**

#### الأسباب:
```
1. ❌ KV store error
   → تحقق من أن table kv_store_90ad488b موجود
   
2. ❌ Missing env variables
   → تحقق من SUPABASE_SERVICE_ROLE_KEY
   
3. ❌ Code error
   → تحقق من Logs في Dashboard
```

---

## 🎯 الحل السريع (Quick Fix):

### **إذا كنت تستخدم Figma Make:**

النظام **يجب** أن يكون متصل بـ Supabase تلقائياً. لكن إذا لم يعمل:

#### **1. تحقق من أن المشروع مفعّل:**
```
- افتح Figma Make
- Settings/Project Settings
- تحقق من Supabase integration
```

#### **2. أعد تحميل الصفحة:**
```
Ctrl+R أو Cmd+R
```

#### **3. امسح Cache:**
```
F12 → Application → Clear storage → Clear site data
```

---

## 📊 Checklist كامل:

```
☑ Supabase project موجود ونشط
☑ Edge Function "server" deployed
☑ Environment variables موجودة:
   ☑ SUPABASE_URL
   ☑ SUPABASE_ANON_KEY  
   ☑ SUPABASE_SERVICE_ROLE_KEY
☑ Health check يعمل: /health → {status: "ok"}
☑ Table kv_store_90ad488b موجود في Database
☑ CORS enabled في السيرفر
☑ projectId و publicAnonKey موجودين في الفرونت
☑ User logged in (access_token موجود)
☑ Internet connection نشط
```

---

## 🚀 بعد إصلاح Backend:

### **1. اختبر تسجيل الدخول:**
```
1. افتح الموقع
2. سجل دخول
3. تحقق من Console - هل ظهرت أخطاء؟
```

### **2. اختبر Student Dashboard:**
```
1. سجل دخول كطالب
2. اذهب إلى "تسجيل الحضور"
3. يجب أن تظهر الجلسات المباشرة (إذا موجودة)
```

### **3. اختبر Instructor:**
```
1. سجل دخول كمدرس
2. أنشئ جلسة "بث مباشر"
3. ابدأ البث
4. يجب أن يعمل بدون "Failed to fetch"
```

---

## 💡 نصائح مهمة:

### **للتطوير (Development):**
```
✅ استخدم Supabase Local Development
✅ استخدم ngrok لـ expose localhost
✅ راقب Logs باستمرار
```

### **للإنتاج (Production):**
```
✅ Deploy Edge Functions عبر CI/CD
✅ استخدم Environment variables آمنة
✅ فعّل Rate limiting
✅ راقب Performance metrics
```

---

## 📞 إذا استمرت المشكلة:

### **جمع المعلومات التالية:**

```javascript
// في Console (F12):
console.log('=== Debug Info ===');
console.log('1. Project ID:', projectId);
console.log('2. Anon Key exists:', !!publicAnonKey);
console.log('3. User logged in:', !!localStorage.getItem('access_token'));
console.log('4. Current URL:', window.location.href);

// Test backend:
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-90ad488b/health`)
  .then(r => {
    console.log('5. Health check status:', r.status);
    return r.json();
  })
  .then(data => console.log('6. Health check response:', data))
  .catch(err => console.log('7. Health check error:', err));
```

### **أرسل هذه المعلومات للدعم:**
```
1. Project ID: ...
2. Error message: ...
3. Console logs: ...
4. Network tab screenshot
5. Edge Functions status from Dashboard
```

---

## ✅ الخلاصة:

المشكلة **"Failed to fetch"** تعني أن الفرونت لا يستطيع الوصول للباك إند.

**الحل الأكثر احتمالاً:**
```
1. ✅ Deploy Edge Function
2. ✅ تحقق من Environment variables
3. ✅ اختبر /health endpoint
4. ✅ أعد تحميل الصفحة
```

**بعد تطبيق هذه الخطوات، يجب أن يعمل كل شيء! 🎉**

---

**آخر تحديث:** 11 نوفمبر 2025  
**الحالة:** 🔧 Backend Troubleshooting Guide

---

**ملاحظة مهمة:** إذا كنت تستخدم Figma Make في بيئة مُدارة، فإن Backend يجب أن يكون مُجهز تلقائياً. إذا لم يعمل، قد تحتاج إلى الاتصال بدعم Figma Make لتفعيل Supabase integration.
