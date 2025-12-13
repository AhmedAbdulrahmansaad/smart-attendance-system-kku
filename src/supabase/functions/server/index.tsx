import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

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

// Create Supabase client helper
function getSupabaseClient(useServiceRole = false) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = useServiceRole 
    ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    : Deno.env.get('SUPABASE_ANON_KEY')!;
  
  return createClient(url, key);
}

// Helper to get authenticated user from SQL database
async function getAuthenticatedUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'Missing authorization token', user: null };
  }
  
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: 'Unauthorized', user: null };
  }
  
  // Get user profile from SQL database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profileError || !profile) {
    console.log('❌ Profile not found for user:', data.user.id);
    return { error: 'Profile not found', user: null };
  }
  
  return { error: null, user: profile };
}

// Helper to generate random session code
function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==================== AUTH ENDPOINTS ====================

// Health check endpoint
app.get("/make-server-90ad488b/health", async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error);
      return c.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: false,
        message: 'Database connection failed',
        messageAr: 'فشل الاتصال بقاعدة البيانات',
        error: error.message
      }, 500);
    }
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: true,
      message: 'Backend is running correctly with SQL database',
      messageAr: 'الخادم يعمل بشكل صحيح مع قاعدة البيانات'
    });
  } catch (error) {
    console.log('❌ Health check error:', error);
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: false,
      message: 'Backend has issues',
      messageAr: 'الخادم يواجه مشاكل',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-90ad488b/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, full_name, role, university_id } = body;
    
    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return c.json({ 
        error: 'Missing required fields',
        messageAr: 'جميع الحقول مطلوبة'
      }, 400);
    }
    
    // Validate email format (must be @kku.edu.sa)
    if (!email.endsWith('@kku.edu.sa')) {
      return c.json({ 
        error: 'Email must be a valid KKU email (@kku.edu.sa)',
        messageAr: 'يجب أن يكون البريد الإلكتروني من جامعة الملك خالد (@kku.edu.sa)'
      }, 400);
    }
    
    // Validate role
    const validRoles = ['admin', 'instructor', 'student', 'supervisor'];
    if (!validRoles.includes(role)) {
      return c.json({ 
        error: 'Invalid role',
        messageAr: 'الدور غير صحيح'
      }, 400);
    }
    
    // Validate student-specific fields
    if (role === 'student') {
      if (!university_id) {
        return c.json({ 
          error: 'University ID is required for students',
          messageAr: 'الرقم الجامعي مطلوب للطلاب'
        }, 400);
      }
      
      // Validate university ID format: 9 digits starting with 44
      const universityIdRegex = /^44\d{7}$/;
      if (!universityIdRegex.test(university_id)) {
        return c.json({ 
          error: 'University ID must be 9 digits starting with 44 (e.g., 441234567)',
          messageAr: 'الرقم الجامعي يجب أن يكون 9 أرقام تبدأ بـ 44 (مثال: 441234567)'
        }, 400);
      }
      
      // Check if university ID already exists in SQL database
      const supabase = getSupabaseClient();
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('university_id', university_id)
        .single();
      
      if (existingProfile && !checkError) {
        console.log(`❌ Signup failed: University ID already registered - ${university_id}`);
        return c.json({ 
          error: 'University ID already registered',
          message: 'This University ID is already registered. Please use Sign In instead.',
          messageAr: 'هذا الرقم الجامعي مسجل مسبقاً. الرجاء استخدام تسجيل الدخول.'
        }, 400);
      }
    }
    
    const supabase = getSupabaseClient(true); // Use service role for auth admin
    
    // First, check if email already exists in profiles table
    console.log('🔍 Checking if email exists in profiles...');
    const { data: existingEmailProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingEmailProfile) {
      console.log(`❌ Signup failed: Email already exists in profiles - ${email}`);
      return c.json({ 
        error: 'Email already registered',
        message: 'This email is already registered. Please use Sign In instead.',
        messageAr: 'هذا البريد مسجل مسبقاً. الرجاء استخدام تسجيل الدخول.'
      }, 400);
    }
    
    // Create user in Supabase Auth
    console.log('🔐 Creating user in Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server hasn't been configured
      user_metadata: { full_name, role, university_id: university_id || null }
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      
      // Check if email already exists
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('User already registered')) {
        return c.json({ 
          error: 'Email already registered',
          message: 'This email is already registered. Please use Sign In instead.',
          messageAr: 'هذا البريد مسجل مسبقاً. الرجاء استخدام تسجيل الدخول.'
        }, 400);
      }
      
      return c.json({ error: authError.message }, 400);
    }
    
    console.log('✅ User created in Auth:', authData.user.id);
    
    // Create profile in SQL database
    console.log('💾 Creating profile in database...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        university_id: university_id || null
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Profile creation error:', profileError);
      
      // Check if it's a duplicate key error
      if (profileError.message.includes('duplicate key') || profileError.code === '23505') {
        console.log('⚠️ Profile already exists, attempting to fetch existing profile...');
        
        // Try to get the existing profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (existingProfile) {
          console.log('✅ Found existing profile, returning it');
          return c.json({ 
            message: 'User profile retrieved successfully',
            messageAr: 'تم استرجاع الحساب بنجاح',
            user: existingProfile
          });
        }
      }
      
      // If profile creation fails and we can't find existing, delete the auth user
      console.log('🗑️ Deleting auth user due to profile creation failure...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return c.json({ 
        error: 'Failed to create profile',
        details: profileError.message,
        messageAr: 'فشل إنشاء الملف الشخصي'
      }, 500);
    }
    
    console.log('✅ Profile created successfully:', profileData);
    
    return c.json({ 
      message: 'User created successfully',
      messageAr: 'تم إنشاء الحساب بنجاح',
      user: profileData
    });
  } catch (error) {
    console.log('❌ Signup error:', error);
    return c.json({ 
      error: 'Internal server error during signup',
      details: error instanceof Error ? error.message : 'Unknown error',
      messageAr: 'حدث خطأ داخلي أثناء التسجيل'
    }, 500);
  }
});

