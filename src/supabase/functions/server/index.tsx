import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.ts";

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
  const authHeader = request.headers.get('Authorization');
  console.log('🔐 [getAuthenticatedUser] Auth header:', authHeader ? 'Present' : 'Missing');
  
  const accessToken = authHeader?.split(' ')[1];
  if (!accessToken) {
    console.log('❌ [getAuthenticatedUser] No access token found');
    return { error: 'Missing authorization token', user: null };
  }
  
  console.log('🔑 [getAuthenticatedUser] Access token:', accessToken.substring(0, 20) + '...');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    console.log('❌ [getAuthenticatedUser] Supabase auth error:', error?.message || 'No user data');
    return { error: 'Unauthorized', user: null };
  }
  
  console.log('✅ [getAuthenticatedUser] Supabase auth success, user:', data.user.id);
  
  // Get user from database
  let userRecord = await db.getUserByAuthId(data.user.id);
  
  // If user doesn't exist in database, create it from user_metadata
  if (!userRecord) {
    console.log('🔧 [getAuthenticatedUser] User not found in DB, creating from metadata:', data.user.id);
    
    const metadata = data.user.user_metadata || {};
    try {
      // Double check if user was just created (race condition)
      userRecord = await db.getUserByAuthId(data.user.id);
      
      if (userRecord) {
        console.log('✅ [getAuthenticatedUser] User already exists (race condition avoided):', userRecord.email);
      } else {
        userRecord = await db.createUser({
          auth_id: data.user.id,
          email: data.user.email || '',
          full_name: metadata.full_name || metadata.name || 'User',
          role: metadata.role || 'student',
          university_id: metadata.university_id || undefined,
        });
        console.log('✅ [getAuthenticatedUser] User created in DB:', userRecord.email);
      }
    } catch (err: any) {
      console.error('❌ Error creating user:', err);
      
      // If it's a duplicate key error, try to get the user again
      if (err.code === '23505' || err.message?.includes('duplicate key')) {
        console.log('🔄 [getAuthenticatedUser] Duplicate key error, fetching existing user...');
        userRecord = await db.getUserByAuthId(data.user.id);
        
        if (userRecord) {
          console.log('✅ [getAuthenticatedUser] Found existing user after duplicate key error:', userRecord.email);
        } else {
          console.error('❌ [getAuthenticatedUser] Still cannot find user after duplicate error!');
          return { error: 'Error creating user', user: null };
        }
      } else {
        return { error: 'Error creating user', user: null };
      }
    }
  }
  
  if (!userRecord) {
    console.error('❌ [getAuthenticatedUser] User record is still null!');
    return { error: 'User record not found', user: null };
  }
  
  console.log('✅ [getAuthenticatedUser] User record loaded:', userRecord.email, 'role:', userRecord.role);
  return { error: null, user: userRecord };
}

// Helper to generate random code
function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==================== HEALTH CHECK ====================

