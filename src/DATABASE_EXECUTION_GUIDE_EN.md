# 🎯 Database Execution Guide - Smart Attendance System

## ✅ Step 1: Verify Supabase Connection

Your project is already connected to Supabase database:

```
Project URL: https://pcymgqdjbdklrikdquih.supabase.co
Status: ✅ Connected
```

---

## 📋 Step 2: Execute SQL Code in Database

### Method 1: Using Supabase Dashboard (Recommended) ⭐

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih

2. **Open SQL Editor**
   - From sidebar, click **"SQL Editor"**
   - Or go directly to: https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih/sql/new

3. **Copy SQL Code**
   - Open file: `COMPLETE_DATABASE_SETUP.sql`
   - Copy **all** content (Ctrl+A then Ctrl+C)

4. **Paste Code in SQL Editor**
   - Paste the complete code into the editor

5. **Execute the Code**
   - Click **"Run"** button or press (Ctrl+Enter)
   - Wait for "Success" message ✅

6. **Verify Result**
   - Success message should appear
   - If any errors appear, read the next step

---

### Method 2: Using Supabase CLI

If you're using Command Line:

```bash
# 1. Login to Supabase
supabase login

# 2. Link your project
supabase link --project-ref pcymgqdjbdklrikdquih

# 3. Execute SQL
supabase db execute --file COMPLETE_DATABASE_SETUP.sql
```

---

## 🔍 Step 3: Verify Tables Creation

After executing the code, verify tables are created:

### From Supabase Dashboard:

1. Go to **"Table Editor"** from sidebar
2. You should see these tables:

   ✅ **profiles** - User information  
   ✅ **courses** - Academic courses  
   ✅ **enrollments** - Student enrollments  
   ✅ **sessions** - Attendance & live sessions  
   ✅ **attendance** - Attendance records  
   ✅ **schedules** - Lecture schedules  

### Or use SQL Query to verify:

```sql
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check table count (should be 6)
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 👤 Step 4: Create First Admin User

### From Supabase Dashboard:

1. Go to **"Authentication"** > **"Users"**
2. Click **"Add user"** > **"Create new user"**
3. Fill in:
   ```
   Email: admin@kku.edu.sa
   Password: [Choose a strong password]
   Auto Confirm Email: ✅ [Enable this]
   ```
4. Click **"Create user"**

5. **Important**: After creating user, get their UUID:
   - From Users list, copy the `id` (UUID) of the user you created

6. Then execute this SQL to add Profile data:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role) 
   VALUES 
     ('UUID-here', 'admin@kku.edu.sa', 'System Admin', 'admin');
   ```
   **Replace `UUID-here` with the UUID you copied**

---

## 🧪 Step 5: Test Connection

### From Browser:

1. Open project in browser
2. Login page should appear
3. Login with:
   ```
   Email: admin@kku.edu.sa
   Password: [Password you created]
   ```

4. If login succeeds, you should see:
   - ✅ Admin Dashboard
   - ✅ Sidebar menus
   - ✅ Ability to add users and courses

---

## 🔧 Step 6 (Optional): Add Sample Data

If you want to test the system with sample data, execute this SQL:

### 1. Create Instructor:

```sql
-- First: Create user from Authentication > Users in Dashboard
-- Then execute:
INSERT INTO public.profiles (id, email, full_name, role, university_id) 
VALUES 
  ('instructor-UUID', 'instructor@kku.edu.sa', 'Dr. Ahmed Ali', 'instructor', 'INS001');
```

### 2. Create Students:

```sql
-- First: Create users from Authentication > Users
-- Then execute:
INSERT INTO public.profiles (id, email, full_name, role, university_id) 
VALUES 
  ('student1-UUID', '441234567@kku.edu.sa', 'Mohammed Hassan', 'student', '441234567'),
  ('student2-UUID', '441234568@kku.edu.sa', 'Fatimah Salem', 'student', '441234568');
```

### 3. Create Course:

```sql
INSERT INTO public.courses (course_code, course_name, instructor_id, semester, year) 
VALUES 
  ('CS101', 'Introduction to Computer Science', 'instructor-UUID', 'Fall', 2025);
```

### 4. Enroll Students:

```sql
-- First get course_id from courses table
INSERT INTO public.enrollments (student_id, course_id, status) 
VALUES 
  ('student1-UUID', 'course-UUID', 'active'),
  ('student2-UUID', 'course-UUID', 'active');
```

---

## ⚠️ Common Issues & Solutions

### Issue: "relation already exists"

**Solution**: Tables already exist. Either:
- Delete old tables from Table Editor
- Or use CLEANUP section code in SQL file

### Issue: "permission denied"

**Solution**: Make sure you're logged in as Admin in Supabase Dashboard

### Issue: "RLS policy violation"

**Solution**: 
1. Ensure RLS is enabled on all tables
2. Ensure all Policies in SQL file are applied

### Issue: "trigger already exists"

**Solution**: Execute this code first to drop old triggers:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
```
Then execute the complete code again.

---

## 📊 Final Verification

Execute these queries to verify everything works:

```sql
-- 1. Table count (should be 6)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Index count (should be > 20)
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';

-- 3. RLS Policies count (should be > 20)
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';

-- 4. Triggers count (should be 3)
SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';

-- 5. User count by role
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role;
```

---

## 🎉 Setup Complete!

If all steps succeeded, your system is now:

✅ Connected to database  
✅ Tables created successfully  
✅ RLS Policies enabled  
✅ Triggers ready  
✅ Ready for production use  

---

## 📚 Next Steps

1. **Start Using the System**:
   - Login as Admin
   - Create new users (instructors and students)
   - Create courses
   - Test attendance and live streaming features

2. **Review Documentation**:
   - `QUICK_START.md` - Quick Start Guide
   - `DATABASE_VERIFICATION_GUIDE.md` - Database Verification Guide
   - `TROUBLESHOOTING.md` - Troubleshooting Guide

3. **Deploy to Production**:
   - Review `DEPLOYMENT_GUIDE.md`
   - Or `VERCEL_DEPLOYMENT.md` for Vercel deployment

---

## 📞 Support

If you face any issues:

1. Review `TROUBLESHOOTING.md`
2. Check Browser Console (F12)
3. Review Logs in Supabase Dashboard

---

**Created: December 2025**  
**King Khalid University - Smart Attendance System** 🎓
