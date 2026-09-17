// Run inside masova-mongodb:
// mongosh --file /tmp/mongo-fix-demo.js
// Or: docker exec -i masova-mongodb mongosh --quiet < mongo-fix-demo.js

function listCollections(dbName) {
  const d = db.getSiblingDB(dbName);
  print("=== " + dbName + " ===");
  d.getCollectionNames().forEach((c) => {
    print("  " + c + ": " + d.getCollection(c).countDocuments());
  });
}

["masova_core", "masova_commerce", "masova_payment", "masova_logistics", "masova_analytics", "masova_db"].forEach(
  listCollections
);

const core = db.getSiblingDB("masova_core");
const commerce = db.getSiblingDB("masova_commerce");

// Prefer customers collection in core or commerce or masova_db
let customers = [];
for (const name of ["masova_core", "masova_db", "masova_commerce"]) {
  const d = db.getSiblingDB(name);
  if (d.getCollectionNames().includes("customers")) {
    customers = d.customers.find({ storeId: "DOM001" }).toArray();
    print("Using customers from " + name + " count=" + customers.length);
    if (customers.length) break;
  }
}

if (!customers.length) {
  print("ERROR: no customers found for DOM001");
  quit(1);
}

// Build email -> customerId map
const byEmail = {};
const byName = {};
customers.forEach((c) => {
  if (c.email) byEmail[String(c.email).toLowerCase()] = c._id.str || c._id.toString();
  if (c.name) byName[String(c.name).toLowerCase()] = c._id.str || c._id.toString();
  // also store object id
  byEmail[String(c.email).toLowerCase()] = c._id;
  byName[String(c.name).toLowerCase()] = c._id;
});

const ordersColl = commerce.getCollectionNames().includes("orders")
  ? commerce.orders
  : commerce.getCollection("orders");

const allOrders = ordersColl.find({ storeId: "DOM001" }).toArray();
print("orders DOM001: " + allOrders.length);

let linked = 0;
let unlinked = 0;
allOrders.forEach((o, idx) => {
  let cid = null;
  if (o.customerEmail && byEmail[String(o.customerEmail).toLowerCase()]) {
    cid = byEmail[String(o.customerEmail).toLowerCase()];
  } else if (o.customerName && byName[String(o.customerName).toLowerCase()]) {
    cid = byName[String(o.customerName).toLowerCase()];
  } else {
    // round-robin assign
    cid = customers[idx % customers.length]._id;
  }
  const r = ordersColl.updateOne({ _id: o._id }, { $set: { customerId: cid } });
  if (r.modifiedCount || r.matchedCount) linked++;
  else unlinked++;
});
print("linked customerId on orders: " + linked);

// Diversify statuses for demo (leave some RECEIVED for kitchen)
const statuses = [
  "PREPARING",
  "OVEN",
  "BAKED",
  "READY",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "SERVED",
];
const received = ordersColl.find({ storeId: "DOM001", status: "RECEIVED" }).toArray();
print("RECEIVED before diversify: " + received.length);
received.forEach((o, i) => {
  if (i < 20) return; // keep first 20 as RECEIVED for KDS
  const st = statuses[i % statuses.length];
  ordersColl.updateOne({ _id: o._id }, { $set: { status: st } });
});
const after = {};
ordersColl.find({ storeId: "DOM001" }).forEach((o) => {
  after[o.status] = (after[o.status] || 0) + 1;
});
print("status histogram: " + JSON.stringify(after));

// Ensure EU fields on Berlin store
if (core.getCollectionNames().includes("stores")) {
  core.stores.updateOne(
    { code: "DOM001" },
    {
      $set: {
        countryCode: "DE",
        currency: "EUR",
        locale: "de-DE",
        vatNumber: "DE123456789",
        name: "MaSoVa Berlin Mitte",
      },
    }
  );
  print("DOM001 EU fields ensured");
}

print("DONE mongo-fix-demo");
