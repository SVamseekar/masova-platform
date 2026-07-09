// scripts/reseed/seed-commerce.js
// POST /api/orders/seed-demo — menu + multi-status orders (customerId=userId) + equipment

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const STORE = process.env.STORE_ID || 'DOM001';

async function seedCommerce(token, { storeId = STORE, customerId, driverId } = {}) {
  if (!token) throw new Error('seed-commerce requires manager JWT');
  const q = new URLSearchParams({ storeId });
  if (customerId) q.set('customerId', customerId);
  if (driverId) q.set('driverId', driverId);
  const url = `${GW}/api/orders/seed-demo?${q}`;
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
    throw new Error(`seed-commerce HTTP ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}`);
  }
  console.log(
    `[seed-commerce] menu=${data?.menu?.totalForStore ?? '?'} orders=${data?.orders?.totalSeedOrders ?? '?'} equipment=${data?.equipment?.totalForStore ?? '?'} paidIds=${data?.orders?.paidOrderIds?.length ?? 0}`
  );
  return data;
}

module.exports = { seedCommerce };

if (require.main === module) {
  console.error('Run via reseed-all.js (needs manager JWT)');
  process.exit(1);
}
