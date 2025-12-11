import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useSupervisorData } from '../hooks/useSupervisorData';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Download,
  Filter,
  Eye,
  UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { LoadingFallback } from './LoadingFallback';

const COLORS = ['#006747', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

interface SupervisorDashboardProps {}

export function SupervisorDashboard({}: SupervisorDashboardProps) {
  const { language } = useLanguage();
  const { token } = useAuth();
  const isRTL = language === 'ar';
  const [timeFilter, setTimeFilter] = useState('week');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const { stats, loading, error } = useSupervisorData(token);

  if (loading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p>{language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const translations = {
    ar: {
      title: 'لوحة تحكم المشرف',
      subtitle: 'نظرة شاملة على جميع أنشطة الحضور والمقررات',
      overview: 'نظرة عامة',
      totalStudents: 'إجمالي الطلاب',
      totalInstructors: 'إجمالي المدرسين',
      totalCourses: 'إجمالي المقررات',
      totalSessions: 'إجمالي الجلسات',
      avgAttendance: 'متوسط الحضور',
      activeSessions: 'الجلسات النشطة',
      todayAttendance: 'حضور اليوم',
      attendanceTrends: 'اتجاهات الحضور',
      coursePerformance: 'أداء المقررات',
      attendanceByDepartment: 'الحضور حسب القسم',
      recentActivity: 'النشاط الأخير',
      filters: 'الفلاتر',
      timeRange: 'الفترة الزمنية',
      department: 'القسم',
      week: 'الأسبوع',
      month: 'الشهر',
      semester: 'الفصل الدراسي',
      year: 'السنة',
      all: 'الكل',
      exportReport: 'تصدير التقرير',
      viewDetails: 'عرض التفاصيل',
      students: 'طلاب',
      sessions: 'جلسات',
      attendance: 'الحضور',
      date: 'التاريخ',
      course: 'المقرر',
      instructor: 'المدرس',
      status: 'الحالة',
      present: 'حاضر',
      absent: 'غائب',
      late: 'متأخر',
      topCourses: 'المقررات الأكثر حضوراً',
      lowAttendanceCourses: 'مقررات ذات حضور منخفض',
      upcomingSessions: 'الجلسات القادمة',
      statistics: 'الإحصائيات',
      presentRate: 'نسبة الحضور',
      absentRate: 'نسبة الغياب',
      lateRate: 'نسبة التأخير',
    },
    en: {
      title: 'Supervisor Dashboard',
      subtitle: 'Comprehensive overview of all attendance activities and courses',
      overview: 'Overview',
      totalStudents: 'Total Students',
      totalInstructors: 'Total Instructors',
      totalCourses: 'Total Courses',
      totalSessions: 'Total Sessions',
      avgAttendance: 'Average Attendance',
      activeSessions: 'Active Sessions',
      todayAttendance: 'Today\'s Attendance',
      attendanceTrends: 'Attendance Trends',
      coursePerformance: 'Course Performance',
      attendanceByDepartment: 'Attendance by Department',
      recentActivity: 'Recent Activity',
      filters: 'Filters',
      timeRange: 'Time Range',
      department: 'Department',
      week: 'Week',
      month: 'Month',
      semester: 'Semester',
      year: 'Year',
      all: 'All',
      exportReport: 'Export Report',
      viewDetails: 'View Details',
      students: 'Students',
      sessions: 'Sessions',
      attendance: 'Attendance',
      date: 'Date',
      course: 'Course',
      instructor: 'Instructor',
      status: 'Status',
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      topCourses: 'Top Attended Courses',
      lowAttendanceCourses: 'Low Attendance Courses',
      upcomingSessions: 'Upcoming Sessions',
      statistics: 'Statistics',
      presentRate: 'Present Rate',
      absentRate: 'Absent Rate',
      lateRate: 'Late Rate',
    }
  };

  const t = translations[language];

  // Mock data for charts - in real app, this comes from backend
  const attendanceTrendsData = [
    { name: language === 'ar' ? 'السبت' : 'Sat', حضور: 85, غياب: 15 },
    { name: language === 'ar' ? 'الأحد' : 'Sun', حضور: 88, غياب: 12 },
    { name: language === 'ar' ? 'الاثنين' : 'Mon', حضور: 82, غياب: 18 },
    { name: language === 'ar' ? 'الثلاثاء' : 'Tue', حضور: 90, غياب: 10 },
    { name: language === 'ar' ? 'الأربعاء' : 'Wed', حضور: 87, غياب: 13 },
    { name: language === 'ar' ? 'الخميس' : 'Thu', حضور: 84, غياب: 16 },
  ];

  const coursePerformanceData = stats?.courseStats || [
    { name: 'CS101', attendance: 92, students: 45 },
    { name: 'CS102', attendance: 85, students: 38 },
    { name: 'CS201', attendance: 88, students: 42 },
    { name: 'CS202', attendance: 78, students: 35 },
  ];

  const attendanceDistribution = [
    { name: language === 'ar' ? 'حاضر' : 'Present', value: stats?.presentCount || 0 },
    { name: language === 'ar' ? 'غائب' : 'Absent', value: stats?.absentCount || 0 },
    { name: language === 'ar' ? 'متأخر' : 'Late', value: stats?.lateCount || 0 },
  ];

  const handleExportReport = () => {
    // Implementation for exporting reports
    console.log('Exporting report...');
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#006747]">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleExportReport}
            className="bg-[#006747] hover:bg-[#005438] gap-2"
          >
            <Download className="w-4 h-4" />
            {t.exportReport}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t.filters}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.timeRange}</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t.week}</SelectItem>
                  <SelectItem value="month">{t.month}</SelectItem>
                  <SelectItem value="semester">{t.semester}</SelectItem>
                  <SelectItem value="year">{t.year}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.department}</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="cs">{language === 'ar' ? 'علوم الحاسب' : 'Computer Science'}</SelectItem>
                  <SelectItem value="math">{language === 'ar' ? 'الرياضيات' : 'Mathematics'}</SelectItem>
                  <SelectItem value="eng">{language === 'ar' ? 'الهندسة' : 'Engineering'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalStudents}</CardTitle>
            <Users className="w-5 h-5 text-[#006747]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#006747]">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'طالب مسجل في النظام' : 'Registered students'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalInstructors}</CardTitle>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalInstructors || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'مدرس في النظام' : 'Active instructors'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCourses}</CardTitle>
            <BookOpen className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'مقرر نشط' : 'Active courses'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.avgAttendance}</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.avgAttendance || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'نسبة الحضور العامة' : 'Overall attendance rate'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalSessions}</CardTitle>
            <Calendar className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <Badge variant="outline" className="mt-2">
              {language === 'ar' ? 'جلسة هذا الأسبوع' : 'Sessions this week'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.activeSessions}</CardTitle>
            <Clock className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <Badge variant="default" className="mt-2 bg-green-600">
              {language === 'ar' ? 'قيد التنفيذ الآن' : 'Running now'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.todayAttendance}</CardTitle>
            <CheckCircle className="w-5 h-5 text-[#006747]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayAttendance || 0}</div>
            <Badge variant="secondary" className="mt-2">
              {language === 'ar' ? 'من أصل' : 'out of'} {stats?.todayExpected || 0}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t.attendanceTrends}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'نسبة الحضور والغياب خلال الأسبوع' : 'Attendance vs Absence rate this week'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="حضور" fill="#006747" name={language === 'ar' ? 'حضور' : 'Present'} />
                <Bar dataKey="غياب" fill="#EF4444" name={language === 'ar' ? 'غياب' : 'Absent'} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t.statistics}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'توزيع حالات الحضور' : 'Distribution of attendance status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t.coursePerformance}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'أداء الحضور في المقررات المختلفة' : 'Attendance performance across courses'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={coursePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="attendance" 
                fill="#006747" 
                name={language === 'ar' ? 'نسبة الحضور %' : 'Attendance %'} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.recentActivity}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'آخر الأنشطة في النظام' : 'Latest system activities'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivities?.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'present' ? 'bg-green-600' : 
                    activity.type === 'absent' ? 'bg-red-600' : 
                    'bg-orange-600'
                  }`} />
                  <div>
                    <p className="font-medium">{activity.courseName}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.studentName} - {activity.time}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  activity.type === 'present' ? 'default' : 
                  activity.type === 'absent' ? 'destructive' : 
                  'secondary'
                }>
                  {activity.type === 'present' ? t.present : 
                   activity.type === 'absent' ? t.absent : 
                   t.late}
                </Badge>
              </div>
            )) || (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ar' ? 'لا توجد أنشطة حديثة' : 'No recent activities'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}