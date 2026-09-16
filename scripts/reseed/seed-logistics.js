// scripts/reseed/seed-logistics.js
// POST /api/inventory/seed-demo — suppliers, inventory, POs, waste, delivery tracking
// Pass commerce deliveryTrackingOrderIds (Mongo order ids) for real delivery_trackings.orderId.

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const STORE = process.env.STORE_ID || 'DOM001';

async function seedLogistics(token, { storeId = STORE, driverId, orderIds = [] } = {}) {
  if (!token) throw new Error('seed-logistics requires manager JWT');
  const q = new URLSearchParams({ storeId });
  if (driverId) q.set('driverId', driverId);
  if (orderIds && orderIds.length) {
    q.set('orderIds', orderIds.join(','));
  }
  const url = `${GW}/api/inventory/seed-demo?${q}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    throw new Error(`seed-logistics HTTP ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}`);
  }
  console.log(
    `[seed-logistics] suppliers=${data?.suppliers?.total ?? '?'} inventory=${data?.inventory?.totalForStore ?? '?'} delivery=${data?.delivery?.totalSeedTrackings ?? '?'}`
  );
  return data;
}

module.exports = { seedLogistics };

if (require.main === module) {
  console.error('Run via reseed-all.js (needs manager JWT)');
  process.exit(1);
}
