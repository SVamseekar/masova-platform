// scripts/reseed/seed-intelligence.js
// POST /api/analytics/seed-demo — clear Redis analytics caches + warm EU dashboard queries
// Intelligence has no owned entities; this is read-through warm from commerce data.

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const STORE = process.env.STORE_ID || 'DOM001';

async function seedIntelligence(token, { storeId = STORE } = {}) {
  if (!token) throw new Error('seed-intelligence requires manager JWT');
  const url = `${GW}/api/analytics/seed-demo?storeId=${encodeURIComponent(storeId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Selected-Store-Id': storeId,
      'X-User-Store-Id': storeId,
      'X-User-Type': 'MANAGER',
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    throw new Error(`seed-intelligence HTTP ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}`);
  }
  console.log(
    `[seed-intelligence] tz=${data?.timezone || 'Europe/Berlin'} warmed=${Object.keys(data?.warmed || {}).length}`
  );
  return data;
}

module.exports = { seedIntelligence };

if (require.main === module) {
  console.error('Run via reseed-all.js (needs manager JWT)');
  process.exit(1);
}
