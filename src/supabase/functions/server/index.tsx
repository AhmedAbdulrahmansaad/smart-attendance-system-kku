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
    
    if (!['student', 'instructor', 'admin', 'supervisor'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Validate university_id for students
    if (role === 'student' && !university_id) {
      return c.json({ error: 'University ID is required for students' }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
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
      created_at: new Date().toISOString()
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

// ==================== USER MANAGEMENT (ADMIN) ====================

app.get("/make-server-90ad488b/users", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Internal server error while fetching users' }, 500);
  }
});

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
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { student_id, course_id } = await c.req.json();
    
    if (!student_id || !course_id) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const enrollment = {
      student_id,
      course_id,
      enrolled_at: new Date().toISOString()
    };
    
    await kv.set(`enrollment:${student_id}:${course_id}`, enrollment);
    
    return c.json({ message: 'Student enrolled successfully', enrollment });
  } catch (error) {
    console.log('Create enrollment error:', error);
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

// Health check endpoint
app.get("/make-server-90ad488b/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);