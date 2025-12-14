# 🚀 Quick Deploy Guide - Edge Function

## ✅ Complete Edge Function Created!

```
✅ File: /supabase/functions/server/index.tsx
✅ 20+ Endpoints Ready
✅ Connected to Database
✅ Production Ready
```

---

## 🎯 Quick Deploy (3 Steps)

### Step 1: Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login & Link Project

```bash
# Login
supabase login

# Link to your project
supabase link --project-ref pcymgqdjbdklrikdquih
```

### Step 3: Deploy!

```bash
supabase functions deploy server --no-verify-jwt
```

---

## ✅ Verify Deployment

```bash
curl https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": true,
  "message": "Backend is running correctly"
}
```

---

## 📊 Available Endpoints

### Authentication
- `POST /make-server-90ad488b/signup` - Sign up
- `GET /make-server-90ad488b/me` - Get current user

### Courses
- `GET /make-server-90ad488b/courses` - List courses
- `POST /make-server-90ad488b/courses` - Create course
- `DELETE /make-server-90ad488b/courses/:id` - Delete course

### Sessions
- `GET /make-server-90ad488b/sessions` - List sessions
- `POST /make-server-90ad488b/sessions` - Create session
- `PUT /make-server-90ad488b/sessions/:id` - Update session
- `DELETE /make-server-90ad488b/sessions/:id` - Delete session

### Attendance
- `GET /make-server-90ad488b/attendance` - Get attendance records
- `POST /make-server-90ad488b/attendance` - Submit attendance

### Enrollments
- `GET /make-server-90ad488b/enrollments` - List enrollments
- `POST /make-server-90ad488b/enrollments` - Enroll student
- `DELETE /make-server-90ad488b/enrollments/:id` - Remove enrollment

### Live Sessions
- `GET /make-server-90ad488b/live-sessions` - List live sessions
- `POST /make-server-90ad488b/live-sessions` - Create live session
- `PUT /make-server-90ad488b/live-sessions/:id/status` - Update status

### Stats
- `GET /make-server-90ad488b/stats/public` - Public stats
- `GET /make-server-90ad488b/stats/dashboard` - Dashboard stats

### Notifications
- `GET /make-server-90ad488b/notifications` - Get notifications
- `PUT /make-server-90ad488b/notifications/:id/read` - Mark as read

---

## 🔧 Environment Variables

Set these in Supabase Dashboard → Edge Functions → server → Settings:

```bash
SUPABASE_URL=https://pcymgqdjbdklrikdquih.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ✅ Features

- ✅ JWT Authentication
- ✅ Role-based Authorization
- ✅ CRUD for all tables
- ✅ Error Handling (Arabic/English)
- ✅ Logging
- ✅ CORS Protection
- ✅ Input Validation
- ✅ Business Logic

---

## 🐛 Troubleshooting

### Function not responding?

```bash
# Check deployment
supabase functions list

# View logs
supabase functions logs server
```

### Database connection failed?

Check environment variables in Supabase Dashboard.

### Unauthorized errors?

Make sure to send Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🎊 Done!

```
✅ Edge Function deployed
✅ All endpoints working
✅ Connected to database
✅ Ready for production
```

**Enjoy your Smart Attendance System! 🎉**
