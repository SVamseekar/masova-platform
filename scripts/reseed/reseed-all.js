// scripts/reseed/reseed-all.js
//
// Orchestrator for the dev-data re-seed used by the 2026-07-04 investigation.
//
// Only core-service has a real @Profile("dev") seed endpoint as of this
// investigation (see docs/investigations/2026-07-04-investigation-data-seed-gaps.md).
// commerce-service, payment-service, logistics-service, and intelligence-service
// have no dev seed endpoint, so no seeders were written for them — that is a
// documented gap, not an oversight. When a future remediation plan adds dev
// seed endpoints to those services, add a seed-<service>.js following the
// seed-core.js pattern and wire it in below.

const { seedCore } = require('./seed-core');

async function reseedAll() {
  console.log('Starting fresh full re-seed (replaces DOM001 Berlin data)...');
  const store = await seedCore();
  // Additional seeders (commerce/payment/logistics/intelligence) are added here
  // only for services confirmed in Task 5 Step 3 to have a dev seed endpoint.
  console.log('Re-seed complete.');
  return { store };
}

module.exports = { reseedAll };

if (require.main === module) {
  reseedAll().catch(err => { console.error('reseed-all failed:', err); process.exit(1); });
}
