/**
 * 🔥 Supabase Direct Hooks - Real Data Only!
 * 
 * هذه الـ hooks تقرأ مباشرة من Supabase بدون Edge Function
 * These hooks read directly from Supabase without Edge Function
 * 
 * ✅ بيانات حقيقية 100%
 * ✅ 100% Real Data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

interface UseDataOptions {
  enabled?: boolean;
}

// ═══════════════════════════════════════════════════════════
//  Admin Dashboard Stats
// ═══════════════════════════════════════════════════════════

export function useAdminDashboardStats({ enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-stats-supabase'],
    queryFn: async () => {
      console.log('📊 [useAdminDashboardStats] Fetching from Supabase...');
      
      try {
        // Get all counts in parallel
        const [
          profilesResult,
          studentsResult,
          instructorsResult,
          coursesResult,
          sessionsResult,
          attendanceResult
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor'),
          supabase.from('courses').select('id', { count: 'exact', head: true }),
          supabase.from('sessions').select('id', { count: 'exact', head: true }),
          supabase.from('attendance').select('*').gte('recorded_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        ]);
        
        // Calculate today's stats
        const attendanceToday = attendanceResult.data || [];
        const presentToday = attendanceToday.filter(a => a.status === 'present').length;
        const absentToday = attendanceToday.filter(a => a.status === 'absent').length;
        const totalToday = attendanceToday.length;
        const attendanceRateToday = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
        
        // Get today's sessions
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
        
        const { data: todaySessions } = await supabase
          .from('sessions')
          .select('id')
          .gte('session_date', todayStart)
          .lte('session_date', todayEnd);
        
        const stats = {
          totalUsers: profilesResult.count || 0,
          totalStudents: studentsResult.count || 0,
          totalInstructors: instructorsResult.count || 0,
          totalCourses: coursesResult.count || 0,
          totalSessions: sessionsResult.count || 0,
          activeSessionsToday: todaySessions?.length || 0,
          attendanceRateToday,
          presentToday,
          absentToday,
        };
        
        console.log('✅ [useAdminDashboardStats] Stats loaded:', stats);
        
        // Get recent activity
        const { data: recentAttendance } = await supabase
          .from('attendance')
          .select(`
            *,
            student:student_id (full_name),
            session:session_id (
              course:course_id (course_name)
            )
          `)
          .order('recorded_at', { ascending: false })
          .limit(10);
        
        const recentActivity = (recentAttendance || []).map((record: any) => ({
          id: record.id,
          type: record.status === 'present' ? 'attendance' : 'absence',
          student: record.student?.full_name || 'Unknown',
          course: record.session?.course?.course_name || 'Unknown',
          time: record.recorded_at,
          status: record.status,
        }));
        
        return { stats, recentActivity };
      } catch (error: any) {
        console.error('❌ [useAdminDashboardStats] Error:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════
//  All Users
// ═══════════════════════════════════════════════════════════

export function useAllUsers({ enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['all-users-supabase'],
    queryFn: async () => {
      console.log('👥 [useAllUsers] Fetching from Supabase...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useAllUsers] Error:', error);
        throw error;
      }
      
      console.log('✅ [useAllUsers] Loaded', data?.length, 'users');
      return data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════
//  All Courses
// ═══════════════════════════════════════════════════════════

export function useAllCourses({ enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['all-courses-supabase'],
    queryFn: async () => {
      console.log('📚 [useAllCourses] Fetching from Supabase...');
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructor_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useAllCourses] Error:', error);
        throw error;
      }
      
      console.log('✅ [useAllCourses] Loaded', data?.length, 'courses');
      return data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════
//  All Sessions
// ═══════════════════════════════════════════════════════════

export function useAllSessions({ enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['all-sessions-supabase'],
    queryFn: async () => {
      console.log('📅 [useAllSessions] Fetching from Supabase...');
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          course:course_id (
            id,
            course_name,
            course_code,
            instructor:instructor_id (
              full_name
            )
          )
        `)
        .order('session_date', { ascending: false });
      
      if (error) {
        console.error('❌ [useAllSessions] Error:', error);
        throw error;
      }
      
      console.log('✅ [useAllSessions] Loaded', data?.length, 'sessions');
      return data || [];
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// ═══════════════════════════════════════════════════════════
//  All Attendance
// ═══════════════════════════════════════════════════════════

export function useAllAttendance({ enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['all-attendance-supabase'],
    queryFn: async () => {
      console.log('✅ [useAllAttendance] Fetching from Supabase...');
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:student_id (
            id,
            full_name,
            university_id
          ),
          session:session_id (
            id,
            session_date,
            course:course_id (
              course_name,
              course_code
            )
          )
        `)
        .order('recorded_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useAllAttendance] Error:', error);
        throw error;
      }
      
      console.log('✅ [useAllAttendance] Loaded', data?.length, 'attendance records');
      return data || [];
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ═══════════════════════════════════════════════════════════
//  Instructor Courses
// ═══════════════════════════════════════════════════════════

export function useInstructorCourses(instructorId: string | undefined, { enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['instructor-courses-supabase', instructorId],
    queryFn: async () => {
      if (!instructorId) throw new Error('No instructor ID');
      
      console.log('📚 [useInstructorCourses] Fetching for instructor:', instructorId);
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useInstructorCourses] Error:', error);
        throw error;
      }
      
      console.log('✅ [useInstructorCourses] Loaded', data?.length, 'courses');
      return data || [];
    },
    enabled: enabled && !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════
//  Student Courses (Enrollments)
// ═══════════════════════════════════════════════════════════

export function useStudentCourses(studentId: string | undefined, { enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['student-courses-supabase', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID');
      
      console.log('📚 [useStudentCourses] Fetching for student:', studentId);
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:course_id (
            *,
            instructor:instructor_id (
              full_name,
              email
            )
          )
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useStudentCourses] Error:', error);
        throw error;
      }
      
      console.log('✅ [useStudentCourses] Loaded', data?.length, 'courses');
      return data || [];
    },
    enabled: enabled && !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════
//  Student Attendance Records
// ═══════════════════════════════════════════════════════════

export function useStudentAttendance(studentId: string | undefined, { enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['student-attendance-supabase', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID');
      
      console.log('✅ [useStudentAttendance] Fetching for student:', studentId);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          session:session_id (
            id,
            session_date,
            session_time,
            location,
            course:course_id (
              course_name,
              course_code,
              instructor:instructor_id (
                full_name
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('recorded_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useStudentAttendance] Error:', error);
        throw error;
      }
      
      console.log('✅ [useStudentAttendance] Loaded', data?.length, 'attendance records');
      return data || [];
    },
    enabled: enabled && !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════
//  Live Sessions
// ═══════════════════════════════════════════════════════════

export function useLiveSessions({ enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['live-sessions-supabase'],
    queryFn: async () => {
      console.log('🎥 [useLiveSessions] Fetching from Supabase...');
      
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          course:course_id (
            course_name,
            course_code,
            instructor:instructor_id (
              full_name
            )
          )
        `)
        .order('scheduled_start', { ascending: false });
      
      if (error) {
        console.error('❌ [useLiveSessions] Error:', error);
        throw error;
      }
      
      console.log('✅ [useLiveSessions] Loaded', data?.length, 'live sessions');
      return data || [];
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for live sessions)
  });
}

// ═══════════════════════════════════════════════════════════
//  Course Enrollments
// ═══════════════════════════════════════════════════════════

export function useCourseEnrollments(courseId: string | undefined, { enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['course-enrollments-supabase', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('No course ID');
      
      console.log('👥 [useCourseEnrollments] Fetching for course:', courseId);
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:student_id (
            id,
            full_name,
            email,
            university_id
          )
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useCourseEnrollments] Error:', error);
        throw error;
      }
      
      console.log('✅ [useCourseEnrollments] Loaded', data?.length, 'enrollments');
      return data || [];
    },
    enabled: enabled && !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════
//  Session Attendance
// ═══════════════════════════════════════════════════════════

export function useSessionAttendance(sessionId: string | undefined, { enabled = true }: UseDataOptions = {}) {
  return useQuery({
    queryKey: ['session-attendance-supabase', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      
      console.log('✅ [useSessionAttendance] Fetching for session:', sessionId);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:student_id (
            id,
            full_name,
            email,
            university_id
          )
        `)
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: false });
      
      if (error) {
        console.error('❌ [useSessionAttendance] Error:', error);
        throw error;
      }
      
      console.log('✅ [useSessionAttendance] Loaded', data?.length, 'attendance records');
      return data || [];
    },
    enabled: enabled && !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
