import { randomUUID } from 'crypto';
import { query, queryOne } from './db.mjs';

const TABLE_COLUMNS = {
  profiles: 'id, username, email, avatar_url, wallet_balance, is_admin, role, is_blocked, created_at',
  dishes: 'id, name, description, price, image_url, rating, category, is_available, ingredients, nutrition, created_at',
  cart_items: 'id, user_id, dish_id, quantity, created_at',
  orders: 'id, user_id, total, status, address, payment_method, created_at',
  order_items: 'id, order_id, dish_id, name, price, quantity, image_url',
  favorites: 'id, user_id, dish_id, created_at',
  reviews: 'id, user_id, dish_id, order_id, rating, comment, created_at',
  categories: 'id, name, is_enabled, created_at',
  restaurants: 'id, name, image_url, created_at',
  dish_addons: 'id, dish_id, name, price',
};

function logDb(action, table, detail = '') {
  console.log(`[MySQL] ${action} ${table}${detail ? ` — ${detail}` : ''}`);
}

function parseJsonFields(table, row) {
  if (!row) return row;
  const copy = { ...row };
  if (table === 'dishes') {
    if (typeof copy.ingredients === 'string') {
      try { copy.ingredients = JSON.parse(copy.ingredients); } catch { copy.ingredients = []; }
    }
    if (typeof copy.nutrition === 'string') {
      try { copy.nutrition = JSON.parse(copy.nutrition); } catch { copy.nutrition = null; }
    }
    copy.is_available = !!copy.is_available;
  }
  if (table === 'profiles') {
    copy.is_admin = !!copy.is_admin;
    copy.is_blocked = !!copy.is_blocked;
    copy.wallet_balance = Number(copy.wallet_balance);
  }
  if (table === 'categories') copy.is_enabled = !!copy.is_enabled;
  if (copy.price !== undefined && copy.price !== null) copy.price = Number(copy.price);
  if (copy.rating !== undefined && copy.rating !== null) copy.rating = Number(copy.rating);
  if (copy.total !== undefined && copy.total !== null) copy.total = Number(copy.total);
  if (copy.quantity !== undefined && copy.quantity !== null) copy.quantity = Number(copy.quantity);
  return copy;
}

function splitSelectColumns(columns) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const char of columns) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function projectFields(obj, fields) {
  if (fields.trim() === '*') return { ...obj };
  const result = {};
  for (const field of splitSelectColumns(fields)) {
    if (field in obj) result[field] = obj[field];
  }
  return result;
}

async function resolveForeignRow(row, foreignTable, fields, parentTable) {
  if (parentTable === 'cart_items' && foreignTable === 'dishes') {
    const dish = await queryOne('SELECT * FROM dishes WHERE id = :id LIMIT 1', { id: row.dish_id });
    return dish ? projectFields(parseJsonFields('dishes', dish), fields) : null;
  }
  if (parentTable === 'orders' && foreignTable === 'order_items') {
    const items = await query('SELECT * FROM order_items WHERE order_id = :order_id', { order_id: row.id });
    return items.map((item) => (fields.trim() === '*' ? item : projectFields(item, fields)));
  }
  return null;
}

