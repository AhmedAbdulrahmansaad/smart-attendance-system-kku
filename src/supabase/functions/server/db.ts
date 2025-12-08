/**
 * Database Helper Functions
 * دوال مساعدة للتعامل مع قاعدة بيانات Supabase PostgreSQL الحقيقية
 */

import { createClient } from "npm:@supabase/supabase-js@2";

// إنشاء عميل Supabase للعمليات الإدارية
export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// إنشاء عميل Supabase للعمليات العامة
export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
}

/**
 * الحصول على مستخدم من قاعدة البيانات بواسطة auth_id
 */
export async function getUserByAuthId(authId: string) {
  const supabase = getSupabaseAdmin();
  
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

/**
 * الحصول على مستخدم من قاعدة البيانات بواسطة البريد الإلكتروني
 */
export async function getUserByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error getting user by email:', error);
    return null;
  }
  
  return data;
}

/**
 * الحصول على مستخدم من قاعدة البيانات بواسطة الرقم الجامعي
 */
export async function getUserByUniversityId(universityId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('university_id', universityId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error getting user by university_id:', error);
    return null;
  }
  
  return data;
}

/**
 * إنشاء مستخدم جديد في قاعدة البيانات
 */
export async function createUser(userData: {
  auth_id: string;
  email: string;
  full_name: string;
  role: string;
  university_id?: string;
  phone?: string;
  department?: string;
}) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }
  
  return data;
}

/**
 * تحديث آخر تسجيل دخول للمستخدم
 */
export async function updateLastLogin(userId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * تسجيل جلسة جهاز جديدة
 */
export async function registerDeviceSession(sessionData: {
  user_id: string;
  device_fingerprint: string;
  device_info: any;
  ip_address?: string;
  location?: any;
  session_token: string;
}) {
  const supabase = getSupabaseAdmin();
  
  // التحقق من وجود جلسة نشطة لنفس المستخدم
  const { data: existingSessions, error: checkError } = await supabase
    .from('device_sessions')
    .select('*')
    .eq('user_id', sessionData.user_id)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  
  if (checkError) {
    console.error('Error checking existing sessions:', checkError);
  }
  
  if (existingSessions && existingSessions.length > 0) {
    // إذا كانت هناك جلسة نشطة، تحقق من البصمة
    const sameDeviceSession = existingSessions.find(
      s => s.device_fingerprint === sessionData.device_fingerprint
    );
    
    if (sameDeviceSession) {
      // نفس الجهاز - تحديث الجلسة الموجودة
      const { data, error } = await supabase
        .from('device_sessions')
        .update({
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          session_token: sessionData.session_token
        })
        .eq('id', sameDeviceSession.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating device session:', error);
        throw error;
      }
      
      return { data, conflict: false };
    } else {
      // جهاز مختلف - يوجد تعارض
      return { 
        data: null, 
        conflict: true, 
        message: 'Another device session is active' 
      };
    }
  }
  
  // إنشاء جلسة جديدة
  const { data, error } = await supabase
    .from('device_sessions')
    .insert([{
      ...sessionData,
      is_active: true,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error registering device session:', error);
    throw error;
  }
  
  return { data, conflict: false };
}

/**
 * تحديث نشاط الجلسة
 */
export async function updateSessionActivity(sessionToken: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('device_sessions')
    .update({ 
      last_activity: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    })
    .eq('session_token', sessionToken)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error updating session activity:', error);
  }
}

/**
 * إنهاء جلسة الجهاز
 */
export async function terminateDeviceSession(userId: string, sessionToken?: string) {
  const supabase = getSupabaseAdmin();
  
  let query = supabase
    .from('device_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);
  
  if (sessionToken) {
    query = query.eq('session_token', sessionToken);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error('Error terminating device session:', error);
  }
}

/**
 * الحصول على جميع المقررات
 */
export async function getAllCourses() {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('courses')
    .select('*, instructor:users!courses_instructor_id_fkey(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting courses:', error);
    return [];
  }
  
  return data || [];
}

/**
 * الحصول على مقررات مدرس معين
 */
export async function getInstructorCourses(instructorId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting instructor courses:', error);
    return [];
  }
  
  return data || [];
}

/**
 * الحصول على مقررات طالب معين
 */
export async function getStudentCourses(studentId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, course:courses(*)')
    .eq('student_id', studentId)
    .eq('status', 'active');
  
  if (error) {
    console.error('Error getting student courses:', error);
    return [];
  }
  
  return data?.map(e => e.course) || [];
}

/**
 * تسجيل سجل نشاط
 */
export async function logActivity(activityData: {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  status: 'success' | 'failed' | 'blocked';
}) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('activity_logs')
    .insert([{
      ...activityData,
      created_at: new Date().toISOString()
    }]);
  
  if (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * إنشاء إشعار
 */
export async function createNotification(notificationData: {
  user_id: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  related_id?: string;
  related_type?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      ...notificationData,
      is_read: false,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  
  return data;
}

/**
 * الحصول على إشعارات المستخدم
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
  
  return data || [];
}

/**
 * تحديث حالة الإشعار إلى مقروء
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
  }
}
