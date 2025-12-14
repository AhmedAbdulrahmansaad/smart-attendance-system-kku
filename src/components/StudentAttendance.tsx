import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ClipboardCheck, CheckCircle, AlertCircle, Fingerprint, QrCode, Video, Users, Clock, RefreshCw, Radio } from 'lucide-react';
import { FingerprintAttendance } from './FingerprintAttendance';
import { LiveStreamViewer } from './LiveStreamViewer';
import { NFCAttendance } from './NFCAttendance';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../utils/supabaseClient';
import { getSessions } from '../utils/apiWithFallback';
import { toast } from 'sonner';

interface Session {
  id: string;
  course_id: string;
  code: string;
  title?: string;
  description?: string;
  session_type: 'attendance' | 'live';
  active: boolean;
  expires_at: string;
  viewers_count?: number;
  meeting_url?: string;
  course_name?: string;
  course_code?: string;
  instructor_name?: string;
  instructor_id?: string;
}

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  instructor_id?: string;
}

export function StudentAttendance() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Live sessions state
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeStreamSession, setActiveStreamSession] = useState<Session | null>(null);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!token || !user) {
        setError(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
        setLoading(false);
        return;
      }

      const code = sessionCode.toUpperCase().trim();

      console.log('📝 [StudentAttendance] Marking attendance with code:', code);

      // Step 1: Find the session by code
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, course_id')
        .eq('code', code)
        .single();

      if (sessionError || !session) {
        console.error('❌ [StudentAttendance] Session not found:', sessionError);
        setError(language === 'ar' ? 'كود جلسة غير صحيح' : 'Invalid session code');
        setLoading(false);
        return;
      }

      // Note: We removed active and expires_at checks as these columns don't exist
      // Sessions are valid as long as they exist in the database

      // Step 4: Check if student is enrolled in this course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', session.course_id)
        .single();

      if (enrollmentError || !enrollment) {
        console.error('❌ [StudentAttendance] Student not enrolled:', enrollmentError);
        setError(language === 'ar' ? 'أنت غير مسجل في هذه المادة' : 'You are not enrolled in this course');
        setLoading(false);
        return;
      }

      // Step 5: Check if attendance already recorded
      const { data: existingAttendance, error: existingError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', user.id)
        .eq('session_id', session.id)
        .single();

      if (existingAttendance) {
        console.error('❌ [StudentAttendance] Attendance already recorded');
        setError(language === 'ar' ? 'تم تسجيل الحضور مسبقاً لهذه الجلسة' : 'Attendance already recorded for this session');
        setLoading(false);
        return;
      }

      // Step 6: Record attendance
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          session_id: session.id,
          student_id: user.id,
          course_id: session.course_id,
          status: 'present',
          recorded_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('❌ [StudentAttendance] Failed to insert attendance:', insertError);
        throw insertError;
      }

      console.log('✅ [StudentAttendance] Attendance recorded successfully');
      setSuccess(true);
      setSessionCode('');
      toast.success(language === 'ar' ? '✅ تم تسجيل حضورك بنجاح!' : '✅ Attendance marked successfully!');
    } catch (err: any) {
      console.error('❌ [StudentAttendance] Error:', err);
      const errorMessage = err.message || (language === 'ar' ? 'فشل تسجيل الحضور' : 'Failed to mark attendance');
      setError(errorMessage);
      toast.error(language === 'ar' ? '❌ فشل تسجيل الحضور' : '❌ Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintScan = async (scanSuccess: boolean) => {
    if (scanSuccess) {
      setSuccess(true);
      setError('');
    } else {
      setError(language === 'ar' ? 'فشل التعرف على البصمة' : 'Fingerprint recognition failed');
      setSuccess(false);
    }
  };

  const handleNFCSwipe = async (swipeSuccess: boolean) => {
    if (swipeSuccess) {
      setSuccess(true);
      setError('');
    } else {
      setError(language === 'ar' ? 'فشل قراءة البطاقة' : 'NFC card reading failed');
      setSuccess(false);
    }
  };

  const fetchLiveSessions = async () => {
    console.log('🔄 [Student] Fetching live sessions...');
    setLoadingSessions(true);
    
    try {
      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [Student] Session error:', sessionError);
        setLiveSessions([]);
        setCourses([]);
        setLoadingSessions(false);
        return;
      }
      
      if (!session?.access_token || !user) {
        console.error('❌ [Student] No valid session');
        setLiveSessions([]);
        setCourses([]);
        setLoadingSessions(false);
        return;
      }

      console.log('✅ [Student] Fetching live sessions for user:', user.id);

      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);

      if (enrollError) {
        console.error('❌ [Student] Error fetching enrollments:', enrollError);
      }

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      console.log('📚 [Student] Enrolled in courses:', enrolledCourseIds);

      // Get courses details
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('id', enrolledCourseIds);

      if (coursesError) {
        console.error('❌ [Student] Error fetching courses:', coursesError);
      }

      setCourses(coursesData || []);

      if (enrolledCourseIds.length === 0) {
        console.warn('⚠️ [Student] Not enrolled in any courses');
        setLiveSessions([]);
        setLoadingSessions(false);
        return;
      }

      // Get active live sessions for enrolled courses with JOIN
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses (
            id,
            course_name,
            course_code,
            instructor_id
          ),
          instructor:profiles!sessions_instructor_id_fkey (
            id,
            full_name
          )
        `)
        .in('course_id', enrolledCourseIds)
        .eq('session_type', 'live')
        .eq('stream_active', true)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('❌ [Student] Error fetching sessions:', sessionsError);
        setLiveSessions([]);
        setLoadingSessions(false);
        return;
      }

      // Format sessions data
      const formattedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        course_name: session.course?.course_name,
        course_code: session.course?.course_code,
        instructor_name: session.instructor?.full_name,
      }));

      console.log('🎥 [Student] Active live sessions:', formattedSessions.length);
      setLiveSessions(formattedSessions);

    } catch (err: any) {
      console.error('❌ [Student] Error:', err);
      setLiveSessions([]);
      setCourses([]);
    } finally {
      console.log('✅ [Student] Setting loading to false');
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      console.log('🎬 [Student] Component mounted, fetching sessions...');
      fetchLiveSessions();
      
      // تحديث كل دقيقتين بدلاً من 30 ثانية (لتقليل الحمل)
      const interval = setInterval(() => {
        console.log('⏰ [Student] Auto-refresh triggered');
        fetchLiveSessions();
      }, 120000); // 2 دقيقة

      return () => {
        console.log('🛑 [Student] Component unmounted, clearing interval');
        clearInterval(interval);
      };
    }
  }, [user, token]);

  const handleStreamSessionClick = (session: Session) => {
    console.log('🎥 [Student] Opening stream for session:', session.id);
    setActiveStreamSession(session);
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border-2 border-primary/20">
        <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {language === 'ar' ? 'تسجيل الحضور' : 'Mark Attendance'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {language === 'ar'
            ? 'اختر الطريقة المناسبة لتسجيل حضورك'
            : 'Choose the appropriate method to mark your attendance'}
        </p>
      </div>

      <Tabs defaultValue="fingerprint" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 glass border border-border">
          <TabsTrigger 
            value="fingerprint" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white gap-2 font-bold"
          >
            <Fingerprint className="w-5 h-5" />
            {language === 'ar' ? 'البصمة' : 'Fingerprint'}
          </TabsTrigger>
          <TabsTrigger 
            value="code" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white gap-2 font-bold"
          >
            <QrCode className="w-5 h-5" />
            {language === 'ar' ? 'الكود' : 'Code'}
          </TabsTrigger>
          <TabsTrigger 
            value="nfc" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white gap-2 font-bold"
          >
            <Radio className="w-5 h-5" />
            {language === 'ar' ? 'NFC' : 'NFC'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fingerprint" className="mt-6">
          <FingerprintAttendance onScanComplete={handleFingerprintScan} />
        </TabsContent>

        <TabsContent value="code" className="mt-6">
          <Card className="border-2 border-primary/20 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ClipboardCheck className="w-6 h-6 text-primary" />
                {language === 'ar' ? 'تسجيل الحضور بالكود' : 'Mark Attendance with Code'}
              </CardTitle>
              <CardDescription className="text-base">
                {language === 'ar'
                  ? 'أدخل كود الجلسة الذي حصلت عليه من المدرس'
                  : 'Enter the session code you received from the instructor'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmitAttendance} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="sessionCode" className="text-base font-semibold">
                    {language === 'ar' ? 'كود الجلسة' : 'Session Code'}
                  </Label>
                  <Input
                    id="sessionCode"
                    type="text"
                    placeholder={language === 'ar' ? 'أدخل الكود هنا' : 'Enter code here'}
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    disabled={loading}
                    className="h-16 text-2xl font-bold text-center tracking-widest border-2 focus:border-primary uppercase"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {language === 'ar'
                      ? 'الكود مكون من 6 أحرف أو أرقام'
                      : 'Code consists of 6 letters or numbers'}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base font-semibold">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-base font-semibold text-green-600">
                      {language === 'ar' ? 'تم تسجيل حضورك بنجاح!' : 'Your attendance has been marked successfully!'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 shadow-lg"
                  disabled={loading}
                >
                  {loading 
                    ? (language === 'ar' ? 'جاري التسجيل...' : 'Submitting...') 
                    : (language === 'ar' ? 'تسجيل الحضور' : 'Mark Attendance')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfc" className="mt-6">
          <NFCAttendance onSuccess={() => setSuccess(true)} />
        </TabsContent>
      </Tabs>

      <Card className="glass border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">
            {language === 'ar' ? 'ملاحظات هامة' : 'Important Notes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'تأكد من تسجيل الحضور خلال الوقت المحدد للجلسة'
                : 'Make sure to mark attendance within the specified session time'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'يمكنك استخدام البصمة أو الكود لتسجيل الحضور'
                : 'You can use fingerprint or code to mark attendance'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'لا يمكن تسجيل الحضور مرتين لنفس الجلسة'
                : 'Cannot mark attendance twice for the same session'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Sessions Section */}
      <Card className="glass border-2 border-red-500/30 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Video className="w-6 h-6 text-red-600" />
                {language === 'ar' ? 'الجلسات المباشرة النشطة 🔴' : 'Active Live Sessions 🔴'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'انضم إلى المحاضرات المباشرة الآن'
                  : 'Join live lectures now'}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchLiveSessions()}
              disabled={loadingSessions}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug Info */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-xs space-y-1">
            <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🔍 {language === 'ar' ? 'معلومات التشخيص' : 'Debug Info'}
            </div>
            <div className="text-yellow-700 dark:text-yellow-300">
              • {language === 'ar' ? 'حالة التحميل:' : 'Loading:'} {loadingSessions ? '✅ نعم' : '❌ لا'}
            </div>
            <div className="text-yellow-700 dark:text-yellow-300">
              • {language === 'ar' ? 'عدد الجلسات:' : 'Sessions Count:'} {liveSessions.length}
            </div>
            <div className="text-yellow-700 dark:text-yellow-300">
              • {language === 'ar' ? 'عدد المواد:' : 'Courses Count:'} {courses.length}
            </div>
            <div className="text-yellow-700 dark:text-yellow-300 text-xs mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
              💡 {language === 'ar' 
                ? 'افتح Console (F12) لمزيد من التفاصيل'
                : 'Open Console (F12) for more details'}
            </div>
          </div>

          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent"></div>
              <p className="text-muted-foreground text-center font-semibold">
                {language === 'ar' ? 'جارٍ تحميل الجلسات المباشرة...' : 'Loading live sessions...'}
              </p>
            </div>
          ) : liveSessions.length > 0 ? (
            <div className="space-y-4">
              {liveSessions.map(session => {
                const course = courses.find(c => c.id === session.course_id);
                return (
                  <Card key={session.id} className="border-2 border-red-400 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="relative">
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                              </div>
                              <span className="text-sm font-bold text-red-600 uppercase tracking-wide">
                                {language === 'ar' ? '🔴 مباشر الآن' : '🔴 Live Now'}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              {session.title || (language === 'ar' ? 'جلسة مباشرة' : 'Live Session')}
                            </h3>
                            {course && (
                              <p className="text-base text-muted-foreground mb-2">
                                📚 <span className="font-semibold">{course.course_name}</span> ({course.course_code})
                              </p>
                            )}
                            {session.description && (
                              <p className="text-sm text-muted-foreground mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                {session.description}
                              </p>
                            )}
                            <div className="flex items-center gap-6 mt-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {language === 'ar' ? 'الكود:' : 'Code:'} 
                                  <span className="font-mono font-bold text-gray-900 dark:text-white ml-2 text-base">
                                    {session.code}
                                  </span>
                                </span>
                              </div>
                              {session.viewers_count !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  <span className="font-semibold">{session.viewers_count}</span>
                                  <span>{language === 'ar' ? 'مشاهد' : 'viewers'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-500 via-red-600 to-orange-500 hover:from-red-600 hover:via-red-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all"
                          onClick={() => handleStreamSessionClick(session)}
                        >
                          <Video className="w-6 h-6 ml-2" />
                          {language === 'ar' ? '🎥 انضم للمحاضرة المباشرة' : '🎥 Join Live Lecture'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-16 bg-white/50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <Video className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-700 mb-6" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                {language === 'ar' 
                  ? 'لا توجد جلسات مباشرة حالياً'
                  : 'No Live Sessions Currently'}
              </h3>
              <p className="text-base text-muted-foreground mb-4">
                {language === 'ar' 
                  ? 'سيتم عرض الجلسات المباشرة النشطة هنا عندما يبدأها المدرسون'
                  : 'Active live sessions will appear here when instructors start them'}
              </p>
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 {language === 'ar' 
                      ? `تحقق من أنك مسجل في المواد الدراسية (المواد المسجلة: ${courses.length})`
                      : `Ensure you are enrolled in courses (Enrolled: ${courses.length})`}
                  </p>
                </div>
                {courses.length === 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ {language === 'ar' 
                        ? 'أنت غير مسجل في أي مادة. تواصل مع المدرس أو المشرف لتسجيلك.'
                        : 'You are not enrolled in any courses. Contact your instructor or supervisor to enroll.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Stream Viewer Modal */}
      {activeStreamSession && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto shadow-2xl">
            <LiveStreamViewer
              sessionId={activeStreamSession.id}
              sessionTitle={activeStreamSession.title || (language === 'ar' ? 'جلسة مباشرة' : 'Live Session')}
              meetingUrl={activeStreamSession.meeting_url || ''}
              courseName={activeStreamSession.course_name || (language === 'ar' ? 'غير محدد' : 'Unknown')}
              instructorName={activeStreamSession.instructor_name || (language === 'ar' ? 'غير محدد' : 'Unknown')}
              onLeave={() => setActiveStreamSession(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}