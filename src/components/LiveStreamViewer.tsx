import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Volume2, VolumeX, Video, VideoOff, Mic, MicOff, LogOut, AlertCircle, Users } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';

interface LiveStreamViewerProps {
  sessionId: string;
  sessionTitle: string;
  meetingUrl: string;
  courseName: string;
  instructorName: string;
  onLeave: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function LiveStreamViewer({ 
  sessionId, 
  sessionTitle, 
  meetingUrl, 
  courseName,
  instructorName,
  onLeave 
}: LiveStreamViewerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // Students start with video off by default

  useEffect(() => {
    console.log('🎬 [Viewer] Initializing Jitsi Meet for session:', sessionId);
    console.log('🔗 [Viewer] Meeting URL:', meetingUrl);
    
    loadJitsiScript();

    return () => {
      console.log('🛑 [Viewer] Cleaning up Jitsi...');
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const loadJitsiScript = () => {
    // Check if Jitsi script is already loaded
    if (window.JitsiMeetExternalAPI) {
      console.log('✅ [Viewer] Jitsi script already loaded');
      initializeJitsi();
      return;
    }

    // Load Jitsi Meet API script
    console.log('📥 [Viewer] Loading Jitsi Meet API script...');
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ [Viewer] Jitsi script loaded successfully');
      initializeJitsi();
    };
    script.onerror = () => {
      console.error('❌ [Viewer] Failed to load Jitsi script');
      setError(
        language === 'ar'
          ? 'فشل تحميل مكتبة البث المباشر. تحقق من الاتصال بالإنترنت.'
          : 'Failed to load live streaming library. Check your internet connection.'
      );
      setIsLoading(false);
    };
    document.body.appendChild(script);
  };

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      console.error('❌ [Viewer] Jitsi container or API not ready');
      return;
    }

    try {
      // Extract room name from meeting URL
      const roomName = meetingUrl.split('/').pop() || `kku_${sessionId}`;
      console.log('🏠 [Viewer] Room name:', roomName);

      const domain = 'meet.jit.si';
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '600',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'raisehand',
            'videoquality',
            'filmstrip',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#006747',
          DEFAULT_REMOTE_DISPLAY_NAME: language === 'ar' ? 'المدرس' : 'Instructor',
          DEFAULT_LOCAL_DISPLAY_NAME: language === 'ar' ? 'أنا' : 'Me',
          DISABLE_VIDEO_BACKGROUND: false,
          FILM_STRIP_MAX_HEIGHT: 120,
        },
        userInfo: {
          displayName: user?.full_name || (language === 'ar' ? 'طالب' : 'Student'),
          email: user?.email || '',
        },
      };

      console.log('🚀 [Viewer] Initializing Jitsi with options:', options);
      
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event listeners
      api.on('videoConferenceJoined', () => {
        console.log('✅ [Viewer] Successfully joined conference');
        setIsLoading(false);
        setError('');
      });

      api.on('participantJoined', (participant: any) => {
        console.log('👋 [Viewer] Participant joined:', participant);
        setParticipantCount(prev => prev + 1);
      });

      api.on('participantLeft', (participant: any) => {
        console.log('👋 [Viewer] Participant left:', participant);
        setParticipantCount(prev => Math.max(0, prev - 1));
      });

      api.on('audioMuteStatusChanged', (data: any) => {
        console.log('🔇 [Viewer] Audio mute status:', data.muted);
        setIsMuted(data.muted);
      });

      api.on('videoMuteStatusChanged', (data: any) => {
        console.log('📹 [Viewer] Video mute status:', data.muted);
        setIsVideoOff(data.muted);
      });

      api.on('readyToClose', () => {
        console.log('🔚 [Viewer] Meeting ended');
        handleLeave();
      });

      api.on('errorOccurred', (error: any) => {
        console.error('❌ [Viewer] Jitsi error:', error);
        setError(
          language === 'ar'
            ? `حدث خطأ في البث: ${error.message || 'خطأ غير معروف'}`
            : `Streaming error: ${error.message || 'Unknown error'}`
        );
      });

    } catch (err: any) {
      console.error('❌ [Viewer] Error initializing Jitsi:', err);
      setError(
        language === 'ar'
          ? `فشل الانضمام إلى البث المباشر: ${err.message}`
          : `Failed to join live stream: ${err.message}`
      );
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const handleLeave = () => {
    console.log('🚪 [Viewer] Leaving session...');
    
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    
    onLeave();
  };

  return (
    <div className="space-y-4">
      {/* Session Info Card */}
      <Card className="border-blue-600 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            {language === 'ar' ? 'مشاهدة البث المباشر' : 'Watching Live Stream'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium">
              {language === 'ar' ? 'المقرر:' : 'Course:'}
            </p>
            <p>{courseName}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {language === 'ar' ? 'عنوان الجلسة:' : 'Session Title:'}
            </p>
            <p>{sessionTitle}</p>
          </div>

          <div>
            <p className="text-sm font-medium">
              {language === 'ar' ? 'المدرس:' : 'Instructor:'}
            </p>
            <p>{instructorName}</p>
          </div>

          <div className="flex items-center gap-2 text-sm pt-2">
            <Users className="w-4 h-4" />
            <span>
              {language === 'ar' 
                ? `المشاهدون: ${participantCount}` 
                : `Viewers: ${participantCount}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جاري الانضمام إلى البث المباشر...' : 'Joining live stream...'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Jitsi Container */}
      <Card>
        <CardContent className="p-0">
          <div ref={jitsiContainerRef} className="w-full min-h-[600px] rounded-lg overflow-hidden" />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={isMuted ? 'destructive' : 'default'}
          onClick={toggleAudio}
          disabled={isLoading}
        >
          {isMuted ? <MicOff className="w-4 h-4 ml-2" /> : <Mic className="w-4 h-4 ml-2" />}
          {language === 'ar' 
            ? (isMuted ? 'تشغيل المايك' : 'كتم المايك')
            : (isMuted ? 'Unmute' : 'Mute')}
        </Button>

        <Button
          variant={isVideoOff ? 'secondary' : 'default'}
          onClick={toggleVideo}
          disabled={isLoading}
        >
          {isVideoOff ? <VideoOff className="w-4 h-4 ml-2" /> : <Video className="w-4 h-4 ml-2" />}
          {language === 'ar' 
            ? (isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا')
            : (isVideoOff ? 'Start Video' : 'Stop Video')}
        </Button>

        <Button
          variant="outline"
          onClick={handleLeave}
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'مغادرة الجلسة' : 'Leave Session'}
        </Button>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          {language === 'ar' ? (
            <>
              <strong>ملاحظات:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>يتم تسجيل حضورك تلقائياً عند الانضمام</li>
                <li>يمكنك كتم المايك وإيقاف الكاميرا حسب الحاجة</li>
                <li>يمكنك استخدام الدردشة للتفاعل مع المدرس</li>
                <li>تأكد من وجود اتصال إنترنت مستقر</li>
              </ul>
            </>
          ) : (
            <>
              <strong>Notes:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your attendance is automatically recorded upon joining</li>
                <li>You can mute your microphone and turn off your camera as needed</li>
                <li>You can use the chat to interact with the instructor</li>
                <li>Make sure you have a stable internet connection</li>
              </ul>
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
