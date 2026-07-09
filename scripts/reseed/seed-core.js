// scripts/reseed/seed-core.js
//
// Seeds core-service dev data via its @Profile("dev") TestDataController.
// This is the ONLY service found (2026-07-04 investigation) with a dev seed
// endpoint at all. See docs/investigations/2026-07-04-investigation-data-seed-gaps.md
// for the gaps in commerce/payment/logistics/intelligence-service.
//
// core-service's TestDataController only exposes store-creation endpoints
// (create-default-store, create-test-stores, migrate-users-to-storecode) —
// there is no dev endpoint for seeding users/staff. That absence is logged
// as a gap rather than worked around here.

const BASE = 'http://192.168.50.88:8085';

async function seedCore() {
  const storeRes = await fetch(`${BASE}/api/test-data/create-default-store`, { method: 'POST' });
  if (!storeRes.ok) {
    const body = await storeRes.text();
    throw new Error(`create-default-store failed: HTTP ${storeRes.status} — ${body.slice(0, 200)}`);
  }
  const store = await storeRes.json();
  console.log('Store seeded:', store);
  return store;
}

module.exports = { seedCore };

if (require.main === module) {
  seedCore().catch(err => { console.error('seed-core failed:', err); process.exit(1); });
}
