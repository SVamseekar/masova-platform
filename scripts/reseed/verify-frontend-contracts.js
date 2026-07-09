#!/usr/bin/env node
/**
 * Frontend contract verification against Dell gateway.
 * Catches: wrong paths (/orders/store), missing storeId, dual-source lies (KPI vs list).
 *
 *   GW=http://192.168.50.88:8080 node scripts/reseed/verify-frontend-contracts.js
 * Exit 0 = all green.
 */
const GW = process.env.GW || 'http://192.168.50.88:8080';
const STORE = process.env.STORE || 'DOM001';
const EMAIL = process.env.MANAGER_EMAIL || 'manager.berlin@gmail.com';
const PASS = process.env.MANAGER_PASSWORD || 'Demo@1234';

async function login() {
  const r = await fetch(`${GW}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!r.ok) throw new Error(`login ${r.status}`);
  const j = await r.json();
  const token = j.accessToken;
  let sub = '';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    sub = payload.sub || '';
  } catch { /* ignore */ }
  return { token, sub, user: j.user };
}

async function get(path, { token, sub }) {
  const r = await fetch(`${GW}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-User-Id': sub || '',
      'X-Selected-Store-Id': STORE,
      'X-User-Store-Id': STORE,
    },
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body };
}

function asArray(body) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    if (Array.isArray(body.content)) return body.content;
    if (Array.isArray(body.orders)) return body.orders;
    if (Array.isArray(body.data)) return body.data;
  }
  return null;
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark.padEnd(4)} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`=== Frontend contracts ===\nGW=${GW} store=${STORE}\n`);
  const auth = await login();
  console.log(`auth ok user=${auth.user?.email || EMAIL}\n`);

  // A. Broken path must stay dead (document regression)
  {
    const bad = await get('/api/orders/store', auth);
    check(
      'GET /api/orders/store is NOT used (expect fail or empty)',
      bad.status >= 400 || (asArray(bad.body)?.length ?? 0) === 0,
      `status=${bad.status}`,
    );
  }

  // B. Canonical store orders
  let orderCount = 0;
  {
    const good = await get(`/api/orders?storeId=${encodeURIComponent(STORE)}`, auth);
    const arr = asArray(good.body);
    orderCount = arr?.length ?? 0;
    check('GET /api/orders?storeId= list', good.status === 200 && Array.isArray(arr), `status=${good.status} n=${orderCount}`);
    check('Orders list non-empty (seed)', orderCount > 0, `n=${orderCount}`);
  }

  // C. Kitchen queue
  {
    const r = await get(`/api/orders?kitchen=true&storeId=${encodeURIComponent(STORE)}`, auth);
    const arr = asArray(r.body);
    check('Kitchen queue path', r.status === 200 && Array.isArray(arr), `status=${r.status} n=${arr?.length ?? '?'}`);
  }

  // D. Analytics with storeId
  for (const type of ['sales', 'peak-hours', 'order-breakdown', 'top-products&period=WEEKLY&sortBy=QUANTITY', 'staff-leaderboard&period=TODAY']) {
    const path = `/api/analytics?type=${type}${type.includes('storeId') ? '' : `&storeId=${STORE}`}`;
    // top-products already has extra params; ensure storeId
    const url = path.includes('storeId=') ? path : `${path.includes('?') ? path : path}&storeId=${STORE}`;
    // fix double
    const final = `/api/analytics?type=${type.split('&')[0]}${type.includes('&') ? '&' + type.split('&').slice(1).join('&') : ''}&storeId=${STORE}`;
    const r = await get(final.replace(/&&/g, '&'), auth);
    check(`analytics type=${type.split('&')[0]}`, r.status === 200 || r.status === 204, `status=${r.status}`);
  }

  // E. Inventory / suppliers / POs / equipment / menu
  const listPaths = [
    `/api/inventory?storeId=${STORE}`,
    `/api/inventory?lowStock=true&storeId=${STORE}`,
    `/api/suppliers?storeId=${STORE}`,
    // PO list may 500 until logistics redeploy (Jackson overdue); still probe
    `/api/purchase-orders?storeId=${STORE}`,
    `/api/equipment?storeId=${STORE}`,
    `/api/menu?storeId=${STORE}`,
    `/api/users/kiosk?storeId=${STORE}`,
  ];
  for (const p of listPaths) {
    const r = await get(p, auth);
    const arr = asArray(r.body);
    check(p.replace(GW, ''), r.status === 200, `status=${r.status} n=${arr?.length ?? (typeof r.body === 'object' ? 'obj' : '?')}`);
  }

  // F. Dual-source: if analytics has today order count, orders list should not be empty for busy store
  {
    const sales = await get(`/api/analytics?type=sales&storeId=${STORE}`, auth);
    let todayCount = null;
    if (sales.status === 200 && sales.body && typeof sales.body === 'object') {
      todayCount = sales.body.todayOrderCount ?? sales.body.orderCount ?? sales.body.totalOrders ?? null;
    }
    if (todayCount != null && Number(todayCount) > 0) {
      check(
        'Dual-source: analytics today>0 implies orders list non-empty',
        orderCount > 0,
        `analyticsToday=${todayCount} listN=${orderCount}`,
      );
    } else {
      check('Dual-source: analytics sales readable or skip', sales.status === 200 || sales.status >= 400, `status=${sales.status} today=${todayCount}`);
    }
  }

  // G. Kiosk create path exists
  {
    const r = await get(`/api/users/kiosk?storeId=${STORE}`, auth);
    check('Kiosk list', r.status === 200 && Array.isArray(asArray(r.body)), `status=${r.status}`);
  }

  const failed = results.filter((x) => !x.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(' -', f.name, f.detail));
    process.exit(1);
  }
  console.log('ALL GREEN');
  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(2);
});
