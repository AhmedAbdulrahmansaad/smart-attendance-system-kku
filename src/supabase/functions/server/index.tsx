import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get authenticated user
async function getAuthenticatedUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'Missing authorization token', user: null };
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: 'Unauthorized', user: null };
  }
  
  // Get user role from KV store
  const userRecord = await kv.get(`user:${data.user.id}`);
  if (!userRecord) {
    return { error: 'User not found in system', user: null };
  }
  
  return { error: null, user: { ...data.user, ...userRecord } };
}

// Helper to generate random code
function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper to hash password (basic implementation)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== AUTH ENDPOINTS ====================

// Sign up endpoint
app.post("/make-server-90ad488b/signup", async (c) => {
  try {
    const { email, password, full_name, role, university_id } = await c.req.json();
    
    if (!email || !password || !full_name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Validate email domain
    if (!email.endsWith('@kku.edu.sa')) {
      return c.json({ error: 'Must use university email @kku.edu.sa' }, 400);
    }
    
    if (!['student', 'instructor', 'admin', 'supervisor'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Validate university_id for students
    if (role === 'student') {
      if (!university_id) {
        return c.json({ error: 'University ID is required for students' }, 400);
      }
      
      // Validate university ID format: 9 digits starting with 44
      const universityIdRegex = /^44\d{7}$/;
      if (!universityIdRegex.test(university_id)) {
        return c.json({ error: 'University ID must be 9 digits starting with 44 (e.g., 441234567)' }, 400);
      }
      
      // Check if university ID already exists
      const existingUsers = await kv.getByPrefix('user:');
      const duplicateId = existingUsers.find((u: any) => u.university_id === university_id);
      if (duplicateId) {
        console.log(`❌ Signup failed: University ID already registered - ${university_id}`);
        return c.json({ 
          error: 'University ID already registered',
          message: 'This University ID is already registered. Please use Sign In instead.',
          messageAr: 'هذا الرقم الجامعي مسجل مسبقاً. الرجاء استخدام تسجيل الدخول.'
        }, 400);
      }
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    // Check if email already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      console.log(`❌ Signup failed: Email already registered - ${email}`);
      return c.json({ 
        error: 'Email already registered',
        message: 'This email is already registered. Please use Sign In instead.',
        messageAr: 'هذا البريد مسجل مسبقاً. الرجاء استخدام تسجيل الدخول.'
      }, 400);
    }
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server hasn't been configured
      user_metadata: { full_name, role, university_id: university_id || null }
    });
    
    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Store user in KV store
    const userRecord = {
      id: data.user.id,
      email,
      full_name,
      role,
      university_id: university_id || null,
      created_at: new Date().toISOString(),
      active_session: null // For session management
    };
    
    await kv.set(`user:${data.user.id}`, userRecord);
    
    return c.json({ 
      message: 'User created successfully',
      user: userRecord
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Sign in endpoint (for reference, actual sign-in happens on frontend)
app.get("/make-server-90ad488b/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Missing authorization token' }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      console.log('Auth error in /me:', error);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }
    
    // Try to get user record from KV store
    let userRecord = await kv.get(`user:${data.user.id}`);
    
    // If user doesn't exist in KV store, create it from user_metadata
    if (!userRecord) {
      console.log('User not found in KV, creating from metadata:', data.user.id);
      
      const metadata = data.user.user_metadata || {};
      userRecord = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: metadata.full_name || metadata.name || 'User',
        role: metadata.role || 'student',
        university_id: metadata.university_id || null,
        created_at: new Date().toISOString()
      };
      
      await kv.set(`user:${data.user.id}`, userRecord);
    }
    
    return c.json({ user: userRecord });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Internal server error while fetching user' }, 500);
  }
});

// Session management - check and register session
app.post("/make-server-90ad488b/session/register", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Missing authorization token' }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = data.user.id;
    const sessionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Get user record
    const userRecord = await kv.get(`user:${userId}`);
    if (!userRecord) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if there's an active session
    if (userRecord.active_session) {
      const sessionAge = Date.now() - new Date(userRecord.active_session.timestamp).getTime();
      // If session is less than 30 seconds old, it's likely the same login
      if (sessionAge < 30000) {
        return c.json({ 
          session_id: userRecord.active_session.session_id,
          message: 'Session already registered'
        });
      }
      
      // Check if session is still valid (less than 12 hours old)
      if (sessionAge < 12 * 60 * 60 * 1000) {
        return c.json({ 
          error: 'Another session is active. Please logout from other device first.',
          session_conflict: true
        }, 409);
      }
    }
    
    // Register new session
    userRecord.active_session = {
      session_id: sessionId,
      timestamp,
      access_token: accessToken
    };
    
    await kv.set(`user:${userId}`, userRecord);
    
    return c.json({ 
      session_id: sessionId,
      message: 'Session registered successfully'
    });
  } catch (error) {
    console.log('Session register error:', error);
    return c.json({ error: 'Internal server error while registering session' }, 500);
  }
});

// Session management - logout
app.post("/make-server-90ad488b/session/logout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Missing authorization token' }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = data.user.id;
    
    // Get user record
    const userRecord = await kv.get(`user:${userId}`);
    if (userRecord) {
      // Clear active session
      userRecord.active_session = null;
      await kv.set(`user:${userId}`, userRecord);
    }
    
    return c.json({ message: 'Session cleared successfully' });
  } catch (error) {
    console.log('Session logout error:', error);
    return c.json({ error: 'Internal server error while logging out' }, 500);
  }
});

