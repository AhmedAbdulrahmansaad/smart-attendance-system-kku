# 📡 API Reference - نظام الحضور الذكي

<div align="center">

![API](https://img.shields.io/badge/API-Reference-blue)
![Endpoints](https://img.shields.io/badge/endpoints-30+-green)
![Version](https://img.shields.io/badge/version-1.0-brightgreen)

**دليل شامل لجميع API Endpoints في النظام**

</div>

---

## 🌐 Base URL

```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b
```

---

## 🔐 Authentication

جميع الـ endpoints (ما عدا `/health`) تحتاج Authorization header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**كيف تحصل على Token:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## 📚 Table of Contents

1. [Authentication](#-authentication-endpoints)
2. [Users](#-user-management)
3. [Courses](#-courses)
4. [Sessions](#-sessions)
5. [Attendance](#-attendance)
6. [Enrollments](#-enrollments)
7. [Schedules](#-schedules)
8. [Reports](#-reports)
9. [Health](#-health-check)

---

## 🔑 Authentication Endpoints

### POST /signup

إنشاء مستخدم جديد

**Request:**
```http
POST /signup
Content-Type: application/json

{
  "email": "student@kku.edu.sa",
  "password": "SecurePassword123!",
  "full_name": "أحمد محمد",
  "role": "student",
  "university_id": "442001234"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "email": "student@kku.edu.sa",
    "full_name": "أحمد محمد",
    "role": "student",
    "university_id": "442001234",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

**Validation:**
- ✅ Email يجب أن ينتهي بـ `@kku.edu.sa`
- ✅ Password مطلوب
- ✅ Full name مطلوب
- ✅ Role: `student`, `instructor`, `admin`, `supervisor`
- ✅ University ID مطلوب للطلاب فقط

---

### GET /me

جلب معلومات المستخدم الحالي

**Request:**
```http
GET /me
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "student@kku.edu.sa",
    "full_name": "أحمد محمد",
    "role": "student",
    "university_id": "442001234",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

---

## 👥 User Management

### GET /users

جلب جميع المستخدمين (Admin فقط)

**Request:**
```http
GET /users
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid-1",
      "email": "student1@kku.edu.sa",
      "full_name": "أحمد محمد",
      "role": "student",
      "university_id": "442001234",
      "created_at": "2025-11-11T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "email": "instructor@kku.edu.sa",
      "full_name": "د. سارة علي",
      "role": "instructor",
      "university_id": null,
      "created_at": "2025-11-10T09:00:00Z"
    }
  ]
}
```

**Permission:** Admin only

---

### DELETE /users/:userId

حذف مستخدم (Admin فقط)

**Request:**
```http
DELETE /users/uuid-here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Permission:** Admin only

**Side Effects:**
- يُحذف من Supabase Auth
- يُحذف من KV Store
- تُحذف جميع البيانات المرتبطة (حضور، تسجيلات، إلخ)

---

## 📚 Courses

### POST /courses

إنشاء مادة جديدة

**Request:**
```http
POST /courses
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "course_name": "مقدمة في الحاسب",
  "course_code": "CS101",
  "instructor_id": "uuid-instructor" // اختياري للـ instructor
}
```

**Response:**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": "course_1730000000000_abc123",
    "course_name": "مقدمة في الحاسب",
    "course_code": "CS101",
    "instructor_id": "uuid-instructor",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

**Permission:** Instructor or Admin

**Notes:**
- إذا كان المستخدم Instructor، يُعيّن تلقائياً كـ instructor للمادة
- Admin يمكنه تحديد أي instructor

---

### GET /courses

جلب المواد

**Request:**
```http
GET /courses
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "courses": [
    {
      "id": "course_id_1",
      "course_name": "مقدمة في الحاسب",
      "course_code": "CS101",
      "instructor_id": "uuid-instructor",
      "created_at": "2025-11-11T10:00:00Z"
    }
  ]
}
```

**Filter by Role:**
- **Admin/Supervisor**: جميع المواد
- **Instructor**: المواد التي يدرّسها فقط
- **Student**: المواد المسجل فيها فقط

---

### PUT /courses/:courseId

تحديث مادة

**Request:**
```http
PUT /courses/course_id_here
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "course_name": "مقدمة في الحاسب المتقدم",
  "course_code": "CS102",
  "instructor_id": "uuid-new-instructor"
}
```

**Response:**
```json
{
  "message": "Course updated successfully",
  "course": {
    "id": "course_id_here",
    "course_name": "مقدمة في الحاسب المتقدم",
    "course_code": "CS102",
    "instructor_id": "uuid-new-instructor",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

**Permission:** Admin only

---

### DELETE /courses/:courseId

حذف مادة

**Request:**
```http
DELETE /courses/course_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

**Permission:** Admin or Instructor (own courses only)

**Side Effects:**
- تُحذف جميع التسجيلات (enrollments)
- تُحذف جميع الجلسات (sessions)
- تُحذف جميع سجلات الحضور (attendance)

---

## 📅 Sessions

### POST /sessions

إنشاء جلسة حضور

**Request:**
```http
POST /sessions
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "course_id": "course_id_here",
  "duration_minutes": 15,
  "session_type": "attendance", // or "live"
  "title": "محاضرة البرمجة الأولى", // للـ live فقط
  "description": "شرح أساسيات البرمجة" // للـ live فقط
}
```

**Response:**
```json
{
  "message": "Session created successfully",
  "session": {
    "id": "session_1730000000000_xyz",
    "course_id": "course_id_here",
    "code": "ABC123",
    "created_by": "uuid-instructor",
    "created_at": "2025-11-11T10:00:00Z",
    "expires_at": "2025-11-11T10:15:00Z",
    "active": true,
    "session_type": "attendance",
    "title": null,
    "description": null,
    "stream_active": false,
    "viewers_count": 0
  }
}
```

**Permission:** Instructor only (للمواد التي يدرّسها)

**Session Types:**
- `attendance`: جلسة حضور عادية
- `live`: جلسة بث مباشر

---

### GET /sessions/:courseId

جلب جلسات مادة معينة

**Request:**
```http
GET /sessions/course_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_id_1",
      "course_id": "course_id_here",
      "code": "ABC123",
      "created_by": "uuid-instructor",
      "created_at": "2025-11-11T10:00:00Z",
      "expires_at": "2025-11-11T10:15:00Z",
      "active": true,
      "session_type": "attendance"
    }
  ]
}
```

---

### GET /sessions

جلب جميع الجلسات النشطة المباشرة (للطالب)

**Request:**
```http
GET /sessions
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "data": {
    "sessions": [
      {
        "id": "session_id_1",
        "course_id": "course_id_here",
        "code": "ABC123",
        "title": "محاضرة البرمجة",
        "session_type": "live",
        "active": true,
        "expires_at": "2025-11-11T11:00:00Z"
      }
    ],
    "courses": [
      {
        "id": "course_id_here",
        "course_name": "مقدمة في الحاسب",
        "course_code": "CS101"
      }
    ]
  }
}
```

**Filter:**
- للطالب: الجلسات المباشرة للمواد المسجل فيها
- للمدرس: الجلسات المباشرة لمواده
- للمشرف/المدير: جميع الجلسات

---

### POST /sessions/:sessionId/deactivate

إيقاف جلسة

**Request:**
```http
POST /sessions/session_id_here/deactivate
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Session deactivated successfully"
}
```

**Permission:** Instructor (own sessions only)

---

### DELETE /sessions/:sessionId

حذف جلسة

**Request:**
```http
DELETE /sessions/session_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

**Permission:** Instructor (own sessions only)

**Side Effects:**
- تُحذف الجلسة من KV Store
- يُحذف الكود من `session_code:` mapping
- تُحذف جميع سجلات الحضور المرتبطة

---

## ✅ Attendance

### POST /attendance

تسجيل الحضور

**Request:**
```http
POST /attendance
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "session_code": "ABC123"
}
```

**Response:**
```json
{
  "message": "Attendance recorded successfully",
  "attendance": {
    "id": "attendance_1730000000000_xyz",
    "student_id": "uuid-student",
    "course_id": "course_id_here",
    "session_id": "session_id_here",
    "date": "2025-11-11T10:05:00Z",
    "status": "present",
    "session_code": "ABC123"
  }
}
```

**Permission:** Student only

**Validation:**
- ✅ الكود صحيح وموجود
- ✅ الجلسة نشطة (active = true)
- ✅ الجلسة لم تنتهِ (expires_at > now)
- ✅ الطالب مسجل في المادة
- ✅ لم يسبق تسجيل الحضور

---

### GET /attendance/student

جلب سجل حضور الطالب

**Request:**
```http
GET /attendance/student
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "attendance": [
    {
      "id": "attendance_id_1",
      "student_id": "uuid-student",
      "course_id": "course_id_here",
      "session_id": "session_id_here",
      "date": "2025-11-11T10:05:00Z",
      "status": "present",
      "session_code": "ABC123",
      "course": {
        "id": "course_id_here",
        "course_name": "مقدمة في الحاسب",
        "course_code": "CS101"
      }
    }
  ]
}
```

**Permission:** Student only (بياناته فقط)

---

### GET /attendance/course/:courseId

جلب سجل حضور مادة معينة

**Request:**
```http
GET /attendance/course/course_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "attendance": [
    {
      "id": "attendance_id_1",
      "student_id": "uuid-student",
      "course_id": "course_id_here",
      "session_id": "session_id_here",
      "date": "2025-11-11T10:05:00Z",
      "status": "present",
      "session_code": "ABC123",
      "student": {
        "id": "uuid-student",
        "email": "student@kku.edu.sa",
        "full_name": "أحمد محمد",
        "university_id": "442001234"
      }
    }
  ]
}
```

**Permission:** Instructor (own courses) or Admin

---

## 🎓 Enrollments

### POST /enrollments

تسجيل طالب في مادة

**Request:**
```http
POST /enrollments
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "student_id": "uuid-student",
  "course_id": "course_id_here"
}
```

**Response:**
```json
{
  "message": "Student enrolled successfully",
  "enrollment": {
    "student_id": "uuid-student",
    "course_id": "course_id_here",
    "enrolled_at": "2025-11-11T10:00:00Z"
  }
}
```

**Permission:** Admin only

---

### GET /enrollments/:courseId

جلب تسجيلات مادة معينة

**Request:**
```http
GET /enrollments/course_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "enrollments": [
    {
      "student_id": "uuid-student",
      "course_id": "course_id_here",
      "enrolled_at": "2025-11-11T10:00:00Z",
      "student": {
        "id": "uuid-student",
        "email": "student@kku.edu.sa",
        "full_name": "أحمد محمد",
        "role": "student",
        "university_id": "442001234"
      }
    }
  ]
}
```

---

## 📆 Schedules

### POST /schedules

إنشاء جدول محاضرة

**Request:**
```http
POST /schedules
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "course_id": "course_id_here",
  "day_of_week": "Sunday",
  "start_time": "10:00",
  "end_time": "11:30",
  "location": "قاعة 101"
}
```

**Response:**
```json
{
  "message": "Schedule created successfully",
  "schedule": {
    "id": "schedule_1730000000000_xyz",
    "course_id": "course_id_here",
    "day_of_week": "Sunday",
    "start_time": "10:00",
    "end_time": "11:30",
    "location": "قاعة 101",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

**Permission:** Instructor or Admin

---

### GET /schedules

جلب الجداول

**Request:**
```http
GET /schedules
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "schedules": [
    {
      "id": "schedule_id_1",
      "course_id": "course_id_here",
      "day_of_week": "Sunday",
      "start_time": "10:00",
      "end_time": "11:30",
      "location": "قاعة 101",
      "created_at": "2025-11-11T10:00:00Z",
      "course": {
        "id": "course_id_here",
        "course_name": "مقدمة في الحاسب",
        "course_code": "CS101"
      }
    }
  ]
}
```

**Filter by Role:**
- **Instructor**: جداول مواده فقط
- **Student**: جداول مواده المسجلة
- **Admin/Supervisor**: جميع الجداول

---

### DELETE /schedules/:scheduleId

حذف جدول

**Request:**
```http
DELETE /schedules/schedule_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Schedule deleted successfully"
}
```

**Permission:** Instructor or Admin

---

## 📊 Reports

### GET /reports/course/:courseId

تقرير حضور مادة معينة

**Request:**
```http
GET /reports/course/course_id_here
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "report": [
    {
      "student_id": "uuid-student",
      "student_name": "أحمد محمد",
      "student_email": "student@kku.edu.sa",
      "total_sessions": 10,
      "attended_sessions": 8,
      "attendance_rate": 80,
      "attendance_records": [
        {
          "id": "attendance_id_1",
          "session_id": "session_id_1",
          "date": "2025-11-11T10:05:00Z",
          "status": "present"
        }
      ]
    }
  ]
}
```

**Permission:** Instructor (own courses) or Admin

---

### GET /reports/overview

نظرة عامة على الإحصائيات

**Request:**
```http
GET /reports/overview
Authorization: Bearer YOUR_TOKEN
```

**Response (Admin/Supervisor):**
```json
{
  "overview": {
    "total_users": 150,
    "total_students": 120,
    "total_instructors": 25,
    "total_courses": 40,
    "total_sessions": 200,
    "total_attendance_records": 1500
  }
}
```

**Response (Instructor):**
```json
{
  "overview": {
    "total_users": 150,
    "total_students": 120,
    "total_instructors": 25,
    "total_courses": 40,
    "total_sessions": 200,
    "total_attendance_records": 1500,
    "my_courses": 5,
    "my_sessions": 30,
    "my_attendance_records": 250
  }
}
```

**Response (Student):**
```json
{
  "overview": {
    "total_users": 150,
    "total_students": 120,
    "total_instructors": 25,
    "total_courses": 40,
    "total_sessions": 200,
    "total_attendance_records": 1500,
    "my_courses": 6,
    "my_attendance_records": 48,
    "total_sessions": 60,
    "my_attendance_rate": 80
  }
}
```

---

## 🏥 Health Check

### GET /health

فحص صحة النظام

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

**No Authorization Required**

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Missing authorization token"
}
```
or
```json
{
  "error": "Unauthorized - Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Course not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error while creating course"
}
```

---

## 🔧 Rate Limits

حالياً لا توجد rate limits، لكن يُفضل:
- **الحد الأقصى**: 100 request/minute/user
- **Burst**: 20 request/second

---

## 📝 Notes

### KV Store Keys Format

```typescript
// Users
user:{userId}

// Courses
course:{courseId}

// Sessions
session:{sessionId}
session_code:{code} → sessionId

// Attendance
attendance:{studentId}:{sessionId}
attendance_record:{attendanceId}

// Enrollments
enrollment:{studentId}:{courseId}

// Schedules
schedule:{scheduleId}
```

---

## 🧪 Testing

### Example with cURL

```bash
# Health check
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-90ad488b/health

# Get user info
curl -X GET \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-90ad488b/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create course
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-90ad488b/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_name": "مقدمة في الحاسب",
    "course_code": "CS101"
  }'
```

### Example with JavaScript

```javascript
const apiRequest = async (endpoint, options = {}) => {
  const token = options.token;
  const method = options.method || 'GET';
  const body = options.body;

  const response = await fetch(
    `https://YOUR_PROJECT.supabase.co/functions/v1/make-server-90ad488b${endpoint}`,
    {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  return await response.json();
};

// Example: Get courses
const courses = await apiRequest('/courses', { token });
```

---

<div align="center">

## 📚 انتهى دليل API Reference

**للمزيد من المعلومات:**
- [SYSTEM_GUIDE.md](SYSTEM_GUIDE.md) - دليل النظام الكامل
- [BACKEND_DOCS_INDEX.md](BACKEND_DOCS_INDEX.md) - وثائق Backend
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - حل المشاكل

---

**جامعة الملك خالد - نظام الحضور الذكي**  
**API Version**: 1.0 | **Last Updated**: نوفمبر 2025

</div>
