import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';

interface UseAdminDataOptions {
  token: string | null;
  enabled?: boolean;
}

// Hook for comprehensive dashboard statistics
export function useAdminDashboardStats({ token, enabled = true }: UseAdminDataOptions) {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await apiRequest('/stats/dashboard', { token });
      return data;
    },
    enabled: enabled && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
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