// ==================== USER MANAGEMENT (ADMIN) ====================

app.delete("/make-server-90ad488b/users/:userId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const userId = c.req.param('userId');
    
    // Delete from Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    await supabase.auth.admin.deleteUser(userId);
    
    // Delete from KV store
    await kv.del(`user:${userId}`);
    
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log('Delete user error:', error);
    return c.json({ error: 'Internal server error while deleting user' }, 500);
  }
});

// ==================== COURSE MANAGEMENT ====================

app.post("/make-server-90ad488b/courses", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    // Allow both admin and instructor to create courses
    if (user.role !== 'admin' && user.role !== 'instructor') {
      return c.json({ error: 'Admin or Instructor access required' }, 403);
    }
    
    const { course_name, course_code, instructor_id } = await c.req.json();
    
    if (!course_name || !course_code) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // If instructor creates course, automatically assign them as instructor
    const finalInstructorId = user.role === 'instructor' ? user.id : (instructor_id || null);
    
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const course = {
      id: courseId,
      course_name,
      course_code,
      instructor_id: finalInstructorId,
      created_at: new Date().toISOString()
    };
    
    await kv.set(`course:${courseId}`, course);
    
    return c.json({ message: 'Course created successfully', course });
  } catch (error) {
    console.log('Create course error:', error);
    return c.json({ error: 'Internal server error while creating course' }, 500);
  }
});

app.get("/make-server-90ad488b/courses", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const courses = await kv.getByPrefix('course:');
    
    // Filter by role
    if (user.role === 'instructor') {
      const instructorCourses = courses.filter(course => course.instructor_id === user.id);
      return c.json({ courses: instructorCourses });
    }
    
    if (user.role === 'student') {
      // Get enrolled courses
      const enrollments = await kv.getByPrefix(`enrollment:${user.id}:`);
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      const enrolledCourses = courses.filter(course => enrolledCourseIds.includes(course.id));
      return c.json({ courses: enrolledCourses });
    }
    
    return c.json({ courses });
  } catch (error) {
    console.log('Get courses error:', error);
    return c.json({ error: 'Internal server error while fetching courses' }, 500);
  }
});

app.put("/make-server-90ad488b/courses/:courseId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const courseId = c.req.param('courseId');
    const updates = await c.req.json();
    
    const existingCourse = await kv.get(`course:${courseId}`);
    if (!existingCourse) {
      return c.json({ error: 'Course not found' }, 404);
    }
    
    const updatedCourse = { ...existingCourse, ...updates };
    await kv.set(`course:${courseId}`, updatedCourse);
    
    return c.json({ message: 'Course updated successfully', course: updatedCourse });
  } catch (error) {
    console.log('Update course error:', error);
    return c.json({ error: 'Internal server error while updating course' }, 500);
  }
});

app.delete("/make-server-90ad488b/courses/:courseId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const courseId = c.req.param('courseId');
    const existingCourse = await kv.get(`course:${courseId}`);
    
    if (!existingCourse) {
      return c.json({ error: 'Course not found' }, 404);
    }
    
    // Allow admin to delete any course, or instructor to delete their own courses
    if (user.role !== 'admin' && existingCourse.instructor_id !== user.id) {
      return c.json({ error: 'You can only delete your own courses' }, 403);
    }
    
    // Delete all related data
    // 1. Delete enrollments
    const enrollments = await kv.getByPrefix(`enrollment:`);
    const courseEnrollments = enrollments.filter(e => e.course_id === courseId);
    for (const enrollment of courseEnrollments) {
      await kv.del(`enrollment:${enrollment.student_id}:${courseId}`);
    }
    
    // 2. Delete sessions
    const sessions = await kv.getByPrefix(`session:`);
    const courseSessions = sessions.filter(s => s.course_id === courseId);
    for (const session of courseSessions) {
      await kv.del(`session:${session.id}`);
      if (session.code) {
        await kv.del(`session_code:${session.code}`);
      }
    }
    
    // 3. Delete attendance records
    const attendanceRecords = await kv.getByPrefix(`attendance:`);
    const courseAttendance = attendanceRecords.filter(a => a.course_id === courseId);
    for (const record of courseAttendance) {
      await kv.del(`attendance:${record.id}`);
    }
    
    // 4. Finally delete the course
    await kv.del(`course:${courseId}`);
    
    console.log(`Course ${courseId} deleted successfully by ${user.full_name} (${user.role})`);
    
    return c.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.log('Delete course error:', error);
    return c.json({ error: 'Internal server error while deleting course' }, 500);
  }
});

