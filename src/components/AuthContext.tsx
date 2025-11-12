import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const refreshUser = async () => {
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
          setUser(userData.user);
          setToken(session.access_token);
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
      console.log('✅ [AuthContext] refreshUser completed');
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

    setRefreshInterval(interval);

    return () => {
      subscription.unsubscribe();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
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
  };

  const signUp = async (
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
  };

  const signOut = async () => {
    console.log('🚪 [AuthContext] Signing out...');
    
    // Clear interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    
    console.log('✅ [AuthContext] Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, refreshUser }}>
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