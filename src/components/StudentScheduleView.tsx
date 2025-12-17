import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Clock, MapPin, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
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

export function StudentScheduleView() {
  const { user: currentUser, token } = useAuth();
  const { language } = useLanguage();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const daysOfWeek = [
    { value: 'SUNDAY', labelAr: 'الأحد', labelEn: 'Sunday' },
    { value: 'MONDAY', labelAr: 'الاثنين', labelEn: 'Monday' },
    { value: 'TUESDAY', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
    { value: 'WEDNESDAY', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
    { value: 'THURSDAY', labelAr: 'الخميس', labelEn: 'Thursday' },
    { value: 'FRIDAY', labelAr: 'الجمعة', labelEn: 'Friday' },
    { value: 'SATURDAY', labelAr: 'السبت', labelEn: 'Saturday' },
  ];

  useEffect(() => {
    if (token) {
      loadSchedules();
    }
  }, [token]);

  const loadSchedules = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📅 [StudentScheduleView] Loading student schedules from backend...');
      
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
          console.log('✅ [StudentScheduleView] Loaded', schedulesData?.length || 0, 'schedules from backend');
          console.log('📊 [StudentScheduleView] Schedules data:', schedulesData);
          setSchedules(schedulesData || []);
          
          if (schedulesData && schedulesData.length > 0) {
            toast.success(
              language === 'ar' 
                ? `تم تحميل ${schedulesData.length} جدول دراسي` 
                : `Loaded ${schedulesData.length} schedules`,
              { duration: 2000 }
            );
          }
          return;
        }
        
        console.log('⚠️ [StudentScheduleView] Backend not available, using direct Supabase...');
      } catch (backendError) {
        console.log('⚠️ [StudentScheduleView] Backend error, using direct Supabase...', backendError);
      }
      
      // Fallback: Direct Supabase query
      console.log('🔄 [StudentScheduleView] Using direct Supabase...');
      const supabase = getSupabaseClient(token);
      
      // Get current user from token
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('❌ [StudentScheduleView] Auth error:', authError);
        throw new Error('Authentication failed');
      }
      
      console.log('👤 [StudentScheduleView] Current user ID:', authUser.id);
      
      // Get enrollments for this student
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', authUser.id);
      
      if (enrollError) {
        console.error('❌ [StudentScheduleView] Enrollments error:', enrollError);
        throw new Error(enrollError.message);
      }
      
      console.log('📚 [StudentScheduleView] Student enrollments:', enrollments?.length || 0);
      
      if (!enrollments || enrollments.length === 0) {
        console.log('ℹ️ [StudentScheduleView] Student not enrolled in any courses');
        setSchedules([]);
        return;
      }
      
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      console.log('📝 [StudentScheduleView] Enrolled course IDs:', enrolledCourseIds);
      
      // Get schedules for enrolled courses
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('*, course:courses!schedules_course_id_fkey(*)')
        .in('course_id', enrolledCourseIds)
        .order('day_of_week', { ascending: true });
      
      if (schedulesError) {
        console.error('❌ [StudentScheduleView] Schedules error:', schedulesError);
        throw new Error(schedulesError.message);
      }
      
      console.log('✅ [StudentScheduleView] Loaded', schedulesData?.length || 0, 'schedules from Supabase');
      console.log('📋 [StudentScheduleView] Schedules:', schedulesData);
      setSchedules(schedulesData || []);
      
      if (schedulesData && schedulesData.length > 0) {
        toast.success(
          language === 'ar' 
            ? `تم تحميل ${schedulesData.length} جدول دراسي` 
            : `Loaded ${schedulesData.length} schedules`,
          { duration: 2000 }
        );
      }
    } catch (error: any) {
      console.error('❌ [StudentScheduleView] Error loading schedules:', error);
      setError(error.message || 'فشل تحميل الجداول');
      toast.error(
        language === 'ar' 
          ? 'فشل تحميل الجداول الدراسية' 
          : 'Failed to load schedules'
      );
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (dayValue: string) => {
    const day = daysOfWeek.find(d => d.value === dayValue.toUpperCase());
    return language === 'ar' ? day?.labelAr : day?.labelEn;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
    
    // If it's in other format, try to parse it
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return timeString;
    }
  };

  const groupSchedulesByDay = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    
    daysOfWeek.forEach(day => {
      grouped[day.value] = schedules
        .filter(s => s.day_of_week.toUpperCase() === day.value)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جارٍ تحميل الجداول...' : 'Loading schedules...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const groupedSchedules = groupSchedulesByDay();
  const hasSchedules = schedules.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            {language === 'ar' ? 'جدولي الدراسي' : 'My Schedule'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' 
              ? 'عرض الجداول الدراسية الأسبوعية لموادي المسجلة'
              : 'View weekly class schedules for my enrolled courses'}
          </p>
        </div>
        <Button
          onClick={loadSchedules}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {!hasSchedules ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-24 h-24 text-muted-foreground opacity-20 mb-4" />
            <p className="text-xl font-semibold text-muted-foreground mb-2">
              {language === 'ar' ? 'لا توجد جداول دراسية' : 'No schedules found'}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {language === 'ar'
                ? 'لم يتم إنشاء جداول دراسية لموادك بعد. يرجى التواصل مع مدرسك أو الإدارة.'
                : 'No schedules have been created for your courses yet. Please contact your instructor or admin.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-xl bg-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي المحاضرات' : 'Total Classes'}
                  </p>
                  <p className="text-3xl font-bold">{schedules.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'أيام الدراسة' : 'Study Days'}
                  </p>
                  <p className="text-3xl font-bold">
                    {Object.values(groupedSchedules).filter(day => day.length > 0).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'المواد' : 'Courses'}
                  </p>
                  <p className="text-3xl font-bold">
                    {new Set(schedules.map(s => s.course_id)).size}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule */}
          <div className="grid grid-cols-1 gap-4">
            {daysOfWeek.map(day => {
              const daySchedules = groupedSchedules[day.value];
              
              if (daySchedules.length === 0) {
                return null; // Don't show days with no classes
              }

              return (
                <Card key={day.value} className="border-2 hover:border-primary/50 transition-all">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {language === 'ar' ? day.labelAr : day.labelEn}
                      <Badge variant="secondary" className="ml-auto">
                        {daySchedules.length} {language === 'ar' ? 'محاضرة' : 'class'}
                        {daySchedules.length > 1 ? (language === 'ar' ? 'ات' : 'es') : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {daySchedules.map((schedule, index) => (
                        <div
                          key={schedule.id}
                          className="p-6 hover:bg-accent/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Time */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <Clock className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-bold text-lg">
                                  {formatTime(schedule.start_time)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatTime(schedule.end_time)}
                                </p>
                              </div>
                            </div>

                            {/* Course Info */}
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1">
                                {schedule.course?.course_code || 'N/A'}
                              </h3>
                              <p className="text-muted-foreground mb-2">
                                {schedule.course?.course_name || 'Unknown Course'}
                              </p>
                              
                              {schedule.location && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {schedule.location}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Badge */}
                            <Badge 
                              variant="outline" 
                              className="bg-green-500/10 text-green-700 border-green-200"
                            >
                              {language === 'ar' ? 'مسجل' : 'Enrolled'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Show all days message if some days have no classes */}
          {Object.values(groupedSchedules).filter(day => day.length > 0).length < 7 && (
            <div className="text-center text-sm text-muted-foreground">
              {language === 'ar'
                ? '* يتم عرض الأيام التي تحتوي على محاضرات فقط'
                : '* Only showing days with scheduled classes'}
            </div>
          )}
        </>
      )}
    </div>
  );
}