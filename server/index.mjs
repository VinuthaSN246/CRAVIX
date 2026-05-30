import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { query, queryOne } from './db.mjs';
import {
  executeQueryPlan,
  executeInsert,
  executeUpdate,
  executeDelete,
} from './mysql-engine.mjs';

const app = express();
const PORT = Number(process.env.MYSQL_API_PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE email = :email', { email });
    if (!user) return res.json({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.json({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });

    const profile = await queryOne('SELECT * FROM profiles WHERE id = :id', { id: user.id });
    if (profile?.is_blocked) {
      return res.json({ data: { user: null, session: null }, error: { message: 'Your account has been blocked by an administrator.' } });
    }

    const session = {
      access_token: `mysql-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { username: profile?.username ?? email.split('@')[0] },
      },
    };
    res.json({ data: { user: session.user, session }, error: null });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, options } = req.body;
    const existing = await queryOne('SELECT id FROM users WHERE email = :email', { email });
    if (existing) return res.json({ data: { user: null, session: null }, error: { message: 'User already exists' } });

    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    const username = options?.data?.username || email.split('@')[0];

    await query('INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :hash)', {
      id,
      email,
      hash,
    });
    await query(
      `INSERT INTO profiles (id, username, email, avatar_url, wallet_balance, is_admin, role, is_blocked)
       VALUES (:id, :username, :email, :avatar_url, 350.00, 0, 'customer', 0)`,
      { id, username, email, avatar_url: options?.data?.avatar_url ?? null },
    );

    const session = {
      access_token: `mysql-${id}`,
      user: { id, email, user_metadata: { username } },
    };
    res.json({ data: { user: session.user, session }, error: null });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.get('/api/auth/session', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token?.startsWith('mysql-')) return res.json({ data: { session: null }, error: null });
  const userId = token.replace('mysql-', '');
  const user = await queryOne('SELECT id, email FROM users WHERE id = :id', { id: userId });
  if (!user) return res.json({ data: { session: null }, error: null });
  const profile = await queryOne('SELECT username FROM profiles WHERE id = :id', { id: userId });
  res.json({
    data: {
      session: {
        access_token: token,
        user: { id: user.id, email: user.email, user_metadata: { username: profile?.username } },
      },
    },
    error: null,
  });
});

app.post('/api/auth/update-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token?.startsWith('mysql-')) {
      return res.json({ data: null, error: { message: 'Not authenticated' } });
    }
    const userId = token.replace('mysql-', '');
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.json({ data: null, error: { message: 'Password must be at least 6 characters' } });
    }
    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = :hash WHERE id = :id', { hash, id: userId });
    console.log('[MySQL] UPDATE users — password changed for', userId);
    const user = await queryOne('SELECT id, email FROM users WHERE id = :id', { id: userId });
    const profile = await queryOne('SELECT username FROM profiles WHERE id = :id', { id: userId });
    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { username: profile?.username },
        },
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ─── Database queries (Supabase-compatible chain) ───────────────────────────

app.post('/api/db/query', async (req, res) => {
  const result = await executeQueryPlan(req.body);
  res.json(result);
});

app.post('/api/db/insert', async (req, res) => {
  const { table, payload, chain } = req.body;
  const result = await executeInsert(table, payload);
  if (chain?.includes('single') && result.data?.length) {
    return res.json({ data: result.data[0], error: result.error });
  }
  res.json(result);
});

app.post('/api/db/update', async (req, res) => {
  const { table, payload, filters } = req.body;
  const result = await executeUpdate(table, payload, filters);
  res.json(result);
});

app.post('/api/db/delete', async (req, res) => {
  const { table, filters } = req.body;
  const result = await executeDelete(table, filters);
  res.json(result);
});

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ ok: true, database: 'cravix' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CRAVIX MySQL API running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.MYSQL_DATABASE || 'cravix'}`);
});