// Health check endpoint (no auth required)
app.get("/make-server-90ad488b/health", async (c) => {
  return c.json({ 
    status: "healthy", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", async (c) => {
  return c.json({ 
    message: "KKU Attendance System API",
    status: "running",
    endpoints: {
      health: "/make-server-90ad488b/health",
      signup: "/make-server-90ad488b/signup",
      me: "/make-server-90ad488b/me",
    }
  });
});

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
      const idExists = await db.checkUniversityIdExists(university_id);
      if (idExists) {
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
    
    // Store user in database
    const userRecord = await db.createUser({
      auth_id: data.user.id,
      email,
      full_name,
      role,
      university_id: university_id || undefined,
    });
    
    // Log activity
    await db.logActivity({
      user_id: userRecord.id,
      action: 'user_signup',
      entity_type: 'user',
      entity_id: userRecord.id,
      log_status: 'success',
    });
    
    return c.json({ 
      message: 'User created successfully',
      user: userRecord
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get user info endpoint
app.get("/make-server-90ad488b/me", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    // Update last login
    await db.updateUserLastLogin(user.id);
    
    return c.json({ user });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Internal server error while fetching user' }, 500);
  }
});

// Session management - check and register session
app.post("/make-server-90ad488b/session/register", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const sessionToken = crypto.randomUUID();
    
    // Check for active sessions
    const activeSessions = await db.getActiveDeviceSessions(user.id);
    
    if (activeSessions.length > 0) {
      const recentSession = activeSessions[0];
      const sessionAge = Date.now() - new Date(recentSession.created_at).getTime();
      
      // If session is less than 30 seconds old, it's likely the same login
      if (sessionAge < 30000) {
        return c.json({ 
          session_id: recentSession.id,
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
    
    // Create new device session
    const deviceSession = await db.createDeviceSession({
      user_id: user.id,
      device_fingerprint: 'browser-' + crypto.randomUUID(),
      session_token: sessionToken,
    });
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'session_register',
      log_status: 'success',
    });
    
    return c.json({ 
      session_id: deviceSession.id,
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
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    // Deactivate all user sessions
    await db.deactivateAllUserSessions(user.id);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'session_logout',
      log_status: 'success',
    });
    
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
    
    // Get user to delete (for logging)
    const userToDelete = await db.getUserByAuthId(userId);
    
    // Delete from Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    await supabase.auth.admin.deleteUser(userId);
    
    // Database will cascade delete due to ON DELETE CASCADE
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'user_delete',
      entity_type: 'user',
      entity_id: userId,
      details: { deleted_user_email: userToDelete?.email },
      log_status: 'success',
    });
    
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log('Delete user error:', error);
    return c.json({ error: 'Internal server error while deleting user' }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-90ad488b/users", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return c.json({ error: 'Admin or Supervisor access required' }, 403);
    }
    
    const users = await db.getAllUsers();
    
    return c.json({ users });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Internal server error while fetching users' }, 500);
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
    
    const courseData = await c.req.json();
    
    if (!courseData.course_name || !courseData.course_code) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // If instructor creates course, automatically assign them as instructor
    if (user.role === 'instructor') {
      courseData.instructor_id = user.id;
    }
    
    // Add Arabic name if not provided
    if (!courseData.course_name_ar) {
      courseData.course_name_ar = courseData.course_name;
    }
    
    const course = await db.createCourse(courseData);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'course_create',
      entity_type: 'course',
      entity_id: course.id,
      log_status: 'success',
    });
    
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
    
    let courses = [];
    
    if (user.role === 'instructor') {
      // Get instructor's courses
      courses = await db.getCoursesByInstructor(user.id);
    } else if (user.role === 'student') {
      // Get enrolled courses
      const enrollments = await db.getEnrollmentsByStudent(user.id);
      courses = enrollments.map(e => e.course).filter(Boolean);
    } else {
      // Admin/Supervisor can see all courses
      courses = await db.getAllCourses();
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
    
    const course = await db.updateCourse(courseId, updates);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'course_update',
      entity_type: 'course',
      entity_id: courseId,
      log_status: 'success',
    });
    
    return c.json({ message: 'Course updated successfully', course });
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
    const course = await db.getCourseById(courseId);
    
    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }
    
    // Allow admin to delete any course, or instructor to delete their own courses
    if (user.role !== 'admin' && course.instructor_id !== user.id) {
      return c.json({ error: 'You can only delete your own courses' }, 403);
    }
    
    // Delete course (database will cascade delete related data)
    await db.deleteCourse(courseId);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'course_delete',
      entity_type: 'course',
      entity_id: courseId,
      log_status: 'success',
    });
    
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
    
    const enrollment = await db.createEnrollment(student_id, course_id);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'enrollment_create',
      entity_type: 'enrollment',
      entity_id: enrollment.id,
      log_status: 'success',
    });
    
    console.log('✅ Enrollment saved successfully!');
    
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
    const enrollments = await db.getEnrollmentsByCourse(courseId);
    
    return c.json({ enrollments });
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
    
    const scheduleData = await c.req.json();
    
    if (!scheduleData.course_id || !scheduleData.day_of_week || !scheduleData.start_time || !scheduleData.end_time) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    console.log('📝 [POST /schedules] Creating schedule with data:', scheduleData);
    
    const schedule = await db.createSchedule(scheduleData);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'schedule_create',
      entity_type: 'schedule',
      entity_id: schedule.id,
      log_status: 'success',
    });
    
    return c.json({ message: 'Schedule created successfully', schedule });
  } catch (error: any) {
    console.error('❌ [POST /schedules] Error:', error);
    return c.json({ error: error?.message || 'Internal server error while creating schedule' }, 500);
  }
});

