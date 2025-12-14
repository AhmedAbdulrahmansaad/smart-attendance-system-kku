import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getCourses, getSessions, getAttendance } from '../utils/apiWithFallback';

interface UseStudentDataOptions {
  token: string | null;
  userId: string | null;
  enabled?: boolean;
}

export function useStudentCourses({ token, userId, enabled = true }: UseStudentDataOptions) {
  const query = useQuery({
    queryKey: ['student-courses', userId],
    queryFn: async () => {
      if (!token || !userId) throw new Error('No token or userId');
      
      try {
        console.log('📚 [useStudentCourses] Loading courses via Fallback system...');
        
        // استخدام Fallback system - Backend أو Supabase مباشر
        const courses = await getCourses(token);

        if (!courses || courses.length === 0) {
          console.log('⚠️ [useStudentCourses] No courses found');
          return [];
        }

        // Map to simplified structure
        const mappedCourses = courses.map((course: any) => ({
          id: course.id,
          code: course.course_code,
          name: course.course_name,
          instructor_id: course.instructor_id,
          instructor_name: course.instructor?.full_name || 'Unknown',
        }));

        console.log('✅ [useStudentCourses] Loaded', mappedCourses.length, 'courses');
        return mappedCourses;
      } catch (error: any) {
        console.error('❌ [useStudentCourses] Error:', error);
        throw error;
      }
    },
    enabled: enabled && !!token && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Use ref to avoid dependency issues
  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;

  // Setup realtime listener for enrollment changes
  useEffect(() => {
    if (!userId || !enabled) return;

    console.log('🔔 [useStudentCourses] Setting up realtime listener for enrollments');
    
    // Subscribe to changes in enrollments table
    const channel = supabase
      .channel(`enrollment-changes-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public', 
          table: 'enrollments',
          filter: `student_id=eq.${userId}`
        },
        (payload) => {
          console.log('🎉 [useStudentCourses] Enrollment changed!', payload);
          // Refetch courses immediately
          refetchRef.current();
        }
      )
      .subscribe((status) => {
        console.log('🔔 [useStudentCourses] Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 [useStudentCourses] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [userId, enabled]);

  return query;
}

export function useStudentSessions({ token, courseIds, enabled = true }: { token: string | null; courseIds: string[]; enabled?: boolean }) {
  return useQuery({
    queryKey: ['student-sessions', courseIds.sort().join(',')],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      if (!courseIds || courseIds.length === 0) return [];
      
      try {
        console.log('📅 [useStudentSessions] Loading sessions via Fallback system...');
        
        // استخدام Fallback system - Backend أو Supabase مباشر
        const sessions = await getSessions(undefined, token);

        if (!sessions || sessions.length === 0) {
          console.log('⚠️ [useStudentSessions] No sessions found');
          return [];
        }

        // Filter sessions for student's courses
        const filteredSessions = sessions.filter((s: any) => 
          courseIds.includes(s.course_id)
        );

        // Map to simplified structure
        const mappedSessions = filteredSessions.map((s: any) => ({
          id: s.id,
          course_id: s.course_id,
          course_name: s.course?.course_name || 'Unknown',
          course_code: s.course?.course_code || 'N/A',
          date: s.created_at,
          session_type: s.session_type,
          title: s.title,
          active: s.active,
          expires_at: s.expires_at,
        }));

        console.log('✅ [useStudentSessions] Loaded', mappedSessions.length, 'sessions');
        return mappedSessions;
      } catch (error: any) {
        console.error('❌ [useStudentSessions] Error:', error);
        throw error;
      }
    },
    enabled: enabled && !!token && courseIds.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useStudentAttendance({ token, userId, enabled = true }: UseStudentDataOptions) {
  return useQuery({
    queryKey: ['student-attendance', userId],
    queryFn: async () => {
      if (!token || !userId) throw new Error('No token or userId');
      
      try {
        console.log('✅ [useStudentAttendance] Loading attendance via Fallback system...');
        
        // استخدام Fallback system - Backend أو Supabase مباشر
        const attendance = await getAttendance({ student_id: userId }, token);

        if (!attendance || attendance.length === 0) {
          console.log('⚠️ [useStudentAttendance] No attendance found');
          return [];
        }

        // Map to simplified structure
        const mappedAttendance = attendance.map((a: any) => ({
          id: a.id,
          session_id: a.session_id,
          student_id: a.student_id,
          status: a.status,
          date: a.created_at, // استخدم created_at بدلاً من timestamp
          course_id: a.course_id,
        }));

        console.log('✅ [useStudentAttendance] Loaded', mappedAttendance.length, 'records');
        return mappedAttendance;
      } catch (error: any) {
        console.error('❌ [useStudentAttendance] Error:', error);
        throw error;
      }
    },
    enabled: enabled && !!token && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

// Combined hook for dashboard stats with error handling
export function useStudentStats({ token, userId, enabled = true }: UseStudentDataOptions) {
  const coursesQuery = useStudentCourses({ token, userId, enabled });
  const courseIds = coursesQuery.data?.map((c: any) => c.id) || [];
  const sessionsQuery = useStudentSessions({ token, courseIds, enabled: enabled && courseIds.length > 0 });
  const attendanceQuery = useStudentAttendance({ token, userId, enabled });

  // Compute stats with memoization
  const stats = {
    myCourses: coursesQuery.data?.length || 0,
    totalSessions: sessionsQuery.data?.length || 0,
    attendedSessions: attendanceQuery.data?.length || 0,
    attendanceRate: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
  };

  if (attendanceQuery.data && attendanceQuery.data.length > 0) {
    const myAttendance = attendanceQuery.data;
    stats.presentCount = myAttendance.filter((a: any) => a.status === 'present').length;
    stats.absentCount = myAttendance.filter((a: any) => a.status === 'absent').length;
    stats.lateCount = myAttendance.filter((a: any) => a.status === 'late').length;
    const totalAttendance = myAttendance.length;
    stats.attendanceRate = totalAttendance > 0 ? Math.round((stats.presentCount / totalAttendance) * 100) : 0;
  }

  return {
    stats,
    courses: coursesQuery.data || [],
    sessions: sessionsQuery.data || [],
    attendance: attendanceQuery.data || [],
    isLoading: coursesQuery.isLoading || sessionsQuery.isLoading || attendanceQuery.isLoading,
    isError: coursesQuery.isError || sessionsQuery.isError || attendanceQuery.isError,
    error: coursesQuery.error || sessionsQuery.error || attendanceQuery.error,
    refetch: () => {
      coursesQuery.refetch();
      sessionsQuery.refetch();
      attendanceQuery.refetch();
    },
  };
}