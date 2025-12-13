# 🧪 دليل الاختبار السريع - Testing Guide

## 📝 نظرة عامة

تم إنشاء مجموعة من سكربتات الاختبار للتحقق من عمل النظام بشكل صحيح بعد إصلاح مشكلة Failed to Fetch.

---

## 🔧 السكربتات المتاحة

### 1. `test-url-fix.sh` - اختبار إصلاح الـ URL
**الغرض:** التحقق من أن جميع Endpoints تعمل بالـ URL الصحيح

**كيفية الاستخدام:**
```bash
# امنح صلاحيات التنفيذ
chmod +x test-url-fix.sh

# شغّل الاختبار
./test-url-fix.sh
```

**ما الذي يختبره:**
- ✅ `/health` - Health Check Endpoint
- ✅ `/stats/public` - Public Statistics (للصفحة الرئيسية)
- ⚠️ `/stats/dashboard` - Dashboard Statistics (يحتاج authentication)

**النتيجة المتوقعة:**
```
✅ Health Check: 200 OK
✅ Public Stats: 200 OK
⚠️ Dashboard Stats: 401 Unauthorized (طبيعي - يحتاج تسجيل دخول)
```

---

### 2. `test-edge-function.sh` - اختبار شامل للـ Edge Function
**الغرض:** اختبار جميع endpoints بشكل مفصّل

**كيفية الاستخدام:**
```bash
chmod +x test-edge-function.sh
./test-edge-function.sh
```

**ما الذي يختبره:**
- صحة الاتصال بالـ Edge Function
- Health Check
- Public Stats
- Database Connection
- جميع الـ Endpoints الأساسية

---

### 3. `deploy-edge-function.sh` - نشر Edge Function
**الغرض:** نشر Edge Function على Supabase

**كيفية الاستخدام:**
```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

**المتطلبات:**
1. Supabase CLI مثبت
2. تسجيل دخول إلى Supabase
3. Database Schema مطبّق

---

## 🎯 سيناريوهات الاختبار

### السيناريو 1: النظام يعمل بشكل كامل ✅

**الأوامر:**
```bash
./test-url-fix.sh
```

**النتيجة المتوقعة:**
```
✅ Health Check: 200 OK
✅ Public Stats: 200 OK
⚠️ Dashboard Stats: 401 Unauthorized
```

**التفسير:**
- النظام يعمل بشكل صحيح
- Endpoints العامة تعمل
- Endpoints المحمية تطلب authentication (طبيعي)

---

### السيناريو 2: Edge Function غير منشور ❌

**الأوامر:**
```bash
./test-url-fix.sh
```

**النتيجة:**
```
❌ Health Check: 404 Not Found
❌ Public Stats: 404 Not Found
❌ Dashboard Stats: 404 Not Found
```

**الحل:**
```bash
# 1. تأكد من تطبيق Database Schema أولاً
# افتح Supabase Dashboard > SQL Editor
# الصق محتوى database_schema.sql

# 2. انشر Edge Function
./deploy-edge-function.sh
```

---

### السيناريو 3: Database Schema غير مطبّق ⚠️

**النتيجة:**
```
✅ Health Check: 200 OK
❌ Public Stats: 500 Internal Server Error
```

**الحل:**
```sql
-- افتح Supabase Dashboard > SQL Editor
-- الصق محتوى database_schema.sql
-- اضغط Run
```

---

## 🔍 كيفية قراءة نتائج الاختبار

### HTTP Status Codes

| كود | معنى | ماذا تفعل |
|-----|------|-----------|
| 200 | ✅ نجاح | كل شيء يعمل بشكل صحيح |
| 401 | ⚠️ غير مصرّح | طبيعي للـ endpoints المحمية |
| 404 | ❌ غير موجود | Edge Function غير منشور |
| 500 | ❌ خطأ في الخادم | تحقق من Database Schema |

---

## 📊 اختبار عبر المتصفح

### الطريقة 1: فحص Console

1. افتح الصفحة الرئيسية للنظام
2. اضغط F12 لفتح Developer Tools
3. افتح تبويب Console
4. ابحث عن الرسائل التالية:

```javascript
✅ Fetching landing stats from API...
✅ Response status: 200
✅ Landing page stats from database: { ... }
```

### الطريقة 2: فحص Network Tab

1. افتح Developer Tools (F12)
2. افتح تبويب Network
3. أعد تحميل الصفحة
4. ابحث عن الطلبات لـ `make-server-90ad488b`
5. تحقق من Status Code (يجب أن يكون 200)

---

## 🧪 اختبار متقدم عبر curl

### اختبار Health Check
```bash
curl -i https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### اختبار Public Stats
```bash
curl -i https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/stats/public \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### اختبار Signup (POST)
```bash
curl -X POST https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/signup \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kku.edu.sa",
    "password": "Test123456",
    "full_name": "Test User",
    "role": "student",
    "university_id": "441234567"
  }'
