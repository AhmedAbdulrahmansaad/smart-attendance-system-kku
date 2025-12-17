import { createClient } from "npm:@supabase/supabase-js@2";

// Initialize Supabase client with service role for database access
export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

// Get Supabase client with user token (for RLS)
export function getSupabaseClientWithAuth(accessToken: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  
  // Set auth token for RLS policies
  supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: ''
  });
  
  return supabase;
}

// =============================================================================
// USER FUNCTIONS
// =============================================================================

export async function getUserByAuthId(authId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();
  
  if (error) {
    console.error('Error getting user by auth_id:', error);
    return null;
  }
  
  return data;
}

export async function createUser(userData: {
  auth_id: string;
  email: string;
  full_name: string;
  role: string;
  university_id?: string;
  phone?: string;
  department?: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .insert([{
      auth_id: userData.auth_id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      university_id: userData.university_id || null,
      phone: userData.phone || null,
      department: userData.department || null,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }
  
  return data;
}

export async function updateUserLastLogin(userId: string) {
  const supabase = getSupabaseClient();
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
}

export async function getAllUsers() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting all users:', error);
    return [];
  }
  
  return data;
}

export async function deleteUser(userId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function checkUniversityIdExists(universityId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('university_id', universityId)
    .single();
  
  return !!data;
}

// =============================================================================
// COURSE FUNCTIONS
// =============================================================================

export async function createCourse(courseData: {
  course_code: string;
  course_name: string;
  course_name_ar: string;
  description?: string;
  instructor_id?: string;
  department?: string;
  semester?: string;
  academic_year?: string;
  credit_hours?: number;
  max_students?: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .insert([courseData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating course:', error);
    throw error;
  }
  
  return data;
}

export async function getAllCourses() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting all courses:', error);
    return [];
  }
  
  return data;
}

export async function getCourseById(courseId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error) {
    console.error('Error getting course by id:', error);
    return null;
  }
  
  return data;
}

export async function updateCourse(courseId: string, updates: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating course:', error);
    throw error;
  }
  
  return data;
}

export async function deleteCourse(courseId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  
  if (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

export async function getCoursesByInstructor(instructorId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting courses by instructor:', error);
    return [];
  }
  
  return data;
}

// =============================================================================
// ENROLLMENT FUNCTIONS
// =============================================================================

export async function createEnrollment(studentId: string, courseId: string) {
  console.log('📝 [createEnrollment] Creating enrollment:', { studentId, courseId });
  
  try {
    // Check if enrollment already exists to prevent duplicates
    const supabase = getSupabaseClient();
    const { data: existing, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();
    
    if (existing) {
      console.log('ℹ️ [createEnrollment] Enrollment already exists');
      return existing;
    }
    
    // Use direct HTTP request to bypass RLS issues
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/enrollments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [createEnrollment] HTTP Error:', error);
      
      // If it's a duplicate key error, that's okay
      if (error.message && error.message.includes('duplicate')) {
        console.log('ℹ️ [createEnrollment] Enrollment already exists (duplicate key)');
        // Fetch the existing enrollment
        const { data } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .single();
        return data;
      }
      
      throw new Error(error.message || 'Failed to create enrollment');
    }
    
    const data = await response.json();
    const enrollment = Array.isArray(data) ? data[0] : data;
    
    console.log('✅ [createEnrollment] Enrollment created successfully:', enrollment);
    return enrollment;
  } catch (error) {
    console.error('❌ [createEnrollment] Error:', error);
    throw error;
  }
}

export async function getEnrollmentsByCourse(courseId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, student:users!enrollments_student_id_fkey(*)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });
  
  if (error) {
    console.error('Error getting enrollments by course:', error);
    return [];
  }
  
  return data;
}

export async function getEnrollmentsByStudent(studentId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, course:courses(*)')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });
  
  if (error) {
    console.error('Error getting enrollments by student:', error);
    return [];
  }
  
  return data;
}

export async function deleteEnrollment(studentId: string, courseId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', courseId);
  
  if (error) {
    console.error('Error deleting enrollment:', error);
    throw error;
  }
}

// =============================================================================
// SESSION FUNCTIONS
// =============================================================================

export async function createSession(sessionData: {
  course_id: string;
  instructor_id: string;
  session_type: string;
  title?: string;
  description?: string;
  code: string;
  start_time?: string;
  duration_minutes?: number;
  location?: string;
}) {
  const supabase = getSupabaseClient();
  
  // Calculate end_time
  const startTime = sessionData.start_time ? new Date(sessionData.start_time) : new Date();
  const endTime = new Date(startTime.getTime() + (sessionData.duration_minutes || 15) * 60000);
  
  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      course_id: sessionData.course_id,
      instructor_id: sessionData.instructor_id,
      code: sessionData.code,
      session_date: startTime.toISOString().split('T')[0],
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      session_type: sessionData.session_type,
      location: sessionData.location || null,
      is_active: true,
      stream_active: sessionData.session_type === 'live',
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }
  
  return data;
}

