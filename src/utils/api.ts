import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

export async function apiRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string | null;
  } = {}
) {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    console.log(`🌐 API Request: ${method} ${endpoint}`);
    console.log(`🔑 Using token:`, token ? 'User token' : 'Anon key');
    
    const url = `${BASE_URL}${endpoint}`;
    console.log(`📍 Full URL:`, url);

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      console.log(`📥 Response status:`, response.status, response.statusText);
      
      const data = await response.json();
      
      if (!response.ok) {
        // Only log errors that are unexpected
        // Don't log 401 for /me endpoint (expected when not logged in)
        // Don't log 401 when using anon key (expected when not authenticated)
        const shouldLog = !(
          response.status === 401 && (
            endpoint === '/me' || 
            !token || 
            token === publicAnonKey
          )
        );
        
        if (shouldLog) {
          console.error(`❌ API error for ${endpoint}:`, data);
        } else {
          console.log(`ℹ️ Authentication required for ${endpoint} (expected)`);
        }
        
        throw new Error(data.error || 'API request failed');
      }
      
      console.log(`✅ Success for ${endpoint}`);
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - الخادم لا يستجيب');
      }
      throw fetchError;
    }
  } catch (err: any) {
    // Only log unexpected errors
    const isAuthError = err.message?.includes('Unauthorized') || err.message?.includes('401');
    const isExpectedAuthError = isAuthError && (!token || token === publicAnonKey);
    
    if (!isExpectedAuthError) {
      console.error(`❌ Fetch error for ${endpoint}:`, err.message);
    }
    
    throw err;
  }
}