// Get current user endpoint
app.get("/make-server-90ad488b/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Missing authorization token' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      console.log('❌ Auth error in /me:', error);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }
    
    // Get user profile from SQL database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError || !profile) {
      console.log('❌ Profile not found for user:', data.user.id);
      
      // Try to create profile from user_metadata
      const metadata = data.user.user_metadata || {};
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: metadata.full_name || metadata.name || 'User',
          role: metadata.role || 'student',
          university_id: metadata.university_id || null
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Failed to create profile:', createError);
        return c.json({ error: 'Profile not found and creation failed' }, 404);
      }
      
      return c.json({ user: newProfile });
    }
    
    return c.json({ user: profile });
  } catch (error) {
    console.log('❌ Get user error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==================== STATS ENDPOINTS ====================

// Public stats endpoint for landing page
app.get("/make-server-90ad488b/stats/public", async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Get students count
    const { count: studentsCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    
    // Get instructors count
    const { count: instructorsCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'instructor');
    
    // Get courses count
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    
    // Calculate attendance rate
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status');
    
    let attendanceRate = 99.8;
    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      attendanceRate = (presentCount / attendanceData.length) * 100;
    }
    
    console.log('📊 Public stats:', { studentsCount, instructorsCount, coursesCount, attendanceRate });
    
    return c.json({
      stats: {
        studentsCount: studentsCount || 0,
        instructorsCount: instructorsCount || 0,
        coursesCount: coursesCount || 0,
        attendanceRate: Number(attendanceRate.toFixed(1))
      }
    });
  } catch (error) {
    console.log('❌ Stats error:', error);
    return c.json({
      stats: {
        studentsCount: 0,
        instructorsCount: 0,
        coursesCount: 0,
        attendanceRate: 99.8
      }
    });
  }
});