export async function getSessionByCode(code: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();
  
  if (error) {
    console.error('Error getting session by code:', error);
    return null;
  }
  
  return data;
}

export async function getSessionsByCourse(courseId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('course_id', courseId)
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error getting sessions by course:', error);
    return [];
  }
  
  return data;
}

export async function getAllActiveLiveSessions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, course:courses(*)')
    .eq('is_active', true)
    .eq('session_type', 'live')
    .gt('end_time', new Date().toISOString())
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error getting active live sessions:', error);
    return [];
  }
  
  return data;
}

export async function getAllSessions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
  
  return data;
}

export async function updateSession(sessionId: string, updates: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }
  
  return data;
}

export async function deactivateSession(sessionId: string) {
  return updateSession(sessionId, { is_active: false, stream_active: false });
}

export async function deleteSession(sessionId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

// =============================================================================
// ATTENDANCE FUNCTIONS
// =============================================================================

export async function createAttendanceRecord(attendanceData: {
  session_id: string;
  student_id: string;
  course_id: string;
  attendance_status?: string;
  verification_method?: string;
  device_fingerprint: string;
  ip_address?: string;
  location?: any;
  notes?: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .insert([{
      ...attendanceData,
      check_in_time: new Date().toISOString(),
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating attendance record:', error);
    throw error;
  }
  
  return data;
}

export async function getAttendanceByStudent(studentId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, course:courses(*), session:sessions(*)')
    .eq('student_id', studentId)
    .order('check_in_time', { ascending: false });
  
  if (error) {
    console.error('Error getting attendance by student:', error);
    return [];
  }
  
  return data;
}

export async function getAttendanceByCourse(courseId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, student:users!attendance_records_student_id_fkey(*)')
    .eq('course_id', courseId)
    .order('check_in_time', { ascending: false });
  
  if (error) {
    console.error('Error getting attendance by course:', error);
    return [];
  }
  
  return data;
}

export async function getAttendanceBySession(sessionId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, student:users!attendance_records_student_id_fkey(*)')
    .eq('session_id', sessionId)
    .order('check_in_time', { ascending: false });
  
  if (error) {
    console.error('Error getting attendance by session:', error);
    return [];
  }
  
  return data;
}

export async function checkAttendanceExists(sessionId: string, studentId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .single();
  
  return !!data;
}

export async function getTodayAttendance() {
  const supabase = getSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, student:users!attendance_records_student_id_fkey(*), course:courses(*)')
    .gte('check_in_time', today.toISOString())
    .order('check_in_time', { ascending: false });
  
  if (error) {
    console.error('Error getting today attendance:', error);
    return [];
  }
  
  return data;
}

// =============================================================================
// DEVICE SESSION FUNCTIONS (Security)
// =============================================================================

export async function createDeviceSession(sessionData: {
  user_id: string;
  device_fingerprint: string;
  device_info?: any;
  ip_address?: string;
  location?: any;
  session_token: string;
}) {
  const supabase = getSupabaseClient();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12); // 12 hours
  
  const { data, error } = await supabase
    .from('device_sessions')
    .insert([{
      ...sessionData,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating device session:', error);
    throw error;
  }
  
  return data;
}

export async function getActiveDeviceSessions(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('device_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting active device sessions:', error);
    return [];
  }
  
  return data;
}

export async function deactivateDeviceSession(sessionId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('device_sessions')
    .update({ is_active: false })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error deactivating device session:', error);
    throw error;
  }
}

export async function deactivateAllUserSessions(userId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('device_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deactivating all user sessions:', error);
    throw error;
  }
}

// =============================================================================
// SCHEDULE FUNCTIONS
// =============================================================================

export async function createSchedule(scheduleData: {
  course_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location?: string;
  building?: string;
  room_number?: string;
}) {
  console.log('📝 [createSchedule] Creating schedule with data:', scheduleData);
  
  try {
    // Try different day formats to match the constraint
    let dayValue = scheduleData.day_of_week;
    
    // Map of different possible formats - try most common first
    const dayMappings: Record<string, string[]> = {
      'SUNDAY': ['Sunday', 'SUNDAY', 'sunday', '0', 'الأحد'],
      'MONDAY': ['Monday', 'MONDAY', 'monday', '1', 'الاثنين'],
      'TUESDAY': ['Tuesday', 'TUESDAY', 'tuesday', '2', 'الثلاثاء'],
      'WEDNESDAY': ['Wednesday', 'WEDNESDAY', 'wednesday', '3', 'الأربعاء'],
      'THURSDAY': ['Thursday', 'THURSDAY', 'thursday', '4', 'الخميس'],
      'FRIDAY': ['Friday', 'FRIDAY', 'friday', '5', 'الجمعة'],
      'SATURDAY': ['Saturday', 'SATURDAY', 'saturday', '6', 'السبت'],
    };
    
    // Find the variants to try
    const variants = dayMappings[dayValue.toUpperCase()] || [dayValue];
    
    console.log(`🔍 [createSchedule] Will try ${variants.length} variants:`, variants);
    
    let lastError = null;
    
    // Try each variant until one works
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      try {
        console.log(`🔄 [createSchedule] Attempt ${i + 1}/${variants.length}: trying day_of_week="${variant}"`);
        
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/schedules`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              course_id: scheduleData.course_id,
              day_of_week: variant,
              start_time: scheduleData.start_time,
              end_time: scheduleData.end_time,
              location: scheduleData.location || null,
              building: scheduleData.building || null,
              room_number: scheduleData.room_number || null,
            }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const schedule = Array.isArray(data) ? data[0] : data;
          console.log(`✅ [createSchedule] SUCCESS! Schedule created with day_of_week="${variant}"`);
          console.log(`✅ [createSchedule] Schedule:`, schedule);
          return schedule;
        }
        
        const error = await response.json();
        lastError = error;
        
        // If it's not a constraint error, throw immediately
        if (!error.message?.includes('check constraint') && !error.message?.includes('day_of_week')) {
          console.error(`❌ [createSchedule] Non-constraint error with "${variant}":`, error);
          throw new Error(error.message || 'Failed to create schedule');
        }
        
        console.log(`⚠️ [createSchedule] Variant "${variant}" failed (constraint error), trying next...`);
      } catch (err: any) {
        // If error is not about constraint, throw it
        if (!err.message?.includes('check constraint') && !err.message?.includes('day_of_week') && err.message !== 'Failed to create schedule') {
          throw err;
        }
        lastError = err;
        continue;
      }
    }
    
    // If all variants failed, throw the last error with helpful message
    console.error(`❌ [createSchedule] All ${variants.length} day_of_week variants failed!`);
    console.error('❌ [createSchedule] Last error:', lastError);
    throw new Error(
      `Failed to create schedule. The day_of_week check constraint in database doesn't match any of: ${variants.join(', ')}. ` +
      `Please check your Supabase database table 'schedules' column 'day_of_week' constraint. ` +
      `Error: ${JSON.stringify(lastError)}`
    );
  } catch (error) {
    console.error('❌ [createSchedule] Fatal error:', error);
    throw error;
  }
}

export async function getAllSchedules() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('schedules')
    .select('*, course:courses(*)')
    .order('day_of_week', { ascending: true });
  
  if (error) {
    console.error('Error getting all schedules:', error);
    return [];
  }
  
  return data;
}

export async function getSchedulesByCourse(courseId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('course_id', courseId)
    .order('day_of_week', { ascending: true });
  
  if (error) {
    console.error('Error getting schedules by course:', error);
    return [];
  }
  
  return data;
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);
  
  if (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

// =============================================================================
// NOTIFICATION FUNCTIONS
// =============================================================================

export async function createNotification(notificationData: {
  user_id: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  notification_type: string;
  related_id?: string;
  related_type?: string;
  priority?: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  
  return data;
}

export async function getNotificationsByUser(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting notifications by user:', error);
    return [];
  }
  
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// =============================================================================
// ACTIVITY LOG FUNCTIONS
// =============================================================================

export async function logActivity(activityData: {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  log_status?: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('activity_logs')
    .insert([activityData]);
  
  if (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getActivityLogs(limit = 100) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
  
  return data;
}

// =============================================================================
// STATISTICS FUNCTIONS
// =============================================================================

export async function getSystemStats() {
  const supabase = getSupabaseClient();
  
  // Get counts
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  const { count: studentsCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');
  
  const { count: instructorsCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'instructor');
  
  const { count: coursesCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });
  
  const { count: sessionsCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true });
  
  const { count: attendanceCount } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true });
  
  return {
    total_users: usersCount || 0,
    total_students: studentsCount || 0,
    total_instructors: instructorsCount || 0,
    total_courses: coursesCount || 0,
    total_sessions: sessionsCount || 0,
    total_attendance_records: attendanceCount || 0,
  };
}

// Get public stats for landing page (no authentication required)
export async function getPublicStats() {
  const supabase = getSupabaseClient();
  
  try {
    // Get total students
    const { count: studentsCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    
    // Get total instructors
    const { count: instructorsCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'instructor');
    
    // Get total courses
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    
    // Get total sessions
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    // Get total attendance records
    const { count: totalAttendance } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('attendance_status', 'present');
    
    // Calculate attendance rate
    let attendanceRate = 0;
    if (totalSessions && totalSessions > 0) {
      attendanceRate = ((totalAttendance || 0) / totalSessions) * 100;
    }
    
    return {
      studentsCount: studentsCount || 0,
      instructorsCount: instructorsCount || 0,
      coursesCount: coursesCount || 0,
      attendanceRate: attendanceRate > 0 ? Math.min(attendanceRate, 100).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Error getting public stats:', error);
    return {
      studentsCount: 0,
      instructorsCount: 0,
      coursesCount: 0,
      attendanceRate: 0
    };
  }
}