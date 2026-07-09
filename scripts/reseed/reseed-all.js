// scripts/reseed/reseed-all.js
//
// Full platform reseed orchestrator (True E2E Phase E) — EU / Berlin primary.
// Seeds: core → commerce → payment → logistics → intelligence → notifications
// Cross-links commerce order Mongo ids into payment + logistics delivery_trackings.
//
// Usage (Mac → Dell):
//   GW=http://192.168.50.88:8080 node scripts/reseed/reseed-all.js
//
// Idempotent: safe to run twice (upsert by fixed seed keys).
//
// Prerequisites:
//   - Host Mongo (not empty Docker mongo) — see scripts/reseed/README.md
//   - Services on SPRING_PROFILES_ACTIVE=dev (or demo)
//   - RabbitMQ + Redis + Postgres healthy
//   - Gateway :8080

const { seedCore } = require('./seed-core');
const { seedCommerce } = require('./seed-commerce');
const { seedPayment } = require('./seed-payment');
const { seedLogistics } = require('./seed-logistics');
const { seedIntelligence } = require('./seed-intelligence');

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

async function reseedAll() {
  console.log('=== MaSoVa full platform reseed (EU) ===');
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
  const managerId = userIds['manager.berlin@gmail.com'] || null;

  // 2) Login as manager for protected seeds
  console.log('\n--- auth ---');
  const { token: managerToken } = await login(MANAGER_EMAIL, MANAGER_PASSWORD);
  console.log(`[reseed] logged in as ${MANAGER_EMAIL}`);

  // 3) Commerce (menu + orders + equipment) — pass driver for OFD/DELIVERED
  console.log('\n--- commerce ---');
  const commerce = await seedCommerce(managerToken, {
    storeId: STORE,
    customerId: customerUserId,
    driverId,
  });
  const paidOrderIds = commerce?.orders?.paidOrderIds || [];
  const deliveryOrderIds = commerce?.orders?.deliveryTrackingOrderIds || [];

  // 4) Payment — link txs to paid commerce order Mongo ids
  console.log('\n--- payment ---');
  const payment = await seedPayment(managerToken, {
    storeId: STORE,
    customerId: customerUserId || 'cust-demo-1',
    orderIds: paidOrderIds,
  });

  // 5) Logistics — delivery_trackings.orderId = commerce Mongo ids
  console.log('\n--- logistics ---');
  const logistics = await seedLogistics(managerToken, {
    storeId: STORE,
    driverId,
    orderIds: deliveryOrderIds,
  });

  // 6) Intelligence (cache clear + warm)
  console.log('\n--- intelligence ---');
  const intelligence = await seedIntelligence(managerToken, { storeId: STORE });

  // 7) Notifications (required for full platform)
  console.log('\n--- notifications ---');
  const notifRes = await fetch(`${GW}/api/notifications/seed-demo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  const notif = await notifRes.json().catch(() => ({}));
  if (!notifRes.ok && notifRes.status !== 404) {
    throw new Error(`notifications seed-demo HTTP ${notifRes.status}`);
  }
  console.log(
    `[reseed] notifications: ${notifRes.ok ? 'OK' : 'skipped (404)'} created=${notif.createdCount ?? '?'}`
  );

  const summary = {
    storeId: STORE,
    region: 'EU-DE',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    core: {
      users: Object.keys(userIds).length,
      primaryCustomerUserId: customerUserId,
      driverId,
      managerId,
    },
    commerce: {
      menu: commerce?.menu?.totalForStore,
      orders: commerce?.orders?.totalSeedOrders,
      equipment: commerce?.equipment?.totalForStore,
      paidOrderIds: paidOrderIds.length,
      deliveryOrderIds: deliveryOrderIds.length,
    },
    payment: {
      transactions: payment?.transactionIds?.length,
      refunds: payment?.refundIds?.length,
      syncedOrders: payment?.syncedOrderPaymentStatus?.length,
    },
    logistics: {
      suppliers: logistics?.suppliers?.total,
      inventory: logistics?.inventory?.totalForStore,
      delivery: logistics?.delivery?.totalSeedTrackings,
    },
    intelligence: {
      timezone: intelligence?.timezone,
      warmed: intelligence?.warmed ? Object.keys(intelligence.warmed).length : 0,
      errors: intelligence?.errors ? Object.keys(intelligence.errors).length : 0,
    },
    notifications: notifRes.ok ? notif : { skipped: true },
  };

  console.log('\n=== reseed complete ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nNext:');
  console.log('  node scripts/reseed/verify-seed.js');
  console.log('  node scripts/reseed/verify-backend-load.js');
  return summary;
}

module.exports = { reseedAll };

if (require.main === module) {
  reseedAll().catch((err) => {
    console.error('reseed-all failed:', err);
    process.exit(1);
  });
}
