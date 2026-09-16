// Link orders.customerId to Customer.userId (JWT sub) for ownership checks.
const core = db.getSiblingDB("masova_core");
const commerce = db.getSiblingDB("masova_commerce");

const customers = core.customers.find({ storeId: "DOM001" }).toArray();
print("customers: " + customers.length);

const byEmail = {};
customers.forEach((c) => {
  if (c.email) {
    // Prefer userId — matches JWT `sub` used by gateway ownership checks
    byEmail[String(c.email).toLowerCase()] = c.userId || c._id;
  }
});

let n = 0;
commerce.orders.find({ storeId: "DOM001" }).forEach((o, i) => {
  let uid = null;
  if (o.customerEmail && byEmail[String(o.customerEmail).toLowerCase()]) {
    uid = byEmail[String(o.customerEmail).toLowerCase()];
  } else {
    const c = customers[i % customers.length];
    uid = c.userId || c._id;
  }
  commerce.orders.updateOne({ _id: o._id }, { $set: { customerId: uid } });
  n++;
});
print("updated " + n + " orders");

const sample = commerce.orders.findOne({ customerEmail: "anna.mueller@gmail.com" });
if (sample) {
  print("sample order customerId=" + sample.customerId);
  const anna = customers.find((c) => c.email === "anna.mueller@gmail.com");
  if (anna) print("anna userId=" + anna.userId + " match=" + (String(sample.customerId) === String(anna.userId)));
}
