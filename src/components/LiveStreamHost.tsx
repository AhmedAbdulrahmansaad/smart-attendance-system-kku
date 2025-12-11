import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Video, VideoOff, Mic, MicOff, Users, StopCircle, AlertCircle, Copy, Check, UserCheck, UserX, Eye } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LiveStreamHostProps {
  sessionId: string;
  sessionTitle: string;
  meetingUrl: string;
  attendanceCode: string;
  onStop: () => void;
}

interface Participant {
  id: string;
  displayName: string;
  email?: string;
  joinedAt: Date;
  isHost: boolean;
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);

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
          enableNoisyMicDetection: true,
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

      // Add host as first participant
      setParticipants([{
        id: 'host',
        displayName: user?.full_name || (language === 'ar' ? 'المدرس' : 'Instructor'),
        email: user?.email,
        joinedAt: new Date(),
        isHost: true,
      }]);

      // Event listeners
      api.on('videoConferenceJoined', (data: any) => {
        console.log('✅ [Host] Successfully joined conference:', data);
        setIsLoading(false);
        setError('');
      });

      api.on('participantJoined', async (participant: any) => {
        console.log('👋 [Host] Participant joined:', participant);
        
        const newParticipant: Participant = {
          id: participant.id,
          displayName: participant.displayName || (language === 'ar' ? 'طالب' : 'Student'),
          email: participant.email,
          joinedAt: new Date(),
          isHost: false,
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        
        // Save participant attendance to server
        await recordParticipantAttendance(newParticipant);
      });

      api.on('participantLeft', (participant: any) => {
        console.log('👋 [Host] Participant left:', participant);
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
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

  const recordParticipantAttendance = async (participant: Participant) => {
    try {
      console.log('📝 [Host] Recording attendance for participant:', participant.displayName);
      
      // Send to server to record attendance
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/live-session-join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            participant_id: participant.id,
            participant_name: participant.displayName,
            participant_email: participant.email,
            joined_at: participant.joinedAt.toISOString(),
          }),
        }
      );

      if (response.ok) {
        console.log('✅ [Host] Attendance recorded successfully');
      } else {
        console.error('❌ [Host] Failed to record attendance');
      }
    } catch (error) {
      console.error('❌ [Host] Error recording attendance:', error);
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

  const studentParticipants = participants.filter(p => !p.isHost);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Content - Video */}
      <div className="lg:col-span-2 space-y-4">
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

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-green-600" />
                <span className="font-semibold">
                  {language === 'ar' 
                    ? `إجمالي المشاركين: ${participants.length}` 
                    : `Total Participants: ${participants.length}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'ar' 
                    ? `الطلاب: ${studentParticipants.length}` 
                    : `Students: ${studentParticipants.length}`}
                </span>
              </div>
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
            <div ref={jitsiContainerRef} className="w-full min-h-[600px] rounded-lg overflow-hidden bg-gray-900" />
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant={isMuted ? 'destructive' : 'default'}
            onClick={toggleAudio}
            disabled={isLoading}
            size="lg"
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
            size="lg"
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
            size="lg"
          >
            <StopCircle className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'إنهاء البث' : 'End Stream'}
          </Button>
        </div>

        {/* Instructions */}
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
                  <li>راجع قائمة الحاضرين على الجانب الأيمن</li>
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
                  <li>Check the participants list on the right side</li>
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Sidebar - Participants List */}
      <div className="lg:col-span-1">
        <Card className="border-2 border-primary sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {language === 'ar' ? 'الحاضرون' : 'Participants'}
              </div>
              <Badge variant="secondary" className="text-lg">
                {participants.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`p-3 rounded-lg border-2 ${
                      participant.isHost
                        ? 'bg-green-50 dark:bg-green-950 border-green-500'
                        : 'bg-blue-50 dark:bg-blue-950 border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {participant.isHost ? (
                            <Badge variant="default" className="bg-green-600">
                              {language === 'ar' ? 'المدرس' : 'Host'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {language === 'ar' ? 'طالب' : 'Student'} #{index}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold truncate">
                          {participant.displayName}
                        </p>
                        {participant.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {participant.email}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'ar' ? 'انضم:' : 'Joined:'}{' '}
                          {participant.joinedAt.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {participant.isHost ? (
                        <Eye className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}

                {participants.length === 1 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      {language === 'ar' 
                        ? 'في انتظار انضمام الطلاب...' 
                        : 'Waiting for students to join...'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الطلاب:' : 'Total Students:'}
                </span>
                <span className="font-bold text-lg">{studentParticipants.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}