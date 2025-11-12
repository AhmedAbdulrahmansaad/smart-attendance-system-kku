# 🔒 تذكير أمني - Security Reminder

<div align="center">

# ⚠️ مهم جداً! Important!

**اقرأ هذا قبل رفع المشروع على GitHub**

</div>

---

## 🚨 تحذير: مفاتيح Supabase موجودة في الكود!

حالياً، مفاتيح Supabase الحقيقية موجودة في:

```
📁 /config/supabase.config.ts
```

**هذا جيد للاختبار في Figma Make**  
**لكن خطير جداً للرفع على GitHub!**

---

## ⛔ قبل رفع على GitHub: احذف المفاتيح!

### الخطوات الضرورية:

```
1. افتح الملف: /config/supabase.config.ts

2. استبدل المفاتيح الحقيقية بالقيم الافتراضية:

   من:
   SUPABASE_URL: 'https://pcymgqdjbdklrikdquih.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGci...',

   إلى:
   SUPABASE_URL: 'https://your-project-id.supabase.co',
   SUPABASE_ANON_KEY: 'your-anon-public-key-here',

3. احفظ الملف

4. الآن يمكنك رفع المشروع على GitHub بأمان
```

---

## ✅ للنشر على Vercel (الطريقة الآمنة)

بدلاً من وضع المفاتيح في الكود، استخدم Environment Variables:

```
1. ارفع المشروع على GitHub (بعد حذف المفاتيح من الكود)

2. اذهب إلى Vercel Dashboard

3. Settings → Environment Variables

4. أضف المتغيرات:
   
   Name: VITE_SUPABASE_URL
   Value: https://pcymgqdjbdklrikdquih.supabase.co
   Environment: Production, Preview, Development
   [Add]

   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Environment: Production, Preview, Development
   [Add]

5. Deploy المشروع

6. الآن المفاتيح محفوظة بشكل آمن في Vercel!
```

---

## 🎯 الطرق الثلاثة للتكوين

### 1️⃣ للاختبار في Figma Make:

```
✅ ضع المفاتيح في /config/supabase.config.ts
❌ لا ترفع على GitHub بعد ذلك
```

---

### 2️⃣ للتطوير المحلي:

```
✅ ضع المفاتيح في .env.local
✅ .env.local محمي في .gitignore
✅ آمن للرفع على GitHub
```

---

### 3️⃣ للنشر على Vercel:

```
✅ استخدم Vercel Environment Variables
✅ لا مفاتيح في الكود
✅ آمن 100%
```

---

## ❓ لماذا هذا مهم؟

### إذا رفعت المفاتيح على GitHub:

```
❌ أي شخص يمكنه رؤية قاعدة بياناتك
❌ يمكن حذف أو تعديل البيانات
❌ استخدام غير مصرح به
❌ فاتورة غير متوقعة (إذا تجاوزت الحد المجاني)
❌ مشاكل أمنية خطيرة
```

---

## ✅ Checklist قبل GitHub

```
☐ فتحت /config/supabase.config.ts
☐ حذفت المفاتيح الحقيقية
☐ أعدت القيم الافتراضية
☐ حفظت الملف
☐ اختبرت أن المشروع لا يعمل بعد الحذف (طبيعي!)
☐ الآن يمكن رفع GitHub بأمان
```

---

## ✅ Checklist قبل Vercel

```
☐ رفعت المشروع على GitHub (بدون مفاتيح)
☐ فتحت Vercel Dashboard
☐ أضفت VITE_SUPABASE_URL في Environment Variables
☐ أضفت VITE_SUPABASE_ANON_KEY في Environment Variables
☐ ضبطت Environment على All
☐ Deploy المشروع
☐ المشروع يعمل على Vercel بنجاح
```

---

## 🔐 المفاتيح الحالية (احفظها!)

للرجوع إليها عند الحاجة:

```
Project URL:
https://pcymgqdjbdklrikdquih.supabase.co

Anon Public Key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ
```

**💡 نصيحة:** احفظ هذه المفاتيح في مكان آمن (ملف محلي على جهازك فقط)

---

## 📖 المزيد

- اقرأ `VERCEL_DEPLOYMENT.md` لدليل النشر الكامل
- اقرأ `.gitignore` لفهم الملفات المحمية
- اقرأ `START_HERE.md` للتعليمات العامة

---

<div align="center">

## ⚠️ تذكر دائماً

**لا تشارك المفاتيح**  
**لا ترفعها على GitHub**  
**استخدم Environment Variables للنشر**

---

**🔒 الأمان أولاً!**

</div>

---

**آخر تحديث:** 11 نوفمبر 2025