app.get("/make-server-90ad488b/schedules", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      console.log('❌ [GET /schedules] Unauthorized:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    console.log('📅 [GET /schedules] Fetching schedules for user:', user.email, 'ID:', user.id, 'role:', user.role);
    
    const schedules = await db.getAllSchedules();
    console.log('📊 [GET /schedules] Total schedules in database:', schedules.length);
    
    if (schedules.length > 0) {
      console.log('📋 [GET /schedules] Sample schedule:', JSON.stringify(schedules[0], null, 2));
    }
    
    // Filter by role
    if (user.role === 'instructor') {
      console.log('👨‍🏫 [GET /schedules] Filtering for instructor...');
      const instructorSchedules = schedules.filter(s => {
        const matches = s.course?.instructor_id === user.id;
        if (!matches && s.course) {
          console.log(`⏭️ [GET /schedules] Skipping schedule for course ${s.course.course_code} (instructor: ${s.course.instructor_id})`);
        }
        return matches;
      });
      console.log('👨‍🏫 [GET /schedules] Instructor schedules found:', instructorSchedules.length);
      if (instructorSchedules.length > 0) {
        console.log('✅ [GET /schedules] Sample instructor schedule:', JSON.stringify(instructorSchedules[0], null, 2));
      }
      return c.json({ schedules: instructorSchedules });
    }
    
    if (user.role === 'student') {
      console.log('🎓 [GET /schedules] Filtering for student...');
      const enrollments = await db.getEnrollmentsByStudent(user.id);
      console.log('📚 [GET /schedules] Student enrollments:', enrollments.length);
      
      if (enrollments.length > 0) {
        console.log('📝 [GET /schedules] Sample enrollment:', JSON.stringify(enrollments[0], null, 2));
      }
      
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      console.log('📝 [GET /schedules] Enrolled course IDs:', enrolledCourseIds);
      
      const studentSchedules = schedules.filter(s => {
        const isEnrolled = enrolledCourseIds.includes(s.course_id);
        if (!isEnrolled) {
          console.log(`⏭️ [GET /schedules] Skipping schedule for course ${s.course_id} (not enrolled)`);
        }
        return isEnrolled;
      });
      
      console.log('🎓 [GET /schedules] Student schedules found:', studentSchedules.length);
      
      if (studentSchedules.length > 0) {
        console.log('✅ [GET /schedules] Student schedules:', JSON.stringify(studentSchedules, null, 2));
      } else {
        console.log('⚠️ [GET /schedules] No schedules found for student. Enrollments:', enrolledCourseIds, 'Available courses in schedules:', schedules.map(s => s.course_id));
      }
      
      return c.json({ schedules: studentSchedules });
    }
    
    console.log('👑 [GET /schedules] Admin/Supervisor - returning all', schedules.length, 'schedules');
    return c.json({ schedules });
  } catch (error: any) {
    console.error('❌ [GET /schedules] Error:', error);
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
    await db.deleteSchedule(scheduleId);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'schedule_delete',
      entity_type: 'schedule',
      entity_id: scheduleId,
      log_status: 'success',
    });
    
    return c.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.log('Delete schedule error:', error);
    return c.json({ error: 'Internal server error while deleting schedule' }, 500);
  }
});

// ==================== SESSION MANAGEMENT (ATTENDANCE CODES & LIVE STREAMING) ====================

