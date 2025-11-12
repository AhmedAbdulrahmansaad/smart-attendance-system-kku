import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DebugPanel } from './DebugPanel';
import { LoadingFallback } from './LoadingFallback';

interface Overview {
  my_courses: number;
  my_attendance_records: number;
  total_sessions: number;
  my_attendance_rate: number;
}

export function StudentDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // Set default data if no session
        setOverview({
          my_courses: 0,
          my_attendance_records: 0,
          total_sessions: 0,
          my_attendance_rate: 0
        });
        setLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        throw new Error('Request timeout');
      }, 10000); // 10 seconds timeout

      const data = await apiRequest('/reports/overview', {
        token: session.access_token,
      });

      clearTimeout(timeoutId);
      setOverview(data.overview);
    } catch (error: any) {
      console.error('Error loading overview:', error);
      setError(error.message || 'Failed to load data');
      // Set default data on error
      setOverview({
        my_courses: 0,
        my_attendance_records: 0,
        total_sessions: 0,
        my_attendance_rate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد بيانات لعرضها</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <button 
          onClick={loadOverview}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: 'موادي الدراسية',
      value: overview.my_courses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'سجلات الحضور',
      value: overview.my_attendance_records,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'إجمالي الجلسات',
      value: overview.total_sessions,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'نسبة الحضور',
      value: `${overview.my_attendance_rate}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const attendanceData = [
    {
      name: 'الحضور',
      value: overview.my_attendance_records,
      color: '#1ABC9C',
    },
    {
      name: 'الغياب',
      value: overview.total_sessions - overview.my_attendance_records,
      color: '#E74C3C',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>لوحة تحكم الطالب</h1>
        <p className="text-muted-foreground">نظرة عامة على حضورك الأكاديمي</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        {overview.total_sessions > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الحضور</CardTitle>
              <CardDescription>نسبة الحضور والغياب</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Card */}
        <Card>
          <CardHeader>
            <CardTitle>الأداء الأكاديمي</CardTitle>
            <CardDescription>ملخص حضورك الدراسي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Attendance Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">نسبة الحضور</span>
                  <span className="text-sm font-semibold">{overview.my_attendance_rate}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-green-500 transition-all duration-500"
                    style={{ width: `${overview.my_attendance_rate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.my_attendance_rate >= 75
                    ? 'أداء ممتاز! استمر في الحفاظ على حضورك'
                    : overview.my_attendance_rate >= 50
                    ? 'أداء جيد، حاول تحسين نسبة الحضور'
                    : 'يجب تحسين نسبة الحضور'}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">المواد المسجلة</span>
                  <span className="font-semibold">{overview.my_courses}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">الجلسات الحاضرة</span>
                  <span className="font-semibold text-green-600">
                    {overview.my_attendance_records}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">الجلسات الغائبة</span>
                  <span className="font-semibold text-red-600">
                    {overview.total_sessions - overview.my_attendance_records}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">إجمالي الجلسات</span>
                  <span className="font-semibold">{overview.total_sessions}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            نصائح لتحسين الحضور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>تأكد من الوصول للمحاضرة في الوقت المحدد</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>احتفظ بهاتفك جاهزاً لتسجيل كود الحضور</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>راجع جدولك الدراسي بانتظام لتجنب فوات أي محاضرة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>في حالة الغياب الاضطراري، تواصل مع المدرس لتوضيح السبب</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}