// ==================== ENROLLMENT ====================

app.post("/make-server-90ad488b/enrollments", async (c) => {
  try {
    console.log('📝 POST /enrollments - Enrollment request received');
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      console.log('❌ Enrollment error: Unauthorized');
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin') {
      console.log('❌ Enrollment error: Not admin');
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { student_id, course_id } = await c.req.json();
    
    if (!student_id || !course_id) {
      console.log('❌ Enrollment error: Missing fields');
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const enrollment = {
      student_id,
      course_id,
      enrolled_at: new Date().toISOString()
    };
    
    console.log('💾 Saving enrollment to KV store:', { 
      key: `enrollment:${student_id}:${course_id}`,
      value: enrollment 
    });
    
    await kv.set(`enrollment:${student_id}:${course_id}`, enrollment);
    
    console.log('✅ Enrollment saved successfully! This should trigger Realtime update for student:', student_id);
    
    return c.json({ message: 'Student enrolled successfully', enrollment });
  } catch (error) {
    console.log('❌ Create enrollment error:', error);
    return c.json({ error: 'Internal server error while creating enrollment' }, 500);
  }
});

app.get("/make-server-90ad488b/enrollments/:courseId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const courseId = c.req.param('courseId');
    const allEnrollments = await kv.getByPrefix('enrollment:');
    const courseEnrollments = allEnrollments.filter(e => e.course_id === courseId);
    
    // Get student details
    const studentsWithDetails = await Promise.all(
      courseEnrollments.map(async (enrollment) => {
        const student = await kv.get(`user:${enrollment.student_id}`);
        return {
          ...enrollment,
          student
        };
      })
    );
    
    return c.json({ enrollments: studentsWithDetails });
  } catch (error) {
    console.log('Get enrollments error:', error);
    return c.json({ error: 'Internal server error while fetching enrollments' }, 500);
  }
});

// ==================== SCHEDULE MANAGEMENT ====================

app.post("/make-server-90ad488b/schedules", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin' && user.role !== 'instructor') {
      return c.json({ error: 'Instructor or Admin access required' }, 403);
    }
    
    const { course_id, day_of_week, start_time, end_time, location } = await c.req.json();
    
    if (!course_id || !day_of_week || !start_time || !end_time) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const schedule = {
      id: scheduleId,
      course_id,
      day_of_week,
      start_time,
      end_time,
      location: location || '',
      created_at: new Date().toISOString()
    };
    
    await kv.set(`schedule:${scheduleId}`, schedule);
    
    return c.json({ message: 'Schedule created successfully', schedule });
  } catch (error) {
    console.log('Create schedule error:', error);
    return c.json({ error: 'Internal server error while creating schedule' }, 500);
  }
});

app.get("/make-server-90ad488b/schedules", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const schedules = await kv.getByPrefix('schedule:');
    
    // Get course details for each schedule
    const schedulesWithCourses = await Promise.all(
      schedules.map(async (schedule) => {
        const course = await kv.get(`course:${schedule.course_id}`);
        return {
          ...schedule,
          course
        };
      })
    );
    
    // Filter by role
    if (user.role === 'instructor') {
      const instructorSchedules = schedulesWithCourses.filter(s => s.course?.instructor_id === user.id);
      return c.json({ schedules: instructorSchedules });
    }
    
    if (user.role === 'student') {
      const enrollments = await kv.getByPrefix(`enrollment:${user.id}:`);
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      const studentSchedules = schedulesWithCourses.filter(s => enrolledCourseIds.includes(s.course_id));
      return c.json({ schedules: studentSchedules });
    }
    
    return c.json({ schedules: schedulesWithCourses });
  } catch (error) {
    console.log('Get schedules error:', error);
    return c.json({ error: 'Internal server error while fetching schedules' }, 500);
  }
});

app.delete("/make-server-90ad488b/schedules/:scheduleId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin' && user.role !== 'instructor') {
      return c.json({ error: 'Instructor or Admin access required' }, 403);
    }
    
    const scheduleId = c.req.param('scheduleId');
    await kv.del(`schedule:${scheduleId}`);
    
    return c.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.log('Delete schedule error:', error);
    return c.json({ error: 'Internal server error while deleting schedule' }, 500);
  }
});

// ==================== SESSION MANAGEMENT (ATTENDANCE CODES) ====================

app.post("/make-server-90ad488b/sessions", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor') {
      return c.json({ error: 'Instructor access required' }, 403);
    }
    
    const { course_id, duration_minutes, session_type, title, description } = await c.req.json();
    
    if (!course_id) {
      return c.json({ error: 'Missing course_id' }, 400);
    }
    
    // Verify instructor teaches this course
    const course = await kv.get(`course:${course_id}`);
    if (!course || course.instructor_id !== user.id) {
      return c.json({ error: 'You are not authorized to create sessions for this course' }, 403);
    }
    
    const code = generateSessionCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (duration_minutes || 15));
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const session = {
      id: sessionId,
      course_id,
      code,
      created_by: user.id,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      active: true,
      session_type: session_type || 'attendance', // 'attendance' or 'live'
      title: title || null,
      description: description || null,
      stream_active: false,
      viewers_count: 0
    };
    
    await kv.set(`session:${sessionId}`, session);
    await kv.set(`session_code:${code}`, sessionId);
    
    return c.json({ message: 'Session created successfully', session });
  } catch (error) {
    console.log('Create session error:', error);
    return c.json({ error: 'Internal server error while creating session' }, 500);
  }
});

