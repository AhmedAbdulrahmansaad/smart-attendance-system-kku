import React, { useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useStudentStats } from '../hooks/useStudentData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Award,
  Target,
  BarChart3,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export function StudentDashboard() {
  const { language } = useLanguage();
  const { token, user } = useAuth();
  
  // Use React Query for data fetching with caching
  const { stats, courses, sessions, isLoading, isError, error } = useStudentStats({
    token,
    userId: user?.id || null,
  });

  // Track previous courses count to detect new enrollments
  const prevCoursesCountRef = useRef<number>(courses.length);

  // Show notification when a new course is added
  useEffect(() => {
    if (courses.length > prevCoursesCountRef.current && prevCoursesCountRef.current > 0) {
      const newCourse = courses[courses.length - 1]; // Get the latest course
      toast.success(
        language === 'ar' 
          ? `🎉 تم تسجيلك في مقرر جديد: ${newCourse.name || newCourse.code}`
          : `🎉 You've been enrolled in: ${newCourse.name || newCourse.code}`,
        {
          duration: 5000,
          position: 'top-center',
        }
      );
    }
    prevCoursesCountRef.current = courses.length;
  }, [courses, language]);

  // Memoize expensive computations
  const upcomingSessions = useMemo(() => {
    if (!sessions.length) return [];
    const today = new Date();
    return sessions
      .filter((s: any) => new Date(s.date) >= today)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [sessions]);

  const mainStats = useMemo(() => [
    {
      title: language === 'ar' ? 'موادي الدراسية' : 'My Courses',
      value: stats.myCourses,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      description: language === 'ar' ? 'المسجل فيها' : 'Enrolled',
    },
    {
      title: language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
      description: language === 'ar' ? 'معدل حضوري' : 'My average',
    },
    {
      title: language === 'ar' ? 'الجلسات الحاضرة' : 'Attended',
      value: stats.presentCount,
      icon: CheckCircle,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      description: language === 'ar' ? 'حضرتها' : 'Sessions',
    },
    {
      title: language === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions',
      value: stats.totalSessions,
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600 dark:text-orange-400',
      description: language === 'ar' ? 'في موادي' : 'In my courses',
    },
  ], [language, stats]);

  const attendanceStats = useMemo(() => [
    {
      title: language === 'ar' ? 'حاضر' : 'Present',
      value: stats.presentCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: language === 'ar' ? 'غائب' : 'Absent',
      value: stats.absentCount,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
    },
    {
      title: language === 'ar' ? 'متأخر' : 'Late',
      value: stats.lateCount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
    },
  ], [language, stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}</p>
          <p className="text-sm text-muted-foreground mt-2">{error?.message}</p>
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
          {language === 'ar' ? 'لوحة تحكم الطالب' : 'Student Dashboard'}
        </motion.h1>
        <p className="text-muted-foreground text-lg">
          {language === 'ar' ? `مرحباً ${user?.full_name}! تابع تقدمك الأكاديمي` : `Welcome ${user?.full_name}! Track your academic progress`}
        </p>
      </div>

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

      {/* Attendance Breakdown */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          {language === 'ar' ? 'تفصيل الحضور' : 'Attendance Breakdown'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {attendanceStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                      <h3 className="text-4xl font-black">{stat.value}</h3>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* My Courses & Upcoming Sessions */}
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
                {language === 'ar' ? 'المواد المسجل فيها هذا الفصل' : 'Courses enrolled this semester'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.slice(0, 5).map((course: any, index: number) => (
                    <div
                      key={course.id || index}
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
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                  {courses.length > 5 && (
                    <Button variant="outline" className="w-full">
                      {language === 'ar' ? `عرض الكل (${courses.length})` : `View All (${courses.length})`}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لم تسجل في أي مواد بعد' : 'No courses enrolled yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-2 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'الجلسات القادمة' : 'Upcoming Sessions'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'الجلسات المجدولة قريباً' : 'Sessions scheduled soon'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((session: any, index: number) => (
                    <div
                      key={session.id || index}
                      className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold">{session.course_name || session.course_code}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {language === 'ar' ? 'قريباً' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className={`border-2 ${stats.attendanceRate >= 75 ? 'border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5' : 'border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${stats.attendanceRate >= 75 ? 'bg-green-500/20' : 'bg-yellow-500/20'} flex items-center justify-center`}>
                  {stats.attendanceRate >= 75 ? (
                    <Award className="w-8 h-8 text-green-600" />
                  ) : (
                    <Target className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {stats.attendanceRate >= 75
                      ? (language === 'ar' ? 'أداء ممتاز!' : 'Excellent Performance!')
                      : (language === 'ar' ? 'يمكنك التحسين!' : 'You Can Improve!')}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ar' 
                      ? `نسبة حضورك ${stats.attendanceRate}%`
                      : `Your attendance is ${stats.attendanceRate}%`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-black ${stats.attendanceRate >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stats.attendanceRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'نسبة الحضور' : 'Attendance'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}