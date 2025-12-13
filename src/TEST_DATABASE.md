# 🧪 اختبار قاعدة البيانات - Database Test

<div dir="rtl">

## ✅ **اختبار سريع للتأكد من أن كل شيء يعمل**

---

## **الخطوة 1: اختبر الاتصال بـ Supabase**

### افتح Console في المتصفح (F12) واكتب:

```javascript
// 1. اختبر اتصال Supabase
const testConnection = async () => {
  const { data, error } = await supabase.from('profiles').select('count');
  if (error) {
    console.error('❌ خطأ في الاتصال:', error);
  } else {
    console.log('✅ الاتصال يعمل!', data);
  }
};
testConnection();
```

---

## **الخطوة 2: اختبر جدول courses**

```javascript
// 2. اختبر جدول courses
const testCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ خطأ في جدول courses:', error);
    console.log('💡 نفذ DATABASE_SETUP.sql في Supabase!');
  } else {
    console.log('✅ جدول courses يعمل!');
    console.log('البيانات:', data);
  }
};
testCourses();
```

---

## **الخطوة 3: اختبر الأعمدة**

```javascript
// 3. تحقق من وجود عمودي semester و year
const testColumns = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name, course_code, semester, year')
      .limit(1);
      
    if (error) {
      console.error('❌ الأعمدة غير موجودة!', error);
      console.log('');
      console.log('🔧 الحل:');
      console.log('1. افتح Supabase Dashboard');
      console.log('2. اذهب إلى SQL Editor');
      console.log('3. نفذ ملف DATABASE_SETUP.sql');
      console.log('');
    } else {
      console.log('✅ جميع الأعمدة موجودة!');
      console.log('✅ semester:', data[0]?.semester || 'فارغ');
      console.log('✅ year:', data[0]?.year || 'فارغ');
    }
  } catch (e) {
    console.error('❌ خطأ:', e);
  }
};
testColumns();
```

---

## **الخطوة 4: اختبر إضافة مقرر**

```javascript
// 4. جرب إضافة مقرر تجريبي
const testAddCourse = async () => {
  const testCourse = {
    course_name: 'Test Course',
    course_code: 'TEST101',
    instructor_id: null,
    semester: 'Fall',
    year: '2024'
  };
  
  const { data, error } = await supabase
    .from('courses')
    .insert(testCourse)
    .select()
    .single();
    
  if (error) {
    console.error('❌ فشل إضافة المقرر:', error);
    console.log('رسالة الخطأ:', error.message);
    console.log('التفاصيل:', error.details);
    console.log('التلميح:', error.hint);
  } else {
    console.log('✅ تم إضافة المقرر بنجاح!');
    console.log('البيانات:', data);
    
    // احذف المقرر التجريبي
    await supabase.from('courses').delete().eq('id', data.id);
    console.log('✅ تم حذف المقرر التجريبي');
  }
};
testAddCourse();
```

---

## **الخطوة 5: اختبار شامل**

```javascript
// 5. اختبار شامل لجميع الجداول
const fullTest = async () => {
  console.log('🧪 بدء الاختبار الشامل...');
  console.log('');
  
  const tables = ['profiles', 'courses', 'enrollments', 'sessions', 'attendance'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);
      
    if (error) {
      console.error(`❌ ${table}: خطأ`);
      console.log('   ', error.message);
    } else {
      console.log(`✅ ${table}: يعمل`);
    }
  }
  
  console.log('');
  console.log('✅ انتهى الاختبار!');
};
fullTest();
```

---

## **الخطوة 6: اختبر الـ Indexes**

```sql
-- نفذ في SQL Editor لفحص الـ Indexes:
SELECT 
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**النتيجة المتوقعة:**
```
profiles     | 4
courses      | 4
enrollments  | 5
sessions     | 8
attendance   | 8
```

---

## **الخطوة 7: اختبر RLS**

```sql
-- نفذ في SQL Editor:
SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**النتيجة المتوقعة:**
```
profiles     | 3
courses      | 4
enrollments  | 3
sessions     | 4
attendance   | 4
```

---

## **🚨 إذا ظهر خطأ "Could not find 'year' column":**

### **السبب:**
```
جدول courses لا يحتوي على عمود year!
```

### **الحل:**
```
1. ✅ افتح Supabase Dashboard
2. ✅ اذهب إلى SQL Editor
3. ✅ انسخ كل محتوى DATABASE_SETUP.sql
4. ✅ الصقه في Query Editor
5. ✅ اضغط Run
6. ✅ انتظر "Success" ✅
7. ✅ أعد تحميل التطبيق (Ctrl+F5)
```

---

## **🚨 إذا ظهر خطأ "permission denied":**

### **السبب:**
```
RLS يمنع العملية
```

### **الحل:**
```sql
-- نفذ في SQL Editor:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL@kku.edu.sa';
```

---

## **🚨 إذا ظهر خطأ "duplicate key value":**

### **السبب:**
```
الكود موجود مسبقاً
```

### **الحل:**
```
هذا طبيعي! الكود يجب أن يكون فريد.
جرب إنشاء جلسة أخرى، سيتم توليد كود جديد.
```

---

## **✅ التحقق النهائي:**

### **في Console، يجب أن ترى:**

```
✅ [CourseManagement] Loaded X courses
✅ [SessionManagement] Loaded X sessions
✅ [useStudentData] Loaded X courses
✅ [AuthContext] User loaded
```

### **لا يجب أن ترى:**

```
❌ Could not find 'year' column
❌ EDGE_FUNCTION_NOT_DEPLOYED
❌ permission denied
❌ null value in column
```

---

## **🎯 النتيجة المثالية:**

```javascript
// عند تشغيل fullTest()، يجب أن ترى:

🧪 بدء الاختبار الشامل...

✅ profiles: يعمل
✅ courses: يعمل
✅ enrollments: يعمل
✅ sessions: يعمل
✅ attendance: يعمل

✅ انتهى الاختبار!
```

---

</div>

## 🎊 **إذا رأيت كل ✅، فالنظام جاهز 100%!** 🎊

---

**💚 KKU Smart Attendance System - Database Testing 💚**