async function resolveSelectProjection(rows, columns, tableName) {
  if (!columns || columns === '*') {
    const nestedMatch = columns?.match(/(\w+)\(\*\)/);
    if (nestedMatch) {
      const relationName = nestedMatch[1];
      return Promise.all(
        rows.map(async (row) => ({
          ...parseJsonFields(tableName, row),
          [relationName]: await resolveForeignRow(row, relationName, '*', tableName),
        })),
      );
    }
    return rows.map((r) => parseJsonFields(tableName, r));
  }

  const nestedOnly = columns.match(/^(.+?),?\s*(\w+)\(\*\)$/);
  if (nestedOnly) {
    const [, baseCols, relationName] = nestedOnly;
    const base =
      baseCols.trim() === '*'
        ? rows.map((r) => parseJsonFields(tableName, r))
        : await resolveSelectProjection(rows, baseCols, tableName);
    return Promise.all(
      base.map(async (row) => ({
        ...row,
        [relationName]: await resolveForeignRow(row, relationName, '*', tableName),
      })),
    );
  }

  if (!columns.includes(':') && !columns.includes('(')) {
    return rows.map((row) => projectFields(parseJsonFields(tableName, row), columns));
  }

  const parts = splitSelectColumns(columns);
  return Promise.all(
    rows.map(async (row) => {
      const parsed = parseJsonFields(tableName, row);
      const projected = {};
      for (const part of parts) {
        const joinMatch = part.match(/^(\w+):(\w+)\(([^)]+)\)$/);
        if (joinMatch) {
          const [, alias, foreignTable, fields] = joinMatch;
          projected[alias] = await resolveForeignRow(parsed, foreignTable, fields, tableName);
        } else if (part === '*') {
          Object.assign(projected, parsed);
        } else {
          projected[part] = parsed[part];
        }
      }
      return projected;
    }),
  );
}

async function fetchTable(table) {
  if (table === 'dish_addons') return [];
  const cols = TABLE_COLUMNS[table] || '*';
  const rows = await query(`SELECT ${cols} FROM \`${table}\``);
  return rows.map((r) => parseJsonFields(table, r));
}

function buildWhere(filters) {
  if (!filters?.length) return { sql: '1=1', params: {} };
  const params = {};
  const parts = filters.map((f, i) => {
    const key = `f${i}`;
    params[key] = f.value;
    return `\`${f.column}\` = :${key}`;
  });
  return { sql: parts.join(' AND '), params };
}

function applyOrder(rows, column, ascending = true) {
  return [...rows].sort((a, b) => {
    const va = a[column];
    const vb = b[column];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string') return ascending ? va.localeCompare(vb) : vb.localeCompare(va);
    return ascending ? va - vb : vb - va;
  });
}

async function refreshDishRating(dishId) {
  const row = await queryOne(
    'SELECT ROUND(AVG(rating), 1) AS avg_rating FROM reviews WHERE dish_id = :dish_id',
    { dish_id: dishId },
  );
  const avg = row?.avg_rating != null ? Number(row.avg_rating) : null;
  if (avg != null) {
    await query('UPDATE dishes SET rating = :rating WHERE id = :id', { id: dishId, rating: avg });
  }
}

export async function executeQueryPlan({ table, chain }) {
  try {
    let stepIdx = 0;
    const first = chain[stepIdx++];
    if (!first || first.op !== 'select') {
      return { data: null, error: { message: 'Invalid query chain' } };
    }

    let rows = await fetchTable(table);
    const countExact = first.options?.count === 'exact';
    const selectColumns = first.columns || '*';

    while (stepIdx < chain.length) {
      const op = chain[stepIdx];
      if (op.op === 'eq') rows = rows.filter((r) => r[op.column] === op.value);
      else if (op.op === 'neq') rows = rows.filter((r) => r[op.column] !== op.value);
      else if (op.op === 'in') rows = rows.filter((r) => op.values.includes(r[op.column]));
      else if (op.op === 'order') rows = applyOrder(rows, op.column, op.ascending !== false);
      else if (op.op === 'limit') rows = rows.slice(0, op.count);
      else if (op.op === 'maybeSingle' || op.op === 'single') {
        const projected = await resolveSelectProjection(rows, selectColumns, table);
        if (op.op === 'single' && projected.length === 0) {
          return { data: null, error: { message: 'JSON object not found' }, count: null };
        }
        logDb('SELECT', table, `${projected.length || 0} row(s)`);
        return {
          data: projected[0] ?? null,
          count: countExact ? rows.length : null,
          error: null,
        };
      } else if (op.op === 'then') break;
      stepIdx++;
    }

    const projected = await resolveSelectProjection(rows, selectColumns, table);
    logDb('SELECT', table, `${projected.length} row(s)`);
    return { data: projected, count: countExact ? rows.length : null, error: null };
  } catch (err) {
    console.error('[MySQL] SELECT error:', err.message);
    return { data: null, error: { message: err.message } };
  }
}

