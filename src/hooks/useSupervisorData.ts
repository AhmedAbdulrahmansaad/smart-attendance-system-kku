import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

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
        console.log('📊 [useSupervisorData] Loading supervisor statistics...');

        // Load all data in parallel
        const [
          studentsResult,
          instructorsResult,
          coursesResult,
          sessionsResult,
          attendanceResult,
        ] = await Promise.all([
          supabase.from('profiles').select('id').eq('role', 'student'),
          supabase.from('profiles').select('id').eq('role', 'instructor'),
          supabase.from('courses').select('id, course_name'),
          supabase.from('sessions').select('id, active, session_date'),
          supabase.from('attendance').select('id, status, recorded_at, course_id, student_id'),
        ]);

        // Check for errors
        if (studentsResult.error) throw studentsResult.error;
        if (instructorsResult.error) throw instructorsResult.error;
        if (coursesResult.error) throw coursesResult.error;
        if (sessionsResult.error) throw sessionsResult.error;
        if (attendanceResult.error) throw attendanceResult.error;

        const students = studentsResult.data || [];
        const instructors = instructorsResult.data || [];
        const courses = coursesResult.data || [];
        const sessions = sessionsResult.data || [];
        const attendance = attendanceResult.data || [];

        console.log('✅ [useSupervisorData] Data loaded:', {
          students: students.length,
          instructors: instructors.length,
          courses: courses.length,
          sessions: sessions.length,
          attendance: attendance.length,
        });

        // Calculate today's date range
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        // Filter today's attendance
        const todayAttendanceRecords = attendance.filter((a: any) => {
          const recordDate = new Date(a.recorded_at);
          return recordDate >= todayStart && recordDate <= todayEnd;
        });

        // Count status types
        const presentCount = attendance.filter((a: any) => a.status === 'present').length;
        const absentCount = attendance.filter((a: any) => a.status === 'absent').length;
        const lateCount = attendance.filter((a: any) => a.status === 'late').length;

        // Calculate average attendance
        const totalAttendanceRecords = attendance.length;
        const avgAttendance = totalAttendanceRecords > 0
          ? Math.round((presentCount / totalAttendanceRecords) * 100)
          : 0;

        // Count active sessions
        const activeSessions = sessions.filter((s: any) => s.active === true).length;

        // Calculate course statistics
        const courseStatsMap = new Map<string, { attendance: number; students: Set<string> }>();
        
        attendance.forEach((a: any) => {
          if (!courseStatsMap.has(a.course_id)) {
            courseStatsMap.set(a.course_id, {
              attendance: 0,
              students: new Set(),
            });
          }
          const stat = courseStatsMap.get(a.course_id)!;
          if (a.status === 'present') stat.attendance++;
          stat.students.add(a.student_id);
        });

        // Map course stats with names
        const courseStats = Array.from(courseStatsMap.entries())
          .map(([courseId, stat]) => {
            const course = courses.find((c: any) => c.id === courseId);
            return {
              name: course?.course_name || 'Unknown Course',
              attendance: stat.attendance,
              students: stat.students.size,
            };
          })
          .sort((a, b) => b.attendance - a.attendance)
          .slice(0, 10); // Top 10 courses

        // Get recent activities (last 20)
        const recentAttendance = [...attendance]
          .sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
          .slice(0, 20);

        // Get student and course names for recent activities
        const studentIds = [...new Set(recentAttendance.map((a: any) => a.student_id))];
        const courseIds = [...new Set(recentAttendance.map((a: any) => a.course_id))];

        const [studentsData, coursesData] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', studentIds),
          supabase.from('courses').select('id, course_name').in('id', courseIds),
        ]);

        const studentMap = new Map((studentsData.data || []).map((s: any) => [s.id, s.full_name]));
        const courseMap = new Map((coursesData.data || []).map((c: any) => [c.id, c.course_name]));

        const recentActivities = recentAttendance.map((a: any) => ({
          courseName: courseMap.get(a.course_id) || 'Unknown',
          studentName: studentMap.get(a.student_id) || 'Unknown',
          time: new Date(a.recorded_at).toLocaleString('ar-SA'),
          type: a.status as 'present' | 'absent' | 'late',
        }));

        const result: SupervisorStats = {
          totalStudents: students.length,
          totalInstructors: instructors.length,
          totalCourses: courses.length,
          totalSessions: sessions.length,
          avgAttendance,
          activeSessions,
          todayAttendance: todayAttendanceRecords.length,
          todayExpected: students.length * activeSessions, // Rough estimate
          presentCount,
          absentCount,
          lateCount,
          courseStats,
          recentActivities,
        };

        console.log('✅ [useSupervisorData] Statistics calculated:', result);
        return result;
      } catch (err: any) {
        console.error('❌ [useSupervisorData] Error:', err);
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
