import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';

interface UseAdminDataOptions {
  token: string | null;
  enabled?: boolean;
}

export function useAllUsers({ token, enabled = true }: UseAdminDataOptions) {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/users', { token });
      return data.users || [];
    },
    enabled: enabled && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllCourses({ token, enabled = true }: UseAdminDataOptions) {
  return useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/courses', { token });
      return data.courses || [];
    },
    enabled: enabled && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllSessions({ token, enabled = true }: UseAdminDataOptions) {
  return useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/sessions', { token });
      return data.sessions || [];
    },
    enabled: enabled && !!token,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useAllAttendance({ token, enabled = true }: UseAdminDataOptions) {
  return useQuery({
    queryKey: ['all-attendance'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/attendance', { token });
      return data.attendance || [];
    },
    enabled: enabled && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Combined hook for admin dashboard stats
export function useAdminStats({ token, enabled = true }: UseAdminDataOptions) {
  const usersQuery = useAllUsers({ token, enabled });
  const coursesQuery = useAllCourses({ token, enabled });
  const sessionsQuery = useAllSessions({ token, enabled });
  const attendanceQuery = useAllAttendance({ token, enabled });

  const stats = {
    totalUsers: usersQuery.data?.length || 0,
    totalInstructors: usersQuery.data?.filter((u: any) => u.role === 'instructor').length || 0,
    totalStudents: usersQuery.data?.filter((u: any) => u.role === 'student').length || 0,
    totalCourses: coursesQuery.data?.length || 0,
    totalSessions: sessionsQuery.data?.length || 0,
    attendanceRate: 0,
    activeSessions: 0,
  };

  if (sessionsQuery.data) {
    const now = new Date();
    stats.activeSessions = sessionsQuery.data.filter((s: any) => {
      const sessionDate = new Date(s.date);
      return sessionDate.toDateString() === now.toDateString() && s.status === 'active';
    }).length;
  }

  if (attendanceQuery.data) {
    const totalAttendance = attendanceQuery.data.length;
    const presentCount = attendanceQuery.data.filter((a: any) => a.status === 'present').length;
    stats.attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  }

  return {
    stats,
    users: usersQuery.data || [],
    courses: coursesQuery.data || [],
    sessions: sessionsQuery.data || [],
    attendance: attendanceQuery.data || [],
    isLoading: usersQuery.isLoading || coursesQuery.isLoading || sessionsQuery.isLoading || attendanceQuery.isLoading,
    isError: usersQuery.isError || coursesQuery.isError || sessionsQuery.isError || attendanceQuery.isError,
    error: usersQuery.error || coursesQuery.error || sessionsQuery.error || attendanceQuery.error,
  };
}
