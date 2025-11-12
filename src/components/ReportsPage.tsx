import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

interface StudentReport {
  student_id: string;
  student_name: string;
  student_email: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_rate: number;
}

export function ReportsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [report, setReport] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/courses', {
        token: session.access_token,
      });

      setCourses(data.courses);
      
      // Auto-select first course if available
      if (data.courses.length > 0) {
        setSelectedCourse(data.courses[0].id);
        loadReport(data.courses[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('فشل تحميل المواد');
    }
  };

  const loadReport = async (courseId: string) => {
    if (!courseId) return;
    
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest(`/reports/course/${courseId}`, {
        token: session.access_token,
      });

      setReport(data.report);
    } catch (error) {
      console.error('Error loading report:', error);
      setError('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    loadReport(courseId);
  };

  const exportToCSV = () => {
    if (report.length === 0) return;

    const headers = ['اسم الطالب', 'البريد الإلكتروني', 'الجلسات الحاضرة', 'إجمالي الجلسات', 'نسبة الحضور'];
    const rows = report.map((student) => [
      student.student_name,
      student.student_email,
      student.attended_sessions,
      student.total_sessions,
      `${student.attendance_rate}%`,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${selectedCourse}.csv`;
    link.click();
  };

  const getAttendanceIcon = (rate: number) => {
    if (rate >= 75) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (rate >= 50) return <Minus className="w-5 h-5 text-orange-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 75) return 'text-green-600 bg-green-50';
    if (rate >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const selectedCourseName = courses.find((c) => c.id === selectedCourse)?.course_name || '';

  const averageAttendance = report.length > 0
    ? Math.round(report.reduce((sum, s) => sum + s.attendance_rate, 0) / report.length)
    : 0;

  const totalStudents = report.length;
  const excellentStudents = report.filter((s) => s.attendance_rate >= 75).length;
  const needsAttention = report.filter((s) => s.attendance_rate < 50).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>تقارير الحضور</h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' 
              ? 'عرض تقارير الحضور لجميع المواد' 
              : 'عرض تقارير الحضور لموادك'}
          </p>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                {courses.length === 0 && <option value="">لا توجد مواد متاحة</option>}
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name} ({course.course_code})
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              disabled={report.length === 0}
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جارٍ تحميل التقرير...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : report.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد بيانات لهذه المادة</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">إجمالي الطلاب</p>
                    <p className="text-3xl font-bold">{totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">متوسط الحضور</p>
                    <p className="text-3xl font-bold">{averageAttendance}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">طلاب ممتازون</p>
                    <p className="text-3xl font-bold">{excellentStudents}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">يحتاجون متابعة</p>
                    <p className="text-3xl font-bold">{needsAttention}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>تقرير الحضور - {selectedCourseName}</CardTitle>
              <CardDescription>
                عرض مفصل لحضور الطلاب في المادة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3">الطالب</th>
                      <th className="text-right p-3">البريد الإلكتروني</th>
                      <th className="text-center p-3">الجلسات الحاضرة</th>
                      <th className="text-center p-3">إجمالي الجلسات</th>
                      <th className="text-center p-3">نسبة الحضور</th>
                      <th className="text-center p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((student) => (
                      <tr key={student.student_id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{student.student_name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{student.student_email}</td>
                        <td className="p-3 text-center">{student.attended_sessions}</td>
                        <td className="p-3 text-center">{student.total_sessions}</td>
                        <td className="p-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAttendanceColor(student.attendance_rate)}`}>
                            {student.attendance_rate}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {getAttendanceIcon(student.attendance_rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}