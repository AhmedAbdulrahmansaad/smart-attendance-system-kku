import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { apiRequest } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { DemoDataInitializer } from './DemoDataInitializer';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Activity,
  Clock,
  UserCheck,
  UserX,
  PlayCircle,
  Video,
  ChevronRight,
  BarChart3,
  AlertCircle,
  GraduationCap,
  CheckCircle
} from 'lucide-react';

interface InstructorStats {
  myCourses: number;
  totalStudents: number;
  totalSessions: number;
  activeSessionsToday: number;
  averageAttendance: number;
  presentToday: number;
  absentToday: number;
  liveSessionsCount: number;
}

export function InstructorDashboard() {
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const [stats, setStats] = useState<InstructorStats>({
    myCourses: 0,
    totalStudents: 0,
    totalSessions: 0,
    activeSessionsToday: 0,
    averageAttendance: 0,
    presentToday: 0,
    absentToday: 0,
    liveSessionsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Load data in parallel
      const [coursesData, sessionsData, studentsData, attendanceData] = await Promise.all([
        apiRequest('/courses', { token }).catch(() => ({ courses: [] })),
        apiRequest('/sessions', { token }).catch(() => ({ sessions: [] })),
        apiRequest('/users', { token }).catch(() => ({ users: [] })),
        apiRequest('/attendance/today', { token }).catch(() => ({ attendance: [] })),
      ]);

      const allCourses = coursesData.courses || [];
      const allSessions = sessionsData.sessions || [];
      const allUsers = studentsData.users || [];
      const todayAttendance = attendanceData.attendance || [];

      // Filter my courses (as instructor)
      const instructorCourses = allCourses.filter((c: any) => 
        c.instructor_id === user?.id || c.instructor_email === user?.email
      );
      
      setMyCourses(instructorCourses);

      // Get all students enrolled in my courses
      const courseIds = instructorCourses.map((c: any) => c.id);
      const enrolledStudents = allUsers.filter((u: any) => 
        u.role === 'student' && courseIds.some(id => u.enrolled_courses?.includes(id))
      );

      // Get my sessions
      const mySessions = allSessions.filter((s: any) => 
        courseIds.includes(s.course_id) || s.instructor_id === user?.id
      );

      // Today's sessions
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = mySessions.filter((s: any) => s.date?.startsWith(today));

      // Live sessions
      const liveSessions = mySessions.filter((s: any) => s.status === 'active' || s.is_live);

      // Calculate attendance stats
      const myAttendance = todayAttendance.filter((a: any) => 
        courseIds.includes(a.course_id)
      );
      
      const presentCount = myAttendance.filter((a: any) => a.status === 'present').length;
      const absentCount = myAttendance.filter((a: any) => a.status === 'absent').length;
      const totalAttendance = presentCount + absentCount;
      const avgAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      setStats({
        myCourses: instructorCourses.length,
        totalStudents: enrolledStudents.length,
        totalSessions: mySessions.length,
        activeSessionsToday: todaySessions.length,
        averageAttendance: Math.round(avgAttendance),
        presentToday: presentCount,
        absentToday: absentCount,
        liveSessionsCount: liveSessions.length,
      });

      // Set upcoming sessions
      setUpcomingSessions(todaySessions.slice(0, 5));

    } catch (error) {
      console.error('Error loading instructor dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainStats = [
    {
      title: language === 'ar' ? 'موادي الدراسية' : 'My Courses',
      value: stats.myCourses,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      description: language === 'ar' ? 'المواد المسندة لي' : 'Assigned to me',
    },
    {
      title: language === 'ar' ? 'عدد الطلاب' : 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
      description: language === 'ar' ? 'المسجلون في موادي' : 'Enrolled in my courses',
    },
    {
      title: language === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions',
      value: stats.totalSessions,
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      description: language === 'ar' ? 'جميع الجلسات' : 'All sessions',
    },
    {
      title: language === 'ar' ? 'متوسط الحضور' : 'Avg Attendance',
      value: `${stats.averageAttendance}%`,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600 dark:text-orange-400',
      description: language === 'ar' ? 'نسبة الحضور' : 'Attendance rate',
    },
  ];

  const todayStats = [
    {
      title: language === 'ar' ? 'جلسات اليوم' : "Today's Sessions",
      value: stats.activeSessionsToday,
      icon: Calendar,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: language === 'ar' ? 'بث مباشر' : 'Live Sessions',
      value: stats.liveSessionsCount,
      icon: Video,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
      badge: language === 'ar' ? 'مباشر' : 'LIVE',
    },
    {
      title: language === 'ar' ? 'حاضرون اليوم' : 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: language === 'ar' ? 'غائبون اليوم' : 'Absent Today',
      value: stats.absentToday,
      icon: UserX,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black mb-2 bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent"
        >
          {language === 'ar' ? 'لوحة تحكم المدرس' : 'Instructor Dashboard'}
        </motion.h1>
        <p className="text-muted-foreground text-lg">
          {language === 'ar' ? 'إدارة موادك وجلساتك بكفاءة' : 'Manage your courses and sessions efficiently'}
        </p>
      </div>

      {/* Show Demo Data Initializer if no courses */}
      {stats.myCourses === 0 && stats.totalSessions === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DemoDataInitializer onSuccess={() => window.location.reload()} />
        </motion.div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${stat.color}`}></div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                    <stat.icon className={`w-8 h-8 ${stat.textColor}`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-4xl font-black mb-2">{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          {language === 'ar' ? 'نشاط اليوم' : "Today's Activity"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {todayStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                    {stat.badge && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black">{stat.value}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* My Courses & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'موادي الدراسية' : 'My Courses'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'المواد المسندة لي هذا الفصل' : 'Courses assigned to me this semester'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myCourses.length > 0 ? (
                <div className="space-y-3">
                  {myCourses.slice(0, 5).map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold">{course.code}</p>
                          <p className="text-sm text-muted-foreground">{course.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {course.enrolled_count || 0} {language === 'ar' ? 'طالب' : 'students'}
                      </Badge>
                    </div>
                  ))}
                  {myCourses.length > 5 && (
                    <Button variant="outline" className="w-full">
                      {language === 'ar' ? `عرض الكل (${myCourses.length})` : `View All (${myCourses.length})`}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مواد مسندة لك' : 'No courses assigned to you'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-2 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'الوصول السريع للوظائف الرئيسية' : 'Quick access to main functions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-between h-16 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-6 h-6" />
                  <span className="font-bold">{language === 'ar' ? 'إنشاء جلسة جديدة' : 'Create New Session'}</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-14 text-base hover:bg-red-500/10 hover:border-red-500"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-red-600" />
                  <span>{language === 'ar' ? 'بدء بث مباشر' : 'Start Live Stream'}</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-14 text-base hover:bg-blue-500/10 hover:border-blue-500"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? 'عرض الطلاب' : 'View Students'}</span>
                </div>
                <Badge className="bg-green-500 text-white">
                  {stats.totalStudents}
                </Badge>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-14 text-base hover:bg-purple-500/10 hover:border-purple-500"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'جلسات اليوم' : "Today's Sessions"}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'الجلسات المقررة لهذا اليوم' : 'Sessions scheduled for today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold">{session.course_name || session.course_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.start_time || session.created_at).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.is_live || session.status === 'active' ? (
                        <Badge className="bg-red-500 text-white animate-pulse">
                          {language === 'ar' ? 'مباشر' : 'LIVE'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {language === 'ar' ? 'مجدولة' : 'Scheduled'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد جلسات مجدولة لليوم' : 'No sessions scheduled for today'}
                </p>
                <Button className="mt-4" variant="outline">
                  {language === 'ar' ? 'إنشاء جلسة جديدة' : 'Create New Session'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="border-2 border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {language === 'ar' ? 'أداء ممتاز!' : 'Excellent Performance!'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ar' 
                      ? `متوسط حضور ${stats.averageAttendance}% في موادك`
                      : `${stats.averageAttendance}% average attendance in your courses`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-green-600">{stats.averageAttendance}%</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'معدل الحضور' : 'Attendance Rate'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}