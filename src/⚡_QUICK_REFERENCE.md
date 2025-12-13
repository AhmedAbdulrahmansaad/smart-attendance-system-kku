# ⚡ المرجع السريع - نظام الحضور الذكي

**آخر تحديث:** 11 ديسمبر 2025

---

## 🎯 أوامر سريعة (Copy & Paste)

### 🚀 بدء التشغيل (3 أوامر فقط)

```bash
# 1. امنح الصلاحيات
chmod +x *.sh

# 2. انشر Edge Function
./deploy-edge-function.sh

# 3. اختبر النظام
./test-complete-system.sh
```

---

### 🧪 الاختبار

```bash
# اختبار شامل
./test-complete-system.sh

# اختبار سريع
./test-url-fix.sh

# اختبار Edge Function
./test-edge-function.sh

# اختبار Stats
./test-stats-endpoint.sh
```

---

### 🔧 النشر

```bash
# نشر Edge Function فقط
./deploy-edge-function.sh

# نشر كامل (Frontend + Backend)
./deploy-complete.sh

# نشر على Vercel
vercel

# نشر على Netlify
netlify deploy --prod
```

---

## 📋 URLs المهمة

### Supabase
```
Project URL: https://pcymgqdjbdklrikdquih.supabase.co
Dashboard: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih
SQL Editor: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/editor
Functions: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/functions
```

### API Endpoints
```
Base URL: https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b

Health: /health
Stats Public: /stats/public
Stats Dashboard: /stats/dashboard
Login: /login
Signup: /signup
```

---

## 🔑 حسابات تجريبية

### مدير (Admin)
```
Email: admin@kku.edu.sa
University ID: 440123456
Name: عبدالله سعد
Role: Admin
```

### مدرس (Instructor)
```
Email: instructor@kku.edu.sa
University ID: 441234567
Name: محمد أحمد
Role: Instructor
```

### طالب (Student)
```
Email: student@kku.edu.sa
University ID: 442345678
Name: فاطمة علي
Role: Student
```

### مشرف (Supervisor)
```
Email: supervisor@kku.edu.sa
University ID: 443456789
Name: خالد محمد
Role: Supervisor
```

---

## 📊 SQL Queries سريعة

### عرض جميع المستخدمين
```sql
SELECT id, email, university_id, full_name, role 
FROM profiles 
ORDER BY created_at DESC;
```

### عرض الإحصائيات
```sql
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') as students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'instructor') as instructors,
  (SELECT COUNT(*) FROM courses) as courses,
  (SELECT COUNT(*) FROM sessions) as sessions;
```

### حذف جميع البيانات (للبدء من جديد)
```sql
-- ⚠️ احذر: هذا سيمسح جميع البيانات!
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE courses CASCADE;
DELETE FROM profiles WHERE email != 'your-admin@kku.edu.sa';
```

### إنشاء حساب مدير مباشرة
```sql
INSERT INTO profiles (id, email, university_id, full_name, role)
VALUES (
  gen_random_uuid(),
  'admin@kku.edu.sa',
  '440000000',
  'المدير العام',
  'admin'
);
```

---

## 🔍 فحص المشاكل

### في Terminal:

```bash
# فحص Supabase CLI
supabase --version

# فحص Edge Function
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health

# فحص Database
psql $SUPABASE_DB_URL -c "SELECT version();"
```

### في Browser (Console):

```javascript
// فحص Supabase Config
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);

// فحص Auth
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, error);

// فحص API
const response = await fetch('https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health');
const data = await response.json();
console.log('Health:', data);
```

---

## 🛠️ إصلاحات سريعة

### خطأ: Failed to fetch
```bash
# تحقق من URL في /utils/api.ts
# يجب أن يكون:
const BASE_URL = `https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b`;
```

### خطأ: 404 Not Found
```bash
# انشر Edge Function
./deploy-edge-function.sh
```

### خطأ: 500 Server Error
```sql
-- طبّق Database Schema في SQL Editor
-- انسخ من: DATABASE_READY_TO_EXECUTE.sql
```

### خطأ: CORS Error
```typescript
// تحقق من /supabase/functions/server/index.tsx
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
```

---

## 📁 ملفات مهمة

### Configuration
```
/utils/supabase/info.tsx          - Supabase config
/config/supabase.config.ts        - Extended config
/vercel.json                      - Vercel deployment
/supabase/config.toml             - Supabase local config
```

### Backend
```
/supabase/functions/server/index.tsx      - Main server
/supabase/functions/server/db.ts          - Database helpers
/supabase/functions/server/kv_store.tsx   - KV store (protected)
```

### Frontend
```
/App.tsx                          - Main component
/utils/api.ts                     - API client
/components/AuthContext.tsx       - Auth provider
/components/LanguageContext.tsx   - Language provider
```

