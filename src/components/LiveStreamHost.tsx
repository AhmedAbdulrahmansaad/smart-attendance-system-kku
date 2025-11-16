import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Video, VideoOff, Mic, MicOff, Users, StopCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';

interface LiveStreamHostProps {
  sessionId: string;
  sessionTitle: string;
  meetingUrl: string;
  attendanceCode: string;
  onStop: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function LiveStreamHost({ sessionId, sessionTitle, meetingUrl, attendanceCode, onStop }: LiveStreamHostProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(1); // Host is always present
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    console.log('🎬 [Host] Initializing Jitsi Meet for session:', sessionId);
    console.log('🔗 [Host] Meeting URL:', meetingUrl);
    
    loadJitsiScript();

    return () => {
      console.log('🛑 [Host] Cleaning up Jitsi...');
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const loadJitsiScript = () => {
    // Check if Jitsi script is already loaded
    if (window.JitsiMeetExternalAPI) {
      console.log('✅ [Host] Jitsi script already loaded');
      initializeJitsi();
      return;
    }

    // Load Jitsi Meet API script
    console.log('📥 [Host] Loading Jitsi Meet API script...');
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ [Host] Jitsi script loaded successfully');
      initializeJitsi();
    };
    script.onerror = () => {
      console.error('❌ [Host] Failed to load Jitsi script');
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
      console.error('❌ [Host] Jitsi container or API not ready');
      return;
    }

    try {
      // Extract room name from meeting URL
      const roomName = meetingUrl.split('/').pop() || `kku_${sessionId}`;
      console.log('🏠 [Host] Room name:', roomName);

      const domain = 'meet.jit.si';
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '600',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
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
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#006747',
          DEFAULT_REMOTE_DISPLAY_NAME: language === 'ar' ? 'طالب' : 'Student',
          DEFAULT_LOCAL_DISPLAY_NAME: language === 'ar' ? 'المدرس' : 'Instructor',
        },
        userInfo: {
          displayName: user?.full_name || (language === 'ar' ? 'المدرس' : 'Instructor'),
          email: user?.email || '',
        },
      };

      console.log('🚀 [Host] Initializing Jitsi with options:', options);
      
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event listeners
      api.on('videoConferenceJoined', () => {
        console.log('✅ [Host] Successfully joined conference');
        setIsLoading(false);
        setError('');
      });

      api.on('participantJoined', (participant: any) => {
        console.log('👋 [Host] Participant joined:', participant);
        setParticipantCount(prev => prev + 1);
      });

      api.on('participantLeft', (participant: any) => {
        console.log('👋 [Host] Participant left:', participant);
        setParticipantCount(prev => Math.max(1, prev - 1));
      });

      api.on('audioMuteStatusChanged', (data: any) => {
        console.log('🔇 [Host] Audio mute status:', data.muted);
        setIsMuted(data.muted);
      });

      api.on('videoMuteStatusChanged', (data: any) => {
        console.log('📹 [Host] Video mute status:', data.muted);
        setIsVideoOff(data.muted);
      });

      api.on('readyToClose', () => {
        console.log('🔚 [Host] Meeting ended');
        handleStopStream();
      });

      api.on('errorOccurred', (error: any) => {
        console.error('❌ [Host] Jitsi error:', error);
        setError(
          language === 'ar'
            ? `حدث خطأ في البث: ${error.message || 'خطأ غير معروف'}`
            : `Streaming error: ${error.message || 'Unknown error'}`
        );
      });

    } catch (err: any) {
      console.error('❌ [Host] Error initializing Jitsi:', err);
      setError(
        language === 'ar'
          ? `فشل بدء البث المباشر: ${err.message}`
          : `Failed to start live stream: ${err.message}`
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

  const handleStopStream = async () => {
    console.log('🛑 [Host] Stopping stream...');
    
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    
    onStop();
  };

  const copyToClipboard = (text: string, type: 'code' | 'url') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Session Info Card */}
      <Card className="border-green-600 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-green-600" />
            {language === 'ar' ? 'البث المباشر الآن' : 'Live Streaming Now'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">
              {language === 'ar' ? 'عنوان الجلسة:' : 'Session Title:'}
            </p>
            <p className="text-lg">{sessionTitle}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">
              {language === 'ar' ? 'رمز الحضور:' : 'Attendance Code:'}
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-white dark:bg-gray-800 px-3 py-2 rounded text-xl font-mono flex-1">
                {attendanceCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(attendanceCode, 'code')}
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' 
                ? 'شارك هذا الرمز مع الطلاب لتسجيل حضورهم' 
                : 'Share this code with students to mark their attendance'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">
              {language === 'ar' ? 'رابط الجلسة:' : 'Meeting Link:'}
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded text-xs flex-1 truncate">
                {meetingUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(meetingUrl, 'url')}
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>
              {language === 'ar' 
                ? `عدد المشاهدين: ${participantCount - 1}` 
                : `Viewers: ${participantCount - 1}`}
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
              {language === 'ar' ? 'جاري بدء البث المباشر...' : 'Starting live stream...'}
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
          variant={isVideoOff ? 'destructive' : 'default'}
          onClick={toggleVideo}
          disabled={isLoading}
        >
          {isVideoOff ? <VideoOff className="w-4 h-4 ml-2" /> : <Video className="w-4 h-4 ml-2" />}
          {language === 'ar' 
            ? (isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا')
            : (isVideoOff ? 'Start Video' : 'Stop Video')}
        </Button>

        <Button
          variant="destructive"
          onClick={handleStopStream}
          disabled={isLoading}
        >
          <StopCircle className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'إنهاء البث' : 'End Stream'}
        </Button>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          {language === 'ar' ? (
            <>
              <strong>تعليمات:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>استخدم الأزرار للتحكم في المايك والكاميرا</li>
                <li>شارك رمز الحضور مع الطلاب</li>
                <li>يمكن للطلاب الانضمام من لوحة التحكم الخاصة بهم</li>
                <li>سيتم تسجيل حضور الطلاب تلقائياً عند انضمامهم</li>
              </ul>
            </>
          ) : (
            <>
              <strong>Instructions:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Use the buttons to control your microphone and camera</li>
                <li>Share the attendance code with students</li>
                <li>Students can join from their dashboard</li>
                <li>Student attendance will be automatically recorded when they join</li>
              </ul>
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
