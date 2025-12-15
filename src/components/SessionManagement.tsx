import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, Copy, Check, AlertCircle, Timer, XCircle, BookOpen, ArrowRight, Video, ClipboardCheck, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { LiveStreamHost } from './LiveStreamHost';
import { toast } from 'sonner';
import { apiRequest } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  getCourses, 
  getSessions, 
  createSession,
  updateSession 
} from '../utils/apiWithFallback';

interface Session {
  id: string;
  course_id: string;
  code: string;
  created_by?: string;
  created_at: string;
  session_date?: string;
  start_time?: string;
  session_type?: 'attendance' | 'live';
  title?: string;
  description?: string;
  stream_active?: boolean;
  meeting_url?: string;
  attendance_code?: string;
  location?: string;
}

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

interface SessionManagementProps {
  onNavigate?: (page: string) => void;
}

export function SessionManagement({ onNavigate }: SessionManagementProps = {}) {
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [activeStreamSession, setActiveStreamSession] = useState<Session | null>(null);

  // New session form state
  const [newSessionCourse, setNewSessionCourse] = useState('');
  const [newSessionDuration, setNewSessionDuration] = useState('15');
  const [newSessionType, setNewSessionType] = useState<'attendance' | 'live'>('attendance');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');

  // Delete confirmation state
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      loadAllSessions();
    } else if (!loading) {
      // If courses loaded but empty, stop loading
      setLoading(false);
    }
  }, [courses]);

  // Auto-reload sessions every 30 seconds to update time remaining
  useEffect(() => {
    if (!token || sessions.length === 0) return;

    const interval = setInterval(() => {
      // Just re-render by forcing a state update
      setSessions([...sessions]);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [token, sessions]);

  const loadCourses = async () => {
    console.log('🔄 [SessionManagement] Loading courses...');
    try {
      if (!token) {
        console.error('❌ [SessionManagement] No auth token');
        setLoading(false);
        return;
      }

      console.log('📡 [SessionManagement] Fetching courses from Supabase...');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('course_name', { ascending: true });

      if (error) {
        console.error('❌ [SessionManagement] Error:', error);
        throw error;
      }

      console.log('✅ [SessionManagement] Courses loaded:', data?.length);
      setCourses(data || []);
    } catch (error) {
      console.error('❌ [SessionManagement] Error loading courses:', error);
      toast.error('فشل تحميل المواد / Failed to load courses');
      setError('فشل تحميل المواد');
      setLoading(false);
    }
  };

  const loadAllSessions = async () => {
    console.log('🔄 [SessionManagement] Loading all sessions...');
    console.log('📚 [SessionManagement] Courses to load from:', courses.length);
    
    try {
      if (!token) {
        console.error('❌ [SessionManagement] No auth token');
        setLoading(false);
        return;
      }

      if (courses.length === 0) {
        console.warn('⚠️ [SessionManagement] No courses available');
        setSessions([]);
        setLoading(false);
        return;
      }

      console.log('📡 [SessionManagement] Fetching sessions from Supabase...');
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [SessionManagement] Error:', error);
        throw error;
      }

      console.log('✅ [SessionManagement] Total sessions loaded:', data?.length);
      setSessions(data || []);
    } catch (error) {
      console.error('❌ [SessionManagement] Error loading sessions:', error);
      toast.error('فشل تحميل الجلسات / Failed to load sessions');
      setError('فشل تحميل الجلسات');
    } finally {
      console.log('✅ [SessionManagement] Setting loading to false');
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!token) {
        setError('غير مصرح');
        return;
      }

      console.log('➕ [SessionManagement] Creating session...');

      const durationMinutes = parseInt(newSessionDuration) || 3; // Default 3 minutes
      
      const now = new Date();

      // استخدام createSession مع fallback تلقائي
      const newSession = await createSession({
        course_id: newSessionCourse,
        instructor_id: user?.id, // إضافة معرف المدرس
        session_date: now.toISOString().split('T')[0], // YYYY-MM-DD
        session_time: now.toISOString(), // Full ISO timestamp
        duration: durationMinutes,
        session_type: newSessionType,
        session_code: undefined, // سيتم توليده تلقائياً
      }, token);

      console.log('✅ [SessionManagement] Session created successfully:', newSession);
      toast.success('تم إنشاء الجلسة بنجاح / Session created successfully', {
        description: `الكود: ${newSession.code} | سينتهي بعد ${durationMinutes} دقيقة`
      });

      setIsDialogOpen(false);
      setNewSessionCourse('');
      setNewSessionDuration('3'); // Default to 3 minutes
      setNewSessionType('attendance');
      setNewSessionTitle('');
      setNewSessionDescription('');
      
      await loadAllSessions();
    } catch (err: any) {
      console.error('❌ [SessionManagement] Error creating session:', err);
      toast.error('فشل إنشاء الجلسة / Failed to create session', {
        description: err.message
      });
      setError(err.message || 'فشل إنشاء الجلسة');
    }
  };

  const handleDeactivateSession = async (sessionId: string) => {
    if (!confirm('هل أنت متأكد من إيقاف هذه الجلسة؟ سيتم حذفها نهائياً.')) {
      return;
    }

    try {
      if (!token) return;

      console.log('🗑️ [SessionManagement] Deleting session...');

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('❌ [SessionManagement] Error:', error);
        throw error;
      }

      console.log('✅ [SessionManagement] Session deleted successfully');
      toast.success('تم حذف الجلسة بنجاح / Session deleted successfully');

      await loadAllSessions();
    } catch (error: any) {
      console.error('❌ [SessionManagement] Error deleting session:', error);
      toast.error('فشل حذف الجلسة / Failed to delete session');
      setError('فشل حذف الجلسة');
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      if (!token) return;

      console.log('🗑️ [SessionManagement] Deleting session...');

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id);

      if (error) {
        console.error('❌ [SessionManagement] Error:', error);
        throw error;
      }

      console.log('✅ [SessionManagement] Session deleted successfully');
      toast.success('تم حذف الجلسة بنجاح / Session deleted successfully');

      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
      await loadAllSessions();
    } catch (error: any) {
      console.error('❌ [SessionManagement] Error deleting session:', error);
      toast.error('فشل حذف الجلسة / Failed to delete session');
      setError('فشل حذف الجلسة');
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const openDeleteDialog = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteDialogOpen(true);
  };

  const handleStartLiveStream = async (session: Session) => {
    try {
      setError('');
      console.log('🎬 Starting live stream for session:', session.id);
      
      if (!token) {
        setError('غير مصرح. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }

      // Try to call the backend API first
      let result;
      try {
        result = await apiRequest(`/live-sessions/${session.id}/start`, {
          method: 'POST',
          token: token,
        });
        console.log('✅ Live session started via API:', result);
      } catch (apiError: any) {
        // If Edge Function is not deployed, use fallback with Supabase Client
        if (apiError.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
          console.log('⚠️ [Fallback] Edge Function not available, using Supabase Client directly');
          
          // Generate meeting URL and attendance code locally
          const roomName = `kku-session-${session.id.substring(0, 8)}-${Date.now()}`;
          const meetingUrl = `https://meet.jit.si/${roomName}`;
          const attendanceCode = session.code || Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Update session in database directly using existing Supabase Client (singleton)
          // Only update columns that exist in the sessions table
          const { error: updateError } = await supabase
            .from('sessions')
            .update({ 
              stream_active: true,
              is_active: true
            })
            .eq('id', session.id);
          
          if (updateError) {
            console.error('❌ [Fallback] Failed to update session:', updateError);
            throw new Error('Failed to update session in database');
          }
          
          console.log('✅ [Fallback] Live session started with Supabase Client');
          
          result = {
            session: {
              id: session.id,
              meeting_url: meetingUrl,
              attendance_code: attendanceCode,
              room_name: roomName,
            }
          };
        } else {
          throw apiError;
        }
      }

      // Update the session with meeting URL and attendance code
      const updatedSession = {
        ...session,
        meeting_url: result.session.meeting_url,
        attendance_code: result.session.attendance_code,
      };
      
      setActiveStreamSession(updatedSession);
    } catch (err: any) {
      console.error('❌ Error starting live stream:', err);
      setError(err.message || 'فشل بدء البث المباشر');
      toast.error('فشل بدء البث المباشر', {
        description: err.message
      });
    }
  };

  const handleStopLiveStream = async () => {
    try {
      if (!activeStreamSession) return;

      console.log('🛑 Stopping live stream for session:', activeStreamSession.id);
      
      if (!token) return;

      // Try to call the backend API first
      try {
        await apiRequest(`/live-sessions/${activeStreamSession.id}/end`, {
          method: 'POST',
          token: token,
        });
        console.log('✅ Live session ended via API');
      } catch (apiError: any) {
        // If Edge Function is not deployed, use fallback with Supabase Client
        if (apiError.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
          console.log('⚠️ [Fallback] Edge Function not available, using Supabase Client directly');
          
          // Update session in database directly using existing Supabase Client (singleton)
          const { error: updateError } = await supabase
            .from('sessions')
            .update({ 
              stream_active: false,
              is_active: false
            })
            .eq('id', activeStreamSession.id);
          
          if (updateError) {
            console.error('❌ [Fallback] Failed to update session:', updateError);
            throw new Error('Failed to update session in database');
          }
          
          console.log('✅ [Fallback] Live session ended with Supabase Client');
        } else {
          throw apiError;
        }
      }

      setActiveStreamSession(null);
      toast.success('تم إيقاف البث المباشر بنجاح / Live stream ended successfully');
      await loadAllSessions();
    } catch (err: any) {
      console.error('❌ Error stopping live stream:', err);
      setError(err.message || 'فشل إيقاف البث المباشر');
      toast.error('فشل إيقاف البث المباشر', {
        description: err.message
      });
      // Still close the dialog even if the API call fails
      setActiveStreamSession(null);
    }
  };

  const handleCopyCode = (code: string) => {
    // Fallback copy method for browsers that block Clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = code;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      textArea.remove();
      // Try modern API as fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code)
          .then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(''), 2000);
          })
          .catch((e) => {
            console.error('Clipboard API also failed:', e);
            alert(`Copy this code: ${code}`);
          });
      } else {
        alert(`Copy this code: ${code}`);
      }
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.course_name} (${course.course_code})` : 'مادة غير معروفة';
  };

  const isSessionExpired = (created_at: string) => {
    // Simple: sessions older than 1 hour are considered expired
    const createdTime = new Date(created_at);
    const now = new Date();
    const hoursPassed = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);
    return hoursPassed > 1; // Consider sessions expired after 1 hour
  };

  const getTimeRemaining = (created_at: string) => {
    // Simple: calculate time since creation
    const createdTime = new Date(created_at);
    const now = new Date();
    const minutesPassed = Math.floor((now.getTime() - createdTime.getTime()) / 60000);
    
    if (minutesPassed > 60) return 'انتهت';
    
    const minutesRemaining = 60 - minutesPassed;
    if (minutesRemaining > 0) {
      return `${minutesRemaining} دقيقة`;
    }
    return 'انتهت';
  };

  // NEW: Check if attendance code should be hidden (after 15 minutes)
  const shouldHideAttendanceCode = (created_at: string) => {
    const createdTime = new Date(created_at);
    const now = new Date();
    const minutesPassed = Math.floor((now.getTime() - createdTime.getTime()) / 60000);
    return minutesPassed >= 15; // Hide after 15 minutes
  };

  // NEW: Get attendance code visibility time remaining
  const getCodeVisibilityTimeRemaining = (created_at: string) => {
    const createdTime = new Date(created_at);
    const now = new Date();
    const minutesPassed = Math.floor((now.getTime() - createdTime.getTime()) / 60000);
    const minutesRemaining = 15 - minutesPassed;
    
    if (minutesRemaining <= 0) return 'انتهى';
    if (minutesRemaining === 1) return 'دقيقة واحدة';
    return `${minutesRemaining} دقيقة`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جارٍ التحيل...</p>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => !isSessionExpired(s.created_at));
  const inactiveSessions = sessions.filter((s) => isSessionExpired(s.created_at));

  // If no courses exist, show guidance
  if (courses.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>جلسات الحضور</h1>
          <p className="text-muted-foreground">إنشاء وإدارة أكواد الحضور</p>
        </div>

        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">لا توجد مواد دراسية</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              لإنشاء جلسات حضور، يجب عليك أولاً إضافة مواد دراسية. اذهب إلى صفحة "المواد الدراسية" وأضف مادة جديدة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                onClick={() => onNavigate ? onNavigate('courses') : window.location.href = '#courses'}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                انتقل إلى المواد الدراسية
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-8 p-4 bg-accent/10 rounded-lg text-right max-w-lg mx-auto">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm">1</span>
                أضف مادة دراسية
              </h4>
              <p className="text-sm text-muted-foreground mr-8 mb-3">
                اذهب إلى صفحة "المواد الدراسية" وأنشئ مادة جديدة بإدخال اسم المادة وكدها.
              </p>
              
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm">2</span>
                أنشئ جلسة حضور
              </h4>
              <p className="text-sm text-muted-foreground mr-8 mb-3">
                بعد إضافة المادة، عد إلى هذه الصفحة وأنشئ جلسة حضور جديدة.
              </p>
              
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm">3</span>
                شارك الكود مع الطلاب
              </h4>
              <p className="text-sm text-muted-foreground mr-8">
                سيتم توليد كود فريد، اعرضه على الشاشة ليتمكن الطلاب من تسجيل حضورهم.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>جلسات الحضور</h1>
          <p className="text-muted-foreground">إنشاء وإدارة أكواد الحضور</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء جلسة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء جلسة حضور جديدة</DialogTitle>
              <DialogDescription>
                سيتم توليد كود فريد للطلاب لتسجيل حضورهم
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">المادة</Label>
                <select
                  id="course"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={newSessionCourse}
                  onChange={(e) => setNewSessionCourse(e.target.value)}
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
                <Label htmlFor="duration">مدة الجلسة (بالدقائق)</Label>
                <select
                  id="duration"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={newSessionDuration}
                  onChange={(e) => setNewSessionDuration(e.target.value)}
                >
                  <option value="5">5 دقائق</option>
                  <option value="10">10 دقائق</option>
                  <option value="15">15 دقيقة</option>
                  <option value="30">30 دقيقة</option>
                  <option value="60">60 دقيقة</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>نوع الجلسة</Label>
                <RadioGroup
                  value={newSessionType}
                  onValueChange={(value) => setNewSessionType(value as 'attendance' | 'live')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="attendance" id="attendance" />
                    <Label htmlFor="attendance" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4" />
                        <span>حضور عادي - تسجيل الحضور فقط</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="live" id="live" />
                    <Label htmlFor="live" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        <span>بث مباشر - صوت وصورة</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {newSessionType === 'live' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان الجلسة</Label>
                    <Input
                      id="title"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">وصف الجلسة</Label>
                    <Textarea
                      id="description"
                      className="w-full h-20 px-3 rounded-md border border-input bg-background"
                      value={newSessionDescription}
                      onChange={(e) => setNewSessionDescription(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">إنشاء جلسة</Button>
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
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h2>الجلسات النشطة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <Card key={session.id} className="border-2 border-accent">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{getCourseName(session.course_id)}</span>
                    <div className="flex gap-2">
                      {session.session_type === 'live' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          بث مباشر
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        نشط
                      </span>
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    الوقت المتبقي: {getTimeRemaining(session.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {session.session_type === 'live' && session.title && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-sm mb-1">{session.title}</p>
                      {session.description && (
                        <p className="text-xs text-muted-foreground">{session.description}</p>
                      )}
                    </div>
                  )}

                  {/* Attendance Code - Hide after 15 minutes */}
                  {!shouldHideAttendanceCode(session.created_at) ? (
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        كود الحضور - يختفي بعد: {getCodeVisibilityTimeRemaining(session.created_at)}
                      </p>
                      <p className="text-3xl font-bold tracking-wider text-primary">
                        {session.code}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-destructive/10 p-4 rounded-lg text-center border border-destructive/20">
                      <p className="text-sm text-destructive mb-2 flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        انتهت صلاحية كود الحضور
                      </p>
                      <p className="text-xs text-muted-foreground">
                        مرت 15 دقيقة على بدء الجلسة. الكود غير متاح للعرض.
                      </p>
                    </div>
                  )}

                  {session.session_type === 'live' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStartLiveStream(session)}
                    >
                      <Video className="w-4 h-4 ml-2" />
                      بدء البث المباشر
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCopyCode(session.code)}
                    >
                      {copiedCode === session.code ? (
                        <>
                          <Check className="w-4 h-4 ml-2" />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 ml-2" />
                          نسخ الكود
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => handleDeactivateSession(session.id)}
                    >
                      <XCircle className="w-4 h-4 ml-2" />
                      إيقاف
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => openDeleteDialog(session)}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Sessions */}
      {inactiveSessions.length > 0 && (
        <div className="space-y-4">
          <h2>الجلسات السابقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveSessions.slice(0, 9).map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{getCourseName(session.course_id)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openDeleteDialog(session)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {new Date(session.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">الكود:</span>
                    <span className="font-mono font-semibold">{session.code}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {isSessionExpired(session.created_at) ? 'منتهية' : 'متوقفة'}
                    </span>
                    {session.session_type === 'live' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        بث مباشر
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Timer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد جلسات حضور</p>
            <p className="text-sm text-muted-foreground mt-2">
              ابدأ بإنشاء جلسة جديدة لتسجيل حضور الطلاب
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد حذف هذه الجلسة؟ لا يمكن استعادة الجلسة بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSessionToDelete(null);
              }}
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Live Stream Host Dialog */}
      {activeStreamSession && (
        <Dialog open={!!activeStreamSession} onOpenChange={(open) => !open && setActiveStreamSession(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                {activeStreamSession.title || 'البث المباشر'}
              </DialogTitle>
              <DialogDescription>
                {activeStreamSession.description || `جلسة البث المباشر - كود الحضور: ${activeStreamSession.code}`}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <LiveStreamHost
                sessionId={activeStreamSession.id}
                sessionTitle={activeStreamSession.title || 'جلسة البث المباشر'}
                meetingUrl={activeStreamSession.meeting_url || ''}
                attendanceCode={activeStreamSession.attendance_code || activeStreamSession.code}
                onStop={() => handleStopLiveStream()}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}