app.post("/make-server-90ad488b/sessions", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Instructor access required' }, 403);
    }
    
    const { course_id, duration_minutes, session_type, title, description, location } = await c.req.json();
    
    if (!course_id) {
      return c.json({ error: 'Missing course_id' }, 400);
    }
    
    // Verify instructor teaches this course (if instructor)
    if (user.role === 'instructor') {
      const course = await db.getCourseById(course_id);
      if (!course || course.instructor_id !== user.id) {
        return c.json({ error: 'You are not authorized to create sessions for this course' }, 403);
      }
    }
    
    const code = generateSessionCode();
    
    const session = await db.createSession({
      course_id,
      instructor_id: user.id,
      session_type: session_type || 'attendance',
      title,
      description,
      code,
      duration_minutes: duration_minutes || 15,
      location,
    });
    
    // Create notifications for students if it's a live session
    if (session_type === 'live') {
      const enrollments = await db.getEnrollmentsByCourse(course_id);
      const course = await db.getCourseById(course_id);
      for (const enrollment of enrollments) {
        await db.createNotification({
          user_id: enrollment.student_id,
          title: 'Live Session Started',
          title_ar: 'بدأت جلسة بث مباشر',
          message: `A live session has started for ${course?.course_name || 'course'}`,
          message_ar: `بدأت جلسة بث مباشر لمقرر ${course?.course_name_ar || 'المقرر'}`,
          notification_type: 'session_started',
          related_id: session.id,
          related_type: 'session',
          priority: 'high',
        });
      }
    }
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'session_create',
      entity_type: 'session',
      entity_id: session.id,
      log_status: 'success',
    });
    
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
    const sessions = await db.getSessionsByCourse(courseId);
    
    return c.json({ sessions });
  } catch (error) {
    console.log('Get sessions error:', error);
    return c.json({ error: 'Internal server error while fetching sessions' }, 500);
  }
});

// Get all active live sessions
app.get("/make-server-90ad488b/sessions", async (c) => {
  try {
    console.log('📡 GET /sessions - Fetching active live sessions');
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    // Get all active live sessions
    let sessions = await db.getAllActiveLiveSessions();
    
    // Filter by role
    if (user.role === 'student') {
      const enrollments = await db.getEnrollmentsByStudent(user.id);
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      sessions = sessions.filter(s => enrolledCourseIds.includes(s.course_id));
    } else if (user.role === 'instructor') {
      sessions = sessions.filter(s => s.instructor_id === user.id);
    }
    
    // Get courses
    const courseIds = [...new Set(sessions.map(s => s.course_id))];
    const courses = [];
    for (const courseId of courseIds) {
      const course = await db.getCourseById(courseId);
      if (course) courses.push(course);
    }
    
    return c.json({ 
      data: {
        sessions,
        courses
      }
    });
  } catch (error) {
    console.log('Get live sessions error:', error);
    return c.json({ error: 'Internal server error while fetching live sessions' }, 500);
  }
});

// Get all sessions (both regular and live)
app.get("/make-server-90ad488b/sessions/all", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    let sessions = await db.getAllSessions();
    
    // Filter based on role
    if (user.role === 'instructor') {
      sessions = sessions.filter(s => s.instructor_id === user.id);
    } else if (user.role === 'student') {
      const enrollments = await db.getEnrollmentsByStudent(user.id);
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      sessions = sessions.filter(s => enrolledCourseIds.includes(s.course_id));
    }
    
    return c.json({ sessions });
  } catch (error) {
    console.log('Get all sessions error:', error);
    return c.json({ error: 'Internal server error while fetching sessions' }, 500);
  }
});

// Start live session
app.post("/make-server-90ad488b/live-sessions/:id/start", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Instructor access required' }, 403);
    }
    
    const sessionId = c.req.param('id');
    
    console.log('🔍 [Server] Starting live session:', {
      sessionId,
      userId: user.id,
      userRole: user.role,
    });
    
    const sessions = await db.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      console.log('❌ [Server] Session not found:', sessionId);
      return c.json({ error: 'Session not found' }, 404);
    }
    
    console.log('📋 [Server] Session details:', {
      sessionId: session.id,
      instructorId: session.instructor_id,
      userId: user.id,
      isMatch: session.instructor_id === user.id,
    });
    
    // Allow admin to start any session, or instructor to start their own session
    if (user.role !== 'admin' && session.instructor_id !== user.id) {
      console.log('❌ [Server] Authorization failed:', {
        sessionInstructorId: session.instructor_id,
        currentUserId: user.id,
        userRole: user.role,
      });
      return c.json({ error: 'You are not authorized to start this session' }, 403);
    }
    
    // Generate unique Jitsi room name
    const roomName = `kku-session-${sessionId.substring(0, 8)}-${Date.now()}`;
    const meetingUrl = `https://meet.jit.si/${roomName}`;
    
    // Update session to mark as active
    const updatedSession = await db.updateSession(sessionId, {
      stream_active: true,
      is_active: true,
    });
    
    console.log('✅ [Server] Live session started:', {
      sessionId,
      roomName,
      meetingUrl,
    });
    
    return c.json({
      success: true,
      session: {
        ...updatedSession,
        meeting_url: meetingUrl,
        attendance_code: session.code,
      },
    });
  } catch (error) {
    console.log('Start live session error:', error);
    return c.json({ error: 'Internal server error while starting live session' }, 500);
  }
});

