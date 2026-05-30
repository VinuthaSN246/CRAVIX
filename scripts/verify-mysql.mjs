/**
 * Verifies all CRAVIX website actions persist to MySQL.
 * Run: node scripts/verify-mysql.mjs
 */
const API = 'http://localhost:4000';

async function api(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function dbQuery(table, chain, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api/db/query`, { method: 'POST', headers, body: JSON.stringify({ table, chain }) });
  return res.json();
}

async function dbInsert(table, payload, token, single = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api/db/insert`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ table, payload, chain: single ? ['single'] : [] }),
  });
  return res.json();
}

async function dbUpdate(table, payload, filters, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api/db/update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ table, payload, filters }),
  });
  return res.json();
}

async function dbDelete(table, filters, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api/db/delete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ table, filters }),
  });
  return res.json();
}

const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('CRAVIX MySQL persistence verification\n');

  const health = await api('/api/health');
  check('Database connection', health.ok, health.database);

  const login = await api('/api/auth/login', { email: 'john@gmail.com', password: 'password123' });
  const token = login.data?.session?.access_token;
  const userId = login.data?.user?.id;
  check('Auth login', !!token, userId);

  const dishes = await dbQuery('dishes', [{ op: 'select', columns: '*', options: {} }, { op: 'limit', count: 3 }]);
  check('Browse dishes', dishes.data?.length > 0, `${dishes.data?.length} dishes`);

  const cartIns = await dbInsert('cart_items', { user_id: userId, dish_id: 'dish-1', quantity: 2 }, token);
  check('Add to cart', !cartIns.error, cartIns.error?.message);

  const cartJoin = await dbQuery(
    'cart_items',
    [
      { op: 'select', columns: 'id, quantity, dish:dishes(id, name, price)', options: {} },
      { op: 'eq', column: 'user_id', value: userId },
    ],
    token,
  );
  check('Cart with dish join', cartJoin.data?.[0]?.dish?.name === 'Classic Cheeseburger', cartJoin.data?.[0]?.dish?.price);

  const cartId = cartJoin.data?.[0]?.id;
  if (cartId) {
    const upd = await dbUpdate('cart_items', { quantity: 3 }, [{ column: 'id', value: cartId }], token);
    check('Update cart quantity', !upd.error && upd.data?.[0]?.quantity === 3);
  }

  const orderIns = await dbInsert(
    'orders',
    { user_id: userId, total: 17.98, address: 'Home test', payment_method: 'cash' },
    token,
    true,
  );
  const orderId = orderIns.data?.id;
  check('Place order', !!orderId, orderId);

  if (orderId) {
    const items = await dbInsert(
      'order_items',
      [{ order_id: orderId, dish_id: 'dish-1', name: 'Classic Cheeseburger', price: 12.99, quantity: 1, image_url: 'x' }],
      token,
    );
    check('Order items', !items.error, `${items.data?.length} item(s)`);
  }

  const favIns = await dbInsert('favorites', { user_id: userId, dish_id: 'dish-2' }, token);
  check('Add favorite', !favIns.error);

  const favDel = await dbDelete(
    'favorites',
    [{ column: 'user_id', value: userId }, { column: 'dish_id', value: 'dish-2' }],
    token,
  );
  check('Remove favorite', !favDel.error, `${favDel.data?.length} removed`);

  const wallet = await dbUpdate('profiles', { wallet_balance: 400 }, [{ column: 'id', value: userId }], token);
  check('Wallet top-up', !wallet.error && wallet.data?.[0]?.wallet_balance === 400);

  if (orderId) {
    const rev = await dbInsert(
      'reviews',
      { user_id: userId, dish_id: 'dish-1', order_id: orderId, rating: 5, comment: 'Great!' },
      token,
    );
    check('Submit review', !rev.error);
  }

  const cartClear = await dbDelete('cart_items', [{ column: 'user_id', value: userId }], token);
  check('Clear cart after order', !cartClear.error, `${cartClear.data?.length} removed`);

  const adminLogin = await api('/api/auth/login', { email: 'admin@gmail.com', password: 'admin123' });
  const adminToken = adminLogin.data?.session?.access_token;
  check('Admin login', !!adminToken);

  const newDishId = `dish-test-${Date.now()}`;
  const dishAdd = await dbInsert(
    'dishes',
    { id: newDishId, name: 'Test Dish', description: 'Test', price: 9.99, image_url: 'https://x.com', category: 'Burgers', is_available: true },
    adminToken,
  );
  check('Admin add dish', !dishAdd.error);

  const dishUpd = await dbUpdate('dishes', { price: 10.99 }, [{ column: 'id', value: newDishId }], adminToken);
  check('Admin update dish', !dishUpd.error && dishUpd.data?.[0]?.price === 10.99);

  const dishDel = await dbDelete('dishes', [{ column: 'id', value: newDishId }], adminToken);
  check('Admin delete dish', !dishDel.error);

  const orderUpd = orderId
    ? await dbUpdate('orders', { status: 'Preparing' }, [{ column: 'id', value: orderId }], adminToken)
    : { error: { message: 'no order' } };
  check('Admin update order status', !orderUpd.error);

  console.log('\n--- Summary ---');
  const failed = results.filter((r) => !r.ok);
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
  console.log('\nAll website actions persist to MySQL database "cravix".');
}

main().catch((e) => {
  console.error('Verification failed:', e.message);
  process.exit(1);
});
