/**
 * MySQL-backed client — mirrors the mock Supabase fluent API via REST calls to server/index.mjs
 */

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cravix_mysql_session');
    if (!raw) return null;
    return JSON.parse(raw).access_token ?? null;
  } catch {
    return null;
  }
}

function setSession(session: any) {
  if (typeof window === 'undefined') return;
  if (session) localStorage.setItem('cravix_mysql_session', JSON.stringify(session));
  else localStorage.removeItem('cravix_mysql_session');
}

function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cravix_mysql_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res.json();
}

class RemoteFilterBuilder {
  private table: string;
  private chain: any[];

  constructor(table: string, chain: any[]) {
    this.table = table;
    this.chain = chain;
  }

  eq(column: string, value: any) {
    this.chain.push({ op: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.chain.push({ op: 'neq', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.chain.push({ op: 'in', column, values });
    return this;
  }

  order(column: string, option?: { ascending?: boolean }) {
    this.chain.push({ op: 'order', column, ascending: option?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.chain.push({ op: 'limit', count });
    return this;
  }

  select(_columns?: string) {
    return this;
  }

  async maybeSingle() {
    this.chain.push({ op: 'maybeSingle' });
    return apiFetch('/api/db/query', {
      method: 'POST',
      body: JSON.stringify({ table: this.table, chain: this.chain }),
    });
  }

  async single() {
    this.chain.push({ op: 'single' });
    return apiFetch('/api/db/query', {
      method: 'POST',
      body: JSON.stringify({ table: this.table, chain: this.chain }),
    });
  }

  then(onfulfilled?: (value: any) => any) {
    return apiFetch('/api/db/query', {
      method: 'POST',
      body: JSON.stringify({ table: this.table, chain: this.chain }),
    }).then(onfulfilled);
  }
}

class RemoteInsertBuilder {
  private table: string;
  private payload: any;
  private wantSingle = false;

  constructor(table: string, payload: any) {
    this.table = table;
    this.payload = payload;
  }

  select(_columns?: string) {
    return this;
  }

  async single() {
    this.wantSingle = true;
    return this.execute();
  }

  private async execute() {
    const result = await apiFetch('/api/db/insert', {
      method: 'POST',
      body: JSON.stringify({ table: this.table, payload: this.payload, chain: this.wantSingle ? ['single'] : [] }),
    });
    if (this.wantSingle && result.data && Array.isArray(result.data)) {
      return { data: result.data[0], error: result.error };
    }
    return result;
  }

  then(onfulfilled?: (value: any) => any) {
    return this.execute().then(onfulfilled);
  }
}

class RemoteUpdateBuilder {
  private table: string;
  private payload: any;
  private filters: { column: string; value: any }[] = [];

  constructor(table: string, payload: any) {
    this.table = table;
    this.payload = payload;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  then(onfulfilled?: (value: any) => any) {
    return apiFetch('/api/db/update', {
      method: 'POST',
      body: JSON.stringify({ table: this.table, payload: this.payload, filters: this.filters }),
    }).then(onfulfilled);
  }
}

class RemoteDeleteBuilder {
  private table: string;
  private filters: { column: string; value: any }[] = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  then(onfulfilled?: (value: any) => any) {
    return apiFetch('/api/db/delete', {
      method: 'POST',
      body: JSON.stringify({ table: this.table, filters: this.filters }),
    }).then(onfulfilled);
  }
}

class RemoteQueryBuilder {
  constructor(private tableName: string) {}

  select(columns: string = '*', options?: { count?: 'exact' }) {
    const chain = [{ op: 'select', columns, options: options ?? {} }];
    return new RemoteFilterBuilder(this.tableName, chain);
  }

  insert(payload: any) {
    return new RemoteInsertBuilder(this.tableName, payload);
  }

  update(payload: any) {
    return new RemoteUpdateBuilder(this.tableName, payload);
  }

  delete() {
    return new RemoteDeleteBuilder(this.tableName);
  }
}

const mysqlAuth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.session) {
      setSession(result.data.session);
      authListeners.forEach((cb) => cb('SIGNED_IN', result.data.session));
    }
    return result;
  },

  async signUp({ email, password, options }: any) {
    const result = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, options }),
    });
    if (result.data?.session) {
      setSession(result.data.session);
      authListeners.forEach((cb) => cb('SIGNED_IN', result.data.session));
    }
    return result;
  },

  async getSession() {
    const session = getSession();
    return { data: { session }, error: null };
  },

  async getUser() {
    const session = getSession();
    return { data: { user: session?.user ?? null }, error: null };
  },

  async signOut() {
    setSession(null);
    authListeners.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.add(callback);
    const session = getSession();
    setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners.delete(callback);
          },
        },
      },
    };
  },

  async updateUser(attributes: { password?: string }) {
    if (attributes?.password) {
      return apiFetch('/api/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ password: attributes.password }),
      });
    }
    const session = getSession();
    return { data: { user: session?.user ?? null }, error: null };
  },
};

const mockChannel = {
  on() { return mockChannel; },
  subscribe() { return mockChannel; },
};

export const mysqlClient = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'auth') return mysqlAuth;
    if (prop === 'from') return (table: string) => new RemoteQueryBuilder(table);
    if (prop === 'channel') return () => mockChannel;
    if (prop === 'removeChannel') return () => undefined;
    return undefined;
  },
});