// End live session
app.post("/make-server-90ad488b/live-sessions/:id/end", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Instructor access required' }, 403);
    }
    
    const sessionId = c.req.param('id');
    
    await db.updateSession(sessionId, {
      stream_active: false,
      is_active: false,
    });
    
    console.log('✅ [Server] Live session ended:', sessionId);
    
    return c.json({
      success: true,
      message: 'Live session ended successfully',
    });
  } catch (error) {
    console.log('End live session error:', error);
    return c.json({ error: 'Internal server error while ending live session' }, 500);
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
    const session = await db.getSessionsByCourse('');
    const targetSession = session.find(s => s.id === sessionId);
    
    if (!targetSession) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    if (targetSession.instructor_id !== user.id) {
      return c.json({ error: 'You are not authorized to deactivate this session' }, 403);
    }
    
    await db.deactivateSession(sessionId);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'session_deactivate',
      entity_type: 'session',
      entity_id: sessionId,
      log_status: 'success',
    });
    
    return c.json({ message: 'Session deactivated successfully' });
  } catch (error) {
    console.log('Deactivate session error:', error);
    return c.json({ error: 'Internal server error while deactivating session' }, 500);
  }
});

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
    const sessions = await db.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    if (session.instructor_id !== user.id) {
      return c.json({ error: 'You are not authorized to delete this session' }, 403);
    }
    
    // Delete session (database will cascade delete attendance records)
    await db.deleteSession(sessionId);
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'session_delete',
      entity_type: 'session',
      entity_id: sessionId,
      log_status: 'success',
    });
    
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
    
    const { session_code, device_fingerprint } = await c.req.json();
    
    if (!session_code) {
      return c.json({ error: 'Missing session code' }, 400);
    }
    
    // Find session by code
    const session = await db.getSessionByCode(session_code);
    if (!session || !session.is_active) {
      return c.json({ error: 'Invalid or inactive session code' }, 400);
    }
    
    // Check if session expired
    if (new Date(session.end_time) < new Date()) {
      return c.json({ error: 'Session has expired' }, 400);
    }
    
    // Check if student is enrolled in the course
    const enrollments = await db.getEnrollmentsByStudent(user.id);
    const isEnrolled = enrollments.some(e => e.course_id === session.course_id);
    if (!isEnrolled) {
      return c.json({ error: 'You are not enrolled in this course' }, 403);
    }
    
    // Check if already marked attendance
    const hasAttendance = await db.checkAttendanceExists(session.id, user.id);
    if (hasAttendance) {
      return c.json({ error: 'Attendance already recorded for this session' }, 400);
    }
    
    // Create attendance record
    const attendance = await db.createAttendanceRecord({
      session_id: session.id,
      student_id: user.id,
      course_id: session.course_id,
      attendance_status: 'present',
      verification_method: 'code',
      device_fingerprint: device_fingerprint || 'unknown',
    });
    
    // Log activity
    await db.logActivity({
      user_id: user.id,
      action: 'attendance_record',
      entity_type: 'attendance',
      entity_id: attendance.id,
      log_status: 'success',
    });
    
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
    
    const attendance = await db.getAttendanceByStudent(user.id);
    
    return c.json({ attendance });
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
      const course = await db.getCourseById(courseId);
      if (!course || course.instructor_id !== user.id) {
        return c.json({ error: 'You are not authorized to view this course attendance' }, 403);
      }
    }
    
    const attendance = await db.getAttendanceByCourse(courseId);
    
    return c.json({ attendance });
  } catch (error) {
    console.log('Get course attendance error:', error);
    return c.json({ error: 'Internal server error while fetching course attendance' }, 500);
  }
});

