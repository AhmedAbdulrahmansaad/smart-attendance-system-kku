# 🎓 نظام الحضور الذكي - جامعة الملك خالد

<div align="center">

![KKU](https://img.shields.io/badge/KKU-King%20Khalid%20University-006747?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**نظام حضور ذكي متكامل مع بث مباشر للمحاضرات**

[العربية](#العربية) | [English](#english)

<img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop" alt="University" width="100%"/>

</div>

---

## العربية

### 📖 نظرة عامة

نظام الحضور الذكي هو تطبيق ويب كامل (Full-stack) مصمم خصيصاً لجامعة الملك خالد لتسهيل إدارة حضور الطلاب والبث المباشر للمحاضرات.

#### ✨ الميزات الرئيسية

- 🔐 **نظام مصادقة متقدم** - تسجيل دخول آمن ببريد KKU (@kku.edu.sa)
- 👥 **4 أدوار مختلفة** - طالب، مدرس، مشرف، مدير
- ✅ **تسجيل حضور ذكي** - أكواد فريدة مؤقتة لكل جلسة
- 🎥 **بث مباشر** - WebRTC للصوت والفيديو عبر Jitsi Meet
- 📊 **تقارير شاملة** - إحصائيات ورسوم بيانية تفاعلية
- 📱 **تصميم متجاوب** - يعمل على جميع الأجهزة
- 🌐 **دعم لغتين** - عربي وإنجليزي مع RTL/LTR
- 🔒 **أمان متقدم** - منع تسجيل دخول متزامن، التحقق من البصمة

---

### 🚀 البدء السريع

#### المتطلبات

- Node.js 18+ و npm/yarn
- حساب [Supabase](https://supabase.com) (مجاني)
- Git

#### التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/kku-smart-attendance.git
cd kku-smart-attendance

# 2. تثبيت المكتبات
npm install

# 3. إعداد Supabase
# انسخ ملف المثال وعدّله بمفاتيحك
cp config/supabase.config.example.ts config/supabase.config.ts
cp utils/supabase/info.example.tsx utils/supabase/info.tsx

# افتح الملفات وأضف مفاتيح Supabase الخاصة بك
# احصل على المفاتيح من: https://supabase.com/dashboard
# Settings → API → Project URL & anon key

# 4. تشغيل المشروع
npm run dev
```

افتح المتصفح على `http://localhost:5173`

#### إعداد قاعدة البيانات

راجع [دليل التحقق من قاعدة البيانات](/DATABASE_VERIFICATION_GUIDE.md) للحصول على إرشادات مفصلة.

---

### 🏗️ البنية التقنية

#### Frontend

```
React 18 + TypeScript
├── Vite (Build Tool)
├── TailwindCSS v4.0 (Styling)
├── shadcn/ui (UI Components)
├── React Query (Data Fetching)
├── Recharts (Charts)
└── Motion (Animations)
```

#### Backend

```
Supabase
├── PostgreSQL (Database)
├── Edge Functions (Hono.js)
├── Auth (JWT)
├── Storage (Files)
└── Realtime (WebSockets)
```

#### Live Streaming

```
Jitsi Meet API
├── WebRTC
├── Video/Audio
├── Screen Sharing
└── Chat
```

---

### 📁 هيكل المشروع

```
kku-smart-attendance/
├── components/           # مكونات React
│   ├── AdminDashboard.tsx
│   ├── InstructorDashboard.tsx
│   ├── StudentDashboard.tsx
│   ├── LiveStreamHost.tsx
│   ├── LiveStreamViewer.tsx
│   └── ui/              # مكونات UI
├── supabase/
│   └── functions/
│       └── server/      # Backend API
├── utils/               # دوال مساعدة
├── hooks/               # React Hooks
├── styles/              # ملفات CSS
└── config/              # إعدادات
```

---

### 👥 الأدوار والصلاحيات

| الدور | الصلاحيات |
|------|-----------|
| **👨‍💼 المدير (Admin)** | إدارة كاملة: المستخدمين، المواد، الجلسات، التقارير |
| **👨‍🏫 المدرس (Instructor)** | إدارة المواد، إنشاء جلسات، بث مباشر، تقارير |
| **👨‍🎓 الطالب (Student)** | تسجيل حضور، مشاهدة بث، عرض السجلات، الجدول |
| **👀 المشرف (Supervisor)** | مراقبة التقارير والإحصائيات فقط |

---

### 🎯 الميزات التفصيلية

#### 1. نظام الحضور الذكي

- **أكواد فريدة**: كل جلسة لها كود مكون من 6 أحرف
- **صلاحية محدودة**: الأكواد تنتهي بعد فترة محددة
- **تسجيل فوري**: الطالب يدخل الكود ويُسجل حضوره
- **منع التكرار**: لا يمكن تسجيل الحضور مرتين لنفس الجلسة

#### 2. البث المباشر

- **جودة عالية**: HD video/audio عبر WebRTC
- **تفاعلي**: محادثة نصية، رفع اليد
- **مشاركة الشاشة**: المدرس يمكنه مشاركة شاشته
- **تسجيل تلقائي**: الطلاب الذين ينضمون للبث يُسجل حضورهم تلقائياً
- **إشعارات**: تنبيه الطلاب عند بدء البث

#### 3. التقارير والإحصائيات

- **تقارير فردية**: لكل طالب
- **تقارير المواد**: نسبة الحضور لكل مادة
- **رسوم بيانية**: Charts تفاعلية (Line, Bar, Pie)
- **تصدير**: تحميل التقارير بصيغة PDF/Excel
- **فلترة متقدمة**: حسب التاريخ، المادة، الطالب

#### 4. إدارة المواد

- **إنشاء/تعديل/حذف** المواد
- **تعيين مدرسين** لكل مادة
- **تسجيل الطلاب** في المواد
- **جداول زمنية** لكل مادة

#### 5. الأمان

- **منع تسجيل دخول متزامن**: جلسة واحدة فقط لكل مستخدم
- **التحقق من البصمة**: Fingerprinting للتأكد من هوية الطالب
- **تشفير**: جميع البيانات مشفرة
- **صلاحيات محددة**: كل دور له صلاحيات خاصة

---

### 🌐 النشر

#### على Vercel (موصى به)

```bash
# 1. تثبيت Vercel CLI
npm i -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
vercel

# 4. إضافة Environment Variables في Vercel Dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

راجع [دليل النشر التفصيلي](/DEPLOYMENT_GUIDE_AR.md)

#### Supabase Edge Functions

```bash
# 1. تثبيت Supabase CLI
npm install -g supabase

# 2. تسجيل الدخول
supabase login

# 3. ربط المشروع
supabase link --project-ref YOUR_PROJECT_ID

# 4. نشر Functions
supabase functions deploy server
```

---

### 📊 قاعدة البيانات

النظام يستخدم **KV Store** (Key-Value) بسيط ومرن:

```typescript
// مثال: بيانات مستخدم
{
  key: "user:abc123",
  value: {
    id: "abc123",
    email: "student@kku.edu.sa",
    full_name: "أحمد محمد",
    role: "student",
    university_id: "441234567"
  }
}
```

**الجدول الوحيد المطلوب**: `kv_store_90ad488b`

راجع [دليل قاعدة البيانات](/DATABASE_VERIFICATION_GUIDE.md) للتفاصيل.

---

### 🧪 الاختبار

#### حسابات تجريبية

```javascript
// مدير
{
  email: "admin@kku.edu.sa",
  password: "Admin@123"
}

// مدرس
{
  email: "instructor@kku.edu.sa",
  password: "Instructor@123"
}

// طالب
{
  email: "student@kku.edu.sa",
  password: "Student@123",
  university_id: "441234567"
}
```

#### اختبار الميزات

1. ✅ تسجيل دخول لكل دور
2. ✅ إنشاء مادة (كمدرس)
3. ✅ تسجيل طالب في مادة (كمدير)
4. ✅ إنشاء جلسة حضور (كمدرس)
5. ✅ تسجيل حضور (كطالب)
6. ✅ بدء بث مباشر (كمدرس)
7. ✅ الانضمام للبث (كطالب)
8. ✅ عرض التقارير (جميع الأدوار)

---

### 🛠️ التطوير

#### تشغيل المشروع محلياً

```bash
npm run dev        # Frontend على localhost:5173
npm run build      # إنشاء نسخة الإنتاج
npm run preview    # معاينة نسخة الإنتاج
```

#### تشغيل Backend محلياً

```bash
supabase start
supabase functions serve server
```

---

### 📚 الوثائق

- 📖 [دليل الاستخدام الكامل](/README.md)
- 🗄️ [دليل قاعدة البيانات](/DATABASE_VERIFICATION_GUIDE.md)
- 🚀 [دليل رفع المشروع على GitHub](/GITHUB_SETUP_GUIDE.md)
- 🌐 [دليل النشر](/DEPLOYMENT_GUIDE_AR.md)
- 🎥 [دليل البث المباشر](/LIVE_STREAMING_GUIDE_AR.md)
- 🔧 [استكشاف الأخطاء](/TROUBLESHOOTING_AR.md)
- 🔒 [ميزات الأمان](/SECURITY_FEATURES.md)

---

### 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء Branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

### 📞 الدعم

**هل واجهت مشكلة؟**

1. 📖 راجع [دليل استكشاف الأخطاء](/TROUBLESHOOTING_AR.md)
2. 🔍 ابحث في [Issues](https://github.com/YOUR_USERNAME/kku-smart-attendance/issues)
3. 💬 افتح Issue جديد مع وصف تفصيلي للمشكلة

---

### 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

### 👨‍💻 فريق التطوير

#### أعضاء الفريق

- **أحمد علي** - Team Leader & Full-stack Developer
- **محمد سعيد** - Frontend Developer
- **عبدالله حسن** - Backend Developer
- **فاطمة خالد** - UI/UX Designer
- **سارة أحمد** - QA Tester

#### المشرفون الأكاديميون

- **د. عبدالرحمن محمد** - المشرف الرئيسي
- **د. خالد أحمد** - المشرف المشارك

---

### 🎯 الإصدارات

- **v2.0** (ديسمبر 2025) - إضافة البث المباشر، تحسينات الأمان
- **v1.5** (نوفمبر 2025) - نظام Real-time، تحسينات الأداء
- **v1.0** (أكتوبر 2025) - الإصدار الأول

---

### 🙏 شكر وتقدير

- [Supabase](https://supabase.com) - Backend Platform
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Jitsi Meet](https://jitsi.org) - Live Streaming
- [Tailwind CSS](https://tailwindcss.com) - Styling
- جامعة الملك خالد - الدعم والتوجيه

---

## English

### 📖 Overview

KKU Smart Attendance System is a full-stack web application designed specifically for King Khalid University to facilitate student attendance management and live lecture streaming.

#### ✨ Key Features

- 🔐 **Advanced Authentication** - Secure login with KKU email (@kku.edu.sa)
- 👥 **4 Different Roles** - Student, Instructor, Supervisor, Admin
- ✅ **Smart Attendance** - Unique temporary codes for each session
- 🎥 **Live Streaming** - WebRTC video/audio via Jitsi Meet
- 📊 **Comprehensive Reports** - Interactive statistics and charts
- 📱 **Responsive Design** - Works on all devices
- 🌐 **Bilingual Support** - Arabic and English with RTL/LTR
- 🔒 **Advanced Security** - Prevent concurrent login, fingerprint verification

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/kku-smart-attendance.git

# Install dependencies
npm install

# Setup Supabase keys in config files
cp config/supabase.config.example.ts config/supabase.config.ts

# Run development server
npm run dev
```

### 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS v4.0
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Live Streaming**: Jitsi Meet API (WebRTC)
- **State Management**: React Query
- **Charts**: Recharts
- **Animation**: Motion

### 📚 Documentation

- [Full User Guide](/README.md)
- [Database Guide](/DATABASE_VERIFICATION_GUIDE.md)
- [Deployment Guide](/DEPLOYMENT_GUIDE_AR.md)
- [GitHub Setup Guide](/GITHUB_SETUP_GUIDE.md)

---

<div align="center">

**Made with ❤️ for King Khalid University**

[![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/kku-smart-attendance?style=social)](https://github.com/YOUR_USERNAME/kku-smart-attendance)
[![GitHub Forks](https://img.shields.io/github/forks/YOUR_USERNAME/kku-smart-attendance?style=social)](https://github.com/YOUR_USERNAME/kku-smart-attendance)

</div>
