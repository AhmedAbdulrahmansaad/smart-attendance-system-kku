import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Volume2, VolumeX, Maximize, MessageSquare, Send, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { Input } from './ui/input';

interface LiveStreamViewerProps {
  sessionId: string;
  sessionTitle: string;
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  user_name: string;
  user_id: string;
  message: string;
  timestamp: number;
}

export function LiveStreamViewer({ sessionId, sessionTitle, onLeave }: LiveStreamViewerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const viewerId = useRef(`viewer_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const channelRef = useRef<any>(null);
  const [debugStatus, setDebugStatus] = useState('Initializing...');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    console.log('🎬 [Viewer] Initializing viewer for session:', sessionId);
    console.log('🆔 [Viewer] My viewer ID:', viewerId.current);
    setDebugStatus('Initializing...');
    initializeViewer();

    return () => {
      console.log('🛑 [Viewer] Cleaning up...');
      cleanup();
    };
  }, []);

  const initializeViewer = async () => {
    try {
      setConnecting(true);
      setError('');
      setDebugStatus('Initializing...');
      console.log('📡 [Viewer] Setting up realtime channel...');
      console.log('🆔 [Viewer] Session ID:', sessionId);
      console.log('🆔 [Viewer] My viewer ID:', viewerId.current);
      
      // Create and subscribe to channel FIRST
      const channel = supabase.channel(`live-session-${sessionId}`, {
        config: {
          broadcast: { 
            self: true,
            ack: true
          },
          presence: { key: viewerId.current }
        },
      });

      channelRef.current = channel;

      // Setup all listeners BEFORE subscribing
      setupChannelListeners(channel);

      // Subscribe to channel
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Channel subscription timeout (15s)'));
        }, 15000);

        channel.subscribe(async (status) => {
          console.log('📢 [Viewer] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            setDebugStatus('Channel subscribed!');
            console.log('✅ [Viewer] Channel subscribed successfully');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            reject(new Error(`Channel error: ${status}`));
          }
        });
      });

      // Check if host is present using presence
      console.log('👀 [Viewer] Checking for host presence...');
      
      // Wait a bit for presence to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const presenceState = channel.presenceState();
      console.log('👥 [Viewer] Current presence state:', presenceState);
      
      const hostPresent = Object.values(presenceState).some((presences: any) => 
        presences.some((p: any) => p.user === 'host')
      );
      
      if (hostPresent) {
        console.log('✅ [Viewer] Host is PRESENT in channel!');
        setDebugStatus('Host detected! Connecting...');
      } else {
        console.warn('⚠️ [Viewer] Host NOT present yet. Will keep monitoring via presence events...');
        setDebugStatus('Waiting for host to start streaming... (Host will appear when they click "Start Stream")');
      }

      // Small delay to ensure channel is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create peer connection FIRST
      setDebugStatus('Creating peer connection...');
      createPeerConnection();

      // Only send connection requests if host is present
      if (hostPresent) {
        setDebugStatus('Requesting connection from host...');
        console.log('📣 [Viewer] Starting connection request loop...');
        
        let attempts = 0;
        const maxAttempts = 15;
        
        const requestConnection = async () => {
          attempts++;
          console.log(`📞 [Viewer] Connection request attempt ${attempts}/${maxAttempts}`);
          console.log(`📞 [Viewer] Sending to session: live-session-${sessionId}`);
          
          const result = await channel.send({
            type: 'broadcast',
            event: 'viewer-request-connection',
            payload: {
              viewerId: viewerId.current,
              userName: user?.full_name || 'Student',
              attempt: attempts,
              timestamp: Date.now()
            }
          });

          console.log(`📤 [Viewer] Request ${attempts} sent. Status:`, result.status);
          setDebugStatus(`Requesting connection... (${attempts}/${maxAttempts})`);
        };

        // Send first request immediately
        await requestConnection();

        // Then keep requesting every 3 seconds until connected or timeout
        const requestInterval = setInterval(async () => {
          if (connected) {
            console.log('✅ [Viewer] Connected! Stopping request loop.');
            clearInterval(requestInterval);
            return;
          }

          if (attempts >= maxAttempts) {
            console.warn('⚠️ [Viewer] Max attempts reached');
            clearInterval(requestInterval);
            
            if (!connected) {
              // Check presence one more time
              const finalPresenceState = channel.presenceState();
              const hostStillPresent = Object.values(finalPresenceState).some((presences: any) => 
                presences.some((p: any) => p.user === 'host')
              );
              
              console.log('👥 [Viewer] Final presence check - Host present:', hostStillPresent);
              
              const errorMsg = language === 'ar' 
                ? (hostStillPresent 
                    ? 'فشل الاتصال بالبث. قد تكون هناك مشكلة في الشبكة. اضغط "إعادة المحاولة".' 
                    : 'المدرس لم يبدأ البث المباشر بعد. تأكد من أن المدرس ضغط "بدء البث" ثم اضغط "إعادة المحاولة".')
                : (hostStillPresent 
                    ? 'Connection failed. There may be a network issue. Click "Retry Connection".' 
                    : 'Instructor has not started streaming yet. Make sure the instructor clicked "Start Stream", then click "Retry Connection".');
              
              setError(errorMsg);
              setConnecting(false);
              setDebugStatus(hostStillPresent ? 'Timeout: Network issue?' : 'Timeout: Host not streaming');
            }
            return;
          }

          await requestConnection();
        }, 3000);
      } else {
        // Host not present yet - just wait for presence events to trigger connection
        console.log('⏰ [Viewer] Waiting for host to appear via presence events...');
        setConnecting(false); // Stop the initial "connecting" state
      }

    } catch (err: any) {
      console.error('❌ [Viewer] Error initializing:', err);
      setError(language === 'ar' 
        ? `فشل الانضمام إلى البث: ${err.message}` 
        : `Failed to join stream: ${err.message}`);
      setConnecting(false);
      setDebugStatus(`Error: ${err.message}`);
    }
  };

  const setupChannelListeners = (channel: any) => {
    console.log('👂 [Viewer] Setting up channel listeners...');

    // Listen for presence changes - THIS IS KEY!
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const hostPresent = Object.values(presenceState).some((presences: any) => 
        presences.some((p: any) => p.user === 'host')
      );
      
      console.log('👥 [Viewer] Presence sync - Host present:', hostPresent);
      
      if (hostPresent && !connected && !error) {
        console.log('🎉 [Viewer] HOST JUST CAME ONLINE! Requesting connection...');
        setDebugStatus('Host detected! Connecting...');
        
        // Immediately request connection when host appears
        channel.send({
          type: 'broadcast',
          event: 'viewer-request-connection',
          payload: {
            viewerId: viewerId.current,
            userName: user?.full_name || 'Student',
            timestamp: Date.now()
          }
        });
      }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
      console.log('👋 [Viewer] Someone joined:', key, newPresences);
      
      const isHost = newPresences.some((p: any) => p.user === 'host');
      if (isHost) {
        console.log('🎉 [Viewer] HOST JOINED! Requesting connection immediately...');
        setDebugStatus('Host joined! Connecting...');
        
        // Immediately request connection when host joins
        channel.send({
          type: 'broadcast',
          event: 'viewer-request-connection',
          payload: {
            viewerId: viewerId.current,
            userName: user?.full_name || 'Student',
            timestamp: Date.now()
          }
        });
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
      console.log('👋 [Viewer] Someone left:', key, leftPresences);
      
      const wasHost = leftPresences.some((p: any) => p.user === 'host');
      if (wasHost) {
        console.log('⚠️ [Viewer] HOST LEFT!');
        setError(language === 'ar' ? 'انتهى البث المباشر' : 'Stream ended');
      }
    });

    // Listen for host ready signal
    channel.on('broadcast', { event: 'host-ready' }, (payload: any) => {
      console.log('🎯 [Viewer] Host is ready!', payload);
      setDebugStatus('Host detected! Requesting stream...');
      
      // When host is ready, immediately request connection
      console.log('📤 [Viewer] Requesting connection from host...');
      channel.send({
        type: 'broadcast',
        event: 'viewer-request-connection',
        payload: {
          viewerId: viewerId.current,
          userName: user?.full_name || 'Student'
        }
      });
    });

    // Listen for host offer
    channel.on('broadcast', { event: 'host-offer' }, (payload: any) => {
      console.log('📨 [Viewer] Received host-offer:', payload);
      if (payload.payload.viewerId === viewerId.current) {
        console.log('✅ [Viewer] Offer is for me!');
        setDebugStatus('Received offer! Connecting...');
        handleHostOffer(payload.payload);
      } else {
        console.log('⏭️ [Viewer] Offer is for different viewer:', payload.payload.viewerId);
      }
    });

    // Listen for host signaling
    channel.on('broadcast', { event: 'host-signal' }, (payload: any) => {
      console.log('📨 [Viewer] Received host-signal:', payload);
      if (payload.payload.viewerId === viewerId.current) {
        console.log('✅ [Viewer] Signal is for me!');
        handleHostSignal(payload.payload);
      }
    });

    // Listen for stream ended
    channel.on('broadcast', { event: 'stream-ended' }, () => {
      console.log('🛑 [Viewer] Stream ended by host');
      setError(language === 'ar' 
        ? 'انتهى البث المباشر' 
        : 'Live stream has ended');
      setTimeout(() => {
        onLeave();
      }, 3000);
    });

    // Listen for chat messages
    channel.on('broadcast', { event: 'chat-message' }, (payload: any) => {
      console.log('💬 [Viewer] Received chat message:', payload);
      setChatMessages(prev => [...prev, payload.payload]);
    });

    // Listen for host ping response
    channel.on('broadcast', { event: 'host-pong' }, (payload: any) => {
      console.log('🏓 [Viewer] Received pong from host - Host is ALIVE!');
      setDebugStatus('Host is online! Waiting for offer...');
    });

    console.log('✅ [Viewer] All listeners set up');
  };

  const createPeerConnection = (): RTCPeerConnection => {
    console.log('🔗 [Viewer] Creating peer connection...');
    
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

    // Handle incoming stream - THIS IS KEY!
    peerConnection.ontrack = (event) => {
      console.log('🎥 [Viewer] ✨ RECEIVED TRACK:', event.track.kind, 'streams:', event.streams.length);
      setDebugStatus(`✨ Received ${event.track.kind} track!`);
      
      if (videoRef.current) {
        if (event.streams && event.streams[0]) {
          console.log('✅ [Viewer] Setting video srcObject to stream:', event.streams[0].id);
          videoRef.current.srcObject = event.streams[0];
          
          // IMPORTANT: Force play
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ [Viewer] Video playing successfully!');
                setConnected(true);
                setConnecting(false);
                setDebugStatus('✅ Connected! Streaming...');
                setError('');
              })
              .catch(err => {
                console.warn('⚠️ [Viewer] Autoplay failed:', err);
                setDebugStatus('Click video to play (browser policy)');
                // Still mark as connected
                setConnected(true);
                setConnecting(false);
              });
          }
        } else {
          console.warn('⚠️ [Viewer] No streams in track event');
        }
      } else {
        console.error('❌ [Viewer] Video ref is null!');
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 [Viewer] Sending ICE candidate to host');
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'viewer-signal',
            payload: {
              viewerId: viewerId.current,
              candidate: event.candidate
            }
          }).catch((err: any) => {
            console.error('❌ [Viewer] Failed to send ICE candidate:', err);
          });
        }
      } else {
        console.log('🧊 [Viewer] ICE gathering complete');
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('🔄 [Viewer] Connection state:', state);
      setDebugStatus(`Connection: ${state}`);
      
      if (state === 'connected') {
        console.log('✅ [Viewer] ⭐ Peer connection ESTABLISHED!');
        setConnected(true);
        setConnecting(false);
        setDebugStatus('⭐ Connected!');
        setError('');
      } else if (state === 'failed') {
        console.error('❌ [Viewer] Connection FAILED');
        setError(language === 'ar' 
          ? 'فشل الاتصال بالبث المباشر. جرب إعادة الاتصال.' 
          : 'Failed to connect to live stream. Try reconnecting.');
        setConnecting(false);
        setDebugStatus('❌ Connection failed');
      } else if (state === 'disconnected') {
        console.warn('⚠️ [Viewer] Connection disconnected');
        setDebugStatus('⚠️ Disconnected');
      }
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 [Viewer] ICE connection state:', peerConnection.iceConnectionState);
      setDebugStatus(`ICE: ${peerConnection.iceConnectionState}`);
      
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        console.log('✅ [Viewer] ICE connection successful!');
      }
    };

    // Handle ICE gathering state
    peerConnection.onicegatheringstatechange = () => {
      console.log('🧊 [Viewer] ICE gathering state:', peerConnection.iceGatheringState);
    };

    peerConnectionRef.current = peerConnection;
    console.log('✅ [Viewer] Peer connection created and stored');
    return peerConnection;
  };

  const handleHostOffer = async (data: any) => {
    const { offer } = data;
    console.log('📥 [Viewer] ⭐ HANDLING HOST OFFER...');
    setDebugStatus('Processing offer...');
    
    if (!peerConnectionRef.current) {
      console.error('❌ [Viewer] No peer connection!');
      setError('Internal error: No peer connection');
      return;
    }
    
    try {
      console.log('📝 [Viewer] Setting remote description (offer)...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ [Viewer] Remote description set successfully');
      
      console.log('📝 [Viewer] Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      console.log('✅ [Viewer] Answer created:', answer);
      
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('✅ [Viewer] Local description set');
      
      console.log('📤 [Viewer] Sending answer to host...');
      setDebugStatus('Sending answer...');
      
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'viewer-signal',
          payload: {
            viewerId: viewerId.current,
            answer: peerConnectionRef.current.localDescription
          }
        });
        console.log('✅ [Viewer]  Answer sent successfully!');
        setDebugStatus('Answer sent! Waiting for stream...');
      }
    } catch (err: any) {
      console.error('❌ [Viewer] Error handling offer:', err);
      setError(language === 'ar' 
        ? `فشل الاتصال: ${err.message}` 
        : `Connection failed: ${err.message}`);
      setDebugStatus(`Error: ${err.message}`);
    }
  };

  const handleHostSignal = async (data: any) => {
    const { candidate } = data;
    console.log('🧊 [Viewer] Received ICE candidate from host');
    
    if (!peerConnectionRef.current || !candidate) {
      console.warn('⚠️ [Viewer] No peer connection or candidate');
      return;
    }
    
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ [Viewer] ICE candidate added successfully');
    } catch (err: any) {
      console.error('❌ [Viewer] Error adding ICE candidate:', err);
    }
  };

  const toggleAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setAudioEnabled(!videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelRef.current) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      user_name: user?.full_name || 'Student',
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

  const handleRetry = () => {
    cleanup();
    setRetryCount(0);
    setConnecting(true);
    setConnected(false);
    setError('');
    setTimeout(() => initializeViewer(), 500);
  };

  const cleanup = () => {
    console.log('🧹 [Viewer] Cleaning up...');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'viewer-left',
          payload: { viewerId: viewerId.current }
        });
      } catch (err) {
        console.warn('⚠️ [Viewer] Could not send viewer-left:', err);
      }
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

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
              {language === 'ar' ? 'البث المباشر' : 'Live Stream'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{sessionTitle}</p>
          </div>
          <Button variant="destructive" onClick={onLeave} size="lg">
            {language === 'ar' ? 'مغادرة' : 'Leave'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6 flex gap-6">
        <div className="flex-1 space-y-4">
          {/* Video Container */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={!audioEnabled}
              className="w-full h-full object-contain bg-black"
              onClick={() => {
                // Allow user to manually play if autoplay failed
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play();
                }
              }}
            />

            {connecting && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
                <Loader2 className="w-20 h-20 animate-spin mb-6 text-red-500" />
                <p className="text-xl font-bold mb-2">
                  {language === 'ar' ? 'جاري الاتصال بالبث المباشر...' : 'Connecting to live stream...'}
                </p>
                <p className="text-sm text-gray-400 mb-4 text-center max-w-md px-4">{debugStatus}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  {language === 'ar' ? 'قد يستغرق هذا 10-30 ثانية' : 'This may take 10-30 seconds'}
                </div>
              </div>
            )}
            
            {/* Waiting for Host - Special State */}
            {!connecting && !connected && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 text-white p-8">
                <div className="animate-bounce mb-6">
                  <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {language === 'ar' 
                    ? '⏳ في انتظار المدرس...' 
                    : '⏳ Waiting for Instructor...'}
                </h3>
                <p className="text-gray-300 text-center max-w-md mb-6">
                  {language === 'ar'
                    ? 'المدرس لم يبدأ البث المباشر بعد. ستبدأ المحاضرة تلقائياً عندما يضغط المدرس على \"بدء البث\".'
                    : 'The instructor has not started the stream yet. The lecture will start automatically when the instructor clicks \"Start Stream\".'}
                </p>
                <div className="flex items-center gap-3 bg-white/10 rounded-lg px-6 py-3 backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm">
                    {language === 'ar' 
                      ? 'الاتصال جاهز - في انتظار البث...' 
                      : 'Connection ready - waiting for broadcast...'}
                  </span>
                </div>
                <div className="mt-8 space-y-2 text-xs text-gray-400 text-center">
                  <p>💡 {language === 'ar' 
                    ? 'نصيحة: لا داعي للتحديث، ستبدأ المحاضرة تلقائياً' 
                    : 'Tip: No need to refresh, the lecture will start automatically'}
                  </p>
                  <p>🔔 {language === 'ar' 
                    ? 'تأكد من تشغيل الصوت استعداداً' 
                    : 'Make sure your sound is on and ready'}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 p-6">
                <Alert variant="destructive" className="max-w-md mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
                <Button onClick={handleRetry} variant="outline" size="lg" className="gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry Connection'}
                </Button>
              </div>
            )}

            {connected && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                <div className="relative">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
                </div>
                {language === 'ar' ? 'مباشر الآن' : 'LIVE NOW'}
              </div>
            )}

            {/* Debug Status - Only show when connecting */}
            {connecting && !error && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded text-xs font-mono">
                {debugStatus}
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAudio}
                  className="text-white hover:bg-white/20 h-12 w-12"
                  disabled={!connected}
                >
                  {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 h-12 w-12"
                  disabled={!connected}
                >
                  <Maximize className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Connection Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </p>
              <p className={`text-sm font-bold ${connected ? 'text-green-600' : 'text-yellow-600'}`}>
                {connected 
                  ? (language === 'ar' ? '✅ متصل' : '✅ Connected')
                  : (language === 'ar' ? '⏳ جاري الاتصال' : '⏳ Connecting')}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'ar' ? 'الصوت' : 'Audio'}
              </p>
              <p className="text-sm font-bold">
                {audioEnabled ? '🔊' : '🔇'}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'ar' ? 'الجودة' : 'Quality'}
              </p>
              <p className="text-sm font-bold text-blue-600">HD</p>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <Card className="w-80 flex flex-col border-2">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {language === 'ar' ? 'الدردشة' : 'Chat'}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 min-h-0">
            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2"
              style={{ maxHeight: 'calc(100vh - 400px)' }}
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg ${
                      msg.user_id === user?.id 
                        ? 'bg-primary text-primary-foreground ml-4' 
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1">{msg.user_name}</p>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                disabled={!connected}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!connected || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </CardContent>
    </div>
  );
}