app.get("/make-server-90ad488b/attendance/today", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    let attendance = await db.getTodayAttendance();
    
    // Filter by role
    if (user.role === 'instructor') {
      const courses = await db.getCoursesByInstructor(user.id);
      const courseIds = courses.map(c => c.id);
      attendance = attendance.filter(a => courseIds.includes(a.course_id));
    } else if (user.role === 'student') {
      attendance = attendance.filter(a => a.student_id === user.id);
    }
    
    return c.json({ attendance });
  } catch (error) {
    console.log('Get today attendance error:', error);
    return c.json({ error: 'Internal server error while fetching today attendance' }, 500);
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
      const course = await db.getCourseById(courseId);
      if (!course || course.instructor_id !== user.id) {
        return c.json({ error: 'You are not authorized to view this course report' }, 403);
      }
    }
    
    // Get enrollments, sessions, and attendance
    const enrollments = await db.getEnrollmentsByCourse(courseId);
    const sessions = await db.getSessionsByCourse(courseId);
    const attendance = await db.getAttendanceByCourse(courseId);
    
    // Build report
    const report = enrollments.map(enrollment => {
      const studentAttendance = attendance.filter(a => a.student_id === enrollment.student_id);
      const attendanceRate = sessions.length > 0 
        ? (studentAttendance.length / sessions.length) * 100 
        : 0;
      
      return {
        student_id: enrollment.student_id,
        student_name: enrollment.student?.full_name || 'Unknown',
        student_email: enrollment.student?.email || '',
        total_sessions: sessions.length,
        attended_sessions: studentAttendance.length,
        attendance_rate: Math.round(attendanceRate),
        attendance_records: studentAttendance
      };
    });
    
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
    
    const stats = await db.getSystemStats();
    let overview = { ...stats };
    
    // Add role-specific stats
    if (user.role === 'instructor') {
      const courses = await db.getCoursesByInstructor(user.id);
      const courseIds = courses.map(c => c.id);
      
      let sessionsCount = 0;
      let attendanceCount = 0;
      for (const courseId of courseIds) {
        const sessions = await db.getSessionsByCourse(courseId);
        const attendance = await db.getAttendanceByCourse(courseId);
        sessionsCount += sessions.length;
        attendanceCount += attendance.length;
      }
      
      overview = {
        ...overview,
        my_courses: courses.length,
        my_sessions: sessionsCount,
        my_attendance_records: attendanceCount
      };
    }
    
    if (user.role === 'student') {
      const enrollments = await db.getEnrollmentsByStudent(user.id);
      const attendance = await db.getAttendanceByStudent(user.id);
      
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      let totalSessions = 0;
      for (const courseId of enrolledCourseIds) {
        const sessions = await db.getSessionsByCourse(courseId);
        totalSessions += sessions.length;
      }
      
      const attendanceRate = totalSessions > 0 
        ? (attendance.length / totalSessions) * 100 
        : 0;
      
      overview = {
        ...overview,
        my_courses: enrollments.length,
        my_attendance_records: attendance.length,
        total_sessions: totalSessions,
        my_attendance_rate: Math.round(attendanceRate)
      };
    }
    
    return c.json({ overview });
  } catch (error) {
    console.log('Get overview error:', error);
    return c.json({ error: 'Internal server error while generating overview' }, 500);
  }
});

// ==================== NOTIFICATIONS ====================

app.get("/make-server-90ad488b/notifications", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const notifications = await db.getNotificationsByUser(user.id);
    
    return c.json({ notifications });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: 'Internal server error while fetching notifications' }, 500);
  }
});

app.post("/make-server-90ad488b/notifications/:notificationId/read", async (c) => {
  try {
    const { error, user } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const notificationId = c.req.param('notificationId');
    await db.markNotificationAsRead(notificationId);
    
    return c.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.log('Mark notification as read error:', error);
    return c.json({ error: 'Internal server error while marking notification as read' }, 500);
  }
});

// ==================== PUBLIC STATS ENDPOINT ====================

// Get public stats for landing page (no authentication required)
app.get("/make-server-90ad488b/stats/public", async (c) => {
  try {
    console.log('📊 GET /stats/public - Fetching public statistics');
    
    const stats = await db.getPublicStats();
    
    console.log('✅ Public stats retrieved:', stats);
    
    return c.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.log('❌ Get public stats error:', error);
    return c.json({ 
      success: false,
      error: 'Internal server error while fetching public stats',
      stats: {
        studentsCount: 0,
        instructorsCount: 0,
        coursesCount: 0,
        attendanceRate: 0
      }
    }, 500);
  }
});

// Start server
Deno.serve(app.fetch);