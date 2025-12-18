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
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getSupabaseClient } from '../utils/supabaseClient';

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
  const { user: currentUser, token } = useAuth();
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
    { value: 'Sunday', label: 'الأحد' },
    { value: 'Monday', label: 'الاثنين' },
    { value: 'Tuesday', label: 'الثلاثاء' },
    { value: 'Wednesday', label: 'الأربعاء' },
    { value: 'Thursday', label: 'الخميس' },
    { value: 'Friday', label: 'الجمعة' },
    { value: 'Saturday', label: 'السبت' },
  ];

  useEffect(() => {
    if (token) {
      loadSchedules();
      loadCourses();
    }
  }, [token]);

  const loadSchedules = async () => {
    if (!token) {
      console.log('⚠️ [ScheduleManagement] No token available');
      return;
    }
    
    try {
      console.log('📅 [ScheduleManagement] Loading schedules from backend...');
      console.log('🔑 [ScheduleManagement] Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
      
      // Try backend first
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/schedules`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const { schedules: schedulesData } = await response.json();
          console.log('✅ [ScheduleManagement] Loaded', schedulesData?.length || 0, 'schedules from backend');
          setSchedules(schedulesData || []);
          return;
        }
        
        console.log('⚠️ [ScheduleManagement] Backend not available, using direct Supabase...');
      } catch (backendError) {
        console.log('⚠️ [ScheduleManagement] Backend error, using direct Supabase...', backendError);
      }
      
      // Fallback: Direct Supabase query
      console.log('🔄 [ScheduleManagement] Using direct Supabase...');
      const supabase = getSupabaseClient(token);
      
      const { data: schedulesData, error: supabaseError } = await supabase
        .from('schedules')
        .select('*, course:courses!schedules_course_id_fkey(*)')
        .order('day_of_week', { ascending: true });
      
      if (supabaseError) {
        console.error('❌ [ScheduleManagement] Supabase error:', supabaseError);
        throw new Error(supabaseError.message);
      }
      
      console.log('✅ [ScheduleManagement] Loaded', schedulesData?.length || 0, 'schedules from Supabase');
      console.log('📋 [ScheduleManagement] Schedules:', schedulesData);
      setSchedules(schedulesData || []);

    } catch (error: any) {
      console.error('❌ [ScheduleManagement] Error loading schedules:', error);
      toast.error('فشل تحميل الجداول / Failed to load schedules');
      setError('فشل تحميل الجداول');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    if (!token) {
      console.log('⚠️ [ScheduleManagement] No token available for courses');
      return;
    }
    
    try {
      console.log('📚 [ScheduleManagement] Loading courses from backend...');
      console.log('🔑 [ScheduleManagement] Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
      
      // Try backend first
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/courses`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const { courses: coursesData } = await response.json();
          console.log('✅ [ScheduleManagement] Loaded', coursesData?.length || 0, 'courses from backend');
          setCourses(coursesData || []);
          return;
        }
        
        console.log('⚠️ [ScheduleManagement] Backend not available for courses, using direct Supabase...');
      } catch (backendError) {
        console.log('⚠️ [ScheduleManagement] Backend error for courses, using direct Supabase...', backendError);
      }
      
      // Fallback: Direct Supabase
      console.log('🔄 [ScheduleManagement] Using direct Supabase for courses...');
      const supabase = getSupabaseClient(token);
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (coursesError) {
        console.error('❌ [ScheduleManagement] Courses error:', coursesError);
        throw new Error(coursesError.message);
      }
      
      console.log('✅ [ScheduleManagement] Loaded', coursesData?.length || 0, 'courses from Supabase');
      setCourses(coursesData || []);
    } catch (error: any) {
      console.error('❌ [ScheduleManagement] Error loading courses:', error);
      toast.error('فشل تحميل المقررات / Failed to load courses');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('غير مصرح');
      return;
    }

    try {
      console.log('➕ [ScheduleManagement] Adding new schedule...');
      console.log('📦 [ScheduleManagement] Schedule data:', {
        course_id: newScheduleCourse,
        day_of_week: newScheduleDay,
        start_time: newScheduleStartTime,
        end_time: newScheduleEndTime,
        location: newScheduleLocation || null,
      });
      
      // استخدام Backend (Edge Function) الذي يستخدم SERVICE_ROLE_KEY لتجاوز RLS
      console.log('🔄 [ScheduleManagement] Using Edge Function with SERVICE_ROLE_KEY...');
      const url = `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/schedules`;
      console.log('🌐 [ScheduleManagement] Fetching URL:', url);
      console.log('🔑 [ScheduleManagement] Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_id: newScheduleCourse,
            day_of_week: newScheduleDay,
            start_time: newScheduleStartTime,
            end_time: newScheduleEndTime,
            location: newScheduleLocation || null,
          }),
        });
      } catch (fetchError: any) {
        console.error('❌ [ScheduleManagement] Network error during fetch:', fetchError);
        console.error('❌ [ScheduleManagement] This usually means:');
        console.error('   1. Edge Function is not deployed or not running');
        console.error('   2. CORS issue');
        console.error('   3. Network connectivity issue');
        console.error('   4. URL is incorrect');
        console.error('❌ [ScheduleManagement] Trying direct Supabase insert as fallback...');
        
        // Fallback: Try direct Supabase insert
        try {
          const supabase = getSupabaseClient(token);
          const { data, error: supabaseError } = await supabase
            .from('schedules')
            .insert([{
              course_id: newScheduleCourse,
              day_of_week: newScheduleDay,
              start_time: newScheduleStartTime,
              end_time: newScheduleEndTime,
              location: newScheduleLocation || null,
            }])
            .select()
            .single();
          
          if (supabaseError) {
            console.error('❌ [ScheduleManagement] Supabase fallback also failed:', supabaseError);
            throw new Error(supabaseError.message);
          }
          
          console.log('✅ [ScheduleManagement] Schedule added via Supabase fallback!');
          toast.success('تم إضافة الجدول بنجاح / Schedule added successfully');
          
          setIsDialogOpen(false);
          setNewScheduleCourse('');
          setNewScheduleDay('');
          setNewScheduleStartTime('');
          setNewScheduleEndTime('');
          setNewScheduleLocation('');
          
          await loadSchedules();
          return;
        } catch (fallbackError: any) {
          console.error('❌ [ScheduleManagement] Fallback also failed:', fallbackError);
          throw new Error('Failed to add schedule. Please check database RLS settings.');
        }
      }

      console.log('📡 [ScheduleManagement] Response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('❌ [ScheduleManagement] Backend error:', errorData);
        throw new Error(errorData.error || 'فشل إضافة الجدول');
      }

      const result = await response.json();
      console.log('✅ [ScheduleManagement] Schedule added successfully:', result);
      toast.success('تم إضافة الجدول بنجاح / Schedule added successfully');

      setIsDialogOpen(false);
      setNewScheduleCourse('');
      setNewScheduleDay('');
      setNewScheduleStartTime('');
      setNewScheduleEndTime('');
      setNewScheduleLocation('');
      
      await loadSchedules();
    } catch (err: any) {
      console.error('❌ [ScheduleManagement] Error adding schedule:', err);
      console.error('❌ [ScheduleManagement] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      
      // تحسين رسالة الخطأ
      let errorMessage = 'فشل إضافة الجدول / Failed to add schedule';
      
      if (err.message?.includes('infinite recursion')) {
        errorMessage = 'خطأ في إعدادات الأمان. الرجاء تشغيل SQL: ALTER TABLE users DISABLE ROW LEVEL SECURITY; / RLS error';
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بالخادم. تحقق من deployment Edge Function / Edge Function not available';
      } else if (err.message?.includes('RLS')) {
        errorMessage = 'خطأ أمان قاعدة البيانات. الرجاء تعطيل RLS / Database RLS error';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!token) return;
    
    if (!confirm('هل أنت متأكد من حذف هذا الجدول؟')) {
      return;
    }

    try {
      console.log('🗑️ [ScheduleManagement] Deleting schedule:', scheduleId);
      
      // Try backend first
      try {
        console.log('🌐 [ScheduleManagement] Trying Edge Function delete...');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/schedules/${scheduleId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          console.log('✅ [ScheduleManagement] Schedule deleted successfully via backend');
          toast.success('تم حذف الجدول بنجاح / Schedule deleted successfully');
          await loadSchedules();
          return;
        }
        
        console.log('⚠️ [ScheduleManagement] Backend delete failed, trying direct Supabase...');
      } catch (backendError) {
        console.log('⚠️ [ScheduleManagement] Backend delete error, trying direct Supabase...', backendError);
      }
      
      // Fallback: Direct Supabase delete
      console.log('🔄 [ScheduleManagement] Using direct Supabase delete...');
      const supabase = getSupabaseClient(token);
      
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (deleteError) {
        console.error('❌ [ScheduleManagement] Direct Supabase delete failed:', deleteError);
        throw new Error(deleteError.message || 'Failed to delete schedule');
      }
      
      console.log('✅ [ScheduleManagement] Schedule deleted successfully via direct Supabase');
      toast.success('تم حذف الجدول بنجاح / Schedule deleted successfully');
      await loadSchedules();
      
    } catch (error: any) {
      console.error('❌ [ScheduleManagement] Error deleting schedule:', error);
      toast.error('فشل حذف الجدول / Failed to delete schedule');
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {currentUser?.role === 'ar' ? 'الجداول الدراسية' : 'Class Schedules'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentUser?.role === 'student' 
              ? 'جدولك الأسبوعي' 
              : 'إدارة الجداول الدراسية لجميع المقررات'}
          </p>
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'instructor') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة جدول دراسي
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