### Database
```
/database_schema.sql              - Full schema (old)
/DATABASE_READY_TO_EXECUTE.sql    - Clean schema (use this)
/DATABASE_SETUP_CLEAN.sql         - Alternative clean schema
```

### Scripts
```
/deploy-edge-function.sh          - Deploy Edge Function
/deploy-complete.sh               - Deploy everything
/test-complete-system.sh          - Full system test
/test-edge-function.sh            - Test Edge Function
```

---

## 🎨 ألوان جامعة الملك خالد

```css
/* Primary - الأخضر الداكن */
--kku-green: #006747;

/* Secondary */
--kku-gold: #DAA520;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* RTL Support */
[dir="rtl"] { /* styles for Arabic */ }
[dir="ltr"] { /* styles for English */ }
```

---

## 🔐 Environment Variables

### Local Development (.env.local)
```bash
VITE_SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Vercel
```bash
# في Vercel Dashboard > Settings > Environment Variables
VITE_SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Supabase Edge Function
```bash
# تُعيّن تلقائياً من Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
```

---

## 🎥 Live Streaming (Jitsi)

### تفعيل جلسة مباشرة:

```javascript
// في المدرس Dashboard
const session = {
  course_id: 'course-uuid',
  session_type: 'live',
  scheduled_date: '2025-12-11',
  start_time: '10:00:00',
};

// Jitsi Config
const jitsiConfig = {
  roomName: `kku-${sessionCode}`,
  width: '100%',
  height: '600px',
  parentNode: document.querySelector('#jitsi-container'),
  configOverwrite: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
  },
};
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { /* sm */ }

/* Tablet */
@media (max-width: 768px) { /* md */ }

/* Desktop */
@media (max-width: 1024px) { /* lg */ }

/* Large Desktop */
@media (max-width: 1280px) { /* xl */ }
```

---

## 🌍 اللغات

### تبديل اللغة:

```typescript
// في أي مكون
const { language, setLanguage } = useLanguage();

// تغيير اللغة
setLanguage('ar'); // العربية
setLanguage('en'); // English
```

### إضافة ترجمات جديدة:

```typescript
// في /utils/i18n.ts
export const translations = {
  ar: {
    'new.key': 'النص بالعربية',
  },
  en: {
    'new.key': 'Text in English',
  },
};
```

---

## 🔔 الإشعارات

### استخدام Toast:

```typescript
import { toast } from 'sonner@2.0.3';

// Success
toast.success('تمت العملية بنجاح');

// Error
toast.error('حدث خطأ');

// Loading
toast.loading('جاري التحميل...');

// Custom
toast('رسالة مخصصة', {
  description: 'تفاصيل إضافية',
  duration: 5000,
});
```

---

## 🎯 نصائح سريعة

### للمطورين:

1. **استخدم TypeScript** - جميع الملفات `.tsx`
2. **اتبع التسمية** - `camelCase` للمتغيرات، `PascalCase` للمكونات
3. **اختبر في Console** - `F12` للتشخيص السريع
4. **راجع Logs** - في Supabase Dashboard > Functions > Logs

### للأداء:

1. **Lazy Loading** - المكونات الكبيرة محملة بـ `lazy()`
2. **Memoization** - استخدم `useMemo` و `useCallback`
3. **Debouncing** - للبحث والـ API calls
4. **Caching** - React Query للـ API responses

### للأمان:

1. **RLS Policies** - مفعّلة على جميع الجداول
2. **Service Role Key** - فقط في Backend
3. **Input Validation** - في Frontend و Backend
4. **Email Verification** - `@kku.edu.sa` فقط

---

## 📞 المساعدة السريعة

| المشكلة | الملف | السطر التقريبي |
|---------|------|----------------|
| Failed to fetch | `/utils/api.ts` | 6 |
| 404 Error | `/supabase/functions/server/index.tsx` | 70 |
| Auth Error | `/components/AuthContext.tsx` | 50 |
| Database Error | `/DATABASE_READY_TO_EXECUTE.sql` | 1 |
| CORS Error | `/supabase/functions/server/index.tsx` | 12 |
| Live Stream Error | `/components/LiveStreamHost.tsx` | 100 |

---

## ✅ قائمة التحقق السريعة

```
□ Database Schema مطبّق
□ Edge Function منشور
□ Environment Variables صحيحة
□ Supabase متصل
□ Health Check يعمل (200)
□ Stats يعمل (200)
□ Login يعمل
□ Dashboard يحمّل
□ Live Streaming يعمل
```

---

<div align="center">

## 🎓 نظام الحضور الذكي

**جامعة الملك خالد**

---

**📚 ملفات إضافية:**

`⚡_ابدأ_التشغيل_النهائي.md` • `TESTING_CHECKLIST.md` • `LIVE_STREAMING_GUIDE_AR.md`

**🚀 ابدأ الآن:** `./test-complete-system.sh`

</div>
