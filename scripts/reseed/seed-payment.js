// scripts/reseed/seed-payment.js
// POST /api/payments/seed-demo — synthetic transactions + refunds (Phase C)

const GW = process.env.GW || process.env.GATEWAY || 'http://192.168.50.88:8080';
const STORE = process.env.STORE_ID || 'DOM001';

async function seedPayment(token, { storeId = STORE, customerId = 'cust-demo-1' } = {}) {
  if (!token) throw new Error('seed-payment requires manager JWT');
  const paths = [
    `/api/payments/seed-demo?storeId=${encodeURIComponent(storeId)}&customerId=${encodeURIComponent(customerId)}`,
    `/api/payments/test-data/seed-demo?storeId=${encodeURIComponent(storeId)}&customerId=${encodeURIComponent(customerId)}`,
  ];
  for (const path of paths) {
    const res = await fetch(`${GW}${path}`, {
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
    if (res.ok && data?.transactionIds) {
      console.log(
        `[seed-payment] txs=${data.transactionIds.length} refunds=${data.refundIds?.length ?? 0}`
      );
      return data;
    }
    if (res.status === 404) continue;
    throw new Error(`seed-payment HTTP ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}`);
  }
  throw new Error('seed-payment failed: seed-demo not available (restart payment-service on Phase C/E binary)');
}

module.exports = { seedPayment };

if (require.main === module) {
  console.error('Run via reseed-all.js (needs manager JWT)');
  process.exit(1);
}
