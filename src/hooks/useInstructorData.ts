import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';

interface UseInstructorDataOptions {
  token: string | null;
  userId: string | null;
  enabled?: boolean;
}

export function useInstructorCourses({ token, userId, enabled = true }: UseInstructorDataOptions) {
  return useQuery({
    queryKey: ['instructor-courses', userId],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/courses', { token });
      const allCourses = data.courses || [];
      // Filter courses taught by this instructor
      return allCourses.filter((c: any) => c.instructor_id === userId);
    },
    enabled: enabled && !!token && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInstructorSessions({ token, courseIds, enabled = true }: { token: string | null; courseIds: string[]; enabled?: boolean }) {
  return useQuery({
    queryKey: ['instructor-sessions', courseIds],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/sessions', { token });
      const allSessions = data.sessions || [];
      // Filter sessions for instructor's courses
      return allSessions.filter((s: any) => courseIds.includes(s.course_id));
    },
    enabled: enabled && !!token && courseIds.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useInstructorAttendance({ token, sessionIds, enabled = true }: { token: string | null; sessionIds: string[]; enabled?: boolean }) {
  return useQuery({
    queryKey: ['instructor-attendance', sessionIds],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/attendance', { token });
      const allAttendance = data.attendance || [];
      // Filter attendance for instructor's sessions
      return allAttendance.filter((a: any) => sessionIds.includes(a.session_id));
    },
    enabled: enabled && !!token && sessionIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Combined hook for instructor dashboard stats
export function useInstructorStats({ token, userId, enabled = true }: UseInstructorDataOptions) {
  const coursesQuery = useInstructorCourses({ token, userId, enabled });
  const courseIds = coursesQuery.data?.map((c: any) => c.id) || [];
  const sessionsQuery = useInstructorSessions({ token, courseIds, enabled: enabled && courseIds.length > 0 });
  const sessionIds = sessionsQuery.data?.map((s: any) => s.id) || [];
  const attendanceQuery = useInstructorAttendance({ token, sessionIds, enabled: enabled && sessionIds.length > 0 });

  const stats = {
    totalCourses: coursesQuery.data?.length || 0,
    totalSessions: sessionsQuery.data?.length || 0,
    totalStudents: 0,
    attendanceRate: 0,
    activeSessions: 0,
  };

  if (coursesQuery.data) {
    // Count unique students across all courses
    const uniqueStudents = new Set();
    coursesQuery.data.forEach((course: any) => {
      (course.enrolled_students || []).forEach((s: string) => uniqueStudents.add(s));
    });
    stats.totalStudents = uniqueStudents.size;
  }

  if (sessionsQuery.data) {
    const now = new Date();
    stats.activeSessions = sessionsQuery.data.filter((s: any) => {
      const sessionDate = new Date(s.date);
      return sessionDate.toDateString() === now.toDateString() && s.status === 'active';
    }).length;
  }

  if (attendanceQuery.data && sessionsQuery.data) {
    const totalAttendance = attendanceQuery.data.length;
    const presentCount = attendanceQuery.data.filter((a: any) => a.status === 'present').length;
    stats.attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  }

  return {
    stats,
    courses: coursesQuery.data || [],
    sessions: sessionsQuery.data || [],
    attendance: attendanceQuery.data || [],
    isLoading: coursesQuery.isLoading || sessionsQuery.isLoading || attendanceQuery.isLoading,
    isError: coursesQuery.isError || sessionsQuery.isError || attendanceQuery.isError,
    error: coursesQuery.error || sessionsQuery.error || attendanceQuery.error,
  };
}