app.get("/make-server-90ad488b/sessions/:courseId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const courseId = c.req.param('courseId');
    const allSessions = await kv.getByPrefix('session:');
    const courseSessions = allSessions.filter(s => s.course_id === courseId);
    
    return c.json({ sessions: courseSessions });
  } catch (error) {
    console.log('Get sessions error:', error);
    return c.json({ error: 'Internal server error while fetching sessions' }, 500);
  }
});

// Get all active live sessions for students
app.get("/make-server-90ad488b/sessions", async (c) => {
  try {
    console.log('==================================================');
    console.log('📡 GET /sessions - Fetching all active live sessions');
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      console.log('❌ Authentication error:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    console.log('✅ User authenticated:', { id: user.id, role: user.role, name: user.full_name });
    
    // Get all courses
    const allCourses = await kv.getByPrefix('course:');
    console.log('📚 Total courses in database:', allCourses.length);
    if (allCourses.length > 0) {
      console.log('📚 Sample course:', allCourses[0]);
    }
    
    // Filter courses based on user role
    let userCourses = [];
    if (user.role === 'student') {
      // Get enrolled courses for student
      const enrollments = await kv.getByPrefix(`enrollment:${user.id}:`);
      console.log('🎓 Student enrollments found:', enrollments.length);
      if (enrollments.length > 0) {
        console.log('🎓 Sample enrollment:', enrollments[0]);
      }
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      console.log('🎓 Enrolled course IDs:', enrolledCourseIds);
      userCourses = allCourses.filter(course => enrolledCourseIds.includes(course.id));
      console.log('🎓 Student enrolled courses:', userCourses.length);
    } else if (user.role === 'instructor') {
      // Get courses taught by instructor
      userCourses = allCourses.filter(course => course.instructor_id === user.id);
      console.log('👨‍🏫 Instructor courses:', userCourses.length);
    } else {
      // Admin or supervisor can see all courses
      userCourses = allCourses;
      console.log('👑 All courses (admin/supervisor):', userCourses.length);
    }
    
    // Get all sessions
    const allSessions = await kv.getByPrefix('session:');
    console.log('📋 Total sessions in database:', allSessions.length);
    if (allSessions.length > 0) {
      console.log('📋 Sample session:', allSessions[0]);
    }
    
    // Filter active live sessions for user's courses
    const now = new Date();
    console.log('⏰ Current time:', now.toISOString());
    
    const activeLiveSessions = allSessions.filter(session => {
      const expiresAt = new Date(session.expires_at);
      const isNotExpired = expiresAt > now;
      const isActive = session.active === true;
      const isLive = session.session_type === 'live';
      const isUserCourse = userCourses.some(c => c.id === session.course_id);
      
      console.log(`🔍 Session ${session.code}:`, {
        id: session.id,
        active: session.active,
        type: session.session_type,
        expires_at: session.expires_at,
        isNotExpired,
        isActive,
        isLive,
        isUserCourse,
        course_id: session.course_id,
        PASS: isActive && isLive && isUserCourse && isNotExpired ? '✅' : '❌'
      });
      
      return isActive && isLive && isUserCourse && isNotExpired;
    });
    
    console.log('🎥 Active live sessions for user:', activeLiveSessions.length);
    if (activeLiveSessions.length > 0) {
      console.log('🎥 Active live sessions list:', activeLiveSessions.map(s => ({
        id: s.id,
        code: s.code,
        title: s.title,
        course_id: s.course_id
      })));
    }
    console.log('==================================================');
    
    return c.json({ 
      data: {
        sessions: activeLiveSessions,
        courses: userCourses
      }
    });
  } catch (error) {
    console.log('❌ Get live sessions error:', error);
    return c.json({ error: 'Internal server error while fetching live sessions' }, 500);
  }
});

app.post("/make-server-90ad488b/sessions/:sessionId/deactivate", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor') {
      return c.json({ error: 'Instructor access required' }, 403);
    }
    
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    if (session.created_by !== user.id) {
      return c.json({ error: 'You are not authorized to deactivate this session' }, 403);
    }
    
    session.active = false;
    await kv.set(`session:${sessionId}`, session);
    
    return c.json({ message: 'Session deactivated successfully' });
  } catch (error) {
    console.log('Deactivate session error:', error);
    return c.json({ error: 'Internal server error while deactivating session' }, 500);
  }
});

