import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Video, VideoOff, Mic, MicOff, Users, StopCircle, AlertCircle, MessageSquare, Send, Loader2, XCircle, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { Input } from './ui/input';

interface LiveStreamHostProps {
  sessionId: string;
  sessionTitle: string;
  onStop: () => void;
}

interface ChatMessage {
  id: string;
  user_name: string;
  user_id: string;
  message: string;
  timestamp: number;
}

export function LiveStreamHost({ sessionId, sessionTitle, onStop }: LiveStreamHostProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [viewersCount, setViewersCount] = useState(0);
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const channelRef = useRef<any>(null);
  const [debugStatus, setDebugStatus] = useState('Initializing...');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    console.log('🎬 [Host] Starting live stream for session:', sessionId);
    setDebugStatus('Starting...');
    initializeHost();

    return () => {
      console.log('🛑 [Host] Stopping stream...');
      cleanup();
    };
  }, []);

  const initializeHost = async () => {
    try {
      // Step 1: Get media stream first
      setDebugStatus('Requesting camera/microphone...');
      await initializeStream();

      // Step 2: Setup realtime channel
      setDebugStatus('Setting up realtime channel...');
      await setupRealtimeChannel();

      setDebugStatus('Ready! Waiting for viewers...');
      console.log('✅ [Host] Initialization complete');
    } catch (err: any) {
      console.error('❌ [Host] Initialization failed:', err);
      setError(err.message || 'Failed to initialize stream');
      setIsInitializing(false);
      setDebugStatus(`Error: ${err.message}`);
    }
  };

  const initializeStream = async () => {
    console.log('📹 [Host] Requesting media devices...');
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ [Host] Media stream obtained:', {
        video: mediaStream.getVideoTracks().length,
        audio: mediaStream.getAudioTracks().length
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInitializing(false);
      setPermissionDenied(false);
      setError('');

      return mediaStream;
    } catch (err: any) {
      console.error('❌ [Host] Error accessing media devices:', err);
      
      let errorMessage = '';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = language === 'ar' 
          ? 'تم رفض الإذن للوصول إلى الكاميرا والمايك. يرجى السماح بالوصول من إعدادات المتصفح.' 
          : 'Permission denied to access camera and microphone. Please allow access from browser settings.';
        setPermissionDenied(true);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = language === 'ar'
          ? 'لم يتم العثور على كاميرا أو مايكروفون. تأكد من توصيل الأجهزة.'
          : 'No camera or microphone found. Please ensure devices are connected.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = language === 'ar'
          ? 'الكاميرا أو المايك قيد الاستخدام من تطبيق آخر.'
          : 'Camera or microphone is already in use by another application.';
      } else {
        errorMessage = language === 'ar' 
          ? `خطأ في الوصول إلى الأجهزة: ${err.message}` 
          : `Error accessing devices: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsInitializing(false);
      throw new Error(errorMessage);
    }
  };

  const setupRealtimeChannel = async () => {
    console.log('📡 [Host] Setting up realtime channel...');
    
    const channel = supabase.channel(`live-session-${sessionId}`, {
      config: {
        broadcast: { 
          self: true,  // Changed to true for better debugging
          ack: true    // Added for reliability
        },
        presence: { key: 'host' }
      },
    });

    channelRef.current = channel;

    // Setup all listeners
    setupChannelListeners(channel);

    // Subscribe to channel with better error handling
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Channel subscription timeout'));
      }, 10000);

      channel.subscribe(async (status) => {
        console.log('📢 [Host] Channel status:', status);
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          console.log('✅ [Host] Channel subscribed successfully');
          setIsStreaming(true);
          
          // Track presence - tell viewers host is online
          console.log('👋 [Host] Tracking presence as "online"...');
          await channel.track({
            user: 'host',
            online_at: new Date().toISOString(),
            sessionId: sessionId,
            streaming: true
          });
          
          // Announce host is ready via broadcast
          console.log('📢 [Host] Broadcasting host-ready event...');
          await channel.send({
            type: 'broadcast',
            event: 'host-ready',
            payload: { 
              sessionId,
              timestamp: Date.now()
            }
          });
          
          console.log('✅ [Host] Presence tracked and ready signal sent');
          
          // Send periodic ready signals every 5 seconds to ensure viewers see us
          const readyInterval = setInterval(async () => {
            if (channelRef.current) {
              console.log('📡 [Host] Sending periodic ready signal...');
              try {
                await channel.send({
                  type: 'broadcast',
                  event: 'host-ready',
                  payload: { 
                    sessionId,
                    timestamp: Date.now()
                  }
                });
                
                // Re-track presence to keep it fresh
                await channel.track({
                  user: 'host',
                  online_at: new Date().toISOString(),
                  sessionId: sessionId,
                  streaming: true,
                  lastPing: Date.now()
                });
              } catch (err) {
                console.error('❌ [Host] Error sending periodic signal:', err);
              }
            } else {
              clearInterval(readyInterval);
            }
          }, 5000);
          
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error(`Channel error: ${status}`));
        }
      });
    });

    console.log('✅ [Host] Realtime channel ready');
  };

  const setupChannelListeners = (channel: any) => {
    console.log('👂 [Host] Setting up channel listeners...');

    // Listen for viewer join
    channel.on('broadcast', { event: 'viewer-joined' }, (payload: any) => {
      console.log('👤 [Host] Viewer joined:', payload);
      handleViewerJoined(payload.payload);
    });

    // Listen for viewer connection request (NEW - more reliable)
    channel.on('broadcast', { event: 'viewer-request-connection' }, (payload: any) => {
      console.log('📞 [Host] ⭐ Viewer requested connection:', payload);
      handleViewerJoined(payload.payload);
    });

    // Listen for viewer signaling
    channel.on('broadcast', { event: 'viewer-signal' }, (payload: any) => {
      console.log('📨 [Host] Viewer signal:', payload);
      handleViewerSignal(payload.payload);
    });

    // Listen for viewer leave
    channel.on('broadcast', { event: 'viewer-left' }, (payload: any) => {
      console.log('👋 [Host] Viewer left:', payload);
      handleViewerLeft(payload.payload);
    });

    // Listen for chat messages
    channel.on('broadcast', { event: 'chat-message' }, (payload: any) => {
      console.log('💬 [Host] Chat message:', payload);
      setChatMessages(prev => [...prev, payload.payload]);
    });

    // Listen for ping from viewers (health check)
    channel.on('broadcast', { event: 'viewer-ping' }, (payload: any) => {
      console.log('🏓 [Host] Received ping from viewer, sending pong...');
      channel.send({
        type: 'broadcast',
        event: 'host-pong',
        payload: { timestamp: Date.now() }
      });
    });

    console.log('✅ [Host] All listeners set up');
  };

  const createPeerConnection = (viewerId: string): RTCPeerConnection => {
    console.log('🔗 [Host] Creating peer connection for viewer:', viewerId);
    
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
    
    const peerConnection = new RTCPeerConnection(config);

    // CRITICAL: Add local stream to peer connection BEFORE creating offer
    if (stream) {
      console.log('📹 [Host] ⭐ Adding tracks to peer connection...');
      const tracks = stream.getTracks();
      console.log(`📹 [Host] Total tracks to add: ${tracks.length}`);
      
      tracks.forEach(track => {
        console.log(`  ➕ [Host] Adding ${track.kind} track (id: ${track.id}, enabled: ${track.enabled})`);
        const sender = peerConnection.addTrack(track, stream);
        console.log(`  ✅ [Host] Track added, sender:`, sender);
      });
      
      console.log('✅ [Host] All tracks added to peer connection');
    } else {
      console.error('❌ [Host] ⚠️ NO STREAM AVAILABLE! Cannot add tracks!');
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 [Host] Sending ICE candidate to viewer:', viewerId);
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'host-signal',
            payload: {
              viewerId,
              candidate: event.candidate
            }
          });
        }
      } else {
        console.log('🧊 [Host] ICE gathering complete for viewer:', viewerId);
      }
    };

    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`🔄 [Host] Connection state for ${viewerId}:`, state);
      
      if (state === 'connected') {
        console.log(`✅ [Host] ⭐ Viewer ${viewerId} CONNECTED!`);
      } else if (state === 'failed') {
        console.error(`❌ [Host] Connection FAILED for ${viewerId}`);
      }
    };
    
    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 [Host] ICE state for ${viewerId}:`, peerConnection.iceConnectionState);
    };

    peersRef.current.set(viewerId, peerConnection);
    console.log('✅ [Host] Peer connection created and stored');
    return peerConnection;
  };

  const handleViewerJoined = async (data: any) => {
    const { viewerId, userName } = data;
    console.log('👤 [Host] ⭐ NEW VIEWER JOINED:', viewerId, userName);
    setDebugStatus(`Viewer ${userName} joined!`);
    
    setViewersCount(prev => prev + 1);
    
    if (!stream) {
      console.error('❌ [Host] NO STREAM AVAILABLE! Cannot send to viewer!');
      return;
    }

    console.log('📹 [Host] Stream available:', {
      id: stream.id,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length
    });

    // Small delay to ensure channel is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    const peerConnection = createPeerConnection(viewerId);
    
    try {
      console.log('📝 [Host] Creating offer for viewer:', viewerId);
      const offer = await peerConnection.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false
      });
      
      console.log('📝 [Host] Offer created:', offer.type);
      await peerConnection.setLocalDescription(offer);
      console.log('✅ [Host] Local description set');
      
      // Wait a moment for ICE gathering to start
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📤 [Host] Sending offer to viewer:', viewerId);
      
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'host-offer',
          payload: {
            viewerId,
            offer: peerConnection.localDescription
          }
        });
        console.log('✅ [Host] ⭐ Offer sent successfully to', viewerId);
        setDebugStatus(`Offer sent to ${userName}`);
      } else {
        console.error('❌ [Host] Channel not available!');
      }
    } catch (err) {
      console.error('❌ [Host] Error creating/sending offer:', err);
      setDebugStatus(`Error: ${err}`);
    }
  };

  const handleViewerSignal = async (data: any) => {
    const { viewerId, answer, candidate } = data;
    console.log('📨 [Host] Received signal from viewer:', viewerId);
    
    const peerConnection = peersRef.current.get(viewerId);
    
    if (!peerConnection) {
      console.error('❌ [Host] No peer connection found for viewer:', viewerId);
      return;
    }
    
    try {
      if (answer) {
        console.log('📥 [Host] Setting remote description (answer) from viewer:', viewerId);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ [Host] Answer processed successfully');
        setDebugStatus('Viewer connected!');
      }
      
      if (candidate) {
        console.log('🧊 [Host] Adding ICE candidate from viewer:', viewerId);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ [Host] ICE candidate added');
      }
    } catch (err) {
      console.error('❌ [Host] Error handling viewer signal:', err);
    }
  };

  const handleViewerLeft = (data: any) => {
    const { viewerId } = data;
    console.log('👋 [Host] Viewer left:', viewerId);
    
    const peerConnection = peersRef.current.get(viewerId);
    
    if (peerConnection) {
      peerConnection.close();
      peersRef.current.delete(viewerId);
      console.log('✅ [Host] Peer connection closed and removed');
    }
    
    setViewersCount(prev => Math.max(0, prev - 1));
    setDebugStatus('Viewer left');
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        console.log('📹 [Host] Video:', videoTrack.enabled ? 'enabled' : 'disabled');
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log('🎤 [Host] Audio:', audioTrack.enabled ? 'enabled' : 'disabled');
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelRef.current) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      user_name: user?.full_name || 'Instructor',
      user_id: user?.id || 'unknown',
      message: newMessage,
      timestamp: Date.now()
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message
    });

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleStopStream = async () => {
    console.log('🛑 [Host] Stopping stream...');
    
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'stream-ended',
        payload: {}
      });
    }

    cleanup();
    onStop();
  };

  const retryPermission = () => {
    setError('');
    setPermissionDenied(false);
    setIsInitializing(true);
    setDebugStatus('Retrying...');
    initializeHost();
  };

  const cleanup = () => {
    console.log('🧹 [Host] Cleaning up...');
    
    // Close all peer connections
    peersRef.current.forEach((peer, viewerId) => {
      console.log('  🔌 Closing peer connection for:', viewerId);
      peer.close();
    });
    peersRef.current.clear();

    // Stop media stream
    if (stream) {
      console.log('  📹 Stopping media stream...');
      stream.getTracks().forEach(track => {
        console.log(`    ⏹️ Stopping ${track.kind} track`);
        track.stop();
      });
      setStream(null);
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      console.log('  📡 Unsubscribing from channel...');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    console.log('✅ [Host] Cleanup complete');
  };

  if (permissionDenied) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-base mt-2">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ar'
                ? 'لبدء البث المباشر، يجب السماح للمتصفح بالوصول إلى الكاميرا والمايكروفون.'
                : 'To start live streaming, you must allow the browser to access your camera and microphone.'}
            </p>
            <div className="flex gap-3">
              <Button onClick={retryPermission} variant="default">
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
              <Button onClick={onStop} variant="outline">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-red-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              {language === 'ar' ? 'بث مباشر' : 'Live Stream'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{sessionTitle}</p>
          </div>
          <div className="flex gap-2">
            {isStreaming && (
              <div className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 font-bold">
                <div className="relative">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
                </div>
                {language === 'ar' ? 'البث نشط الآن' : 'STREAMING LIVE'}
              </div>
            )}
            <Button variant="destructive" onClick={handleStopStream} size="lg">
              {language === 'ar' ? 'إيقاف البث' : 'Stop Stream'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* Video Section */}
        <div className="flex-1 space-y-4">
          {/* Permission Request Alert */}
          {!stream && !isInitializing && !permissionDenied && !error && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-sm">
                <div className="space-y-3">
                  <p className="font-bold text-base">
                    {language === 'ar' 
                      ? '📹 لبدء البث المباشر، اسمح للمتصفح بالوصول للكاميرا والمايكروفون' 
                      : '📹 To start live streaming, allow browser access to camera and microphone'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? 'سيظهر لك نافذة من المتصفح تطلب الإذن. اضغط "السماح" أو "Allow" للمتابعة.'
                      : 'A browser popup will ask for permission. Click "Allow" to proceed.'}
                  </p>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border text-xs space-y-1">
                    <p className="font-semibold">
                      {language === 'ar' ? 'خطوات التفعيل:' : 'Activation Steps:'}
                    </p>
                    <p>1. {language === 'ar' ? 'اضغط الزر أدناه' : 'Click the button below'}</p>
                    <p>2. {language === 'ar' ? 'اختر الكاميرا والمايك المطلوبين' : 'Select your camera and microphone'}</p>
                    <p>3. {language === 'ar' ? 'اضغط "السماح / Allow"' : 'Click "Allow"'}</p>
                    <p>4. {language === 'ar' ? 'ستبدأ معاينة الفيديو تلقائياً' : 'Video preview will start automatically'}</p>
                  </div>
                  <Button 
                    onClick={initializeStream} 
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-base py-6"
                    size="lg"
                  >
                    <Video className="w-6 h-6 mr-2" />
                    {language === 'ar' ? '🎥 تفعيل الكاميرا والمايكروفون الآن' : '🎥 Activate Camera & Microphone Now'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Video Preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-black"
            />

            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
                <Loader2 className="w-20 h-20 animate-spin mb-6 text-blue-500" />
                <p className="text-xl font-bold mb-2">
                  {language === 'ar' ? 'جارٍ التحضير...' : 'Initializing...'}
                </p>
                <p className="text-sm text-gray-400">{debugStatus}</p>
              </div>
            )}

            {permissionDenied && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 p-8 text-white">
                <XCircle className="w-24 h-24 mb-6 text-red-300" />
                <h3 className="text-2xl font-bold mb-4">
                  {language === 'ar' ? 'تم رفض الإذن' : 'Permission Denied'}
                </h3>
                <p className="text-center max-w-md mb-6">
                  {language === 'ar'
                    ? 'لم تسمح للمتصفح بالوصول للكاميرا والمايك. يرجى السماح من إعدادات المتصفح ثم إعادة المحاولة.'
                    : 'You did not allow browser access to camera and microphone. Please allow from browser settings and try again.'}
                </p>
                <div className="space-y-2 text-sm bg-black/30 p-4 rounded mb-6">
                  <p className="font-bold">{language === 'ar' ? 'كيفية السماح:' : 'How to allow:'}</p>
                  <p>🔹 Chrome/Edge: {language === 'ar' ? 'اضغط على أيقونة القفل بجانب رابط الموقع' : 'Click the lock icon next to the URL'}</p>
                  <p>🔹 Firefox: {language === 'ar' ? 'اضغط على أيقونة الكاميرا في شريط العنوان' : 'Click the camera icon in the address bar'}</p>
                  <p>🔹 Safari: {language === 'ar' ? 'اذهب إلى Safari → الإعدادات → المواقع' : 'Go to Safari → Settings → Websites'}</p>
                </div>
                <Button onClick={initializeStream} variant="outline" size="lg" className="bg-white text-red-900 hover:bg-gray-100">
                  {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                </Button>
              </div>
            )}

            {error && !permissionDenied && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 p-6">
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {stream && !error && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                <div className="relative">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                {language === 'ar' ? '✅ الكاميرا جاهزة' : '✅ Camera Ready'}
              </div>
            )}

            {/* Debug Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded text-xs font-mono">
              {debugStatus}
            </div>

            {/* Video Controls */}
            {stream && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAudio}
                    className="text-white hover:bg-white/20 h-12 w-12"
                  >
                    {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVideo}
                    className="text-white hover:bg-white/20 h-12 w-12"
                  >
                    {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <Card className="w-96 flex flex-col">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {language === 'ar' ? 'المحادثة' : 'Chat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]"
            >
              {chatMessages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="text-xs font-semibold text-primary">
                      {msg.user_name}
                    </div>
                    <div className="text-sm bg-muted p-2 rounded-lg">
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </CardContent>
    </div>
  );
}