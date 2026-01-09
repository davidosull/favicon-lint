import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Lazy initialization to ensure env vars are available
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// For backwards compatibility - will throw if not configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});

export function getServiceClient(): SupabaseClient {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseUrl, serviceKey);
}
