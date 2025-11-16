import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { apiRequest } from '../utils/api';

export type UserRole = 'admin' | 'instructor' | 'student' | 'supervisor';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  university_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, universityId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

    // Set up auto-refresh every 4 minutes
    const interval = setInterval(async () => {
      console.log('⏰ [AuthContext] Auto-refresh triggered');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session) {
          console.log('✅ [AuthContext] Auto-refresh successful');
          await refreshUser();
        } else if (error) {
          console.error('❌ [AuthContext] Auto-refresh failed:', error);
        }
      }
    }, 4 * 60 * 1000); // Every 4 minutes

    refreshIntervalRef.current = interval;

    return () => {
      subscription.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Validate email ends with @kku.edu.sa
    if (!email.endsWith('@kku.edu.sa')) {
      throw new Error('Email must end with @kku.edu.sa');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.session?.access_token) {
      await refreshUser();
    }
  }, [refreshUser]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    universityId: string
  ) => {
    // Validate email ends with @kku.edu.sa
    if (!email.endsWith('@kku.edu.sa')) {
      throw new Error('Email must end with @kku.edu.sa');
    }

    // Validate university ID for students
    if (role === 'student' && !universityId.trim()) {
      throw new Error('University ID is required for students');
    }

    console.log('📝 [AuthContext] Signing up user via /signup endpoint');
    
    // Use /signup endpoint which has Service Role Key access
    await apiRequest('/signup', {
      method: 'POST',
      body: {
        email,
        password,
        full_name: fullName,
        role,
        university_id: universityId || null,
      },
    });

    console.log('✅ [AuthContext] User created, now signing in...');
    
    // Sign in after signup
    await signIn(email, password);
  }, [signIn]);

  const signOut = useCallback(async () => {
    console.log('🚪 [AuthContext] Signing out...');
    
    // Clear interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Clear state immediately
    setUser(null);
    setToken(null);
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut();
      console.log('✅ [AuthContext] Signed out from Supabase');
    } catch (error) {
      console.error('❌ [AuthContext] Error signing out:', error);
    }
    
    // Force reload to clear any cached state
    window.location.reload();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }), [user, token, loading, signIn, signUp, signOut, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}