export async function executeInsert(table, payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  const inserted = [];

  try {
    for (const r of rows) {
      const id = r.id || randomUUID();
      switch (table) {
        case 'cart_items': {
          const qty = Number(r.quantity ?? 1);
          const existing = await queryOne(
            'SELECT * FROM cart_items WHERE user_id = :user_id AND dish_id = :dish_id',
            { user_id: r.user_id, dish_id: r.dish_id },
          );
          if (existing) {
            const newQty = Number(existing.quantity) + qty;
            await query('UPDATE cart_items SET quantity = :quantity WHERE id = :id', {
              id: existing.id,
              quantity: newQty,
            });
            inserted.push({ ...parseJsonFields('cart_items', existing), quantity: newQty });
          } else {
            await query(
              'INSERT INTO cart_items (id, user_id, dish_id, quantity) VALUES (:id, :user_id, :dish_id, :quantity)',
              { id, user_id: r.user_id, dish_id: r.dish_id, quantity: qty },
            );
            inserted.push({ id, user_id: r.user_id, dish_id: r.dish_id, quantity: qty, created_at: new Date().toISOString() });
          }
          break;
        }
        case 'orders': {
          await query(
            `INSERT INTO orders (id, user_id, total, status, address, payment_method) VALUES (:id, :user_id, :total, :status, :address, :payment_method)`,
            {
              id,
              user_id: r.user_id,
              total: Number(r.total),
              status: r.status ?? 'Pending',
              address: r.address ?? null,
              payment_method: r.payment_method ?? null,
            },
          );
          inserted.push({ id, ...r, created_at: new Date().toISOString() });
          break;
        }
        case 'order_items':
          await query(
            `INSERT INTO order_items (id, order_id, dish_id, name, price, quantity, image_url) VALUES (:id, :order_id, :dish_id, :name, :price, :quantity, :image_url)`,
            {
              id,
              order_id: r.order_id,
              dish_id: r.dish_id,
              name: r.name,
              price: Number(r.price),
              quantity: Number(r.quantity),
              image_url: r.image_url ?? null,
            },
          );
          inserted.push({ id, ...r });
          break;
        case 'favorites':
          await query(`INSERT IGNORE INTO favorites (id, user_id, dish_id) VALUES (:id, :user_id, :dish_id)`, {
            id,
            user_id: r.user_id,
            dish_id: r.dish_id,
          });
          inserted.push({ id, ...r, created_at: new Date().toISOString() });
          break;
        case 'reviews':
          await query(
            `INSERT INTO reviews (id, user_id, dish_id, order_id, rating, comment) VALUES (:id, :user_id, :dish_id, :order_id, :rating, :comment)`,
            {
              id,
              user_id: r.user_id,
              dish_id: r.dish_id,
              order_id: r.order_id,
              rating: Number(r.rating),
              comment: r.comment ?? null,
            },
          );
          await refreshDishRating(r.dish_id);
          inserted.push({ id, ...r, created_at: new Date().toISOString() });
          break;
        case 'dishes':
          await query(
            `INSERT INTO dishes (id, name, description, price, image_url, rating, category, is_available, ingredients, nutrition)
             VALUES (:id, :name, :description, :price, :image_url, :rating, :category, :is_available, :ingredients, :nutrition)`,
            {
              id,
              name: r.name,
              description: r.description ?? null,
              price: Number(r.price),
              image_url: r.image_url,
              rating: r.rating ?? 4.8,
              category: r.category,
              is_available: r.is_available !== false ? 1 : 0,
              ingredients: JSON.stringify(r.ingredients ?? []),
              nutrition: r.nutrition ? JSON.stringify(r.nutrition) : null,
            },
          );
          inserted.push({ id, ...r, created_at: new Date().toISOString() });
          break;
        case 'categories':
          await query(`INSERT INTO categories (id, name, is_enabled) VALUES (:id, :name, :is_enabled)`, {
            id,
            name: r.name,
            is_enabled: r.is_enabled !== false ? 1 : 0,
          });
          inserted.push({ id, ...r, created_at: new Date().toISOString() });
          break;
        default:
          return { data: null, error: { message: `Insert not implemented for ${table}` } };
      }
    }

    logDb('INSERT', table, `${inserted.length} row(s)`);
    return { data: inserted, error: null };
  } catch (err) {
    console.error('[MySQL] INSERT error:', err.message);
    return { data: null, error: { message: err.message } };
  }
}

