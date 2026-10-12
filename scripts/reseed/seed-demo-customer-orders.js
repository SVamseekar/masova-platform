// Seeds past orders for the synthetic demo customer, so the account, orders and review screens
// show delivered, completed and cancelled orders (design boards 07 and 08).
// Synthetic demo data only: it touches orders whose number starts with ORD90000010 and belongs to
// the seeded customer anna.mueller@gmail.com. Safe to re-run: each order is replaced by number.
// These rows exist in MongoDB only; they are not written to the PostgreSQL ledger.
//
// Run on the Dell host:
//   docker exec -i masova-mongodb mongosh --quiet < scripts/reseed/seed-demo-customer-orders.js
const commerce = db.getSiblingDB('masova_commerce');
const EMAIL = 'anna.mueller@gmail.com';
const STORE = 'DOM001';
const template = commerce.orders.find({ customerEmail: EMAIL, storeId: STORE }).sort({ createdAt: -1 }).limit(1).toArray()[0];
if (!template) {
  print(`demo customer orders: no order found for ${EMAIL} at ${STORE}; place one order as that customer first`);
  quit(0);
}

// Amounts are stored in the same type the order service wrote on the template order.
const like = (sample, value) => typeof sample === 'string' ? value.toFixed(2)
  : sample && sample.constructor && sample.constructor.name === 'Decimal128' ? NumberDecimal(value.toFixed(2)) : Number(value.toFixed(2));
const dish = name => commerce.menu_items.findOne({ storeId: STORE, name });
const line = (name, quantity) => {
  const item = dish(name);
  if (!item) throw new Error(`menu item not found at ${STORE}: ${name}`);
  return { menuItemId: item._id.toString(), name, quantity: NumberInt(quantity), price: Number(item.basePrice) / 100, customizations: [], category: 'FOOD' };
};
const daysAgo = (days, hour, minute) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
};
const VAT_RATE = 0.07; // German reduced rate for delivered and collected food, included in prices

const ORDERS = [
  { number: 'ORD9000001041', days: 2, hour: 17, minute: 24, status: 'DELIVERED', orderType: 'DELIVERY', paymentStatus: 'PAID', lines: [['Chicken Tikka Masala', 1], ['Garlic Naan', 2], ['Mango Lassi', 1]] },
  { number: 'ORD9000001038', days: 5, hour: 16, minute: 5, status: 'COMPLETED', orderType: 'TAKEAWAY', paymentStatus: 'PAID', lines: [['Margherita Pizza', 1], ['Tiramisu', 1]] },
  { number: 'ORD9000001036', days: 8, hour: 11, minute: 40, status: 'CANCELLED', orderType: 'DELIVERY', paymentStatus: 'REFUNDED', lines: [['Paneer Butter Masala', 1], ['Butter Naan', 2]] },
];

let seeded = 0;
for (const spec of ORDERS) {
  const items = spec.lines.map(([name, quantity]) => line(name, quantity));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = spec.orderType === 'DELIVERY' ? 1.9 : 0;
  const gross = subtotal + deliveryFee;
  const vat = gross - gross / (1 + VAT_RATE);
  const createdAt = daysAgo(spec.days, spec.hour, spec.minute);
  const finishedAt = new Date(createdAt.getTime() + 40 * 60000);
  const order = {
    ...template,
    orderNumber: spec.number,
    items,
    subtotal: like(template.subtotal, subtotal),
    deliveryFee: like(template.deliveryFee, deliveryFee),
    tax: like(template.tax, vat),
    total: like(template.total, gross),
    totalNetAmount: like(template.totalNetAmount, gross - vat),
    totalVatAmount: like(template.totalVatAmount, vat),
    totalGrossAmount: like(template.totalGrossAmount, gross),
    status: spec.status,
    orderType: spec.orderType,
    paymentStatus: spec.paymentStatus,
    paymentMethod: 'CARD',
    cancellationRequested: false,
    createdAt,
    receivedAt: createdAt,
    updatedAt: finishedAt,
    version: NumberLong(0),
  };
  delete order._id;
  delete order.vatBreakdown;       // line-level VAT belongs to the template order's items
  delete order.estimatedDeliveryTime;
  delete order.deliveryOtp;
  if (spec.orderType !== 'DELIVERY') delete order.deliveryAddress;
  if (spec.status === 'DELIVERED') order.deliveredAt = finishedAt;
  if (spec.status !== 'CANCELLED') order.completedAt = finishedAt;
  commerce.orders.replaceOne({ orderNumber: spec.number }, order, { upsert: true });
  seeded += 1;
}
print(`demo customer orders: ${seeded} past orders upserted for ${EMAIL} at ${STORE}`);
