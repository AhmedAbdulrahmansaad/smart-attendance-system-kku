import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
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
        const data = await apiRequest('/courses', { token });
        const allCourses = data.courses || [];
        
        // Filter courses where student is enrolled - client-side filtering
        const studentCourses = allCourses.filter((c: any) => 
          c.enrolled_students?.includes(userId) || c.students?.includes(userId)
        );
        
        // Return only needed fields to reduce memory
        return studentCourses.map((c: any) => ({
          id: c.id,
          code: c.course_code || c.code,
          name: c.course_name || c.name,
          instructor_id: c.instructor_id,
          instructor_name: c.instructor_name,
          credits: c.credits,
        }));
      } catch (error: any) {
        console.error('❌ Error fetching student courses:', error.message);
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

    console.log('🔔 Setting up realtime listener for student enrollments:', userId);
    
    // Subscribe to changes in kv_store table for this user's enrollments
    const channel = supabase
      .channel(`enrollment-changes-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'kv_store_90ad488b',
          filter: `key=like.enrollment:${userId}:%`
        },
        (payload) => {
          console.log('🎉 New enrollment detected!', payload);
          // Invalidate and refetch courses immediately
          refetchRef.current();
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime subscription failed. Using polling as fallback.');
        }
      });

    // Fallback: Polling every 10 seconds as backup
    // This ensures updates even if Realtime doesn't work
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling for enrollment changes...');
      refetchRef.current();
    }, 10000); // Poll every 10 seconds

    // Cleanup subscription and polling on unmount
    return () => {
      console.log('🔕 Cleaning up realtime listener and polling');
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
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
        const data = await apiRequest('/sessions', { token });
        const allSessions = data.sessions || [];
        
        // Filter sessions for student's courses only
        const studentSessions = allSessions.filter((s: any) => 
          courseIds.includes(s.course_id)
        );
        
        // Sort by date descending and limit to recent 50 sessions
        return studentSessions
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 50)
          .map((s: any) => ({
            id: s.id,
            course_id: s.course_id,
            course_name: s.course_name,
            course_code: s.course_code,
            date: s.date,
            start_time: s.start_time,
            end_time: s.end_time,
            status: s.status,
            is_live: s.is_live,
          }));
      } catch (error: any) {
        console.error('❌ Error fetching student sessions:', error.message);
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
        const data = await apiRequest('/attendance/my', { token });
        const allAttendance = data.attendance || [];
        
        // Sort by date descending and limit to recent 100 records
        return allAttendance
          .sort((a: any, b: any) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
          .slice(0, 100)
          .map((a: any) => ({
            id: a.id,
            session_id: a.session_id,
            student_id: a.student_id,
            status: a.status,
            date: a.date || a.created_at,
            course_id: a.course_id,
          }));
      } catch (error: any) {
        console.error('❌ Error fetching student attendance:', error.message);
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