function buildDynamicUpdate(table, payload, row) {
  const merged = { ...row, ...payload };
  const sets = [];
  const params = { id: row.id };

  const add = (col, val, transform = (v) => v) => {
    if (payload[col] !== undefined) {
      sets.push(`\`${col}\` = :${col}`);
      params[col] = transform(val);
    }
  };

  if (table === 'profiles') {
    add('username', merged.username);
    add('avatar_url', merged.avatar_url);
    add('wallet_balance', merged.wallet_balance, Number);
    add('is_admin', merged.is_admin, (v) => (v ? 1 : 0));
    add('role', merged.role);
    add('is_blocked', merged.is_blocked, (v) => (v ? 1 : 0));
  } else if (table === 'dishes') {
    add('name', merged.name);
    add('description', merged.description);
    add('price', merged.price, Number);
    add('image_url', merged.image_url);
    add('rating', merged.rating, Number);
    add('category', merged.category);
    add('is_available', merged.is_available, (v) => (v ? 1 : 0));
    if (payload.ingredients !== undefined) {
      sets.push('ingredients = :ingredients');
      params.ingredients = JSON.stringify(merged.ingredients ?? []);
    }
    if (payload.nutrition !== undefined) {
      sets.push('nutrition = :nutrition');
      params.nutrition = merged.nutrition ? JSON.stringify(merged.nutrition) : null;
    }
  } else if (table === 'categories') {
    add('name', merged.name);
    add('is_enabled', merged.is_enabled, (v) => (v ? 1 : 0));
  } else if (table === 'cart_items') {
    add('quantity', merged.quantity, Number);
  } else if (table === 'orders') {
    add('status', merged.status);
    add('total', merged.total, Number);
    add('address', merged.address);
    add('payment_method', merged.payment_method);
  }

  return { sets, params, merged };
}

export async function executeUpdate(table, payload, filters) {
  try {
    const { sql, params: whereParams } = buildWhere(filters);
    const matched = await query(`SELECT * FROM \`${table}\` WHERE ${sql}`, whereParams);
    const updated = [];

    for (const row of matched) {
      const { sets, params, merged } = buildDynamicUpdate(table, payload, row);
      if (sets.length) {
        await query(`UPDATE \`${table}\` SET ${sets.join(', ')} WHERE id = :id`, params);
      }
      updated.push(parseJsonFields(table, merged));
    }

    logDb('UPDATE', table, `${updated.length} row(s)`);
    return { data: updated, error: null };
  } catch (err) {
    console.error('[MySQL] UPDATE error:', err.message);
    return { data: null, error: { message: err.message } };
  }
}

export async function executeDelete(table, filters) {
  try {
    if (!filters?.length) {
      return { data: null, error: { message: 'Delete requires at least one filter' } };
    }

    const { sql, params } = buildWhere(filters);
    const matched = await query(`SELECT * FROM \`${table}\` WHERE ${sql}`, params);
    await query(`DELETE FROM \`${table}\` WHERE ${sql}`, params);

    logDb('DELETE', table, `${matched.length} row(s)`);
    return { data: matched.map((r) => parseJsonFields(table, r)), error: null };
  } catch (err) {
    console.error('[MySQL] DELETE error:', err.message);
    return { data: null, error: { message: err.message } };
  }
}
