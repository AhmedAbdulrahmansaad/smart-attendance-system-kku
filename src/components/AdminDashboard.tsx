import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useAdminDashboardStats } from '../hooks/useSupabaseData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Activity,
  Clock,
  UserCheck,
  UserX,
  GraduationCap,
  ChevronRight,
  BarChart3,
  PieChart,
  AlertCircle
} from 'lucide-react';

export function AdminDashboard() {
  const { language } = useLanguage();
  const { token } = useAuth();
  
  // استخدام الـ hook الشامل لجلب جميع البيانات مباشرة من Supabase
  const { data, isLoading, isError, error } = useAdminDashboardStats();
  
  const stats = data?.stats || {
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalSessions: 0,
    activeSessionsToday: 0,
    attendanceRateToday: 0,
    presentToday: 0,
    absentToday: 0,
  };
  
  const recentActivity = data?.recentActivity || [];

  const statsCards = [
    {
      title: language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: language === 'ar' ? 'عدد الطلاب' : 'Total Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: language === 'ar' ? 'عدد المدرسين' : 'Total Instructors',
      value: stats.totalInstructors,
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: language === 'ar' ? 'المواد الدراسية' : 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const todayCards = [
    {
      title: language === 'ar' ? 'جلسات اليوم' : "Today's Sessions",
      value: stats.activeSessionsToday,
      icon: Calendar,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate',
      value: `${stats.attendanceRateToday}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
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
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
    },
  ];

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black mb-2 bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent"
        >
          {language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
        </motion.h1>
        <p className="text-muted-foreground text-lg">
          {language === 'ar' ? 'نظرة شاملة على نظام الحضور' : 'Comprehensive overview of the attendance system'}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-4xl font-black mb-2">{stat.value}</h3>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                    <stat.icon className={`w-8 h-8 ${stat.textColor}`} />
                  </div>
                </div>
                <div className={`h-2 rounded-full bg-gradient-to-r ${stat.color} mt-4`}></div>
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
          {todayCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${stat.color}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                    <Badge variant="outline" className={stat.textColor}>
                      {language === 'ar' ? 'مباشر' : 'Live'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black">{stat.value}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
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
              {[
                { label: language === 'ar' ? 'إدارة المستخدمين' : 'Manage Users', icon: Users, color: 'text-blue-600' },
                { label: language === 'ar' ? 'إدارة المواد' : 'Manage Courses', icon: BookOpen, color: 'text-green-600' },
                { label: language === 'ar' ? 'إدارة الجداول' : 'Manage Schedules', icon: Calendar, color: 'text-purple-600' },
                { label: language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Analytics', icon: PieChart, color: 'text-orange-600' },
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-between h-14 text-base hover:bg-primary/5 hover:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                    <span>{action.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-2 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'آخر الأحداث في النظام' : 'Latest events in the system'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="font-semibold">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.course_name} {activity.course_code && `(${activity.course_code})`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'ar' ? 'المدرس: ' : 'Instructor: '}{activity.instructor_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                      {activity.active && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-2 border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {language === 'ar' ? 'حالة النظام: ممتازة' : 'System Status: Excellent'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'جميع الأنظمة تعمل بشكل طبيعي' : 'All systems operational'}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white text-base px-4 py-2">
                {language === 'ar' ? '100% نشط' : '100% Active'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}