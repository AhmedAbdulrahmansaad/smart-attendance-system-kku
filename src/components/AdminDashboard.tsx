import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Overview {
  total_users: number;
  total_students: number;
  total_instructors: number;
  total_courses: number;
  total_sessions: number;
  total_attendance_records: number;
}

export function AdminDashboard() {
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
          total_users: 0,
          total_students: 0,
          total_instructors: 0,
          total_courses: 0,
          total_sessions: 0,
          total_attendance_records: 0
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
        total_users: 0,
        total_students: 0,
        total_instructors: 0,
        total_courses: 0,
        total_sessions: 0,
        total_attendance_records: 0
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
      title: 'إجمالي المستخدمين',
      value: overview.total_users,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'المواد الدراسية',
      value: overview.total_courses,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'جلسات الحضور',
      value: overview.total_sessions,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'سجلات الحضور',
      value: overview.total_attendance_records,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const userDistribution = [
    { name: 'الطلاب', value: overview.total_students, color: '#1ABC9C' },
    { name: 'المدرسون', value: overview.total_instructors, color: '#3498DB' },
    { name: 'المديرون', value: overview.total_users - overview.total_students - overview.total_instructors, color: '#2C3E50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>لوحة تحكم المدير</h1>
        <p className="text-muted-foreground">نظرة عامة على النظام</p>
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
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المستخدمين</CardTitle>
            <CardDescription>نسبة المستخدمين حسب الدور</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
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

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات سريعة</CardTitle>
            <CardDescription>معلومات عامة عن النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-muted-foreground">عدد الطلاب</span>
                <span className="font-semibold">{overview.total_students}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-muted-foreground">عدد المدرسين</span>
                <span className="font-semibold">{overview.total_instructors}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-muted-foreground">إجمالي المواد</span>
                <span className="font-semibold">{overview.total_courses}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-muted-foreground">جلسات الحضور</span>
                <span className="font-semibold">{overview.total_sessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">سجلات الحضور</span>
                <span className="font-semibold">{overview.total_attendance_records}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}