// scripts/reseed/reseed-all.js
//
// Full platform reseed orchestrator (True E2E Phase E).
// One command seeds demo data across core / commerce / payment / logistics.
//
// Usage (Mac → Dell):
//   GW=http://192.168.50.88:8080 node scripts/reseed/reseed-all.js
//
// Idempotent: safe to run twice (upsert by seed keys / emails / orderNumbers).
// Strategy: wipe-and-replace is NOT required — each seeder upserts fixed keys.
//
// Prerequisites:
//   - Host Mongo (not empty Docker mongo) — see scripts/reseed/README.md
//   - Services on SPRING_PROFILES_ACTIVE=dev (or demo)
//   - Gateway :8080; after first core seed, manager login works

const { seedCore } = require('./seed-core');
const { seedCommerce } = require('./seed-commerce');
const { seedPayment } = require('./seed-payment');
const { seedLogistics } = require('./seed-logistics');

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const STORE = process.env.STORE_ID || 'DOM001';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager.berlin@gmail.com';
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || 'Demo@1234';

async function login(email, password) {
  const res = await fetch(`${GW}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`login failed HTTP ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}`);
  }
  const token = data.accessToken || data.token || data.access_token;
  if (!token) throw new Error('login response missing accessToken');
  return { token, user: data.user || data };
}

async function seedOptional(name, fn) {
  try {
    const result = await fn();
    console.log(`[reseed] ${name}: OK`);
    return { ok: true, result };
  } catch (e) {
    console.warn(`[reseed] ${name}: SKIP/FAIL — ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function reseedAll() {
  console.log('=== MaSoVa full platform reseed ===');
  console.log(`GW=${GW} store=${STORE}`);
  console.log('Idempotency: upsert by fixed seed keys (no wipe required)\n');

  // 1) Core first (no JWT) — creates manager + customers
  console.log('--- core ---');
  const core = await seedCore(STORE);
  const userIds = core.userIds || {};
  const customerUserId =
    (core.customers && core.customers.primaryCustomerUserId) ||
    userIds['anna.mueller@gmail.com'] ||
    null;
  const driverId = userIds['driver.berlin@gmail.com'] || null;

  // 2) Login as manager for protected seeds
  console.log('\n--- auth ---');
  const { token: managerToken } = await login(MANAGER_EMAIL, MANAGER_PASSWORD);
  console.log(`[reseed] logged in as ${MANAGER_EMAIL}`);

  // 3) Commerce (menu + orders + equipment)
  console.log('\n--- commerce ---');
  const commerce = await seedCommerce(managerToken, {
    storeId: STORE,
    customerId: customerUserId,
  });

  // 4) Payment (synthetic txs + refunds)
  console.log('\n--- payment ---');
  const payment = await seedPayment(managerToken, {
    storeId: STORE,
    customerId: customerUserId || 'cust-demo-1',
  });

  // 5) Logistics
  console.log('\n--- logistics ---');
  const logistics = await seedLogistics(managerToken, {
    storeId: STORE,
    driverId,
  });

  // 6) Optional Phase D seeds (notifications + equipment already in commerce)
  console.log('\n--- optional (notifications) ---');
  const notif = await seedOptional('notifications', async () => {
    const res = await fetch(`${GW}/api/notifications/seed-demo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && res.status !== 404) {
      throw new Error(`HTTP ${res.status}`);
    }
    return data;
  });

  const summary = {
    storeId: STORE,
    core: {
      users: Object.keys(userIds).length,
      primaryCustomerUserId: customerUserId,
      driverId,
    },
    commerce: {
      menu: commerce?.menu?.totalForStore,
      orders: commerce?.orders?.totalSeedOrders,
      equipment: commerce?.equipment?.totalForStore,
    },
    payment: {
      transactions: payment?.transactionIds?.length,
      refunds: payment?.refundIds?.length,
    },
    logistics: {
      suppliers: logistics?.suppliers?.total,
      inventory: logistics?.inventory?.totalForStore,
      delivery: logistics?.delivery?.totalSeedTrackings,
    },
    notifications: notif.ok ? notif.result : notif.error,
  };

  console.log('\n=== reseed complete ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nNext: node scripts/reseed/verify-seed.js');
  return summary;
}

module.exports = { reseedAll };

if (require.main === module) {
  reseedAll().catch((err) => {
    console.error('reseed-all failed:', err);
    process.exit(1);
  });
}
