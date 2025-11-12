import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Calendar, Users, TrendingUp } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DebugPanel } from './DebugPanel';

interface Overview {
  my_courses: number;
  my_sessions: number;
  my_attendance_records: number;
}

export function InstructorDashboard() {
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
          my_sessions: 0,
          my_attendance_records: 0
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
        my_sessions: 0,
        my_attendance_records: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جارٍ التحميل...</p>
          <p className="mt-2 text-xs text-muted-foreground">إذا استمر التحميل، قم بتحديث الصفحة</p>
        </div>
      </div>
    );
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
      title: 'موادي',
      value: overview.my_courses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'الجلسات',
      value: overview.my_sessions,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'سجلات الحضور',
      value: overview.my_attendance_records,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'متوسط الحضور',
      value: overview.my_sessions > 0
        ? `${Math.round((overview.my_attendance_records / overview.my_sessions) * 100) / 100}`
        : '0',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const chartData = [
    {
      name: 'الجلسات',
      value: overview.my_sessions,
    },
    {
      name: 'سجلات الحضور',
      value: overview.my_attendance_records,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>لوحة تحكم المدرس</h1>
        <p className="text-muted-foreground">نظرة عامة على موادك وجلساتك</p>
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
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>نشاط الجلسات</CardTitle>
            <CardDescription>مقارنة بين الجلسات وسجلات الحضور</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#1ABC9C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>ما يمكنك فعله الآن</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <h3 className="font-medium mb-2">إنشاء جلسة حضور جديدة</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  ابدأ جلسة جديدة للطلاب لتسجيل حضورهم
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // This will be handled by the parent navigation
                  }}
                  className="text-sm text-accent font-medium hover:underline"
                >
                  انتقل إلى جلسات الحضور ←
                </a>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-medium mb-2">عرض التقارير</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  راجع تقارير الحضور والغياب لطلابك
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  عرض التقارير ←
                </a>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium mb-2">إدارة الجداول</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  أضف أو عدل الجداول الدراسية لموادك
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  إدارة الجداول ←
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}