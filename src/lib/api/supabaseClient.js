import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl && rawSupabaseUrl !== 'https://your-project-id.supabase.co' &&
  rawSupabaseAnonKey && rawSupabaseAnonKey !== 'your-anon-key'
);

const supabaseUrl = isSupabaseConfigured ? rawSupabaseUrl : 'https://fallback.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawSupabaseAnonKey : 'fallback_anon_key';

if (!isSupabaseConfigured) {
  console.warn("[ APF_ENV_ALERT: Supabase variables missing. Using fallback strings. ]");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
