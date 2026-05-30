import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { MockQueryBuilder, getProfiles, saveProfiles, initMockDb } from './mock-db';
import { mysqlClient } from '@/integrations/mysql/client';

const useMysql = import.meta.env.VITE_USE_MYSQL === 'true';

// Initialize mock DB only when not using MySQL
if (typeof window !== 'undefined' && !useMysql) {
  initMockDb();
}

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Listeners for auth state changes
const authChangeListeners = new Set<(event: string, session: any) => void>();

function getMockSession() {
  if (typeof window === 'undefined') return null;
  const sessionStr = localStorage.getItem("cravix_mock_session");
  return sessionStr ? JSON.parse(sessionStr) : null;
}

function setMockSession(session: any) {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem("cravix_mock_session", JSON.stringify(session));
    authChangeListeners.forEach(cb => cb("SIGNED_IN", session));
  } else {
    localStorage.removeItem("cravix_mock_session");
    authChangeListeners.forEach(cb => cb("SIGNED_OUT", null));
  }
}

// Mock auth object implementation
const mockAuth = {
  async signInWithPassword({ email, password }: any) {
    const profiles = getProfiles();
    const userProfile = profiles.find(p => p.email === email);
    
    // Check demo accounts explicitly
    if (email === "admin@gmail.com" && password === "admin123") {
      const adminProfile = profiles.find(p => p.email === "admin@gmail.com") || profiles[0];
      const session = {
        access_token: "mock-admin-token",
        user: { id: adminProfile.id, email: adminProfile.email, user_metadata: { username: adminProfile.username } }
      };
      setMockSession(session);
      return { data: { user: session.user, session }, error: null };
    }
    
    if (email === "john@gmail.com" && password === "password123") {
      const johnProfile = profiles.find(p => p.email === "john@gmail.com") || profiles[1];
      if (johnProfile?.is_blocked) {
        return { data: { user: null, session: null }, error: { message: "Your account has been blocked by an administrator." } };
      }
      const session = {
        access_token: "mock-customer-token",
        user: { id: johnProfile.id, email: johnProfile.email, user_metadata: { username: johnProfile.username } }
      };
      setMockSession(session);
      return { data: { user: session.user, session }, error: null };
    }

    // Generic mock login if the user already exists in profiles
    if (userProfile) {
      if (userProfile.is_blocked) {
        return { data: { user: null, session: null }, error: { message: "Your account has been blocked by an administrator." } };
      }
      if (password === "password123" || password === "admin123") {
        const session = {
          access_token: `mock-token-${userProfile.id}`,
          user: { id: userProfile.id, email: userProfile.email, user_metadata: { username: userProfile.username } }
        };
        setMockSession(session);
        return { data: { user: session.user, session }, error: null };
      }
    }

    return { data: { user: null, session: null }, error: { message: "Invalid login credentials for Demo Mode. Use admin@gmail.com / admin123 or john@gmail.com / password123." } };
  },

  async signUp({ email, password, options }: any) {
    const profiles = getProfiles();
    if (profiles.some(p => p.email === email)) {
      return { data: { user: null, session: null }, error: { message: "User already exists" } };
    }
    const username = options?.data?.username || email.split("@")[0];
    const newProfile = {
      id: `mock-uid-${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      avatar_url: options?.data?.avatar_url || null,
      wallet_balance: 350.00,
      is_admin: false,
      role: "customer" as const,
      is_blocked: false,
      created_at: new Date().toISOString()
    };
    saveProfiles([...profiles, newProfile]);

    const session = {
      access_token: `mock-token-${newProfile.id}`,
      user: { id: newProfile.id, email: newProfile.email, user_metadata: { username: newProfile.username } }
    };
    setMockSession(session);
    return { data: { user: session.user, session }, error: null };
  },

  async getSession() {
    const session = getMockSession();
    return { data: { session }, error: null };
  },

  async getUser() {
    const session = getMockSession();
    return { data: { user: session?.user ?? null }, error: null };
  },

  async signOut() {
    setMockSession(null);
    return { error: null };
  },

  onAuthStateChange(callback: any) {
    authChangeListeners.add(callback);
    // Trigger immediately with current state
    const session = getMockSession();
    setTimeout(() => callback(session ? "SIGNED_IN" : "SIGNED_OUT", session), 0);
    return {
      data: {
        subscription: {
          unsubscribe() {
            authChangeListeners.delete(callback);
          }
        }
      }
    };
  },

  async updateUser(attributes: any) {
    const session = getMockSession();
    if (!session) return { data: null, error: { message: "No active session" } };
    
    // Mock updating password / details
    return { data: { user: session.user }, error: null };
  }
};

const mockChannel = {
  on(_event: string, _config: unknown, _callback?: unknown) {
    return mockChannel;
  },
  subscribe() {
    return mockChannel;
  },
};

// Export the supabase client — MySQL (local), mock (offline dev), or Supabase cloud (production)
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (useMysql) {
      return Reflect.get(mysqlClient, prop);
    }
    if (import.meta.env.DEV) {
      if (prop === "auth") {
        return mockAuth;
      }
      if (prop === "from") {
        return (table: string) => new MockQueryBuilder(table);
      }
      if (prop === "channel") {
        return () => mockChannel;
      }
      if (prop === "removeChannel") {
        return () => undefined;
      }
    }
    // Fallback to real Supabase in production
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
