import { projectId, publicAnonKey } from './supabase/info';

// Edge Function is deployed as 'server'
// Routes inside are prefixed with /make-server-90ad488b
// Correct URL format: https://PROJECT_ID.supabase.co/functions/v1/server/make-server-90ad488b/route
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
    // Ensure endpoint starts with /make-server-90ad488b
    const formattedEndpoint = endpoint.startsWith('/make-server-90ad488b') 
      ? endpoint 
      : `/make-server-90ad488b${endpoint}`;
    
    // Log the full URL for debugging
    const url = `${BASE_URL}${formattedEndpoint}`;
    console.log(`🌐 [API] ${method} ${url}`);
    
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      // Handle 404 - Edge Function not deployed (silent)
      if (response.status === 404) {
        console.log('ℹ️ [API] Edge Function not deployed - using fallback');
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
      
      // Try to parse JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        console.log('ℹ️ [API] Non-JSON response - Edge Function not deployed');
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
      
      if (!response.ok) {
        console.error(`❌ [API] ${response.status} Error:`, data.error || data);
        throw new Error(data.error || 'API request failed');
      }
      
      console.log(`✅ [API] ${method} ${url} - Success`);
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle all network errors as "Edge Function not deployed"
      if (fetchError.name === 'AbortError') {
        console.log('ℹ️ [API] Request timeout - using fallback');
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
      
      // Handle "Failed to fetch" - network error
      if (fetchError.message.includes('Failed to fetch') || 
          fetchError.message.includes('fetch failed') ||
          fetchError.message.includes('NetworkError')) {
        console.log('ℹ️ [API] Network error - Edge Function not deployed (normal)');
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
      
      console.error('❌ [API] Fetch error:', fetchError.message);
      throw fetchError;
    }
  } catch (err: any) {
    // Handle Edge Function not deployed error (silent)
    if (err.message === 'EDGE_FUNCTION_NOT_DEPLOYED') {
      throw err;
    }
    
    throw err;
  }
}