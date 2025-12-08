# 🤝 دليل المساهمة - Contributing Guide

<div align="center">

![Contributions](https://img.shields.io/badge/Contributions-Welcome-success?style=for-the-badge)

**نرحب بمساهماتك في تطوير نظام الحضور الذكي!**

</div>

---

## 📋 جدول المحتويات

1. [كيف تساهم؟](#-كيف-تساهم)
2. [معايير الكود](#-معايير-الكود)
3. [عملية Pull Request](#-عملية-pull-request)
4. [الإبلاغ عن الأخطاء](#-الإبلاغ-عن-الأخطاء)
5. [اقتراح ميزات جديدة](#-اقتراح-ميزات-جديدة)

---

## 🎯 كيف تساهم؟

### الطرق المختلفة للمساهمة:

1. **الإبلاغ عن Bugs** 🐛
2. **اقتراح ميزات جديدة** 💡
3. **تحسين التوثيق** 📚
4. **كتابة كود** 💻
5. **مراجعة Pull Requests** 👀
6. **تحسين التصميم** 🎨

كل المساهمات مُقدّرة ومُرحّب بها! ❤️

---

## 🛠️ البدء

### الخطوة 1: Fork المشروع

1. اذهب إلى صفحة المشروع على GitHub
2. اضغط زر **"Fork"** أعلى اليمين
3. سيتم نسخ المشروع لحسابك

### الخطوة 2: Clone المشروع

```bash
git clone https://github.com/YOUR_USERNAME/kku-smart-attendance.git
cd kku-smart-attendance
```

### الخطوة 3: إعداد البيئة المحلية

```bash
# تثبيت المكتبات
npm install

# إعداد Supabase
cp config/supabase.config.example.ts config/supabase.config.ts
# عدّل الملف وأضف مفاتيحك

# تشغيل محلياً
npm run dev
```

### الخطوة 4: إنشاء Branch جديد

```bash
git checkout -b feature/your-feature-name
# أو
git checkout -b fix/bug-description
```

---

## 📝 معايير الكود

### TypeScript

```typescript
// ✅ استخدم TypeScript بشكل صحيح
interface User {
  id: string;
  email: string;
  role: 'admin' | 'instructor' | 'student' | 'supervisor';
}

// ✅ استخدم Type Safety
function getUser(id: string): User | null {
  // ...
}

// ❌ تجنب any
function badFunction(data: any) { // لا!
  // ...
}
```

### React Components

```typescript
// ✅ Functional Components مع TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}

// ✅ استخدم Hooks بشكل صحيح
function MyComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Cleanup
    return () => {
      // ...
    };
  }, []);
  
  return <div>{count}</div>;
}
```

### Naming Conventions

```typescript
// ✅ Components: PascalCase
export function UserProfile() { }

// ✅ Functions: camelCase
function getUserData() { }

// ✅ Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// ✅ Files: kebab-case
// user-profile.tsx
// authentication-service.ts
```

### التعليقات

```typescript
// ✅ استخدم JSDoc للوظائف المعقدة
/**
 * يحسب نسبة الحضور للطالب في مادة معينة
 * @param studentId - معرّف الطالب
 * @param courseId - معرّف المادة
 * @returns نسبة الحضور (0-100)
 */
function calculateAttendancePercentage(
  studentId: string,
  courseId: string
): number {
  // ...
}

// ✅ تعليقات واضحة بالعربي أو الإنجليزي
// جلب بيانات الطالب من قاعدة البيانات
const student = await fetchStudent(id);
```

---

## 🎨 معايير التصميم

### Tailwind CSS

```typescript
// ✅ استخدم Tailwind بشكل semantic
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  {/* ... */}
</div>

// ❌ تجنب inline styles إلا للضرورة
<div style={{ color: 'red' }}> {/* تجنب */}

// ✅ استخدم Theme من globals.css
<h1 className="text-kku-primary">  {/* ألوان الجامعة */}
```

### Responsive Design

```typescript
// ✅ استخدم Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* ... */}
</div>
```

### RTL Support

```typescript
// ✅ تأكد من دعم RTL
<div className="rtl:text-right ltr:text-left">
  {/* ... */}
</div>
```

---

## 🔄 عملية Pull Request

### 1. قبل إرسال PR

```bash
# ✅ تأكد من عمل الكود
npm run dev

# ✅ اختبر جميع الميزات
# - التسجيل/الدخول
# - الـ Dashboard
# - إنشاء/تعديل البيانات

# ✅ تأكد من عدم وجود أخطاء في Console
```

### 2. Commit Message

```bash
# ✅ استخدم رسائل واضحة
git commit -m "✨ feat: إضافة ميزة البث المباشر للطلاب"
git commit -m "🐛 fix: إصلاح خطأ في حساب نسبة الحضور"
git commit -m "📚 docs: تحديث دليل الاستخدام"
git commit -m "♻️ refactor: تحسين أداء Dashboard"
git commit -m "💄 style: تحديث ألوان الواجهة"

# استخدم Emojis (اختياري):
# ✨ feat - ميزة جديدة
# 🐛 fix - إصلاح خطأ
# 📚 docs - توثيق
# ♻️ refactor - تحسين الكود
# 💄 style - تصميم
# ⚡ perf - تحسين أداء
# ✅ test - اختبارات
# 🔒 security - أمان
```

### 3. Push و Create PR

```bash
# Push للـ branch
git push origin feature/your-feature-name

# اذهب إلى GitHub
# اضغط "Compare & pull request"
# املأ المعلومات:
```

**PR Template:**

```markdown
## الوصف
وصف مختصر للتغييرات

## نوع التغيير
- [ ] ميزة جديدة (feature)
- [ ] إصلاح خطأ (bug fix)
- [ ] تحسين أداء (performance)
- [ ] توثيق (documentation)
- [ ] تصميم (UI/UX)

## التغييرات
- تم إضافة...
- تم إصلاح...
- تم تحسين...

## Screenshots (إن وُجدت)
![screenshot](url)

## الاختبار
- [x] اختبرت محلياً
- [x] لا توجد أخطاء في Console
- [x] يعمل على الموبايل
- [x] RTL/LTR صحيح

## Checklist
- [x] الكود يتبع معايير المشروع
- [x] التعليقات واضحة
- [x] التوثيق محدّث (إن لزم)
- [x] لا توجد أخطاء
```

### 4. المراجعة

- انتظر مراجعة الكود من maintainers
- قد يُطلب منك إجراء تعديلات
- كن مستعداً للنقاش البناء
- بعد الموافقة، سيتم دمج PR

---

## 🐛 الإبلاغ عن الأخطاء

### استخدم GitHub Issues

1. اذهب إلى **Issues** → **New issue**
2. اختر **Bug Report**
3. املأ النموذج:

```markdown
## وصف المشكلة
وصف واضح ومختصر للمشكلة

## خطوات إعادة المشكلة
1. اذهب إلى '...'
2. اضغط على '...'
3. المشكلة تظهر

## السلوك المتوقع
ماذا كان يجب أن يحدث؟

## السلوك الفعلي
ماذا حدث فعلاً؟

## Screenshots
إن أمكن، أضف صور

## البيئة
- المتصفح: Chrome 120
- نظام التشغيل: Windows 11
- الجهاز: Desktop/Mobile

## معلومات إضافية
أي معلومات أخرى قد تساعد
```

---

## 💡 اقتراح ميزات جديدة

### استخدم GitHub Discussions أو Issues

```markdown
## الميزة المقترحة
وصف الميزة

## المشكلة التي تحلها
لماذا نحتاج هذه الميزة؟

## الحل المقترح
كيف يمكن تنفيذها؟

## البدائل
هل هناك بدائل؟

## معلومات إضافية
تفاصيل، mockups، إلخ
```

---

## 🏗️ هيكل المشروع

```
kku-smart-attendance/
├── components/           # React Components
│   ├── AdminDashboard.tsx
│   ├── InstructorDashboard.tsx
│   ├── StudentDashboard.tsx
│   └── ui/              # UI Components
├── utils/               # Helper functions
│   ├── api.ts
│   ├── i18n.ts
│   └── supabaseClient.ts
├── hooks/               # Custom React Hooks
│   ├── useAdminData.ts
│   ├── useInstructorData.ts
│   └── useStudentData.ts
├── supabase/
│   └── functions/       # Edge Functions (Backend)
│       └── server/
├── styles/
│   └── globals.css      # Global styles
├── config/              # Configuration
│   └── supabase.config.ts
└── public/              # Static files
```

---

## 🧪 الاختبار

### اختبار يدوي

قبل إرسال PR، اختبر:

```bash
✅ تسجيل مستخدم جديد
✅ تسجيل دخول
✅ جميع الـ Dashboards (Admin, Instructor, Student)
✅ إنشاء/تعديل/حذف البيانات
✅ البث المباشر (إن أمكن)
✅ تبديل اللغة
✅ Responsive على الموبايل
✅ RTL/LTR
```

### اختبار في المتصفح

```bash
✅ Chrome
✅ Firefox
✅ Safari (إن أمكن)
✅ Mobile browsers
```

---

## 📚 الموارد المفيدة

### التوثيق الرسمي

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)

### أدلة المشروع

- [START_HERE_AR.md](START_HERE_AR.md)
- [README.md](README.md)
- [DATABASE_SETUP.md](DATABASE_SETUP.md)
- [SECURITY_FEATURES.md](SECURITY_FEATURES.md)

---

## ❓ الأسئلة الشائعة

### س: هل يمكنني المساهمة بدون خبرة كبيرة؟

**ج**: نعم! يمكنك البدء بـ:
- تحسين التوثيق
- الإبلاغ عن bugs
- اقتراح تحسينات في UI/UX
- ترجمة Strings

### س: كم من الوقت يستغرق مراجعة PR؟

**ج**: عادة 1-3 أيام. كن صبوراً!

### س: ماذا لو رُفض PR الخاص بي؟

**ج**: لا تقلق! سنوضح السبب. يمكنك تحسينه وإعادة إرساله.

### س: هل يمكنني العمل على ميزة كبيرة؟

**ج**: نعم، لكن:
1. افتح Issue أولاً لمناقشة الفكرة
2. احصل على موافقة من maintainers
3. قسّمها إلى PRs صغيرة

---

## 🙏 شكر خاص

شكراً لجميع المساهمين في تطوير نظام الحضور الذكي! ❤️

كل مساهمة، مهما كانت صغيرة، تُحدث فرقاً.

---

## 📞 التواصل

- **GitHub Issues**: للـ bugs والميزات
- **GitHub Discussions**: للأسئلة والنقاشات
- **Email**: [contact@example.com] (إن وُجد)

---

<div align="center">

## 🎉 شكراً لمساهمتك!

**معاً نبني نظام حضور أفضل لجامعة الملك خالد**

![Contributors](https://img.shields.io/badge/Contributors-Welcome-success?style=for-the-badge)

</div>

---

**آخر تحديث**: 5 ديسمبر 2025  
**الإصدار**: 3.0
