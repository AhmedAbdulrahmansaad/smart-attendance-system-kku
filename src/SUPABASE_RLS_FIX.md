# إصلاح مشكلة Infinite Recursion في RLS Policies

## المشكلة
تحدث رسالة الخطأ: `infinite recursion detected in policy for relation 'users'`

هذا يحدث بسبب وجود RLS Policies معقدة تحاول الوصول لجدول `users` من داخل policy على نفس الجدول.

## الحل

### الخطوة 1: الدخول إلى Supabase Dashboard
1. اذهب إلى: https://supabase.com/dashboard
2. افتح مشروعك: `pcymgqdjbdklrikdquih`

### الخطوة 2: تعديل RLS Policies

#### طريقة 1: تعطيل RLS مؤقتاً (للتطوير فقط)
```sql
-- في SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
```

#### طريقة 2: تبسيط RLS Policies (مُوصى بها)
```sql
-- حذف جميع Policies الموجودة على جدول users
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- إنشاء Policies بسيطة وآمنة
CREATE POLICY "Enable read access for authenticated users" 
ON users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for service role only" 
ON users FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Enable update for users based on auth_id" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = auth_id);

-- Policies بسيطة لجدول schedules
DROP POLICY IF EXISTS ALL ON schedules;

CREATE POLICY "Enable read access for all authenticated users" 
ON schedules FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable all access for service role" 
ON schedules FOR ALL 
TO service_role 
USING (true);
```

### الخطوة 3: التحقق من الحل
بعد تطبيق الحل، جرّب إضافة جدول دراسي مرة أخرى.

## ملاحظات مهمة

### ⚠️ الأمان
- نحن نستخدم Service Role Key في Backend، والذي يتجاوز RLS Policies
- Frontend لا يستخدم Supabase client مباشرة للكتابة، فقط للقراءة
- جميع عمليات الكتابة تتم عبر Backend API المحمي

### 🔍 كيف تعرف أن المشكلة محلولة؟
- يجب أن تتمكن من إضافة جداول دراسية بدون أخطاء
- يجب أن تتمكن من تسجيل طلاب في المقررات بدون مشاكل
- لن تظهر رسالة "infinite recursion"

### 📝 للمزيد من المساعدة
راجع وثائق Supabase حول RLS:
https://supabase.com/docs/guides/auth/row-level-security
