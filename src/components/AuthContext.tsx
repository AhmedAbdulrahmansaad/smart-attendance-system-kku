import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { apiRequest } from '../utils/api';
import { 
  generateDeviceFingerprint, 
  saveFingerprintToStorage, 
  clearFingerprintFromStorage,
  getDeviceSummary,
  detectSuspiciousDevice,
  type DeviceInfo 
} from '../utils/deviceFingerprint';
import { toast } from 'sonner@2.0.3';

export type UserRole = 'admin' | 'instructor' | 'student' | 'supervisor';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  university_id?: string;
  device_fingerprint?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, universityId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deviceInfo: DeviceInfo | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Memoized refreshUser to prevent re-creation
  const refreshUser = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('⏸️ [AuthContext] Refresh already in progress, skipping');
      return;
    }
    
    isRefreshingRef.current = true;
    console.log('🔄 [AuthContext] refreshUser called');
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [AuthContext] Session error:', sessionError);
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      
      if (session?.access_token) {
        // Check if token is about to expire (within 5 minutes)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        
        console.log('⏰ [AuthContext] Token expires in:', Math.floor(timeUntilExpiry / 1000 / 60), 'minutes');
        
        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('🔄 [AuthContext] Token expiring soon, refreshing...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('❌ [AuthContext] Refresh error:', refreshError);
            // If refresh fails, sign out
            await signOut();
            return;
          }
          
          if (refreshData.session) {
            console.log('✅ [AuthContext] Token refreshed successfully');
            session.access_token = refreshData.session.access_token;
          }
        }
        
        try {
          console.log('🌐 [AuthContext] Calling /me endpoint');
          const userData = await apiRequest('/me', {
            token: session.access_token,
          });
          
          console.log('✅ [AuthContext] User data received:', userData.user);
          
          // Only update if data actually changed (prevents unnecessary re-renders)
          setUser(prev => {
            const newUser = userData.user;
            if (!prev || prev.id !== newUser.id || prev.email !== newUser.email || prev.role !== newUser.role) {
              return newUser;
            }
            return prev;
          });
          
          setToken(prev => {
            if (prev !== session.access_token) {
              return session.access_token;
            }
            return prev;
          });
        } catch (apiError: any) {
          console.error('❌ [AuthContext] Error from /me endpoint:', apiError);
          
          // If 401, token is invalid - sign out
          if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized') || apiError.message?.includes('Invalid JWT')) {
            console.log('🚪 [AuthContext] Invalid token, signing out...');
            await signOut();
            return;
          }
          
          // For other errors, keep the session but don't set user
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('ℹ️ [AuthContext] No active session');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Outer catch error:', error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
      console.log('✅ [AuthContext] refreshUser completed');
    }
  }, []);

  useEffect(() => {
    console.log('🚀 [AuthContext] Initializing...');
    refreshUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [AuthContext] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshUser();
      } else if (event === 'USER_UPDATED') {
        await refreshUser();
      }
    });

    // Auto-refresh user every 5 minutes to keep data fresh
    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ [AuthContext] Auto-refresh triggered (5min interval)');
      refreshUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log('🛑 [AuthContext] Cleaning up...');
      subscription.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AuthContext] Sign in attempt for:', email);
    
    try {
      // إنشاء بصمة الجهاز أولاً
      console.log('🔍 [AuthContext] Generating device fingerprint...');
      const deviceData = await generateDeviceFingerprint();
      setDeviceInfo(deviceData);

      // التحقق من الجهاز المشبوه
      const suspiciousCheck = detectSuspiciousDevice(deviceData);
      if (suspiciousCheck.isSuspicious) {
        console.warn('⚠️ [AuthContext] Suspicious device detected:', suspiciousCheck.reasons);
        toast.warning('تم اكتشاف جهاز مشبوه / Suspicious device detected', {
          description: 'يرجى التواصل مع الدعم الفني / Please contact technical support'
        });
      }

      console.log('✅ [AuthContext] Device fingerprint generated:', {
        fingerprint: deviceData.fingerprint,
        summary: getDeviceSummary(deviceData),
        isSuspicious: suspiciousCheck.isSuspicious
      });

      // محاولة تسجيل الدخول في Supabase Auth
      console.log('🔑 [AuthContext] Attempting Supabase auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ [AuthContext] Supabase auth error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.session) {
        throw new Error('No session created');
      }

      console.log('✅ [AuthContext] Supabase auth successful');

      // التحقق من الجلسة في الخادم (Session Management)
      console.log('🔒 [AuthContext] Registering device session...');
      try {
        const sessionResponse = await apiRequest('/session/register', {
          method: 'POST',
          token: authData.session.access_token,
          body: {
            device_fingerprint: deviceData.fingerprint,
            device_info: {
              platform: deviceData.platform,
              userAgent: deviceData.userAgent,
              vendor: deviceData.vendor,
              summary: getDeviceSummary(deviceData)
            },
            ip_address: deviceData.ip,
            location: deviceData.location
          }
        });

        console.log('✅ [AuthContext] Device session registered:', sessionResponse);
      } catch (sessionError: any) {
        console.error('❌ [AuthContext] Session registration error:', sessionError);
        
        // إذا كان هناك جلسة نشطة أخرى، نمنع تسجيل الدخول
        if (sessionError.session_conflict) {
          await supabase.auth.signOut();
          throw new Error('يوجد جلسة نشطة على جهاز آخر. يرجى تسجيل الخروج من الجهاز الآخر أولاً.\n\nAnother active session detected. Please logout from the other device first.');
        }
        
        // في حالة حدوث خطأ آخر، نستمر في تسجيل الدخول
        console.warn('⚠️ [AuthContext] Session registration failed but continuing login');
      }

      // حفظ البصمة في LocalStorage
      saveFingerprintToStorage(deviceData);

      // تحديث بيانات المستخدم
      console.log('📥 [AuthContext] Fetching user data...');
      await refreshUser();
      
      console.log('✅ [AuthContext] Sign in successful');
      toast.success('تم تسجيل الدخول بنجاح / Login successful');
    } catch (error: any) {
      console.error('❌ [AuthContext] Sign in error:', error);
      toast.error('فشل تسجيل الدخول / Login failed', {
        description: error.message
      });
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole, 
    universityId: string
  ) => {
    console.log('📝 [AuthContext] Sign up attempt:', { email, role, universityId });
    
    try {
      // إنشاء بصمة الجهاز
      console.log('🔍 [AuthContext] Generating device fingerprint for signup...');
      const deviceData = await generateDeviceFingerprint();
      setDeviceInfo(deviceData);

      // التحقق من صحة البيانات
      if (!email.endsWith('@kku.edu.sa')) {
        throw new Error('يجب استخدام البريد الجامعي @kku.edu.sa\nMust use university email @kku.edu.sa');
      }

      // التحقق من الاسم الكامل (يجب أن يحتوي على اسمين على الأقل)
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        throw new Error('يرجى إدخال الاسم الكامل (الاسم الأول والعائلة على الأقل)\nPlease enter full name (first and last name at least)');
      }

      if (fullName.trim().length < 3) {
        throw new Error('الاسم يجب أن يكون 3 أحرف على الأقل\nName must be at least 3 characters');
      }

      // التحقق من الرقم الجامعي للطلاب
      if (role === 'student') {
        if (!universityId || universityId.trim().length === 0) {
          throw new Error('الرقم الجامعي مطلوب للطلاب\nUniversity ID is required for students');
        }

        const universityIdRegex = /^44\d{7}$/;
        if (!universityIdRegex.test(universityId)) {
          throw new Error('الرقم الجامعي يجب أن يكون 9 أرقام ويبدأ بـ 44 (مثال: 441234567)\nUniversity ID must be 9 digits starting with 44 (e.g., 441234567)');
        }
      }

      // استدعاء API endpoint للتسجيل
      console.log('🌐 [AuthContext] Calling /signup endpoint...');
      await apiRequest('/signup', {
        method: 'POST',
        body: {
          email,
          password,
          full_name: fullName,
          role,
          university_id: role === 'student' ? universityId : null,
          device_fingerprint: deviceData.fingerprint,
          device_info: {
            platform: deviceData.platform,
            userAgent: deviceData.userAgent,
            vendor: deviceData.vendor,
            summary: getDeviceSummary(deviceData)
          }
        }
      });

      console.log('✅ [AuthContext] Sign up successful');
      toast.success('تم إنشاء الحساب بنجاح / Account created successfully', {
        description: 'يمكنك الآن تسجيل الدخول / You can now sign in'
      });

      // تسجيل الدخول تلقائياً بعد التسجيل
      await signIn(email, password);
    } catch (error: any) {
      console.error('❌ [AuthContext] Sign up error:', error);
      toast.error('فشل إنشاء الحساب / Sign up failed', {
        description: error.message
      });
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 [AuthContext] Sign out initiated');
    
    try {
      // مسح الجلسة من الخادم
      if (token) {
        console.log('🔒 [AuthContext] Clearing device session...');
        try {
          await apiRequest('/session/logout', {
            method: 'POST',
            token: token
          });
          console.log('✅ [AuthContext] Device session cleared');
        } catch (error) {
          console.warn('⚠️ [AuthContext] Failed to clear device session:', error);
        }
      }

      // تسجيل الخروج من Supabase
      console.log('🔑 [AuthContext] Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [AuthContext] Supabase sign out error:', error);
        throw error;
      }

      // مسح البيانات المحلية
      setUser(null);
      setToken(null);
      setDeviceInfo(null);
      clearFingerprintFromStorage();
      
      console.log('✅ [AuthContext] Sign out successful');
      toast.success('تم تسجيل الخروج بنجاح / Signed out successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Sign out error:', error);
      // حتى في حالة الخطأ، نقوم بمسح البيانات المحلية
      setUser(null);
      setToken(null);
      setDeviceInfo(null);
      clearFingerprintFromStorage();
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      deviceInfo,
    }),
    [user, token, loading, deviceInfo, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
