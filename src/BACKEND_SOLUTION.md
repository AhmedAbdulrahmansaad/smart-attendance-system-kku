# ✅ حل مشكلة "Failed to fetch" - Backend Solution

## 📋 ملخص المشكلة

النظام يواجه خطأ **"Failed to fetch"** عند محاولة الوصول إلى `/sessions` API. هذا الخطأ يشير إلى أن:

1. ❌ **Supabase Edge Function غير deployed** أو غير متاح
2. ❌ Edge Function crashed أو بها أخطاء
3. ❌ CORS أو Network issues

---

## 🔧 الحل المُطبق

### 1. أداة تشخيص Backend Health Check

تم إنشاء أداة تشخيص شاملة في `/components/BackendHealthCheck.tsx` تقوم بـ:

#### ✅ الاختبارات التلقائية:

1. **Environment Variables Check**
   - التحقق من وجود `projectId` و `publicAnonKey`
   - عرض معاينة للقيم (مخفية جزئياً للأمان)

2. **Health Endpoint Test**
   - اختبار `/health` endpoint
   - التحقق من أن Edge Function تعمل
   - URL المستخدم: `https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health`

3. **Auth Token Check**
   - التحقق من وجود access token في localStorage
   - معرفة إذا كان المستخدم مسجل دخول

4. **Sessions Endpoint Test** (إذا كان المستخدم مسجل دخول)
   - اختبار `/sessions` endpoint مع token
   - عرض الاستجابة الكاملة

5. **Internet Connection Test**
   - التحقق من اتصال الإنترنت

#### 📊 المخرجات:

- ✅ **Success**: الاختبار نجح
- ❌ **Error**: الاختبار فشل
- ⚠️ **Warning**: تحذير (مثل: لا يوجد token)
- 🔄 **Pending**: الاختبار قيد التشغيل

---

### 2. كيفية الوصول إلى أداة التشخيص

#### الطريقة 1: من الصفحة الرئيسية

1. افتح الموقع (الصفحة الرئيسية)
2. اذهب إلى أسفل الصفحة (Footer)
3. في قسم "روابط سريعة" / "Quick Links"
4. اضغط على "🔧 فحص النظام" / "🔧 System Health"

#### الطريقة 2: URL مباشر

أضف `#health-check` للـ URL (لن يعمل في البيئة الحالية، لكن الطريقة الأولى تعمل)

---

### 3. فهم نتائج الاختبار

#### ✅ إذا نجحت جميع الاختبارات:

```
✅ Environment Variables: Project ID and Public Anon Key found
✅ Health Endpoint: Backend is running (200)
✅ Auth Token: User logged in
✅ /sessions Endpoint: Sessions endpoint working (200)
✅ Internet Connection: Internet connection is working
```

**النتيجة**: Backend يعمل بشكل صحيح! المشكلة قد تكون في مكان آخر.

---

#### ❌ إذا فشل Health Endpoint:

```
❌ Health Endpoint: Failed to connect: Failed to fetch
```

**السبب**: Edge Function غير deployed أو غير متاح

**الحل**:

##### Option A: Deploy عبر Supabase Dashboard

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `pcymgqdjbdklrikdquih`
3. اذهب إلى **Edge Functions**
4. اضغط **"Create a new function"**
5. اسم الـ function: `server`
6. انسخ محتوى `/supabase/functions/server/index.tsx`
7. الصقه في الـ editor
8. اضغط **"Deploy"**

##### Option B: Deploy عبر Supabase CLI

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link to your project
supabase link --project-ref pcymgqdjbdklrikdquih

# 4. Deploy the function
supabase functions deploy server

# 5. Set environment variables
supabase secrets set SUPABASE_URL="https://pcymgqdjbdklrikdquih.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

---

#### ❌ إذا فشل Sessions Endpoint:

```
❌ /sessions Endpoint: Sessions endpoint error (401)
```

**السبب المحتمل**:
- 401 = Token منتهي أو غير صحيح
- 403 = ليس لديك صلاحيات
- 500 = خطأ في السيرفر

**الحل**:
- سجل خروج ثم سجل دخول مرة أخرى
- تحقق من Logs في Supabase Dashboard

---

#### ❌ إذا كانت Environment Variables مفقودة:

```
❌ Environment Variables: Missing environment variables
```

**السبب**: ملف `/utils/supabase/info.tsx` فارغ أو تالف

**الحل**: 
- هذا لا يحدث في بيئة Figma Make لأنها تُدار تلقائياً
- إذا حدث، تواصل مع دعم Figma Make

---

## 📝 معلومات المشروع الحالية

```javascript
Project ID: pcymgqdjbdklrikdquih
Public Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Supabase URL: https://pcymgqdjbdklrikdquih.supabase.co
Edge Function: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b
```

---

## 🎯 خطوات استكشاف الأخطاء

### الخطوة 1: افتح أداة التشخيص

1. اذهب إلى الصفحة الرئيسية
2. Footer → "🔧 فحص النظام"
3. انتظر حتى تنتهي الاختبارات

