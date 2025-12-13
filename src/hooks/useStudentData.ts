import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

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
        console.log('📚 [useStudentCourses] Loading courses for student:', userId);
        
        // Get enrollments for this student with course details
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses (
              id,
              course_code,
              course_name,
              instructor_id,
              semester,
              year
            )
          `)
          .eq('student_id', userId);

        if (error) {
          console.error('❌ [useStudentCourses] Error:', error);
          throw error;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log('⚠️ [useStudentCourses] No enrollments found');
          return [];
        }

        // Get instructor names
        const instructorIds = enrollments
          .map((e: any) => e.courses?.instructor_id)
          .filter((id: string) => id);

        const { data: instructors } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', instructorIds);

        const instructorMap = new Map(
          instructors?.map((i: any) => [i.id, i.full_name]) || []
        );

        // Map to simplified structure
        const courses = enrollments
          .filter((e: any) => e.courses) // Filter out invalid enrollments
          .map((e: any) => ({
            id: e.courses.id,
            code: e.courses.course_code,
            name: e.courses.course_name,
            instructor_id: e.courses.instructor_id,
            instructor_name: instructorMap.get(e.courses.instructor_id) || 'Unknown',
            semester: e.courses.semester,
            year: e.courses.year,
          }));

        console.log('✅ [useStudentCourses] Loaded', courses.length, 'courses');
        return courses;
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
        console.log('📅 [useStudentSessions] Loading sessions for', courseIds.length, 'courses');
        
        // Get all sessions for student's courses
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select(`
            id,
            course_id,
            session_date,
            session_type,
            title,
            active,
            expires_at,
            courses (
              course_code,
              course_name
            )
          `)
          .in('course_id', courseIds)
          .order('session_date', { ascending: false })
          .limit(50);

        if (error) {
          console.error('❌ [useStudentSessions] Error:', error);
          throw error;
        }

        // Map to simplified structure
        const mappedSessions = (sessions || []).map((s: any) => ({
          id: s.id,
          course_id: s.course_id,
          course_name: s.courses?.course_name || 'Unknown',
          course_code: s.courses?.course_code || 'N/A',
          date: s.session_date,
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
        console.log('✅ [useStudentAttendance] Loading attendance for student:', userId);
        
        // Get all attendance records for this student
        const { data: attendance, error } = await supabase
          .from('attendance')
          .select('id, session_id, student_id, status, recorded_at, course_id')
          .eq('student_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ [useStudentAttendance] Error:', error);
          throw error;
        }

        // Map to simplified structure
        const mappedAttendance = (attendance || []).map((a: any) => ({
          id: a.id,
          session_id: a.session_id,
          student_id: a.student_id,
          status: a.status,
          date: a.recorded_at,
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
