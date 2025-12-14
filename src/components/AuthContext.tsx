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

  // Refresh user data
  const refreshUser = async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('🔄 [AuthContext] Refresh already in progress, skipping...');
      return;
    }

    isRefreshingRef.current = true;

    try {
      console.log('🔄 [AuthContext] Refreshing user data...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [AuthContext] Session error:', sessionError);
        setUser(null);
        setToken(null);
        setLoading(false);
        isRefreshingRef.current = false;
        return;
      }

      if (!session) {
        console.log('ℹ️ [AuthContext] No active session');
        setUser(null);
        setToken(null);
        setLoading(false);
        isRefreshingRef.current = false;
        return;
      }

      const authUser = session;
      console.log('✅ [AuthContext] Active session found for user:', authUser.user.id);

      // Read directly from Supabase (skip Edge Function for now)
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ [AuthContext] Profile error:', profileError);
          
          // Check if table doesn't exist
          if (profileError.code === '42P01') {
            console.error('🔥 [AuthContext] TABLE DOES NOT EXIST!');
            toast.error('خطأ في قاعدة البيانات / Database Error', {
              description: 'الجداول غير موجودة! يرجى تشغيل السكريبت SQL\nTables not found! Please run SQL script',
              duration: 10000
            });
          } else if (profileError.code === '42P17') {
            console.error('🔥 [AuthContext] INFINITE RECURSION IN RLS POLICY!');
            toast.error('خطأ في السياسات الأمنية / RLS Policy Error', {
              description: 'يرجى تشغيل سكريبت إصلاح RLS\nPlease run RLS fix script',
              duration: 10000
            });
          } else if (profileError.code === 'PGRST116') {
            // No profile found - try to create from metadata
            console.warn('⚠️ [AuthContext] Profile not found for user:', authUser.user.id);
            
            const userMetadata = authUser.user.user_metadata;
            if (userMetadata && userMetadata.full_name && userMetadata.role) {
              console.log('🔄 [AuthContext] Creating profile from metadata...');
              
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: authUser.user.id,
                  email: authUser.user.email || '',
                  full_name: userMetadata.full_name,
                  role: userMetadata.role,
                  university_id: userMetadata.university_id || null
                })
                .select()
                .single();
              
              if (insertError) {
                console.error('❌ [AuthContext] Failed to create profile:', insertError);
                toast.error('فشل إنشاء الملف الشخصي / Failed to create profile', {
                  description: insertError.message
                });
                setUser(null);
                setToken(null);
                setLoading(false);
                isRefreshingRef.current = false;
                return;
              }
              
              console.log('✅ [AuthContext] Profile created from metadata:', newProfile);
              setUser(newProfile);
              setToken(authUser.access_token);
              setLoading(false);
              isRefreshingRef.current = false;
              return;
            }
            
            toast.error('الملف الشخصي غير موجود / Profile not found', {
              description: 'يرجى التواصل مع المسؤول / Please contact admin'
            });
          }
          
          setUser(null);
          setToken(null);
          setLoading(false);
          isRefreshingRef.current = false;
          return;
        }
        
        if (!profile) {
          console.error('❌ [AuthContext] Profile not found in database');
          toast.error('الملف الشخصي غير موجود / Profile not found', {
            description: 'يرجى إنشاء حساب جديد / Please sign up again'
          });
          setUser(null);
          setToken(null);
          setLoading(false);
          isRefreshingRef.current = false;
          return;
        }
        
        console.log('✅ [AuthContext] Profile loaded from Supabase:', profile);
        setUser(profile);
        setToken(authUser.access_token);
        setLoading(false);
        isRefreshingRef.current = false;
        
      } catch (dbError: any) {
        console.error('❌ [AuthContext] Database error:', dbError);
        toast.error('خطأ في قاعدة البيانات / Database error', {
          description: dbError.message
        });
        setUser(null);
        setToken(null);
        setLoading(false);
        isRefreshingRef.current = false;
      }
    } catch (error: any) {
      console.error('❌ [AuthContext] Refresh user error:', error);
      setUser(null);
      setToken(null);
      setLoading(false);
      isRefreshingRef.current = false;
    }
  };

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

      // Skip session registration (Edge Function not needed)
      console.log('✅ [AuthContext] Skipping session registration (working without Edge Function)');
      
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

      // Use Edge Function /signup endpoint
      console.log('🌐 [AuthContext] Calling /signup endpoint...');
      
      const response = await apiRequest('/signup', {
        method: 'POST',
        body: {
          email,
          password,
          full_name: fullName,
          role,
          university_id: role === 'student' ? universityId : null
        }
      });
      
      console.log('✅ [AuthContext] Sign up successful via Edge Function:', response);
      
      // تسجيل الدخول تلقائياً
      toast.success('تم إنشاء الحساب بنجاح! / Account created successfully!', {
        description: 'جاري تسجيل الدخول... / Logging in...'
      });
      
      // Auto sign in
      await signIn(email, password);
      
    } catch (error: any) {
      console.error('❌ [AuthContext] Sign up error:', error);
      
      // Handle specific error messages
      let errorMessage = error.message || 'فشل إنشاء الحساب\nSign up failed';
      
      // Check for common errors
      if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.message?.includes('duplicate key')) {
        errorMessage = 'هذا البريد مسجل مسبقاً. الرجاء استخدام تسجيل الدخول.\nEmail already registered. Please use Sign In.';
        
        toast.error('البريد مسجل مسبقاً / Email already registered', {
          description: errorMessage,
          duration: 5000
        });
        
        throw new Error(errorMessage);
      }
      
      if (error.message?.includes('University ID already registered')) {
        errorMessage = 'هذا الرقم الجامعي مسجل مسبقاً\nUniversity ID already registered';
      }
      
      toast.error('فشل إنشاء الحساب / Sign up failed', {
        description: errorMessage,
        duration: 5000
      });
      
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    console.log('🚪 [AuthContext] Sign out initiated');
    
    try {
      // Skip session clearing (Edge Function not needed)
      console.log('✅ [AuthContext] Skipping session clearing (working without Edge Function)');

      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Only attempt signOut if session exists
        console.log('🔑 [AuthContext] Signing out from Supabase...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          // Ignore "Auth session missing" errors during signout
          if (error.message.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
            console.warn('⚠️ [AuthContext] Session already cleared, continuing logout...');
          } else {
            console.error('❌ [AuthContext] Supabase sign out error:', error);
            throw error;
          }
        } else {
          console.log('✅ [AuthContext] Supabase sign out successful');
        }
      } else {
        console.log('ℹ️ [AuthContext] No active session to sign out from');
      }

      // Always clear local data regardless of session state
      setUser(null);
      setToken(null);
      setDeviceInfo(null);
      clearFingerprintFromStorage();
      
      console.log('✅ [AuthContext] Sign out successful - local data cleared');
      toast.success('تم تسجيل الخروج بنجاح / Signed out successfully');
    } catch (error: any) {
      console.error('❌ [AuthContext] Sign out error:', error);
      
      // Always clear local data even if signOut fails
      setUser(null);
      setToken(null);
      setDeviceInfo(null);
      clearFingerprintFromStorage();
      
      // Show success message anyway since local data is cleared
      toast.success('تم تسجيل الخروج بنجاح / Signed out successfully');
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