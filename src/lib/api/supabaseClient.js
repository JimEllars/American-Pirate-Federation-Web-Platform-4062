import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl && rawSupabaseUrl !== 'https://your-project-id.supabase.co' && !rawSupabaseUrl.includes('mock.supabase.co') &&
  rawSupabaseAnonKey && rawSupabaseAnonKey !== 'your-anon-key'
);

const supabaseUrl = isSupabaseConfigured ? rawSupabaseUrl : 'https://mock.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawSupabaseAnonKey : 'fallback_anon_key';

if (!isSupabaseConfigured) {
  console.warn("[ APF_ENV_ALERT: Supabase variables missing or mock. Using local fallback client. ]");
}

// Create a deterministic mock client if not configured to prevent network errors
const createMockQuery = (defaultData = []) => {
  const query = {
    data: defaultData,
    error: null,
    then: (resolve) => Promise.resolve({ data: defaultData, error: null }).then(resolve),
    catch: (reject) => Promise.resolve({ data: defaultData, error: null }).catch(reject),
    select: () => query,
    insert: async () => ({ data: null, error: null }),
    update: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    order: () => query,
    limit: () => query,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
  };
  return query;
};

const createMockClient = () => {
    return {
        auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithOAuth: async () => ({ data: null, error: new Error("Mock Client") }),
            signOut: async () => ({ error: null })
        },
        from: (table) => ({
            insert: () => createMockQuery(),
            select: () => createMockQuery(),
            update: () => createMockQuery(),
            delete: () => createMockQuery()
        }),
        functions: {
            invoke: async () => ({ data: null, error: null })
        }
    };
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  : createMockClient();
