import { projectId, publicAnonKey } from './supabase/info';

// Edge Function is deployed as 'server' on Supabase
// All routes must be prefixed with /make-server-90ad488b
// Correct URL format: https://PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/<route>
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-90ad488b`;

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
    // Silent mode - don't log unless needed for debugging
    
    const url = `${BASE_URL}${endpoint}`;

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
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
      
      // Try to parse JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('EDGE_FUNCTION_NOT_DEPLOYED');
      }
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