```

---

## 📋 قائمة التحقق قبل الاختبار

- [ ] Supabase Project جاهز
- [ ] Database Schema مطبّق (`database_schema.sql`)
- [ ] Edge Function منشور (`deploy-edge-function.sh`)
- [ ] Environment Variables موجودة:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_DB_URL`

---

## 🚀 خطوات الاختبار الكامل

### 1️⃣ التحضير
```bash
# امنح صلاحيات للسكربتات
chmod +x test-url-fix.sh
chmod +x test-edge-function.sh
chmod +x deploy-edge-function.sh
```

### 2️⃣ تطبيق Database Schema
```sql
-- في Supabase Dashboard > SQL Editor
-- الصق محتوى database_schema.sql
-- اضغط Run
```

### 3️⃣ نشر Edge Function
```bash
./deploy-edge-function.sh
```

### 4️⃣ اختبار الاتصال
```bash
./test-url-fix.sh
```

### 5️⃣ اختبار شامل
```bash
./test-edge-function.sh
```

### 6️⃣ فحص المتصفح
- افتح الصفحة الرئيسية
- تحقق من ظهور الإحصائيات
- تحقق من Console (F12)

---

## ❓ الأسئلة الشائعة

### Q: ماذا لو حصلت على 404 في كل الاختبارات؟
**A:** Edge Function غير منشور. شغّل `./deploy-edge-function.sh`

### Q: ماذا لو حصلت على 500 في Public Stats؟
**A:** Database Schema غير مطبّق. افتح SQL Editor وطبّق `database_schema.sql`

### Q: هل يجب أن يكون Dashboard Stats يعطي 401؟
**A:** نعم! هذا طبيعي لأنه endpoint محمي يحتاج authentication

### Q: كيف أعرف أن الإصلاح نجح؟
**A:** إذا حصلت على:
- ✅ Health Check: 200 OK
- ✅ Public Stats: 200 OK
- ⚠️ Dashboard Stats: 401 Unauthorized

**هذا يعني أن كل شيء يعمل بشكل صحيح!**

---

## 📚 ملفات إضافية للمساعدة

- **دليل النشر**: `DEPLOYMENT_GUIDE_AR.md`
- **دليل قاعدة البيانات**: `DATABASE_SETUP.md`
- **إصلاح Failed to Fetch**: `🔧_حل_مشكلة_Failed_to_Fetch.md`
- **تفاصيل الإصلاح**: `✅_URL_FIX_COMPLETE.md`

---

## ✅ الخلاصة

**3 خطوات بسيطة للتأكد من عمل النظام:**

```bash
# 1. تطبيق Database Schema (في Supabase Dashboard)

# 2. نشر Edge Function
./deploy-edge-function.sh

# 3. اختبار النظام
./test-url-fix.sh
```

**إذا حصلت على نتائج إيجابية، فالنظام جاهز للاستخدام! 🎉**

---

**آخر تحديث:** 2025-12-11
**الحالة:** ✅ تم إصلاح جميع الأخطاء