// Delete session
app.delete("/make-server-90ad488b/sessions/:sessionId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor') {
      return c.json({ error: 'Instructor access required' }, 403);
    }
    
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    if (session.created_by !== user.id) {
      return c.json({ error: 'You are not authorized to delete this session' }, 403);
    }
    
    // Delete session
    await kv.del(`session:${sessionId}`);
    
    // Delete session code mapping
    if (session.code) {
      await kv.del(`session_code:${session.code}`);
    }
    
    // Delete attendance records for this session
    const allAttendance = await kv.getByPrefix('attendance:');
    const sessionAttendance = allAttendance.filter(a => a.session_id === sessionId);
    await Promise.all(sessionAttendance.map(a => kv.del(`attendance:${a.student_id}:${sessionId}`)));
    
    return c.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.log('Delete session error:', error);
    return c.json({ error: 'Internal server error while deleting session' }, 500);
  }
});

// ==================== ATTENDANCE ====================

app.post("/make-server-90ad488b/attendance", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'student') {
      return c.json({ error: 'Student access required' }, 403);
    }
    
    const { session_code } = await c.req.json();
    
    if (!session_code) {
      return c.json({ error: 'Missing session code' }, 400);
    }
    
    // Find session by code
    const sessionId = await kv.get(`session_code:${session_code.toUpperCase()}`);
    if (!sessionId) {
      return c.json({ error: 'Invalid session code' }, 400);
    }
    
    const session = await kv.get(`session:${sessionId}`);
    if (!session || !session.active) {
      return c.json({ error: 'Session is not active' }, 400);
    }
    
    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return c.json({ error: 'Session has expired' }, 400);
    }
    
    // Check if student is enrolled in the course
    const enrollment = await kv.get(`enrollment:${user.id}:${session.course_id}`);
    if (!enrollment) {
      return c.json({ error: 'You are not enrolled in this course' }, 403);
    }
    
    // Check if already marked attendance
    const existingAttendance = await kv.get(`attendance:${user.id}:${sessionId}`);
    if (existingAttendance) {
      return c.json({ error: 'Attendance already recorded for this session' }, 400);
    }
    
    const attendanceId = `attendance_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const attendance = {
      id: attendanceId,
      student_id: user.id,
      course_id: session.course_id,
      session_id: sessionId,
      date: new Date().toISOString(),
      status: 'present',
      session_code: session_code.toUpperCase()
    };
    
    await kv.set(`attendance:${user.id}:${sessionId}`, attendance);
    await kv.set(`attendance_record:${attendanceId}`, attendance);
    
    return c.json({ message: 'Attendance recorded successfully', attendance });
  } catch (error) {
    console.log('Record attendance error:', error);
    return c.json({ error: 'Internal server error while recording attendance' }, 500);
  }
});

app.get("/make-server-90ad488b/attendance/student", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'student') {
      return c.json({ error: 'Student access required' }, 403);
    }
    
    const allAttendance = await kv.getByPrefix('attendance_record:');
    const studentAttendance = allAttendance.filter(a => a.student_id === user.id);
    
    // Get course details
    const attendanceWithCourses = await Promise.all(
      studentAttendance.map(async (att) => {
        const course = await kv.get(`course:${att.course_id}`);
        return {
          ...att,
          course
        };
      })
    );
    
    return c.json({ attendance: attendanceWithCourses });
  } catch (error) {
    console.log('Get student attendance error:', error);
    return c.json({ error: 'Internal server error while fetching student attendance' }, 500);
  }
});

app.get("/make-server-90ad488b/attendance/course/:courseId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Instructor or Admin access required' }, 403);
    }
    
    const courseId = c.req.param('courseId');
    
    // Verify instructor teaches this course (if instructor)
    if (user.role === 'instructor') {
      const course = await kv.get(`course:${courseId}`);
      if (!course || course.instructor_id !== user.id) {
        return c.json({ error: 'You are not authorized to view this course attendance' }, 403);
      }
    }
    
    const allAttendance = await kv.getByPrefix('attendance_record:');
    const courseAttendance = allAttendance.filter(a => a.course_id === courseId);
    
    // Get student details
    const attendanceWithStudents = await Promise.all(
      courseAttendance.map(async (att) => {
        const student = await kv.get(`user:${att.student_id}`);
        return {
          ...att,
          student
        };
      })
    );
    
    return c.json({ attendance: attendanceWithStudents });
  } catch (error) {
    console.log('Get course attendance error:', error);
    return c.json({ error: 'Internal server error while fetching course attendance' }, 500);
  }
});

// ==================== REPORTS ====================

app.get("/make-server-90ad488b/reports/course/:courseId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Instructor or Admin access required' }, 403);
    }
    
    const courseId = c.req.param('courseId');
    
    // Verify instructor teaches this course (if instructor)
    if (user.role === 'instructor') {
      const course = await kv.get(`course:${courseId}`);
      if (!course || course.instructor_id !== user.id) {
        return c.json({ error: 'You are not authorized to view this course report' }, 403);
      }
    }
    
    // Get all enrollments
    const allEnrollments = await kv.getByPrefix('enrollment:');
    const courseEnrollments = allEnrollments.filter(e => e.course_id === courseId);
    
    // Get all sessions
    const allSessions = await kv.getByPrefix('session:');
    const courseSessions = allSessions.filter(s => s.course_id === courseId);
    
    // Get all attendance
    const allAttendance = await kv.getByPrefix('attendance_record:');
    const courseAttendance = allAttendance.filter(a => a.course_id === courseId);
    
    // Build report
    const report = await Promise.all(
      courseEnrollments.map(async (enrollment) => {
        const student = await kv.get(`user:${enrollment.student_id}`);
        const studentAttendance = courseAttendance.filter(a => a.student_id === enrollment.student_id);
        const attendanceRate = courseSessions.length > 0 
          ? (studentAttendance.length / courseSessions.length) * 100 
          : 0;
        
        return {
          student_id: enrollment.student_id,
          student_name: student?.full_name || 'Unknown',
          student_email: student?.email || '',
          total_sessions: courseSessions.length,
          attended_sessions: studentAttendance.length,
          attendance_rate: Math.round(attendanceRate),
          attendance_records: studentAttendance
        };
      })
    );
    
    return c.json({ report });
  } catch (error) {
    console.log('Get course report error:', error);
    return c.json({ error: 'Internal server error while generating course report' }, 500);
  }
});

app.get("/make-server-90ad488b/reports/overview", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const users = await kv.getByPrefix('user:');
    const courses = await kv.getByPrefix('course:');
    const sessions = await kv.getByPrefix('session:');
    const attendance = await kv.getByPrefix('attendance_record:');
    
    let overview = {
      total_users: users.length,
      total_students: users.filter(u => u.role === 'student').length,
      total_instructors: users.filter(u => u.role === 'instructor').length,
      total_courses: courses.length,
      total_sessions: sessions.length,
      total_attendance_records: attendance.length
    };
    
    // Filter by role
    if (user.role === 'instructor') {
      const instructorCourses = courses.filter(c => c.instructor_id === user.id);
      const instructorCoursesIds = instructorCourses.map(c => c.id);
      const instructorSessions = sessions.filter(s => instructorCoursesIds.includes(s.course_id));
      const instructorAttendance = attendance.filter(a => instructorCoursesIds.includes(a.course_id));
      
      overview = {
        ...overview,
        my_courses: instructorCourses.length,
        my_sessions: instructorSessions.length,
        my_attendance_records: instructorAttendance.length
      };
    }
    
    if (user.role === 'student') {
      const studentEnrollments = await kv.getByPrefix(`enrollment:${user.id}:`);
      const studentAttendance = attendance.filter(a => a.student_id === user.id);
      const enrolledCoursesIds = studentEnrollments.map(e => e.course_id);
      const enrolledSessions = sessions.filter(s => enrolledCoursesIds.includes(s.course_id));
      
      const attendanceRate = enrolledSessions.length > 0 
        ? (studentAttendance.length / enrolledSessions.length) * 100 
        : 0;
      
      overview = {
        ...overview,
        my_courses: studentEnrollments.length,
        my_attendance_records: studentAttendance.length,
        total_sessions: enrolledSessions.length,
        my_attendance_rate: Math.round(attendanceRate)
      };
    }
    
    return c.json({ overview });
  } catch (error) {
    console.log('Get overview error:', error);
    return c.json({ error: 'Internal server error while generating overview' }, 500);
  }
});

// ==================== ATTENDANCE ENDPOINTS ====================

// Get today's attendance (for all users - filtered by role)
app.get("/make-server-90ad488b/attendance/today", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const allAttendance = await kv.getByPrefix('attendance_record:');
    
    // Filter today's attendance
    const todayAttendance = allAttendance.filter(a => {
      const attendanceDate = new Date(a.date).toISOString().split('T')[0];
      return attendanceDate === today;
    });
    
    // Filter by role
    let filteredAttendance = todayAttendance;
    
    if (user.role === 'instructor') {
      // Get instructor's courses
      const courses = await kv.getByPrefix('course:');
      const instructorCourses = courses.filter(c => c.instructor_id === user.id);
      const courseIds = instructorCourses.map(c => c.id);
      
      // Filter attendance for instructor's courses only
      filteredAttendance = todayAttendance.filter(a => courseIds.includes(a.course_id));
    } else if (user.role === 'student') {
      // Student can only see their own attendance
      filteredAttendance = todayAttendance.filter(a => a.student_id === user.id);
    }
    // Admin can see all
    
    return c.json({ attendance: filteredAttendance });
  } catch (error) {
    console.log('Get today attendance error:', error);
    return c.json({ error: 'Internal server error while fetching today attendance' }, 500);
  }
});

// Get my attendance (for students)
app.get("/make-server-90ad488b/attendance/my", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const allAttendance = await kv.getByPrefix('attendance_record:');
    const myAttendance = allAttendance.filter(a => a.student_id === user.id);
    
    // Get course details
    const attendanceWithCourses = await Promise.all(
      myAttendance.map(async (att) => {
        const course = await kv.get(`course:${att.course_id}`);
        return {
          ...att,
          course_name: course?.course_name,
          course_code: course?.course_code
        };
      })
    );
    
    return c.json({ attendance: attendanceWithCourses });
  } catch (error) {
    console.log('Get my attendance error:', error);
    return c.json({ error: 'Internal server error while fetching attendance' }, 500);
  }
});

// Get all users (with role-based filtering)
app.get("/make-server-90ad488b/users", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const users = await kv.getByPrefix('user:');
    
    // Role-based filtering
    if (user.role === 'admin') {
      // Admin can see all users
      return c.json({ users });
    } else if (user.role === 'instructor') {
      // Instructor can see students in their courses
      const courses = await kv.getByPrefix('course:');
      const instructorCourses = courses.filter(c => c.instructor_id === user.id);
      const courseIds = instructorCourses.map(c => c.id);
      
      // Get enrollments for instructor's courses
      const enrollments = await kv.getByPrefix('enrollment:');
      const relevantEnrollments = enrollments.filter(e => courseIds.includes(e.course_id));
      const studentIds = relevantEnrollments.map(e => e.student_id);
      
      // Return students + self
      const accessibleUsers = users.filter(u => 
        u.id === user.id || 
        (u.role === 'student' && studentIds.includes(u.id))
      );
      
      return c.json({ users: accessibleUsers });
    } else {
      // Students and supervisors can only see themselves
      const selfUser = users.find(u => u.id === user.id);
      return c.json({ users: selfUser ? [selfUser] : [] });
    }
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Internal server error while fetching users' }, 500);
  }
});

// Health check endpoint
app.get("/make-server-90ad488b/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== LIVE SESSIONS ENDPOINTS ====================

// Helper functions for live sessions
function generateLiveSessionId(): string {
  return `live_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateAttendanceCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create new live session