### الخطوة 2: افحص النتائج

- كم اختبار نجح؟
- أي اختبار فشل؟
- اضغط "View Details" لمزيد من المعلومات

### الخطوة 3: افتح Console (F12)

في Console، ابحث عن:

```
🏥 Testing health endpoint: ...
🏥 Health response status: ...
🏥 Health response data: ...
```

### الخطوة 4: حدد المشكلة

#### إذا رأيت:
```
🏥 Health response status: 200
🏥 Health response data: {status: "ok"}
```
✅ **Backend يعمل!**

#### إذا رأيت:
```
❌ Failed to fetch
```
❌ **Edge Function غير deployed**

#### إذا رأيت:
```
🏥 Health response status: 404
```
❌ **Function name خطأ أو غير موجود**

#### إذا رأيت:
```
🏥 Health response status: 500
```
❌ **خطأ في كود السيرفر**

### الخطوة 5: طبق الحل المناسب

حسب المشكلة التي حددتها، اتبع الحل المقابل أعلاه.

---

## 🚀 بعد حل المشكلة

### 1. اختبر مرة أخرى

1. في أداة التشخيص، اضغط **"Re-run Tests"**
2. تأكد أن جميع الاختبارات نجحت ✅

### 2. اختبر النظام

1. سجل دخول كطالب
2. اذهب إلى "تسجيل الحضور"
3. تأكد أن الجلسات المباشرة تظهر (إذا موجودة)

### 3. اختبر البث المباشر

1. سجل دخول كمدرس
2. أنشئ جلسة بث مباشر
3. ابدأ البث
4. سجل دخول كطالب في نافذة أخرى
5. شاهد البث

---

## 💡 نصائح مهمة

### للمطورين:

1. ✅ احتفظ بـ أداة Health Check للتشخيص السريع
2. ✅ راقب Console Logs باستمرار
3. ✅ راقب Supabase Edge Function Logs
4. ✅ اختبر بعد كل تغيير في الكود

### للمستخدمين النهائيين:

1. ✅ إذا واجهت مشكلة، افتح أداة التشخيص أولاً
2. ✅ التقط screenshot لنتائج الاختبار
3. ✅ أرسلها للدعم الفني
4. ✅ تأكد من اتصال الإنترنت

---

## 📞 الدعم الفني

إذا استمرت المشكلة بعد تطبيق جميع الحلول:

### جمع المعلومات:

1. افتح أداة التشخيص
2. اضغط "Re-run Tests"
3. التقط screenshot للنتائج
4. افتح Console (F12)
5. انسخ جميع الأخطاء

### أرسل للدعم:

- Screenshot من أداة التشخيص
- Console logs
- خطوات إعادة إنتاج المشكلة
- Browser و OS المستخدم

---

## 🎉 الخلاصة

تم إضافة أداة تشخيص شاملة تساعد على:

1. ✅ تحديد المشكلة بدقة
2. ✅ معرفة إذا كان Backend يعمل
3. ✅ اختبار جميع الـ endpoints
4. ✅ توفير معلومات تفصيلية للمطورين

**للوصول إليها**: الصفحة الرئيسية → Footer → "🔧 فحص النظام"

---

**آخر تحديث**: 11 نوفمبر 2025  
**الحالة**: ✅ Backend Health Check Tool Added

---

## 🔍 معلومات إضافية

### البنية الحالية:

```
Frontend (React + TypeScript)
    ↓ (Fetch API)
Edge Function (Hono + Deno)
    ↓ (Supabase Client)
Database (PostgreSQL + KV Store)
```

### الـ Routes المتاحة:

```
GET  /health                    ✅ Public
POST /signup                    ✅ Public
GET  /me                        🔒 Requires Auth

GET  /users                     🔒 Admin
DELETE /users/:userId           🔒 Admin

POST /courses                   🔒 Admin/Instructor
GET  /courses                   🔒 All Roles
PUT  /courses/:courseId         🔒 Admin
DELETE /courses/:courseId       🔒 Admin/Instructor

POST /enrollments               🔒 Admin
GET  /enrollments/:courseId     🔒 All Roles

POST /schedules                 🔒 Admin/Instructor
GET  /schedules                 🔒 All Roles
DELETE /schedules/:scheduleId   🔒 Admin/Instructor

POST /sessions                  🔒 Instructor
GET  /sessions                  🔒 All Roles
GET  /sessions/:courseId        🔒 All Roles
POST /sessions/:id/deactivate   🔒 Instructor
DELETE /sessions/:id            🔒 Instructor

POST /attendance                🔒 Student
GET  /attendance/student        🔒 Student
GET  /attendance/course/:id     🔒 Instructor/Admin

GET  /reports/course/:id        🔒 Instructor/Admin
GET  /reports/overview          🔒 All Roles
```

---

**ملاحظة**: في بيئة **Figma Make**، Edge Functions يجب أن تكون مُجهزة تلقائياً. إذا لم تعمل، قد تحتاج deployment يدوي عبر Supabase Dashboard أو CLI.
