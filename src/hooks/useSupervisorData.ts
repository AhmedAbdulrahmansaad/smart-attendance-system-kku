import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';

interface SupervisorStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalSessions: number;
  avgAttendance: number;
  activeSessions: number;
  todayAttendance: number;
  todayExpected: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  courseStats: Array<{
    name: string;
    attendance: number;
    students: number;
  }>;
  recentActivities: Array<{
    courseName: string;
    studentName: string;
    time: string;
    type: 'present' | 'absent' | 'late';
  }>;
}

/**
 * Custom hook to fetch supervisor dashboard statistics
 * Uses React Query for efficient data fetching and caching
 */
export function useSupervisorData(token: string | null = null) {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<SupervisorStats>({
    queryKey: ['supervisor-stats'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/supervisor/stats', { token });
        return response;
      } catch (err: any) {
        console.error('Error fetching supervisor stats:', err);
        throw err;
      }
    },
    // Only fetch if we have a token
    enabled: !!token,
    // Refetch every 30 seconds to keep data fresh
    refetchInterval: 30000,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
    // Retry failed requests up to 3 times
    retry: 3,
    // Cache data for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats: stats || {
      totalStudents: 0,
      totalInstructors: 0,
      totalCourses: 0,
      totalSessions: 0,
      avgAttendance: 0,
      activeSessions: 0,
      todayAttendance: 0,
      todayExpected: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      courseStats: [],
      recentActivities: [],
    },
    loading,
    error: error as Error | null,
    refetch,
  };
}