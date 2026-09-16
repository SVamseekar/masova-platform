// scripts/reseed/seed-core.js
//
// Seeds core-service via @Profile("dev"|"demo") TestDataController.
// POST /api/test-data/seed-demo — stores (Berlin DE/EUR), staff/customers, campaigns.
// Idempotent: safe to re-run.

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const CORE = process.env.CORE_URL || 'http://192.168.50.88:8085';
const STORE = process.env.STORE_ID || 'DOM001';

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  return { status: res.status, ok: res.ok, data };
}

/**
 * Prefer gateway (routes /api/test-data/**); fall back to core direct :8085.
 */
async function seedCore(storeId = STORE) {
  const paths = [
    `${GW}/api/test-data/seed-demo?storeId=${encodeURIComponent(storeId)}`,
    `${CORE}/api/test-data/seed-demo?storeId=${encodeURIComponent(storeId)}`,
    // Legacy store-only endpoints (still useful if seed-demo not deployed yet)
    `${CORE}/api/test-data/create-test-stores`,
  ];

  for (const url of paths) {
    try {
      const result = await postJson(url);
      if (result.ok && result.data && (result.data.userIds || result.data.stores || result.data.storeCode)) {
        console.log(`[seed-core] OK via ${url}`);
        console.log(`[seed-core] users=${Object.keys(result.data.userIds || {}).length} password=${result.data.password || 'Demo@1234'}`);
        return result.data;
      }
      if (result.ok && url.includes('create-test-stores')) {
        console.log(`[seed-core] legacy create-test-stores OK (full seed-demo not available — restart core on Phase E PR)`);
        return result.data;
      }
      console.warn(`[seed-core] ${url} → HTTP ${result.status}`, JSON.stringify(result.data)?.slice(0, 160));
    } catch (e) {
      console.warn(`[seed-core] ${url} failed: ${e.message}`);
    }
  }
  throw new Error('seed-core failed: no seed endpoint accepted the request');
}

module.exports = { seedCore };

if (require.main === module) {
  seedCore()
    .then((data) => {
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error('seed-core failed:', err);
      process.exit(1);
    });
}