// Dashboard stats endpoint (Admin, Instructor, Supervisor)
app.get("/make-server-90ad488b/stats/dashboard", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    // Get total counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    
    const { count: totalInstructors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'instructor');
    
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get active sessions today
    const { count: activeSessionsToday } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    // Get today's attendance
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('status')
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());
    
    const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0;
    const absentToday = todayAttendance?.filter(a => a.status === 'absent').length || 0;
    const totalToday = todayAttendance?.length || 0;
    const attendanceRateToday = totalToday > 0 ? (presentToday / totalToday) * 100 : 0;
    
    console.log('📊 Dashboard stats:', {
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalSessions,
      activeSessionsToday,
      attendanceRateToday
    });
    
    return c.json({
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalInstructors: totalInstructors || 0,
      totalCourses: totalCourses || 0,
      totalSessions: totalSessions || 0,
      activeSessionsToday: activeSessionsToday || 0,
      attendanceRateToday: Number(attendanceRateToday.toFixed(1)),
      presentToday,
      absentToday
    });
  } catch (error) {
    console.log('❌ Dashboard stats error:', error);
    return c.json({
      totalUsers: 0,
      totalStudents: 0,
      totalInstructors: 0,
      totalCourses: 0,
      totalSessions: 0,
      activeSessionsToday: 0,
      attendanceRateToday: 0,
      presentToday: 0,
      absentToday: 0
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Get all users (Admin only)
app.get("/make-server-90ad488b/users", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const supabase = getSupabaseClient();
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching users:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ users: profiles || [] });
  } catch (error) {
    console.log('❌ Get users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get courses (accessible by all authenticated users)
app.get("/make-server-90ad488b/courses", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('courses')
      .select(`
        *,
        instructor:instructor_id (
          id,
          full_name,
          email
        )
      `);
    
    // If instructor, only show their courses
    if (user.role === 'instructor') {
      query = query.eq('instructor_id', user.id);
    }
    
    // If student, show enrolled courses
    if (user.role === 'student') {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);
      
      const courseIds = enrollments?.map(e => e.course_id) || [];
      
      if (courseIds.length > 0) {
        query = query.in('id', courseIds);
      } else {
        return c.json({ courses: [] });
      }
    }
    
    const { data: courses, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching courses:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ courses: courses || [] });
  } catch (error) {
    console.log('❌ Get courses error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create course (Admin or Instructor)
app.post("/make-server-90ad488b/courses", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'admin' && user.role !== 'instructor') {
      return c.json({ error: 'Forbidden - Admin or Instructor access required' }, 403);
    }
    
    const { course_name, course_code, instructor_id } = await c.req.json();
    
    if (!course_name || !course_code) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        course_name,
        course_code,
        instructor_id: instructor_id || (user.role === 'instructor' ? user.id : null)
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error creating course:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ course });
  } catch (error) {
    console.log('❌ Create course error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== SESSION ENDPOINTS ====================

// Get sessions
app.get("/make-server-90ad488b/sessions", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        course:course_id (
          id,
          course_name,
          course_code
        ),
        creator:created_by (
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching sessions:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ sessions: sessions || [] });
  } catch (error) {
    console.log('❌ Get sessions error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create session (Instructor only)
app.post("/make-server-90ad488b/sessions", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ error: 'Forbidden - Instructor access required' }, 403);
    }
    
    const { course_id, duration, session_type, title, description } = await c.req.json();
    
    if (!course_id) {
      return c.json({ error: 'Missing course_id' }, 400);
    }
    
    const code = generateSessionCode();
    const expiresAt = new Date(Date.now() + (duration || 30) * 60 * 1000); // Default 30 minutes
    
    const supabase = getSupabaseClient();
    
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        course_id,
        code,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        session_type: session_type || 'attendance',
        title,
        description,
        active: true
      })
      .select(`
        *,
        course:course_id (
          id,
          course_name,
          course_code
        )
      `)
      .single();
    
    if (error) {
      console.log('❌ Error creating session:', error);
      return c.json({ error: error.message }, 500);
    }
    
    console.log('✅ Session created:', session);
    
    return c.json({ session });
  } catch (error) {
    console.log('❌ Create session error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Submit attendance
app.post("/make-server-90ad488b/attendance", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'student') {
      return c.json({ error: 'Forbidden - Student access required' }, 403);
    }
    
    const { session_code, device_fingerprint } = await c.req.json();
    
    if (!session_code) {
      return c.json({ error: 'Missing session code' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Find session by code
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', session_code.toUpperCase())
      .eq('active', true)
      .single();
    
    if (sessionError || !session) {
      return c.json({ 
        error: 'Invalid or expired session code',
        messageAr: 'رمز الجلسة غير صحيح أو منتهي الصلاحية'
      }, 404);
    }
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return c.json({ 
        error: 'Session has expired',
        messageAr: 'انتهت صلاحية الجلسة'
      }, 400);
    }
    
    // Check if student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', session.course_id)
      .single();
    
    if (enrollmentError || !enrollment) {
      return c.json({ 
        error: 'You are not enrolled in this course',
        messageAr: 'أنت غير مسجل في هذا المقرر'
      }, 403);
    }
    
    // Record attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .upsert({
        student_id: user.id,
        session_id: session.id,
        course_id: session.course_id,
        status: 'present',
        device_fingerprint,
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'student_id,session_id'
      })
      .select()
      .single();
    
    if (attendanceError) {
      console.log('❌ Error recording attendance:', attendanceError);
      return c.json({ error: attendanceError.message }, 500);
    }
    
    console.log('✅ Attendance recorded:', attendance);
    
    return c.json({ 
      message: 'Attendance recorded successfully',
      messageAr: 'تم تسجيل الحضور بنجاح',
      attendance 
    });
  } catch (error) {
    console.log('❌ Submit attendance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get attendance records
app.get("/make-server-90ad488b/attendance", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:student_id (
          id,
          full_name,
          email,
          university_id
        ),
        course:course_id (
          id,
          course_name,
          course_code
        ),
        session:session_id (
          id,
          code,
          created_at
        )
      `);
    
    // If student, only show their attendance
    if (user.role === 'student') {
      query = query.eq('student_id', user.id);
    }
    
    const { data: attendance, error } = await query.order('timestamp', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching attendance:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ attendance: attendance || [] });
  } catch (error) {
    console.log('❌ Get attendance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get today's attendance
app.get("/make-server-90ad488b/attendance/today", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:student_id (
          id,
          full_name,
          email,
          university_id
        ),
        course:course_id (
          id,
          course_name,
          course_code
        ),
        session:session_id (
          id,
          code,
          created_at
        )
      `)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());
    
    // If student, only show their attendance
    if (user.role === 'student') {
      query = query.eq('student_id', user.id);
    }
    
    const { data: attendance, error } = await query.order('timestamp', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching today\'s attendance:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ attendance: attendance || [] });
  } catch (error) {
    console.log('❌ Get today\'s attendance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== AUTO-GENERATE EMAIL ====================

// Generate email from name
app.post("/make-server-90ad488b/generate-email", async (c) => {
  try {
    const { full_name } = await c.req.json();
    
    if (!full_name) {
      return c.json({ error: 'Missing full_name' }, 400);
    }
    
    // Convert Arabic/English name to email format
    const nameParts = full_name.trim().split(/\s+/);
    let emailPrefix = '';
    
    // Use first and last name
    if (nameParts.length >= 2) {
      emailPrefix = `${nameParts[0]}.${nameParts[nameParts.length - 1]}`.toLowerCase();
    } else {
      emailPrefix = nameParts[0].toLowerCase();
    }
    
    // Transliterate Arabic to English (basic)
    const arabicToEnglish: { [key: string]: string } = {
      'أ': 'a', 'ا': 'a', 'إ': 'i', 'آ': 'a',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
      'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
      'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
      'ة': 'h', 'ء': 'a'
    };
    
    emailPrefix = emailPrefix.split('').map(char => 
      arabicToEnglish[char] || char
    ).join('');
    
    // Clean up and add domain
    emailPrefix = emailPrefix.replace(/[^a-z.]/g, '');
    const email = `${emailPrefix}@kku.edu.sa`;
    
    return c.json({ email });
  } catch (error) {
    console.log('❌ Generate email error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== ENROLLMENTS ENDPOINTS ====================

// Enroll student in course
app.post("/make-server-90ad488b/enrollments", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const { student_id, course_id } = await c.req.json();
    
    if (!student_id || !course_id) {
      return c.json({ 
        error: 'Missing student_id or course_id',
        messageAr: 'معرف الطالب أو المقرر مفقود'
      }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .single();
    
    if (existing) {
      return c.json({ 
        error: 'Student already enrolled in this course',
        messageAr: 'الطالب مسجل مسبقاً في هذا المقرر'
      }, 400);
    }
    
    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        student_id,
        course_id,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Enrollment error:', error);
      return c.json({ error: error.message }, 500);
    }
    
    console.log('✅ Student enrolled:', enrollment);
    
    return c.json({ 
      message: 'Student enrolled successfully',
      messageAr: 'تم تسجيل الطالب بنجاح',
      enrollment 
    });
  } catch (error) {
    console.log('❌ Enrollment error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get enrollments
app.get("/make-server-90ad488b/enrollments", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        student:student_id (
          id,
          full_name,
          email,
          university_id
        ),
        course:course_id (
          id,
          course_name,
          course_code
        )
      `);
    
    // If student, only show their enrollments
    if (user.role === 'student') {
      query = query.eq('student_id', user.id);
    }
    
    const { data: enrollments, error } = await query.order('enrolled_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching enrollments:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ enrollments: enrollments || [] });
  } catch (error) {
    console.log('❌ Get enrollments error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== LIVE SESSIONS ENDPOINTS ====================

// Start live session
app.post("/make-server-90ad488b/live-sessions/:id/start", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ 
        error: 'Only instructors can start live sessions',
        messageAr: 'يمكن للمدرسين فقط بدء الجلسات المباشرة'
      }, 403);
    }
    
    const sessionId = c.req.param('id');
    
    const supabase = getSupabaseClient();
    
    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return c.json({ 
        error: 'Session not found',
        messageAr: 'الجلسة غير موجودة'
      }, 404);
    }
    
    // Generate Jitsi room name
    const roomName = `kku_session_${sessionId}_${Date.now()}`;
    const meetingUrl = `https://meet.jit.si/${roomName}`;
    const attendanceCode = generateSessionCode();
    
    // Create or update live session record
    const { data: liveSession, error: liveError } = await supabase
      .from('live_sessions')
      .upsert({
        id: sessionId,
        course_id: session.course_id,
        instructor_id: user.id,
        title: session.title || 'Live Session',
        description: session.description,
        jitsi_room_name: roomName,
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        status: 'live'
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (liveError) {
      console.log('❌ Live session creation error:', liveError);
    }
    
    // Update session to mark it as live
    await supabase
      .from('sessions')
      .update({ 
        session_type: 'live',
        active: true
      })
      .eq('id', sessionId);
    
    console.log('✅ Live session started:', { sessionId, roomName, meetingUrl });
    
    return c.json({
      message: 'Live session started successfully',
      messageAr: 'تم بدء الجلسة المباشرة بنجاح',
      meetingUrl,
      roomName,
      attendanceCode,
      sessionId
    });
  } catch (error) {
    console.log('❌ Start live session error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// End live session
app.post("/make-server-90ad488b/live-sessions/:id/end", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return c.json({ 
        error: 'Only instructors can end live sessions',
        messageAr: 'يمكن للمدرسين فقط إنهاء الجلسات المباشرة'
      }, 403);
    }
    
    const sessionId = c.req.param('id');
    
    const supabase = getSupabaseClient();
    
    // Update live session
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        ended_at: new Date().toISOString(),
        status: 'ended'
      })
      .eq('id', sessionId);
    
    if (updateError) {
      console.log('❌ Error ending live session:', updateError);
    }
    
    // Deactivate the session
    await supabase
      .from('sessions')
      .update({ active: false })
      .eq('id', sessionId);
    
    console.log('✅ Live session ended:', sessionId);
    
    return c.json({
      message: 'Live session ended successfully',
      messageAr: 'تم إنهاء الجلسة المباشرة بنجاح'
    });
  } catch (error) {
    console.log('❌ End live session error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Record attendance when joining live session
app.post("/make-server-90ad488b/live-session-join", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const { sessionId, participantName, participantEmail } = await c.req.json();
    
    if (!sessionId) {
      return c.json({ 
        error: 'Missing sessionId',
        messageAr: 'معرف الجلسة مفقود'
      }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      console.log('⚠️ Session not found for live join:', sessionId);
      // Don't fail - just log the attendance attempt
    }
    
    // Record attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        student_id: user.id,
        session_id: sessionId,
        status: 'present',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      })
      .select()
      .single();
    
    if (attendanceError) {
      // Check if already recorded
      if (attendanceError.code === '23505') {
        console.log('ℹ️ Attendance already recorded for this student in this session');
        return c.json({
          message: 'Attendance already recorded',
          messageAr: 'تم تسجيل الحضور مسبقاً'
        });
      }
      
      console.log('❌ Attendance recording error:', attendanceError);
      return c.json({ error: attendanceError.message }, 500);
    }
    
    console.log('✅ Attendance recorded for live session join:', attendance);
    
    return c.json({
      message: 'Attendance recorded successfully',
      messageAr: 'تم تسجيل الحضور بنجاح',
      attendance
    });
  } catch (error) {
    console.log('❌ Live session join error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get live sessions
app.get("/make-server-90ad488b/live-sessions", async (c) => {
  try {
    const { error: authError, user } = await getAuthenticatedUser(c.req.raw);
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('live_sessions')
      .select(`
        *,
        course:course_id (
          id,
          course_name,
          course_code
        ),
        instructor:instructor_id (
          id,
          full_name,
          email
        )
      `);
    
    // If instructor, only show their sessions
    if (user.role === 'instructor') {
      query = query.eq('instructor_id', user.id);
    }
    
    const { data: liveSessions, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching live sessions:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ liveSessions: liveSessions || [] });
  } catch (error) {
    console.log('❌ Get live sessions error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);