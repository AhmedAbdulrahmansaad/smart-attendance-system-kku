# ✅ Fixed Foreign Key Error in Courses Table

## 🎯 Original Problem

```
❌ [createCourse] Supabase error: {
  "code": "23503",
  "details": "Key (instructor_id)=(aae004f8-2c6f-45ac-8578-379332dcb06b) is not present in table \"users\".",
  "hint": null,
  "message": "insert or update on table \"courses\" violates foreign key constraint \"courses_instructor_id_fkey\""
}
```

## 🔍 Root Cause

The `courses` table has a Foreign Key pointing to the `users` table:

```sql
-- ❌ Wrong
ALTER TABLE courses 
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES users(id);
```

But the system uses the `profiles` table, not `users`:

| Wrong Table | Correct Table |
|-------------|---------------|
| `users` ❌ | `profiles` ✅ |

## 🔧 Solution Applied

### File: `/🔥_FIX_COURSES_FOREIGN_KEY.sql`

This script:

1. ✅ **Drops old Foreign Key**
   - Removes `courses_instructor_id_fkey` that points to `users`
   - Removes any other Foreign Keys related to `instructor_id`

2. ✅ **Creates new Foreign Key**
   - Creates `courses_instructor_id_fkey_profiles`
   - Points to `profiles(id)` instead of `users(id)`
   - Uses `ON DELETE SET NULL` (if instructor is deleted, instructor_id becomes NULL)

3. ✅ **Fixes other tables**
   - Fixes `sessions` table (if exists)
   - Fixes `live_sessions` table (if exists)

## 📊 Correct Structure

### Before Fix:
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  course_name TEXT,
  course_code TEXT,
  instructor_id UUID REFERENCES users(id), -- ❌ Wrong
  ...
);
```

### After Fix:
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  course_name TEXT,
  course_code TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- ✅ Correct
  ...
);
```

## 🚀 How to Apply

### Method 1: Apply SQL Script (Recommended)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy contents of `/🔥_FIX_COURSES_FOREIGN_KEY.sql`
4. Paste in SQL Editor
5. Click **Run**
6. You'll see confirmation messages:
   ```
   ✅ Dropped old foreign key: courses_instructor_id_fkey
   ✅ Created new foreign key: courses_instructor_id_fkey_profiles → profiles(id)
   ```

### Method 2: Manual Application (Alternative)

If you want to apply the fix manually:

```sql
-- 1. Drop old Foreign Key
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

-- 2. Create new Foreign Key
ALTER TABLE courses 
ADD CONSTRAINT courses_instructor_id_fkey_profiles 
FOREIGN KEY (instructor_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- 3. Verify
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'courses' 
  AND constraint_type = 'FOREIGN KEY';
```

## ✅ Final Result

After the fix, you can now:

1. ✅ **Add new courses** without errors
2. ✅ **Link courses to instructors** from `profiles` table
3. ✅ **Delete instructors** safely (instructor_id becomes NULL automatically)

### Example - Adding a Course:

```typescript
// In course creation interface
const result = await supabase
  .from('courses')
  .insert({
    course_code: 'CS101',
    course_name: 'Introduction to Programming',
    instructor_id: 'aae004f8-2c6f-45ac-8578-379332dcb06b', // from profiles table
    semester: 'Fall 2024',
    academic_year: '2024-2025'
  });

// ✅ Works now without errors!
```

## 🔍 How to Verify

### 1. In SQL Editor:

```sql
-- Show Foreign Keys in courses table
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'courses' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'instructor_id';
```

**Expected Result:**
```
constraint_name                         | column_name   | references_table | references_column
----------------------------------------|---------------|------------------|------------------
courses_instructor_id_fkey_profiles     | instructor_id | profiles         | id
```

### 2. In Browser Console:

**Before Fix:**
```
❌ [createCourse] Supabase error: violates foreign key constraint "courses_instructor_id_fkey"
```

**After Fix:**
```
✅ [createCourse] Course created successfully!
```

## 📝 Additional Notes

### Why `ON DELETE SET NULL`?

When deleting an instructor from `profiles` table:
- ✅ `ON DELETE SET NULL`: Courses remain, but `instructor_id` becomes `NULL`
- ❌ `ON DELETE CASCADE`: Courses are deleted automatically (dangerous!)
- ❌ `ON DELETE RESTRICT`: Cannot delete instructor if they have courses (annoying!)

### What about the `users` table?

The `users` table is Supabase Auth's internal table. The `profiles` table is our custom table for application users.

**Correct Structure:**
```
auth.users (Supabase Auth) ← Don't use directly
     ↓
public.profiles (Our custom table) ← Use this
     ↑
courses.instructor_id → profiles.id
```

### Other Tables Fixed

The script also fixes:
- ✅ `sessions.instructor_id → profiles(id)`
- ✅ `live_sessions.instructor_id → profiles(id)`

## 🎊 Ready Now!

After applying the script:
- ✅ You can add courses without errors
- ✅ All Foreign Keys point to `profiles`
- ✅ System is consistent and safe

---

## 📚 Related Files

- 📄 `/🔥_FIX_COURSES_FOREIGN_KEY.sql` - Fix script
- 📄 `/database_schema.sql` - Correct table structure
- 📄 `/DATABASE_READY_TO_EXECUTE.sql` - All tables

---

## ⚠️ Important Warning

**Do NOT create a `users` table manually!**

Supabase creates `auth.users` automatically. Use the `profiles` table to store additional user data.

```sql
-- ✅ Correct
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT,
  ...
);

-- ✅ Correct
CREATE TABLE courses (
  instructor_id UUID REFERENCES profiles(id)
);

-- ❌ Wrong
CREATE TABLE courses (
  instructor_id UUID REFERENCES users(id) -- users doesn't exist in public schema
);
```
