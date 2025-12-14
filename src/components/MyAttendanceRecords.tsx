import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';

interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  session_id: string;
  date: string;
  status: string;
  session_code: string;
  course?: {
    course_name: string;
    course_code: string;
  };
}

export function MyAttendanceRecords() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/attendance', {
        method: 'GET',
        token: session.access_token,
      });

      setAttendance(data.attendance || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setError('فشل تحميل سجل الحضور');
    } finally {
      setLoading(false);
    }
  };

  const groupByCourse = () => {
    const grouped: Record<string, AttendanceRecord[]> = {};

    attendance.forEach((record) => {
      const courseKey = record.course_id;
      if (!grouped[courseKey]) {
        grouped[courseKey] = [];
      }
      grouped[courseKey].push(record);
    });

    return grouped;
  };

  const groupedAttendance = groupByCourse();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1>سجل الحضور</h1>
          <p className="text-muted-foreground">عرض سجل الحضور الخاص بك</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد سجلات حضور بعد</p>
            <p className="text-sm text-muted-foreground mt-2">
              سجل حضورك في المحاضرات لتظهر هنا
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>سجل الحضور</h1>
        <p className="text-muted-foreground">
          إجمالي الحضور: {attendance.length} {attendance.length === 1 ? 'جلسة' : 'جلسات'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي المواد</p>
                <p className="text-3xl font-bold">{Object.keys(groupedAttendance).length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">جلسات الحضور</p>
                <p className="text-3xl font-bold">{attendance.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">آخر حضور</p>
                <p className="text-lg font-semibold">
                  {new Date(attendance[0].date).toLocaleDateString('ar-SA', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance by Course */}
      <div className="space-y-6">
        {Object.entries(groupedAttendance).map(([courseId, records]) => {
          const course = records[0]?.course;
          if (!course) return null;

          return (
            <Card key={courseId}>
              <CardHeader>
                <CardTitle>{course.course_name}</CardTitle>
                <CardDescription>
                  {course.course_code} • {records.length} {records.length === 1 ? 'جلسة' : 'جلسات'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">حضور مسجل</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('ar-SA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">الوقت</p>
                        <p className="font-mono text-sm">
                          {new Date(record.date).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}