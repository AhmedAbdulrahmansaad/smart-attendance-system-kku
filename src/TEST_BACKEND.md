# 🧪 اختبار Backend - خطوة بخطوة

## 🎯 الهدف: تشخيص "Failed to fetch" error

---

## ✅ الخطوة 1: اختبار Health Check

### افتح Chrome/Edge
### افتح Console (F12)
### نفذ هذا الكود:

```javascript
// Test 1: Health Check
fetch('https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health')
  .then(r => {
    console.log('✅ Status:', r.status);
    return r.json();
  })
  .then(data => console.log('✅ Response:', data))
  .catch(err => console.error('❌ Error:', err));
```

### النتائج المتوقعة:

#### ✅ إذا نجح:
```
✅ Status: 200
✅ Response: {status: "ok"}
```
**المعنى:** Backend يعمل! ✅

---

#### ❌ إذا فشل:
```
❌ Error: TypeError: Failed to fetch
```

**الأسباب المحتملة:**
1. ❌ Edge Function غير deployed
2. ❌ Network issue
3. ❌ CORS مشكلة
4. ❌ Function crashed

---

## ✅ الخطوة 2: اختبار مع Authorization

### نفذ هذا الكود:

```javascript
// Test 2: Get Sessions (يحتاج Authorization)

// أولاً، احصل على access_token
const accessToken = localStorage.getItem('sb-pcymgqdjbdklrikdquih-auth-token');
console.log('Token exists:', !!accessToken);

if (accessToken) {
  const authData = JSON.parse(accessToken);
  const token = authData?.access_token;
  console.log('Access token:', token ? 'Yes ✅' : 'No ❌');
  
  if (token) {
    fetch('https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/sessions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(r => {
      console.log('✅ Status:', r.status);
      return r.json();
    })
    .then(data => console.log('✅ Sessions Response:', data))
    .catch(err => console.error('❌ Sessions Error:', err));
  } else {
    console.error('❌ No access token found - user not logged in');
  }
} else {
  console.error('❌ No auth data in localStorage - user not logged in');
}
```

### النتائج المتوقعة:

#### ✅ إذا نجح:
```
Token exists: true
Access token: Yes ✅
✅ Status: 200
✅ Sessions Response: {data: {sessions: [...], courses: [...]}}
```

---

#### ❌ إذا فشل:
```
❌ Sessions Error: TypeError: Failed to fetch
```

---

## ✅ الخطوة 3: حل المشاكل

### المشكلة 1: Health check فشل

**السبب:** Edge Function غير deployed

**الحل:**
1. افتح https://supabase.com/dashboard
2. اختر Project: pcymgqdjbdklrikdquih
3. Edge Functions → تحقق من وجود function
4. إذا لا يوجد، deploy عبر CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref pcymgqdjbdklrikdquih

# Deploy function
cd supabase/functions/server
supabase functions deploy server
```

---

### المشكلة 2: Health check نجح لكن /sessions فشل

**السبب:** Authorization مشكلة

**الحل:**
1. تأكد من تسجيل الدخول
2. تحقق من localStorage
3. تحقق من Environment variables في Supabase

---

### المشكلة 3: CORS error

**السبب:** CORS headers غير صحيحة

**الحل:**
تحقق من أن server/index.tsx يحتوي:
```typescript
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
```

---

## 🎯 الخطوة 4: اختبار كامل النظام

### نفذ هذا Script الشامل:

```javascript
console.log('=== 🧪 BACKEND TEST START ===\n');

