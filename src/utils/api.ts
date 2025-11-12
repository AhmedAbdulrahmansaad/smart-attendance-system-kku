import { projectId, publicAnonKey } from './supabase/info';

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
      console.log(`📦 Response data:`, data);

      if (!response.ok) {
        // Don't log 401 errors for /me endpoint (expected when not logged in)
        if (!(response.status === 401 && endpoint === '/me')) {
          console.error(`❌ API error for ${endpoint}:`, data);
        }
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - الخادم لا يستجيب');
      }
      throw fetchError;
    }
  } catch (err: any) {
    console.error(`❌ Fetch error for ${endpoint}:`, err);
    console.error(`❌ Error name:`, err.name);
    console.error(`❌ Error message:`, err.message);
    throw err;
  }
}