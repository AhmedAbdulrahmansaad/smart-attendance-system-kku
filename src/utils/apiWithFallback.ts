import { supabase } from './supabaseClient';
import { apiRequest } from './api';

/**
 * API Request with Direct Supabase Fallback
 * 
 * This helper tries to use Backend API first, but falls back to direct Supabase
 * if Edge Function is not deployed.
 * 
 * User wants REAL data only - no mock data!
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'instructor' | 'student' | 'supervisor';
  university_id?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  course_name: string;
  course_code: string;
  instructor_id: string;
  department?: string;
  credits?: number;
  semester?: string;
  year?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  course_id: string;
  code: string;
  title?: string;
  description?: string;
  session_type: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  active: boolean;
  expires_at: string;
  location?: string;
  meeting_url?: string;
  viewers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
  course_id?: string;
  device_fingerprint?: string;
  location?: string;
}

// Track if Edge Function is available
let edgeFunctionAvailable: boolean | null = null;

/**
 * Check if Edge Function is available
 * 
 * CRITICAL: User specified Edge Function exists at:
 * https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server
 * 
 * If it's not deployed yet, we'll use direct Supabase fallback.
 */
export async function checkEdgeFunction(): Promise<boolean> {
  // If we already checked and it's not available, don't check again
  if (edgeFunctionAvailable === false) {
    return false;
  }

  // Only check once on first request
  if (edgeFunctionAvailable !== null) {
    return edgeFunctionAvailable;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    await apiRequest('/health', { method: 'GET' });
    clearTimeout(timeoutId);
    
    console.log('✅ [Fallback] Edge Function is available - using Backend API');
    edgeFunctionAvailable = true;
    return true;
  } catch (error: any) {
    console.log('ℹ️ [Fallback] Edge Function not available - using direct Supabase (this is normal)');
    edgeFunctionAvailable = false;
    return false;
  }
}

/**
 * Get all users (Admin only)
 */
export async function getUsers(token?: string | null): Promise<User[]> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/users', { method: 'GET', token });
      return data.users || [];
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [getUsers] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [getUsers] Using direct Supabase');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [getUsers] Supabase error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Create new user (Admin only)
 */
export async function createUser(
  userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    university_id?: string;
  },
  token?: string | null
): Promise<User> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/signup', {
        method: 'POST',
        body: userData,
        token,
      });
      return data.user;
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [createUser] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase - but this requires Backend!
  // We can't use supabase.auth.admin from browser
  console.error('❌ [createUser] Cannot create user from browser - Backend required!');
  throw new Error('Backend is required to create users. Please deploy Edge Function.');
}

/**
 * Get all courses
 */
export async function getCourses(token?: string | null): Promise<Course[]> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/courses', { method: 'GET', token });
      return data.courses || [];
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [getCourses] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [getCourses] Using direct Supabase');
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [getCourses] Supabase error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Create new course
 */
export async function createCourse(
  courseData: {
    course_name: string;
    course_code: string;
    instructor_id: string;
    department?: string;
    credits?: number;
    semester?: string;
    year?: string;
    description?: string;
    is_active?: boolean;
  },
  token?: string | null
): Promise<Course> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/courses', {
        method: 'POST',
        body: courseData,
        token,
      });
      return data.course;
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [createCourse] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [createCourse] Using direct Supabase');
  
  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...courseData,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [createCourse] Supabase error:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Delete course
 */
export async function deleteCourse(
  courseId: string,
  token?: string | null
): Promise<void> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      await apiRequest(`/courses/${courseId}`, {
        method: 'DELETE',
        token,
      });
      return;
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [deleteCourse] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [deleteCourse] Using direct Supabase');
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    console.error('❌ [deleteCourse] Supabase error:', error);
    throw new Error(error.message);
  }
}

/**
 * Get all sessions
 */
export async function getSessions(
  filters?: {
    is_active?: boolean;
    course_id?: string;
  },
  token?: string | null
): Promise<Session[]> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/sessions', { 
        method: 'GET', 
        token,
        body: filters 
      });
      return data.sessions || [];
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [getSessions] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [getSessions] Using direct Supabase');
  let query = supabase
    .from('sessions')
    .select('*')
    .order('session_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq('active', filters.is_active);
  }

  if (filters?.course_id) {
    query = query.eq('course_id', filters.course_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getSessions] Supabase error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Create new session
 */
export async function createSession(
  sessionData: {
    course_id: string;
    instructor_id?: string;
    session_date: string;
    session_time: string;
    duration: number;
    session_type: string;
    location?: string;
    session_code?: string;
  },
  token?: string | null
): Promise<Session> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/sessions', {
        method: 'POST',
        body: sessionData,
        token,
      });
      return data.session;
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [createSession] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [createSession] Using direct Supabase');
  
  // Generate session code (6 characters)
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      course_id: sessionData.course_id,
      instructor_id: sessionData.instructor_id, // إضافة معرف المدرس
      code: sessionData.session_code || code,
      session_date: sessionData.session_date,
      start_time: sessionData.session_time,
      session_type: sessionData.session_type,
      location: sessionData.location,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [createSession] Supabase error:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Session>,
  token?: string | null
): Promise<Session> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: updates,
        token,
      });
      return data.session;
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [updateSession] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [updateSession] Using direct Supabase');
  
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('❌ [updateSession] Supabase error:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get attendance records
 */
export async function getAttendance(
  filters?: {
    student_id?: string;
    session_id?: string;
    course_id?: string;
  },
  token?: string | null
): Promise<Attendance[]> {
  const useBackend = await checkEdgeFunction();

  if (useBackend) {
    try {
      const data = await apiRequest('/attendance', { 
        method: 'GET', 
        token,
        body: filters 
      });
      return data.attendance || [];
    } catch (error: any) {
      if (error.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
        console.warn('⚠️ [getAttendance] Fallback to direct Supabase');
        edgeFunctionAvailable = false;
      } else {
        throw error;
      }
    }
  }

  // Fallback to direct Supabase
  console.log('🔄 [getAttendance] Using direct Supabase');
  let query = supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.student_id) {
    query = query.eq('student_id', filters.student_id);
  }

  if (filters?.session_id) {
    query = query.eq('session_id', filters.session_id);
  }

  if (filters?.course_id) {
    query = query.eq('course_id', filters.course_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getAttendance] Supabase error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Reset Edge Function availability check
 * Call this to force re-check on next request
 */
export function resetEdgeFunctionCheck() {
  console.log('🔄 [Fallback] Resetting Edge Function availability check');
  edgeFunctionAvailable = null;
}