app.post("/make-server-90ad488b/live-sessions", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const { course_id, title, type, scheduled_time } = await c.req.json();

    if (!course_id || !title || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['audio', 'video'].includes(type)) {
      return c.json({ error: 'Invalid session type' }, 400);
    }

    // Get course details
    const course = await kv.get(`course:${course_id}`);
    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Check if user is the instructor
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Only instructors can create live sessions' }, 403);
    }

    if (user.role === 'instructor' && course.instructor_id !== user.id) {
      return c.json({ error: 'You can only create sessions for your courses' }, 403);
    }

    const sessionId = generateLiveSessionId();
    const now = new Date().toISOString();

    const session = {
      id: sessionId,
      course_id,
      course_name: course.course_name,
      course_code: course.course_code,
      instructor_id: user.id,
      instructor_name: user.full_name,
      title,
      type,
      status: scheduled_time ? 'scheduled' : 'waiting',
      scheduled_time: scheduled_time || null,
      start_time: null,
      end_time: null,
      meeting_url: null,
      attendance_code: null,
      participants: [],
      created_at: now,
      updated_at: now,
    };

    await kv.set(`live_session:${sessionId}`, session);

    // Add to course sessions list
    const courseSessions = await kv.get(`course:${course_id}:live_sessions`) || [];
    courseSessions.push(sessionId);
    await kv.set(`course:${course_id}:live_sessions`, courseSessions);

    // Add to instructor sessions list
    const instructorSessions = await kv.get(`instructor:${user.id}:live_sessions`) || [];
    instructorSessions.push(sessionId);
    await kv.set(`instructor:${user.id}:live_sessions`, instructorSessions);

    return c.json({ 
      message: 'Live session created successfully',
      session 
    });
  } catch (err: any) {
    console.error('Error creating live session:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Start a live session
app.post("/make-server-90ad488b/live-sessions/:sessionId/start", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`live_session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.instructor_id !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    if (session.status === 'finished') {
      return c.json({ error: 'Session already finished' }, 400);
    }

    // Generate Jitsi meeting URL
    const meetingRoomName = `kku_${sessionId}`;
    const meetingUrl = `https://meet.jit.si/${meetingRoomName}`;
    const attendanceCode = generateAttendanceCode();

    session.status = 'ongoing';
    session.start_time = new Date().toISOString();
    session.meeting_url = meetingUrl;
    session.attendance_code = attendanceCode;
    session.updated_at = new Date().toISOString();

    await kv.set(`live_session:${sessionId}`, session);

    // Create notifications for all enrolled students
    const course = await kv.get(`course:${session.course_id}`);
    if (course) {
      const enrollments = await kv.getByPrefix(`enrollment:`);
      const courseEnrollments = enrollments.filter(e => e.course_id === session.course_id);

      for (const enrollment of courseEnrollments) {
        const studentId = enrollment.student_id;
        const notificationId = `notification_${Date.now()}_${studentId}`;
        const notification = {
          id: notificationId,
          user_id: studentId,
          type: 'live_session_started',
          title: 'جلسة مباشرة الآن',
          message: `بدأت جلسة مباشرة للمقرر ${session.course_name}`,
          data: {
            session_id: sessionId,
            course_id: session.course_id,
            course_name: session.course_name,
            meeting_url: meetingUrl,
          },
          read: false,
          created_at: new Date().toISOString(),
        };

        await kv.set(`notification:${notificationId}`, notification);

        const userNotifications = await kv.get(`user:${studentId}:notifications`) || [];
        userNotifications.unshift(notificationId);
        await kv.set(`user:${studentId}:notifications`, userNotifications.slice(0, 50));
      }
    }

    return c.json({ message: 'Live session started successfully', session });
  } catch (err: any) {
    console.error('Error starting live session:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// End a live session
app.post("/make-server-90ad488b/live-sessions/:sessionId/end", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`live_session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.instructor_id !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    session.status = 'finished';
    session.end_time = new Date().toISOString();
    session.updated_at = new Date().toISOString();

    await kv.set(`live_session:${sessionId}`, session);

    return c.json({ message: 'Live session ended successfully', session });
  } catch (err: any) {
    console.error('Error ending live session:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Join a live session (student)
app.post("/make-server-90ad488b/live-sessions/:sessionId/join", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`live_session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.status !== 'ongoing') {
      return c.json({ error: 'Session is not active' }, 400);
    }

    // Check if student is enrolled in the course
    const enrollment = await kv.get(`enrollment:${user.id}:${session.course_id}`);
    if (!enrollment && user.role !== 'admin') {
      return c.json({ error: 'You are not enrolled in this course' }, 403);
    }

    // Add student to participants if not already
    if (!session.participants.includes(user.id)) {
      session.participants.push(user.id);
      session.updated_at = new Date().toISOString();
      await kv.set(`live_session:${sessionId}`, session);

      // Auto-mark attendance
      const attendanceId = `attendance_${Date.now()}_${user.id}`;
      const attendance = {
        id: attendanceId,
        session_id: sessionId,
        student_id: user.id,
        student_name: user.full_name,
        course_id: session.course_id,
        status: 'present',
        session_type: 'live',
        date: new Date().toISOString(),
        marked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await kv.set(`attendance_record:${attendanceId}`, attendance);

      // Add to student attendance list
      const studentAttendance = await kv.get(`student:${user.id}:attendance`) || [];
      studentAttendance.push(attendanceId);
      await kv.set(`student:${user.id}:attendance`, studentAttendance);
    }

    return c.json({ 
      message: 'Joined session successfully',
      session: {
        id: session.id,
        title: session.title,
        type: session.type,
        meeting_url: session.meeting_url,
        course_name: session.course_name,
        instructor_name: session.instructor_name,
      }
    });
  } catch (err: any) {
    console.error('Error joining live session:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get instructor's live sessions
app.get("/make-server-90ad488b/live-sessions/instructor", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const sessionIds = await kv.get(`instructor:${user.id}:live_sessions`) || [];
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await kv.get(`live_session:${sessionId}`);
      if (session) {
        sessions.push(session);
      }
    }

    sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ sessions });
  } catch (err: any) {
    console.error('Error fetching instructor sessions:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get active live sessions for student
app.get("/make-server-90ad488b/live-sessions/active", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const allCourses = await kv.getByPrefix('course:');
    const enrollments = await kv.getByPrefix(`enrollment:${user.id}:`);
    const enrolledCourseIds = enrollments.map(e => e.course_id);
    const enrolledCourses = allCourses.filter(course => enrolledCourseIds.includes(course.id));

    const activeSessions = [];

    for (const course of enrolledCourses) {
      const sessionIds = await kv.get(`course:${course.id}:live_sessions`) || [];
      
      for (const sessionId of sessionIds) {
        const session = await kv.get(`live_session:${sessionId}`);
        if (session && (session.status === 'ongoing' || session.status === 'scheduled')) {
          activeSessions.push(session);
        }
      }
    }

    activeSessions.sort((a, b) => {
      if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
      if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return c.json({ sessions: activeSessions });
  } catch (err: any) {
    console.error('Error fetching student active sessions:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get session details
app.get("/make-server-90ad488b/live-sessions/:sessionId", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`live_session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Check access
    if (user.role === 'instructor') {
      if (session.instructor_id !== user.id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } else if (user.role === 'student') {
      const enrollment = await kv.get(`enrollment:${user.id}:${session.course_id}`);
      if (!enrollment) {
        return c.json({ error: 'You are not enrolled in this course' }, 403);
      }
    } else if (user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ session });
  } catch (err: any) {
    console.error('Error fetching session details:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user notifications
app.get("/make-server-90ad488b/notifications", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const notificationIds = await kv.get(`user:${user.id}:notifications`) || [];
    const notifications = [];

    for (const notificationId of notificationIds.slice(0, 20)) {
      const notification = await kv.get(`notification:${notificationId}`);
      if (notification) {
        notifications.push(notification);
      }
    }

    return c.json({ notifications });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark notification as read
app.post("/make-server-90ad488b/notifications/:notificationId/read", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('notificationId');
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    if (notification.user_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    notification.read = true;
    await kv.set(`notification:${notificationId}`, notification);

    return c.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);