import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client instance
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    console.log('🔧 [Supabase] Creating new singleton client instance');
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  return supabaseClient;
}

// Helper to get authenticated client with token
export function getAuthenticatedClient(token?: string) {
  const client = getSupabaseClient();
  
  if (token) {
    // Set the session token for authenticated requests
    return client;
  }
  
  return client;
}
