# ⚡ إصلاح سريع - 2 دقيقة

## ❌ المشكلة
```
Edge Function NOT DEPLOYED
Invalid login credentials
Email already registered
```

---

## ✅ الحل (أمران فقط)

### 1️⃣ نشر Backend

```bash
chmod +x ⚡_DEPLOY_NOW.sh
./⚡_DEPLOY_NOW.sh
```

**سيطلب منك:**
- Service Role Key (مرة واحدة)
- احصل عليه من: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/settings/api
- انسخ **service_role** (ليس anon!)

⏱️ **الوقت:** دقيقة واحدة

---

### 2️⃣ تطبيق Database

1. **افتح:** https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql
2. **انسخ** محتوى `database_schema.sql`
3. **الصق** في SQL Editor
4. **اضغط** Run

⏱️ **الوقت:** 30 ثانية

---

## 🚀 ثم ابدأ

```bash
npm run dev
```

---

## ⚠️ تنبيهات مهمة

### 1. البريد المسجل مسبقاً

إذا ظهر `Email already registered`:
- ✅ **هذا صحيح!**
- استخدم **"تسجيل الدخول"** بدلاً من "تسجيل جديد"

---

### 2. بيانات دخول خاطئة

إذا ظهر `Invalid login credentials`:
- تأكد من البريد: `user@kku.edu.sa`
- تأكد من كلمة المرور
- أو سجل حساب جديد

---

## 🧪 اختبار سريع

```bash
# بعد النشر، اختبر:
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health
```

**المتوقع:**
```json
{
  "status": "healthy",
  "database": true
}
```

---

## 📋 قائمة التحقق

- [ ] نفذت `⚡_DEPLOY_NOW.sh`
- [ ] طبقت `database_schema.sql`
- [ ] اختبرت health endpoint (200 OK)
- [ ] شغلت `npm run dev`
- [ ] فتحت http://localhost:5173

---

## 💡 نصائح

1. **Service Role Key**: احفظه في مكان آمن
2. **انتظر 5 ثوانٍ** بعد النشر
3. **راجع Logs** إذا ظهرت مشاكل

---

<div align="center">

## ✅ جاهز!

```bash
./⚡_DEPLOY_NOW.sh
```

**ثم:**

```bash
npm run dev
```

---

**للتفاصيل:** `🚨_EDGE_FUNCTION_NOT_DEPLOYED.md`

</div>
