import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Plus, Trash2, AlertCircle, Clock } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

interface Schedule {
  id: string;
  course_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  created_at: string;
  course?: {
    course_name: string;
    course_code: string;
  };
}

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

export function ScheduleManagement() {
  const { user: currentUser } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // New schedule form state
  const [newScheduleCourse, setNewScheduleCourse] = useState('');
  const [newScheduleDay, setNewScheduleDay] = useState('');
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('');
  const [newScheduleLocation, setNewScheduleLocation] = useState('');

  const daysOfWeek = [
    { value: 'sunday', label: 'الأحد' },
    { value: 'monday', label: 'الاثنين' },
    { value: 'tuesday', label: 'الثلاثاء' },
    { value: 'wednesday', label: 'الأربعاء' },
    { value: 'thursday', label: 'الخميس' },
    { value: 'friday', label: 'الجمعة' },
    { value: 'saturday', label: 'السبت' },
  ];

  useEffect(() => {
    loadSchedules();
    loadCourses();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/schedules', {
        token: session.access_token,
      });

      setSchedules(data.schedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('فشل تحميل الجداول');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/courses', {
        token: session.access_token,
      });

      setCourses(data.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await apiRequest('/schedules', {
        method: 'POST',
        body: {
          course_id: newScheduleCourse,
          day_of_week: newScheduleDay,
          start_time: newScheduleStartTime,
          end_time: newScheduleEndTime,
          location: newScheduleLocation,
        },
        token: session.access_token,
      });

      setIsDialogOpen(false);
      setNewScheduleCourse('');
      setNewScheduleDay('');
      setNewScheduleStartTime('');
      setNewScheduleEndTime('');
      setNewScheduleLocation('');
      
      await loadSchedules();
    } catch (err: any) {
      setError(err.message || 'فشل إضافة الجدول');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجدول؟')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await apiRequest(`/schedules/${scheduleId}`, {
        method: 'DELETE',
        token: session.access_token,
      });

      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError('فشل حذف الجدول');
    }
  };

  const getDayLabel = (day: string) => {
    const dayObj = daysOfWeek.find((d) => d.value === day);
    return dayObj ? dayObj.label : day;
  };

  const groupSchedulesByDay = () => {
    const grouped: Record<string, Schedule[]> = {};
    
    schedules.forEach((schedule) => {
      if (!grouped[schedule.day_of_week]) {
        grouped[schedule.day_of_week] = [];
      }
      grouped[schedule.day_of_week].push(schedule);
    });

    // Sort by time within each day
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>الجداول الدراسية</h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'student' 
              ? 'جدولك الأسبوعي' 
              : 'إدارة الجداول الدراسية'}
          </p>
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'instructor') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة جدول
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة جدول دراسي جديد</DialogTitle>
                <DialogDescription>
                  املأ البيانات التالية لإنشاء جدول جديد
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course">المادة</Label>
                  <select
                    id="course"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newScheduleCourse}
                    onChange={(e) => setNewScheduleCourse(e.target.value)}
                    required
                  >
                    <option value="">-- اختر مادة --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_name} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day">اليوم</Label>
                  <select
                    id="day"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newScheduleDay}
                    onChange={(e) => setNewScheduleDay(e.target.value)}
                    required
                  >
                    <option value="">-- اختر يوماً --</option>
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">وقت البداية</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newScheduleStartTime}
                      onChange={(e) => setNewScheduleStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">وقت النهاية</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newScheduleEndTime}
                      onChange={(e) => setNewScheduleEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">المكان (اختياري)</Label>
                  <Input
                    id="location"
                    value={newScheduleLocation}
                    onChange={(e) => setNewScheduleLocation(e.target.value)}
                    placeholder="مثال: قاعة 101"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">إضافة</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Weekly Schedule */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد جداول دراسية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {daysOfWeek.map((day) => {
            const daySchedules = groupedSchedules[day.value] || [];
            
            if (daySchedules.length === 0) return null;

            return (
              <Card key={day.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {day.label}
                  </CardTitle>
                  <CardDescription>
                    {daySchedules.length} {daySchedules.length === 1 ? 'محاضرة' : 'محاضرات'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Clock className="w-4 h-4 text-primary" />
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                            <div className="h-4 w-px bg-border" />
                            <div>
                              <p className="font-medium">
                                {schedule.course?.course_name || 'مادة غير معروفة'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.course?.course_code} {schedule.location && `• ${schedule.location}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {(currentUser?.role === 'admin' || currentUser?.role === 'instructor') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}