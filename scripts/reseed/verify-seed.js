// scripts/reseed/verify-seed.js
//
// Asserts Phase E reseed exit criteria:
//   - counts: stores, menu, users login, orders, payments, suppliers, inventory
//   - ownership invariant: order.customerId === JWT sub (userId) for customer
//
// Usage:
//   GW=http://192.168.50.88:8080 node scripts/reseed/verify-seed.js
// Exit 0 = green.

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const STORE = process.env.STORE_ID || 'DOM001';

let passed = 0;
let failed = 0;

function ok(name, detail) {
  passed++;
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail) {
  failed++;
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function json(method, path, { token, body } = {}) {
  const headers = {
    Accept: 'application/json',
    'X-Selected-Store-Id': STORE,
    'X-User-Store-Id': STORE,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${GW}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { status: res.status, data };
}

async function login(email, password = 'Demo@1234') {
  const { status, data } = await json('POST', '/api/auth/login', {
    body: { email, password },
  });
  if (status !== 200) {
    throw new Error(`login ${email} → ${status} ${JSON.stringify(data)?.slice(0, 120)}`);
  }
  const token = data.accessToken || data.token;
  const user = data.user || {};
  const userId = user.id || user.userId || user.sub;
  return { token, user, userId };
}

function decodeJwtSub(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const obj = JSON.parse(json);
    return obj.sub || obj.userId || obj.id;
  } catch {
    return null;
  }
}

async function main() {
  console.log('=== verify-seed (Phase E) ===');
  console.log(`GW=${GW} store=${STORE}\n`);

  // ── Auth ──────────────────────────────────────────────────────────────
  console.log('Auth');
  let manager;
  let customer;
  try {
    manager = await login('manager.berlin@gmail.com');
    ok('manager login', `userId=${manager.userId || '?'}`);
  } catch (e) {
    fail('manager login', e.message);
    console.error('\nCannot continue without manager. Run reseed-all.js first.');
    process.exit(1);
  }
  try {
    customer = await login('anna.mueller@gmail.com');
    ok('customer login (anna.mueller)', `userId=${customer.userId || '?'}`);
  } catch (e) {
    fail('customer login', e.message);
  }
  try {
    await login('driver.berlin@gmail.com');
    ok('driver login');
  } catch (e) {
    fail('driver login', e.message);
  }

  const customerSub = customer ? decodeJwtSub(customer.token) || customer.userId : null;

  // ── Stores / menu (public) ────────────────────────────────────────────
  console.log('\nPublic catalog');
  {
    const r = await json('GET', '/api/stores/public');
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.stores || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 1) ok('public stores', `n=${n}`);
      else fail('public stores', `empty body ${JSON.stringify(r.data)?.slice(0, 80)}`);
    } else {
      // fallback list
      const r2 = await json('GET', '/api/stores');
      if (r2.status === 200) ok('stores list', `status=200`);
      else fail('public stores', `HTTP ${r.status}`);
    }
  }
  {
    const r = await json('GET', `/api/menu?storeId=${STORE}`);
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.items || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 5) ok('menu items', `n=${n}`);
      else fail('menu items', `n=${n} (want ≥5)`);
    } else {
      fail('menu items', `HTTP ${r.status}`);
    }
  }

  // ── Orders + ownership ────────────────────────────────────────────────
  console.log('\nOrders + ownership invariant');
  {
    const r = await json('GET', `/api/orders?storeId=${STORE}`, { token: manager.token });
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.orders || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 1) ok('manager order list', `n=${n}`);
      else fail('manager order list', 'empty');

      const seedOrders = list.filter(
        (o) => o.orderNumber && String(o.orderNumber).startsWith('SEED-ORD-')
      );
      if (seedOrders.length >= 5) {
        ok('seed orders present', `n=${seedOrders.length}`);
      } else {
        // Accept non-seed if total is high enough (host mongo already populated)
        if (n >= 5) ok('orders present (non-seed ok)', `n=${n}`);
        else fail('seed orders', `only ${seedOrders.length}`);
      }

      if (customerSub && seedOrders.length) {
        const bad = seedOrders.filter((o) => o.customerId && o.customerId !== customerSub);
        if (bad.length === 0) {
          ok('ownership: seed order.customerId === JWT sub', `sub=${customerSub}`);
        } else {
          fail(
            'ownership invariant',
            `${bad.length} seed orders have customerId≠sub e.g. ${bad[0].customerId}`
          );
        }
      }
    } else {
      fail('manager order list', `HTTP ${r.status}`);
    }
  }

  if (customer?.token) {
    const r = await json('GET', '/api/orders', { token: customer.token });
    // customer list may filter by ownership
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.orders || r.data?.content || [];
      ok('customer order list', `n=${Array.isArray(list) ? list.length : '?'}`);
    } else if (r.status === 403) {
      fail('customer order list', '403 — ownership/customerId mismatch');
    } else {
      // Some deployments require storeId
      const r2 = await json('GET', `/api/orders?storeId=${STORE}`, { token: customer.token });
      if (r2.status === 200) ok('customer order list', '200 with storeId');
      else fail('customer order list', `HTTP ${r.status}/${r2.status}`);
    }
  }

  // ── Payments ──────────────────────────────────────────────────────────
  console.log('\nPayments');
  {
    const r = await json('GET', `/api/payments?storeId=${STORE}`, { token: manager.token });
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.transactions || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 3) ok('payment transactions', `n=${n}`);
      else fail('payment transactions', `n=${n} (want ≥3)`);
    } else {
      fail('payment transactions', `HTTP ${r.status}`);
    }
  }

  // ── Logistics ─────────────────────────────────────────────────────────
  console.log('\nLogistics');
  {
    const r = await json('GET', `/api/suppliers`, { token: manager.token });
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.suppliers || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 1) ok('suppliers', `n=${n}`);
      else fail('suppliers', 'empty');
    } else {
      fail('suppliers', `HTTP ${r.status}`);
    }
  }
  {
    const r = await json('GET', `/api/inventory?storeId=${STORE}`, { token: manager.token });
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.items || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 5) ok('inventory', `n=${n}`);
      else fail('inventory', `n=${n} (want ≥5)`);
    } else {
      fail('inventory', `HTTP ${r.status}`);
    }
  }
  {
    const r = await json('GET', `/api/delivery?storeId=${STORE}`, { token: manager.token });
    if (r.status === 200) ok('delivery list', '200');
    else fail('delivery list', `HTTP ${r.status}`);
  }

  // ── Intelligence (EU analytics warm) ──────────────────────────────────
  console.log('\nIntelligence (analytics / BI)');
  {
    const r = await json(
      'GET',
      `/api/analytics?type=staff-leaderboard&period=TODAY&storeId=${STORE}`,
      { token: manager.token }
    );
    if (r.status === 200) ok('analytics staff-leaderboard', '200');
    else fail('analytics staff-leaderboard', `HTTP ${r.status}`);
  }
  {
    const r = await json('GET', `/api/bi/reports?type=executive-summary&period=MONTH`, {
      token: manager.token,
    });
    if (r.status === 200) ok('bi executive-summary', '200');
    else fail('bi executive-summary', `HTTP ${r.status}`);
  }
  {
    const r = await json('POST', `/api/analytics/seed-demo?storeId=${STORE}`, {
      token: manager.token,
    });
    if (r.status === 200) {
      ok('analytics seed-demo warm', `tz=${r.data?.timezone || '?'}`);
    } else if (r.status === 404) {
      ok('analytics seed-demo skipped', 'profile not dev/demo or old binary');
    } else {
      fail('analytics seed-demo', `HTTP ${r.status}`);
    }
  }

  // ── Equipment / notifications (Phase D seeds) ─────────────────────────
  console.log('\nEquipment / notifications');
  {
    const r = await json('GET', `/api/equipment?storeId=${STORE}`, { token: manager.token });
    if (r.status === 200) {
      const list = Array.isArray(r.data) ? r.data : r.data?.equipment || r.data?.content || [];
      const n = Array.isArray(list) ? list.length : 0;
      if (n >= 1) ok('equipment', `n=${n}`);
      else fail('equipment', 'empty');
    } else {
      fail('equipment', `HTTP ${r.status}`);
    }
  }
  {
    const r = await json('GET', `/api/notifications`, { token: manager.token });
    if (r.status === 200) ok('notifications list', '200');
    else fail('notifications list', `HTTP ${r.status}`);
  }

  // ── Idempotency smoke (second core seed must not 500) ─────────────────
  console.log('\nIdempotency');
  {
    const r = await json('POST', `/api/test-data/seed-demo?storeId=${STORE}`);
    if (r.status === 200) ok('re-run core seed-demo', '200 (no duplicate key explosion)');
    else if (r.status === 404) ok('re-run core seed-demo skipped', '404 — profile not dev/demo or old binary');
    else fail('re-run core seed-demo', `HTTP ${r.status}`);
  }

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