const projectId = 'pcymgqdjbdklrikdquih';
const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-90ad488b`;

// Test 1: Health Check
console.log('Test 1: Health Check');
fetch(`${baseUrl}/health`)
  .then(r => {
    console.log('  ✅ Health Status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('  ✅ Health Response:', data);
    console.log('  ✅ Backend is ALIVE!\n');
    
    // Test 2: Get auth token
    console.log('Test 2: Check Auth Token');
    const authData = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (!authData) {
      console.log('  ❌ No auth data - USER NOT LOGGED IN\n');
      console.log('=== 🧪 BACKEND TEST END ===');
      return;
    }
    
    const token = JSON.parse(authData)?.access_token;
    if (!token) {
      console.log('  ❌ No access token - USER NOT LOGGED IN\n');
      console.log('=== 🧪 BACKEND TEST END ===');
      return;
    }
    
    console.log('  ✅ Auth token found\n');
    
    // Test 3: Get user info
    console.log('Test 3: Get User Info');
    return fetch(`${baseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      console.log('  ✅ /me Status:', r.status);
      return r.json();
    })
    .then(data => {
      console.log('  ✅ User:', data.user);
      console.log('  ✅ Role:', data.user.role);
      console.log('  ✅ Name:', data.user.full_name, '\n');
      
      // Test 4: Get sessions
      console.log('Test 4: Get Live Sessions');
      return fetch(`${baseUrl}/sessions`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(r => {
        console.log('  ✅ /sessions Status:', r.status);
        return r.json();
      })
      .then(data => {
        console.log('  ✅ Sessions:', data.data?.sessions?.length || 0);
        console.log('  ✅ Courses:', data.data?.courses?.length || 0);
        
        if (data.data?.sessions?.length > 0) {
          console.log('  📋 Live sessions found:');
          data.data.sessions.forEach(s => {
            console.log(`    - ${s.title || s.code} (${s.session_type})`);
          });
        } else {
          console.log('  ℹ️ No active live sessions');
        }
        
        console.log('\n=== 🧪 BACKEND TEST END ===');
        console.log('✅ ALL TESTS PASSED!');
      });
    });
  })
  .catch(err => {
    console.error('  ❌ Error:', err);
    console.error('  ❌ Error message:', err.message);
    console.log('\n=== 🧪 BACKEND TEST END ===');
    console.log('❌ TESTS FAILED - Backend not responding');
  });
```

---

## 📊 تفسير النتائج:

### ✅ **Scenario A: كل شيء يعمل**
```
Test 1: Health Check
  ✅ Health Status: 200
  ✅ Health Response: {status: "ok"}
  ✅ Backend is ALIVE!

Test 2: Check Auth Token
  ✅ Auth token found

Test 3: Get User Info
  ✅ /me Status: 200
  ✅ User: {...}
  ✅ Role: student
  ✅ Name: Ahmed

Test 4: Get Live Sessions
  ✅ /sessions Status: 200
  ✅ Sessions: 0
  ✅ Courses: 2
  ℹ️ No active live sessions

✅ ALL TESTS PASSED!
```

**المعنى:** Backend يعمل بشكل كامل! ✅

إذا كانت النتيجة هكذا لكن لا يزال هناك "Failed to fetch"، المشكلة قد تكون:
- Cache issue → امسح cache (Ctrl+Shift+Delete)
- Component issue → أعد تحميل الصفحة

---

### ❌ **Scenario B: Health check فشل**
```
Test 1: Health Check
  ❌ Error: TypeError: Failed to fetch
  ❌ Error message: Failed to fetch

❌ TESTS FAILED - Backend not responding
```

**المعنى:** Edge Function غير deployed أو crashed

**الحل:**
1. Deploy Edge Function (انظر الخطوة 3)
2. تحقق من Supabase Dashboard → Edge Functions → Logs
3. تحقق من internet connection

---

### ⚠️ **Scenario C: Health نجح لكن Auth فشل**
```
Test 1: Health Check
  ✅ Backend is ALIVE!

Test 2: Check Auth Token
  ❌ No auth data - USER NOT LOGGED IN
```

**المعنى:** User لم يسجل دخول

**الحل:**
1. سجل دخول من الصفحة الرئيسية
2. أعد اختبار

---

### ⚠️ **Scenario D: Health نجح و Auth نجح لكن /sessions فشل**
```
Test 3: Get User Info
  ✅ User: {...}

Test 4: Get Live Sessions
  ❌ Error: TypeError: Failed to fetch
```

**المعنى:** مشكلة في `/sessions` endpoint تحديداً

**الحل:**
1. تحقق من Logs في Supabase Dashboard
2. قد يكون هناك خطأ في KV store
3. تحقق من أن table `kv_store_90ad488b` موجود

---

## 🚀 الخطوة التالية بعد النجاح:

إذا نجحت كل الاختبارات:

1. ✅ أعد تحميل صفحة التطبيق
2. ✅ امسح Cache
3. ✅ سجل دخول من جديد
4. ✅ جرب "انضم للمحاضرة المباشرة"

---

## 📞 إذا فشلت الاختبارات:

### خذ Screenshot من:
1. Console output (كل النتائج)
2. Network tab (F12 → Network → فلتر على "make-server")
3. Supabase Dashboard → Edge Functions → Logs

### وشارك المعلومات التالية:
- Project ID: pcymgqdjbdklrikdquih
- Test results: [paste console output]
- Edge Function status from Dashboard
- Any error messages from Logs

---

**🎉 بعد نجاح هذه الاختبارات، البث المباشر سيعمل!**

---

**آخر تحديث:** 11 نوفمبر 2025  
**الحالة:** 🧪 Backend Testing Guide
