/**
 * 6-month manager-dashboard horizon seeder.
 * Spec: docs/COMPLETE_MANAGER_DASHBOARD_SEEDING_GUIDE.md
 *
 *   MONGO=mongodb://192.168.50.88:27017 node scripts/reseed/seed-manager-horizon.js
 *
 * Idempotent for HZN-* keys. Does not wipe demo logins (Demo@1234).
 */
const { MongoClient, ObjectId } = require('../node_modules/mongodb');
const bcrypt = require('../node_modules/bcryptjs');

const MONGO = process.env.MONGO || 'mongodb://192.168.50.88:27017';
const STORE = 'DOM001';
const PREFIX = 'HZN';

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260914);

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function chance(p) {
  return rng() < p;
}

const FIRST = ['Anna', 'Max', 'Lisa', 'Thomas', 'Sophie', 'Jonas', 'Clara', 'Felix', 'Mia', 'Leon', 'Emma', 'Paul', 'Lina', 'Noah', 'Marie', 'Ben', 'Hannah', 'Luis', 'Nina', 'Tim'];
const LAST = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger'];
const STREETS = ['Rosenthaler Str.', 'Friedrichstrasse', 'Alexanderplatz', 'Torstrasse', 'Kastanienallee', 'Oranienburger Str.', 'Unter den Linden', 'Prenzlauer Allee', 'Warschauer Str.', 'Karl-Marx-Allee'];

const DOW = [0.75, 0.8, 0.9, 1.05, 1.4, 1.5, 1.2]; // Mon..Sun (JS Sunday=0 → remap)
function dowFactor(date) {
  const js = date.getUTCDay(); // 0 Sun
  const idx = js === 0 ? 6 : js - 1;
  return DOW[idx];
}

function berlinDay(t0, minusDays) {
  const d = new Date(t0.getTime() - minusDays * 86400000);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function stampOnDay(day, hourFloat) {
  const h = Math.floor(hourFloat);
  const m = Math.floor((hourFloat - h) * 60);
  const s = Math.floor(rng() * 60);
  const d = new Date(day);
  d.setUTCHours(h - 2, m, s, 0); // Berlin CEST ≈ UTC+2 in Sep
  return d;
}

function pickServiceHour() {
  const p = rng();
  if (p < 0.3) return 11.5 + rng() * 2.5;
  if (p < 0.4) return 14 + rng() * 3.5;
  if (p < 0.9) return 17.5 + rng() * 4;
  return 21.5 + rng() * 1.5;
}

const MENU_SPEC = [
  { code: 'PIZ-001', name: 'Margherita Verace', cat: 'PIZZA', price: 11.5, prep: 12, all: ['CEREALS_GLUTEN', 'MILK'],
    ing: ['250g Type 00 flour', '80g San Marzano tomatoes', '100g Fior di Latte', 'Fresh basil', 'EVOO'],
    steps: ['Stretch dough to 12 inches', 'Spread crushed tomatoes', 'Tear mozzarella over the base', 'Bake 90s at 450°C', 'Finish with basil and oil'] },
  { code: 'PIZ-002', name: 'Diavola Piccante (Spicy Salami)', cat: 'PIZZA', price: 14.5, prep: 14, all: ['CEREALS_GLUTEN', 'MILK'],
    ing: ['250g Type 00 flour', '80g tomatoes', '90g mozzarella', '40g Spianata Calabrese', 'Chilli oil'],
    steps: ['Stretch dough', 'Sauce and cheese', 'Lay salami', 'Bake 90s', 'Drizzle chilli oil'] },
  { code: 'PIZ-003', name: 'Tartufo & Funghi (Truffle Mushroom)', cat: 'PIZZA', price: 16.5, prep: 15, all: ['CEREALS_GLUTEN', 'MILK'],
    ing: ['250g dough', 'Mushroom mix', 'Fior di Latte', 'Tartufata', 'Parsley'],
    steps: ['Stretch dough', 'Smear tartufata', 'Add mushrooms and cheese', 'Bake', 'Finish with oil'] },
  { code: 'PIZ-004', name: 'Parma Burrata & Rucola', cat: 'PIZZA', price: 17.5, prep: 14, all: ['CEREALS_GLUTEN', 'MILK'],
    ing: ['Dough', 'Tomato', 'Mozzarella', 'Prosciutto di Parma', 'Burrata', 'Rucola'],
    steps: ['Bake base with tomato and mozzarella', 'Drape Parma ham', 'Add burrata and rucola'] },
  { code: 'PIZ-005', name: 'Quattro Formaggi D.O.P.', cat: 'PIZZA', price: 15, prep: 13, all: ['CEREALS_GLUTEN', 'MILK'],
    ing: ['Mozzarella', 'Gorgonzola', 'Parmigiano', 'Fontina', 'Dough'],
    steps: ['Stretch', 'Distribute four cheeses', 'Bake until blistered'] },
  { code: 'PIZ-006', name: 'Vegan Ortolana (Roasted Veg)', cat: 'PIZZA', price: 13.5, prep: 14, all: ['CEREALS_GLUTEN'],
    ing: ['Dough', 'Tomato', 'Roasted peppers', 'Courgette', 'Aubergine', 'Basil'],
    steps: ['Stretch', 'Sauce', 'Roasted vegetables', 'Bake'] },
  { code: 'PAS-001', name: 'Tagliatelle al Tartufo', cat: 'SIDES', price: 16, prep: 16, all: ['CEREALS_GLUTEN', 'MILK', 'EGGS'],
    ing: ['Fresh tagliatelle', 'Butter', 'Parmigiano', 'Tartufata'],
    steps: ['Boil pasta 90s', 'Emulsify butter and tartufata', 'Toss and plate'] },
  { code: 'PAS-002', name: 'Rigatoni alla Carbonara Autentica', cat: 'SIDES', price: 15, prep: 14, all: ['CEREALS_GLUTEN', 'MILK', 'EGGS'],
    ing: ['Rigatoni', 'Guanciale', 'Egg yolks', 'Pecorino'],
    steps: ['Render guanciale', 'Cook pasta', 'Emulsify yolks off heat'] },
  { code: 'PAS-003', name: 'Penne all\'Arrabbiata', cat: 'SIDES', price: 12.5, prep: 12, all: ['CEREALS_GLUTEN'],
    ing: ['Penne', 'Tomato', 'Garlic', 'Chilli', 'Parsley'],
    steps: ['Sauté garlic and chilli', 'Add tomato', 'Toss pasta'] },
  { code: 'APP-001', name: 'Burrata Pugliese con Pomodorini', cat: 'SIDES', price: 9.5, prep: 6, all: ['MILK'],
    ing: ['Burrata', 'Cherry tomatoes', 'Basil', 'EVOO'],
    steps: ['Plate burrata', 'Scatter tomatoes', 'Dress with oil'] },
  { code: 'APP-002', name: 'Garlic Focaccia al Rosmarino', cat: 'SIDES', price: 6.5, prep: 8, all: ['CEREALS_GLUTEN'],
    ing: ['Focaccia dough', 'Garlic', 'Rosemary', 'EVOO'],
    steps: ['Dimple dough', 'Oil, garlic, rosemary', 'Bake'] },
  { code: 'APP-003', name: 'Arancini al Tartufo (3 pcs)', cat: 'SIDES', price: 8.5, prep: 10, all: ['CEREALS_GLUTEN', 'MILK'],
    ing: ['Arborio rice', 'Tartufata', 'Mozzarella', 'Breadcrumbs'],
    steps: ['Form arancini', 'Crumb', 'Fry 180°C'] },
  { code: 'DES-001', name: 'Classic Tiramisù della Casa', cat: 'DESSERT_SPECIALS', price: 6.5, prep: 2, all: ['MILK', 'EGGS', 'CEREALS_GLUTEN'],
    ing: ['Mascarpone', 'Espresso', 'Savoiardi', 'Cocoa'],
    steps: ['Portion chilled slice', 'Dust cocoa'] },
  { code: 'DES-002', name: 'Panna Cotta ai Frutti di Bosco', cat: 'DESSERT_SPECIALS', price: 5.5, prep: 2, all: ['MILK'],
    ing: ['Cream', 'Vanilla', 'Berry coulis'],
    steps: ['Unmould', 'Spoon berries'] },
  { code: 'BEV-001', name: 'San Pellegrino Sparkling Water (750ml)', cat: 'COLD_DRINKS', price: 4.5, prep: 1, all: [],
    ing: ['San Pellegrino 750ml'], steps: ['Chill and serve'] },
  { code: 'BEV-002', name: 'Acqua Panna Still (750ml)', cat: 'COLD_DRINKS', price: 4.5, prep: 1, all: [],
    ing: ['Acqua Panna 750ml'], steps: ['Chill and serve'] },
  { code: 'BEV-003', name: 'Peroni Nastro Azzurro Draft (500ml)', cat: 'COLD_DRINKS', price: 5.2, prep: 2, all: ['CEREALS_GLUTEN'],
    ing: ['Peroni draft'], steps: ['Pull 500ml'] },
  { code: 'BEV-004', name: 'Chianti Classico DOCG (Bottle)', cat: 'COLD_DRINKS', price: 28, prep: 2, all: ['SULPHUR_DIOXIDE'],
    ing: ['Chianti Classico DOCG'], steps: ['Open, decant if needed'] },
];

const INVENTORY = [
  ['ING-001', 'Caputo 00 Pizza Flour', 'RAW_MATERIAL', 180, 50, 'kg', 1.4],
  ['ING-002', 'San Marzano D.O.P. Tomatoes', 'INGREDIENT', 85, 30, 'kg', 2.8],
  ['ING-003', 'Fior di Latte Mozzarella', 'INGREDIENT', 42, 25, 'kg', 7.2],
  ['ING-004', 'Fresh Burrata Pugliese', 'INGREDIENT', 18, 15, 'pcs', 1.8],
  ['ING-005', 'Prosciutto di Parma 24M', 'INGREDIENT', 12.5, 8, 'kg', 24],
  ['ING-006', 'Spicy Spianata Calabrese', 'INGREDIENT', 9, 10, 'kg', 16.5],
  ['ING-007', 'Black Truffle Sauce (Tartufata)', 'INGREDIENT', 6, 8, 'kg', 38],
  ['ING-008', 'Parmigiano Reggiano 24M', 'INGREDIENT', 16, 10, 'kg', 19.5],
  ['ING-009', 'Extra Virgin Olive Oil D.O.P.', 'RAW_MATERIAL', 35, 20, 'L', 8.9],
  ['ING-010', 'Fresh Organic Basil', 'INGREDIENT', 3.5, 4, 'kg', 12],
  ['ING-011', 'Fresh Truffles (Seasonal)', 'INGREDIENT', 0, 0.5, 'kg', 350],
  ['PKG-001', 'Kraft Pizza Box 12" (Biodegradable)', 'PACKAGING', 620, 200, 'pcs', 0.32],
  ['PKG-002', 'Kraft Pasta Container (750ml)', 'PACKAGING', 340, 150, 'pcs', 0.24],
  ['PKG-003', 'Paper Carry Bags (Heavy Duty)', 'PACKAGING', 480, 200, 'pcs', 0.18],
  ['BEV-K1', 'Peroni Nastro Azzurro 30L Keg', 'BEVERAGE', 4, 2, 'keg', 85],
  ['BEV-K2', 'Chianti Classico Case (6x750ml)', 'BEVERAGE', 8, 4, 'case', 54],
];
for (let i = 12; i <= 30; i++) {
  INVENTORY.push([`ING-${String(i).padStart(3, '0')}`, `Prep item ${i}`, 'INGREDIENT', 20 + i, 8, 'kg', 2 + rng() * 6]);
}

const SUPPLIERS = [
  ['CAP-IT', 'Caputo Molino SpA', 'Gianni Caputo', '+39081234567', 'Naples', 'IT', ['RAW_MATERIAL'], true, 4.9, 4],
  ['LAT-IT', 'Latteria Sorrentina (Dairy)', 'Rosa Esposito', '+39081876543', 'Naples', 'IT', ['INGREDIENT'], true, 4.8, 2],
  ['FRU-DE', 'Fruttopoli Berlin Fresh Produce', 'Klaus Richter', '+49301234001', 'Berlin', 'DE', ['INGREDIENT'], true, 4.7, 1],
  ['PAR-IT', 'Parma Cured Meats Export', 'Matteo Rossi', '+39052199887', 'Parma', 'IT', ['INGREDIENT'], true, 4.9, 5],
  ['BIO-DE', 'BioPack Berlin Packaging Ltd', 'Anja Wolf', '+49301234002', 'Berlin', 'DE', ['PACKAGING'], false, 4.6, 3],
  ['VIN-DE', 'Vino & Birra European Importers', 'Stefan Lang', '+49891234003', 'Munich', 'DE', ['BEVERAGE'], true, 4.8, 3],
];

const STAFF = [
  { email: 'manager.berlin@gmail.com', name: 'Alexander Weber', type: 'MANAGER', role: 'MANAGER', pin: '1001' },
  { email: 'assistant.berlin@gmail.com', name: 'Sophie Neumann', type: 'ASSISTANT_MANAGER', role: 'ASSISTANT_MANAGER', pin: '1002' },
  { email: 'kitchen.berlin@gmail.com', name: 'Marco Rossi', type: 'STAFF', role: 'Head Chef', pin: '2001' },
  { email: 'jan.kowalski@masova.com', name: 'Jan Kowalski', type: 'STAFF', role: 'Line Cook - Pizza', pin: '2002' },
  { email: 'fatima.almansoor@masova.com', name: 'Fatima Al-Mansoor', type: 'STAFF', role: 'Prep Cook', pin: '2003' },
  { email: 'elena.becker@masova.com', name: 'Elena Becker', type: 'STAFF', role: 'Head Server', pin: '3001' },
  { email: 'cashier.berlin@gmail.com', name: 'David Kim', type: 'STAFF', role: 'Cashier / Server', pin: '3002' },
  { email: 'clara.dupont@masova.com', name: 'Clara Dupont', type: 'STAFF', role: 'Hostess', pin: '3003' },
  { email: 'driver.berlin@gmail.com', name: 'Lukas Schneider', type: 'DRIVER', role: 'DRIVER', pin: '4001', vehicle: 'E-Bike', license: 'B-LS-2024' },
  { email: 'mateo.silva@masova.com', name: 'Mateo Silva', type: 'DRIVER', role: 'DRIVER', pin: '4002', vehicle: 'Scooter', license: 'B-MS-2024' },
  { email: 'tariq.hassan@masova.com', name: 'Tariq Hassan', type: 'DRIVER', role: 'DRIVER', pin: '4003', vehicle: 'Car', license: 'B-TH-2024' },
  { email: 'jonas.schmidt@masova.com', name: 'Jonas Schmidt', type: 'DRIVER', role: 'DRIVER', pin: '4004', vehicle: 'E-Bike', license: 'B-JS-2024' },
];

const COMM = { WOLT: 25, DELIVEROO: 28, UBER_EATS: 30, JUST_EAT: 22 };

function sourcePick() {
  const p = rng();
  if (p < 0.55) return 'MASOVA';
  if (p < 0.75) return 'MASOVA'; // POS walk-in still MASOVA enum
  if (p < 0.87) return 'WOLT';
  if (p < 0.94) return 'DELIVEROO';
  if (p < 0.98) return 'UBER_EATS';
  return 'JUST_EAT';
}

function typePick() {
  const p = rng();
  if (p < 0.48) return 'DELIVERY';
  if (p < 0.8) return 'DINE_IN';
  return 'TAKEAWAY';
}

async function bulkUpsert(col, docs, key) {
  if (!docs.length) return 0;
  const ops = docs.map((d) => ({
    updateOne: { filter: { [key]: d[key] }, update: { $set: d }, upsert: true },
  }));
  const r = await col.bulkWrite(ops, { ordered: false });
  return (r.upsertedCount || 0) + (r.modifiedCount || 0);
}

async function insertChunks(col, docs, size = 500) {
  let n = 0;
  for (let i = 0; i < docs.length; i += size) {
    const chunk = docs.slice(i, i + size);
    if (!chunk.length) continue;
    await col.insertMany(chunk, { ordered: false });
    n += chunk.length;
  }
  return n;
}

async function main() {
  const t0 = new Date();
  const client = new MongoClient(MONGO, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const core = client.db('masova_core');
  const commerce = client.db('masova_commerce');
  const logistics = client.db('masova_logistics');
  const payment = client.db('masova_payment');

  const existingManager = await core.collection('users').findOne({ 'personalInfo.email': 'manager.berlin@gmail.com' });
  const pwHash = existingManager?.personalInfo?.passwordHash || bcrypt.hashSync('Demo@1234', 10);
  const pinCache = {};
  const pinHash = (pin) => {
    if (!pinCache[pin]) pinCache[pin] = bcrypt.hashSync(pin, 8);
    return pinCache[pin];
  };

  console.log('[horizon] connected T0=', t0.toISOString());

  // 1. Stores
  const storeSpecs = [
    { code: 'DOM001', name: 'MaSoVa Berlin Mitte Flagship', city: 'Berlin', pincode: '10178', countryCode: 'DE', currency: 'EUR', locale: 'de-DE', street: 'Rosenthaler Str. 40-41', lat: 52.5297, lng: 13.4015, phone: '+493012345678' },
    { code: 'DOM002', name: 'MaSoVa Munich Schwabing', city: 'Munich', pincode: '80802', countryCode: 'DE', currency: 'EUR', locale: 'de-DE', street: 'Leopoldstrasse 12', lat: 48.159, lng: 11.58, phone: '+498912345670' },
    { code: 'DOM003', name: 'MaSoVa London Soho', city: 'London', pincode: 'W1D 4HA', countryCode: 'GB', currency: 'GBP', locale: 'en-GB', street: 'Dean Street 20', lat: 51.513, lng: -0.133, phone: '+442071234567' },
  ];
  for (const s of storeSpecs) {
    await core.collection('stores').updateOne(
      { code: s.code },
      {
        $set: {
          name: s.name,
          code: s.code,
          phoneNumber: s.phone,
          regionId: s.countryCode === 'GB' ? 'EU-GB' : 'EU-DE',
          status: 'ACTIVE',
          countryCode: s.countryCode,
          currency: s.currency,
          locale: s.locale,
          address: { street: s.street, city: s.city, state: s.city, pincode: s.pincode, latitude: s.lat, longitude: s.lng },
          configuration: {
            deliveryRadiusKm: 8.5,
            maxConcurrentOrders: 60,
            estimatedPrepTimeMinutes: 22,
            acceptsOnlineOrders: true,
            acceptsCashPayments: true,
            maxDeliveryTimeMinutes: 35,
            minimumOrderValueINR: 15,
          },
          lastModified: t0,
        },
        $setOnInsert: { createdAt: new Date('2024-03-01T08:00:00Z'), openingDate: new Date('2024-03-01T08:00:00Z'), _class: 'com.MaSoVa.shared.entity.Store' },
      },
      { upsert: true }
    );
  }
  console.log('[horizon] stores upserted');

  // 2. Staff
  const staffIds = {};
  for (const st of STAFF) {
    const existing = await core.collection('users').findOne({ 'personalInfo.email': st.email });
    const emp = {
      storeId: STORE,
      role: st.role,
      status: 'AVAILABLE',
      rating: 4.7,
      activeDeliveryCount: 0,
      employeePINHash: pinHash(st.pin),
      pinSuffix: st.pin.slice(-2),
      isKioskAccount: false,
    };
    if (st.vehicle) emp.vehicleType = st.vehicle;
    if (st.license) emp.licenseNumber = st.license;
    if (existing) {
      await core.collection('users').updateOne(
        { _id: existing._id },
        {
          $set: {
            type: st.type,
            isActive: true,
            'personalInfo.name': st.name,
            'personalInfo.email': st.email,
            employeeDetails: emp,
          },
        }
      );
      staffIds[st.email] = String(existing._id);
    } else {
      const id = new ObjectId();
      await core.collection('users').insertOne({
        _id: id,
        type: st.type,
        personalInfo: {
          name: st.name,
          email: st.email,
          phone: '+49171' + String(Math.floor(10000000 + rng() * 89999999)),
          passwordHash: pwHash,
        },
        employeeDetails: emp,
        createdAt: t0,
        isActive: true,
        authProviders: [],
        _class: 'com.MaSoVa.shared.entity.User',
      });
      staffIds[st.email] = String(id);
    }
  }
  const managerId = staffIds['manager.berlin@gmail.com'];
  const driverIds = [
    staffIds['driver.berlin@gmail.com'],
    staffIds['mateo.silva@masova.com'],
    staffIds['tariq.hassan@masova.com'],
    staffIds['jonas.schmidt@masova.com'],
  ];
  const fohIds = [staffIds['elena.becker@masova.com'], staffIds['cashier.berlin@gmail.com'], staffIds['clara.dupont@masova.com']];
  const kitchenIds = [staffIds['kitchen.berlin@gmail.com'], staffIds['jan.kowalski@masova.com'], staffIds['fatima.almansoor@masova.com']];
  console.log('[horizon] staff', Object.keys(staffIds).length);

  // Kiosk POS-01
  const kioskEmail = 'kiosk.DOM001.POS-01@masova.internal';
  const kioskExisting = await core.collection('users').findOne({ 'personalInfo.email': kioskEmail });
  if (kioskExisting) {
    await core.collection('users').updateOne(
      { _id: kioskExisting._id },
      {
        $set: {
          type: 'STAFF',
          isActive: true,
          'personalInfo.name': 'POS-01 Berlin Mitte',
          employeeDetails: { storeId: STORE, role: 'KIOSK', status: 'AVAILABLE', isKioskAccount: true, terminalId: 'POS-01' },
        },
      }
    );
  } else {
    await core.collection('users').insertOne({
      type: 'STAFF',
      isActive: true,
      personalInfo: { email: kioskEmail, passwordHash: pwHash, phone: '+493000000001', name: 'POS-01 Berlin Mitte' },
      employeeDetails: { storeId: STORE, role: 'KIOSK', status: 'AVAILABLE', isKioskAccount: true, terminalId: 'POS-01' },
      createdAt: t0,
      _class: 'com.MaSoVa.shared.entity.User',
    });
  }

  // 3. Suppliers + inventory
  const supplierIds = {};
  for (const [code, name, contact, phone, city, country, cats, pref, rating, lead] of SUPPLIERS) {
    const doc = {
      supplierCode: code,
      supplierName: name,
      contactPerson: contact,
      phoneNumber: phone,
      email: `${code.toLowerCase()}@supplier.example`,
      addressLine1: 'Via Fornitore 1',
      city,
      state: city,
      pincode: country === 'DE' ? '10115' : '80100',
      country,
      businessType: 'DISTRIBUTOR',
      paymentTerms: 'NET_30',
      creditDays: 30,
      creditLimit: '8000.00',
      categoriesSupplied: cats,
      status: 'ACTIVE',
      isPreferred: pref,
      qualityRating: rating,
      averageLeadTimeDays: lead,
      onTimeDeliveryRate: 97,
      createdBy: 'horizon',
      updatedAt: t0,
      _class: 'com.MaSoVa.logistics.inventory.entity.Supplier',
    };
    await logistics.collection('suppliers').updateOne({ supplierCode: code }, { $set: doc, $setOnInsert: { createdAt: t0 } }, { upsert: true });
    const saved = await logistics.collection('suppliers').findOne({ supplierCode: code });
    supplierIds[code] = String(saved._id);
  }
  const invIds = {};
  for (const [code, name, cat, stock, reorder, unit, cost] of INVENTORY) {
    const status = stock === 0 ? 'OUT_OF_STOCK' : stock <= reorder ? 'LOW_STOCK' : 'AVAILABLE';
    const primary = cat === 'PACKAGING' ? supplierIds['BIO-DE'] : cat === 'BEVERAGE' ? supplierIds['VIN-DE'] : supplierIds['LAT-IT'];
    const doc = {
      storeId: STORE,
      itemCode: code,
      itemName: name,
      category: cat,
      unit,
      currentStock: stock,
      reservedStock: 0,
      minimumStock: reorder,
      maximumStock: reorder * 6,
      reorderQuantity: reorder * 2,
      unitCost: cost,
      averageCost: cost,
      lastPurchaseCost: cost,
      primarySupplierId: primary,
      alternativeSupplierIds: [],
      isPerishable: ['INGREDIENT', 'RAW_MATERIAL'].includes(cat),
      batchTracked: false,
      status,
      autoReorder: true,
      description: 'Horizon inventory',
      storageLocation: 'Walk-in',
      lastUpdatedBy: 'horizon',
      updatedAt: t0,
      _class: 'com.MaSoVa.logistics.inventory.entity.InventoryItem',
    };
    if (code === 'ING-004') doc.expiryDate = new Date(t0.getTime() + 3 * 86400000);
    if (code === 'ING-003') doc.expiryDate = new Date(t0.getTime() + 5 * 86400000);
    await logistics.collection('inventory_items').updateOne(
      { storeId: STORE, itemCode: code },
      { $set: doc, $setOnInsert: { createdAt: t0 } },
      { upsert: true }
    );
    const saved = await logistics.collection('inventory_items').findOne({ storeId: STORE, itemCode: code });
    invIds[code] = String(saved._id);
  }
  console.log('[horizon] suppliers', Object.keys(supplierIds).length, 'inventory', Object.keys(invIds).length);

  // 4. Menu + recipes
  const menuByName = {};
  for (const m of MENU_SPEC) {
    const cents = Math.round(m.price * 100);
    const set = {
      name: m.name,
      description: m.name,
      cuisine: 'ITALIAN',
      category: m.cat,
      basePrice: cents,
      spiceLevel: 'MILD',
      isAvailable: true,
      preparationTime: m.prep,
      servingSize: '1 portion',
      ingredients: m.ing,
      preparationInstructions: m.steps,
      allergens: m.all,
      allergensDeclared: true,
      storeId: STORE,
      isRecommended: m.code.startsWith('PIZ'),
      tags: [m.code],
      updatedAt: t0,
      _class: 'com.MaSoVa.shared.entity.MenuItem',
    };
    await commerce.collection('menu_items').updateOne(
      { storeId: STORE, name: m.name },
      { $set: set, $setOnInsert: { createdAt: t0, variants: [], customizations: [], dietaryInfo: [], displayOrder: 200 } },
      { upsert: true }
    );
    const saved = await commerce.collection('menu_items').findOne({ storeId: STORE, name: m.name });
    menuByName[m.name] = saved;
  }
  const menuList = Object.values(menuByName);
  console.log('[horizon] italian menu', menuList.length);

  // 5. Equipment
  const equipment = [
    ['EQ-01', 'Valoriani Rotary Gas Oven', 'OVEN', 'OPERATIONAL', 440, true, 88],
    ['EQ-02', 'Moretti Forni Deck Oven 2', 'OVEN', 'IN_USE', 380, true, 54],
    ['EQ-03', 'Pasta Cooker Electrolux Pro', 'STOVE', 'IN_USE', 100, true, 42],
    ['EQ-04', 'Double Basket Deep Fryer', 'FRYER', 'OPERATIONAL', 180, true, 29],
    ['EQ-05', 'Cast Iron Char Grill', 'GRILL', 'OPERATIONAL', 220, true, 18],
    ['EQ-06', 'Walk-in Cold Room A', 'REFRIGERATOR', 'OPERATIONAL', 3, true, 0],
    ['EQ-07', 'Under-Counter Prep Fridge 1', 'REFRIGERATOR', 'OPERATIONAL', 4, true, 0],
    ['EQ-08', 'Salvis Commercial Dishwasher', 'DISHWASHER', 'MAINTENANCE', 65, false, 12],
  ];
  for (const [code, name, type, status, temp, on, usage] of equipment) {
    await commerce.collection('kitchen_equipment').updateOne(
      { storeId: STORE, equipmentName: name },
      {
        $set: {
          storeId: STORE,
          equipmentName: name,
          type,
          status,
          temperature: temp,
          isOn: on,
          usageCount: usage,
          lastMaintenanceDate: new Date(t0.getTime() - 20 * 86400000),
          nextMaintenanceDate: code === 'EQ-08' ? new Date('2026-09-18T00:00:00Z') : new Date(t0.getTime() + 30 * 86400000),
          maintenanceNotes: code,
          updatedAt: t0,
          _class: 'com.MaSoVa.commerce.order.entity.KitchenEquipment',
        },
        $setOnInsert: { createdAt: t0 },
      },
      { upsert: true }
    );
  }

  await commerce.collection('aggregator_connections').deleteMany({ storeId: STORE, notes: 'horizon' });
  for (const [platform, pct] of Object.entries(COMM)) {
    await commerce.collection('aggregator_connections').updateOne(
      { storeId: STORE, platform },
      { $set: { storeId: STORE, platform, commissionPercent: pct, active: true, notes: 'horizon' } },
      { upsert: true }
    );
  }

  // 6. Customers (250)
  await core.collection('users').deleteMany({ 'personalInfo.email': /^hzn\.cust\./ });
  await core.collection('customers').deleteMany({ notes: { $regex: /^horizon:/ } });
  const customers = [];
  const customerUsers = [];
  for (let i = 0; i < 250; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
    const name = `${first} ${last}`;
    const email = `hzn.cust.${String(i + 1).padStart(3, '0')}@masova.example.de`;
    const phone = `+49151${String(2000000 + i).padStart(7, '0')}`;
    const userId = new ObjectId();
    const custId = new ObjectId();
    const addrId = new ObjectId().toString();
    let lastOrderDays;
    let churn;
    let tags;
    if (i < 18) {
      lastOrderDays = 46 + Math.floor(rng() * 40);
      churn = 0.81 + rng() * 0.15;
      tags = ['At Risk'];
    } else if (i < 52) {
      lastOrderDays = 21 + Math.floor(rng() * 23);
      churn = 0.5 + rng() * 0.29;
      tags = ['Lapsing'];
    } else {
      lastOrderDays = Math.floor(rng() * 14);
      churn = rng() * 0.29;
      tags = chance(0.2) ? ['VIP', 'Frequent Diner'] : ['Loyal'];
    }
    customerUsers.push({
      _id: userId,
      type: 'CUSTOMER',
      personalInfo: { name, email, phone, passwordHash: pwHash },
      createdAt: new Date(t0.getTime() - (60 + i) * 86400000),
      isActive: true,
      authProviders: [],
      _class: 'com.MaSoVa.shared.entity.User',
    });
    customers.push({
      _id: custId,
      userId: String(userId),
      storeId: STORE,
      storeIds: [STORE],
      name,
      email,
      phone,
      addresses: [
        {
          _id: addrId,
          label: 'HOME',
          addressLine1: `${pick(STREETS)} ${10 + (i % 80)}`,
          city: 'Berlin',
          state: 'Berlin',
          postalCode: '10178',
          country: 'Germany',
          latitude: 52.52 + rng() * 0.03,
          longitude: 13.39 + rng() * 0.04,
          isDefault: true,
        },
      ],
      defaultAddressId: addrId,
      loyaltyInfo: { totalPoints: Math.floor(rng() * 1850), pointsEarned: Math.floor(rng() * 1850), pointsRedeemed: 0 },
      preferences: {},
      orderStats: { totalOrders: 0, totalSpend: 0, lastOrderDate: new Date(t0.getTime() - lastOrderDays * 86400000) },
      active: true,
      marketingOptIn: true,
      smsOptIn: chance(0.5),
      tags,
      notes: `horizon:churn=${churn.toFixed(2)}`,
      churnProbability: churn,
      createdAt: new Date(t0.getTime() - (90 + i) * 86400000),
      updatedAt: t0,
      _class: 'com.MaSoVa.shared.entity.Customer',
    });
  }
  // Keep Anna as extra VIP
  const anna = await core.collection('customers').findOne({ email: 'anna.mueller@gmail.com' });
  await insertChunks(core.collection('users'), customerUsers);
  await insertChunks(core.collection('customers'), customers);
  const custPool = customers.map((c) => ({ userId: c.userId, name: c.name, email: c.email, phone: c.phone, last: c.orderStats.lastOrderDate }));
  if (anna) custPool.unshift({ userId: anna.userId, name: anna.name, email: anna.email, phone: anna.phone, last: t0 });
  console.log('[horizon] customers', custPool.length);

  // 7. Shifts + sessions
  await core.collection('shifts').deleteMany({ notes: 'horizon' });
  await core.collection('working_sessions').deleteMany({ notes: 'horizon' });
  const staffList = Object.entries(staffIds);
  const shifts = [];
  for (let w = 0; w < 26; w++) {
    for (let d = 0; d < 7; d++) {
      const day = berlinDay(t0, w * 7 + d);
      const morningStart = new Date(day.getTime() + 10 * 3600000);
      const morningEnd = new Date(day.getTime() + 16.5 * 3600000);
      const eveningStart = new Date(day.getTime() + 16.5 * 3600000);
      const eveningEnd = new Date(day.getTime() + 23.5 * 3600000);
      const isCurrentWeek = w === 0;
      const isToday = w === 0 && d === 0;
      for (const [email, id] of staffList) {
        const isDriver = email.includes('driver') || email.includes('mateo') || email.includes('tariq') || email.includes('jonas');
        const type = isDriver ? 'PEAK' : 'REGULAR';
        const slot = chance(0.5);
        const start = slot ? morningStart : eveningStart;
        const end = slot ? morningEnd : eveningEnd;
        let status = 'COMPLETED';
        if (isToday) status = 'IN_PROGRESS';
        else if (isCurrentWeek) status = 'SCHEDULED';
        shifts.push({
          storeId: STORE,
          employeeId: id,
          type,
          scheduledStart: start,
          scheduledEnd: end,
          actualStart: status === 'SCHEDULED' ? null : start,
          actualEnd: status === 'COMPLETED' ? end : null,
          status,
          roleRequired: STAFF.find((s) => s.email === email)?.role,
          isMandatory: true,
          notes: 'horizon',
          createdAt: start,
          createdBy: managerId,
          _class: 'com.MaSoVa.shared.entity.Shift',
        });
      }
    }
  }
  await insertChunks(core.collection('shifts'), shifts, 400);
  const sessions = [
    ['manager.berlin@gmail.com', 9.5],
    ['kitchen.berlin@gmail.com', 10.75],
    ['jan.kowalski@masova.com', 11],
    ['elena.becker@masova.com', 11.25],
    ['driver.berlin@gmail.com', 11.5],
  ].map(([email, hour]) => ({
    employeeId: staffIds[email],
    employeeName: STAFF.find((s) => s.email === email).name,
    storeId: STORE,
    date: berlinDay(t0, 0),
    loginTime: stampOnDay(berlinDay(t0, 0), hour),
    isActive: true,
    breakDurationMinutes: 0,
    notes: 'horizon',
    status: 'ACTIVE',
    requiresApproval: false,
    violations: [],
    createdAt: t0,
    lastModified: t0,
    mandatoryBreakTaken: false,
    overtimeApproved: false,
    emergencySession: false,
    _class: 'com.MaSoVa.shared.entity.WorkingSession',
  }));
  sessions.push(
    {
      employeeId: staffIds['cashier.berlin@gmail.com'],
      employeeName: 'David Kim',
      storeId: STORE,
      date: berlinDay(t0, 0),
      loginTime: stampOnDay(berlinDay(t0, 0), 12),
      isActive: true,
      breakDurationMinutes: 0,
      notes: 'horizon',
      status: 'PENDING_APPROVAL',
      requiresApproval: true,
      violations: [],
      createdAt: t0,
      lastModified: t0,
      mandatoryBreakTaken: false,
      overtimeApproved: false,
      emergencySession: false,
      _class: 'com.MaSoVa.shared.entity.WorkingSession',
    },
    {
      employeeId: staffIds['mateo.silva@masova.com'],
      employeeName: 'Mateo Silva',
      storeId: STORE,
      date: berlinDay(t0, 0),
      loginTime: stampOnDay(berlinDay(t0, 0), 12.25),
      isActive: true,
      breakDurationMinutes: 0,
      notes: 'horizon',
      status: 'PENDING_APPROVAL',
      requiresApproval: true,
      violations: [],
      createdAt: t0,
      lastModified: t0,
      mandatoryBreakTaken: false,
      overtimeApproved: false,
      emergencySession: false,
      _class: 'com.MaSoVa.shared.entity.WorkingSession',
    }
  );
  await core.collection('working_sessions').insertMany(sessions);
  console.log('[horizon] shifts', shifts.length, 'sessions', sessions.length);

  // 8. Historical orders + payments
  await commerce.collection('orders').deleteMany({ orderNumber: { $regex: `^${PREFIX}-` } });
  await payment.collection('transactions').deleteMany({ receipt: { $regex: `^${PREFIX}-` } });
  await payment.collection('refunds').deleteMany({ notes: { $regex: /^horizon:/ } });
  await logistics.collection('delivery_trackings').deleteMany({ notes: 'horizon' });

  const monthDaily = [
    [180, 150, 86],
    [150, 120, 96],
    [120, 90, 110],
    [90, 60, 120],
    [60, 30, 130],
    [30, 1, 146],
  ];

  function buildOrder(seq, when, liveStatus) {
    const cust = pick(custPool);
    const item = pick(menuList);
    const qty = chance(0.25) ? 2 : 1;
    const type = typePick();
    const source = type === 'DINE_IN' ? 'MASOVA' : sourcePick();
    const unit = (item.basePrice || 1150) / 100;
    const sub = +(unit * qty).toFixed(2);
    const fee = type === 'DELIVERY' ? 2.5 : 0;
    const vat = +((sub + fee) * 0.19 / 1.19).toFixed(2);
    const net = +(sub + fee - vat).toFixed(2);
    const gross = +(sub + fee).toFixed(2);
    const id = new ObjectId();
    const txId = new ObjectId();
    const orderNumber = `${PREFIX}-${when.toISOString().slice(0, 10).replace(/-/g, '')}-${String(seq).padStart(5, '0')}`;
    let status = liveStatus;
    if (!status) {
      const r = rng();
      if (r < 0.025) status = 'CANCELLED';
      else if (r < 0.04) status = 'COMPLETED';
      else status = type === 'DELIVERY' ? 'DELIVERED' : type === 'DINE_IN' ? 'SERVED' : 'COMPLETED';
    }
    const paid = status !== 'CANCELLED';
    const method = chance(0.13) ? 'CASH' : 'CARD';
    const staffId = type === 'DINE_IN' || source === 'MASOVA' ? pick(fohIds) : pick(fohIds);
    const kitchenStaff = pick(kitchenIds);
    const commPct = COMM[source] || 0;
    const commission = commPct ? +((gross * commPct) / 100).toFixed(2) : null;
    const payout = commPct ? +(gross - commission).toFixed(2) : null;
    const signFail = false;
    const order = {
      _id: id,
      orderNumber,
      customerId: cust.userId,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      storeId: STORE,
      items: [{ menuItemId: String(item._id), name: item.name, quantity: qty, price: unit, category: 'FOOD' }],
      subtotal: sub,
      deliveryFee: fee,
      tax: vat,
      total: gross,
      vatCountryCode: 'DE',
      currency: 'EUR',
      totalNetAmount: net,
      totalVatAmount: vat,
      totalGrossAmount: gross,
      vatBreakdown: { standardRate: 19.0, standardNet: net, standardVat: vat, totalGross: gross },
      status,
      orderType: type,
      paymentStatus: paid ? 'PAID' : 'PENDING',
      paymentMethod: method,
      paymentTransactionId: paid ? String(txId) : null,
      priority: 'NORMAL',
      preparationTime: item.preparationTime || 14,
      orderSource: source,
      aggregatorCommission: commission,
      aggregatorNetPayout: payout,
      createdByStaffId: staffId,
      createdByStaffName: STAFF.find((s) => staffIds[s.email] === staffId)?.name,
      assignedKitchenStaffId: kitchenStaff,
      createdAt: when,
      receivedAt: when,
      updatedAt: when,
      cancellationRequested: false,
      _class: 'com.MaSoVa.commerce.order.entity.Order',
    };
    if (type === 'DELIVERY') {
      order.deliveryAddress = {
        street: `${pick(STREETS)} ${Math.floor(rng() * 80) + 1}`,
        city: 'Berlin',
        state: 'Berlin',
        pincode: '10178',
        latitude: 52.52 + rng() * 0.03,
        longitude: 13.4 + rng() * 0.03,
      };
      if (status === 'DELIVERED') {
        order.assignedDriverId = pick(driverIds);
        order.deliveredAt = new Date(when.getTime() + 40 * 60000);
        order.completedAt = order.deliveredAt;
      }
    }
    if (type === 'DINE_IN') {
      order.tableNumber = String(1 + Math.floor(rng() * 18));
      order.guestCount = 1 + Math.floor(rng() * 6);
    }
    if (paid && status !== 'CANCELLED' && !['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(status)) {
      order.fiscalSignature = {
        signerCountry: 'DE',
        signerSystem: 'TSE',
        transactionId: `tse-${orderNumber}`,
        signatureValue: `ecdsa-${id}`,
        qrCodeData: `DE-TSE-${orderNumber}`,
        signedAt: when,
        signingDeviceId: 'TSE-BER-001',
        required: true,
        signingFailed: signFail,
      };
    }
    if (status === 'CANCELLED') {
      order.cancellationReason = 'Customer cancelled before prep';
      order.cancelledAt = new Date(when.getTime() + 6 * 60000);
    }
    const tx = paid
      ? {
          _id: txId,
          orderId: String(id),
          amount: String(gross.toFixed(2)),
          status: 'SUCCESS',
          paymentMethod: method,
          customerId: cust.userId,
          customerEmail: cust.email,
          customerPhone: cust.phone,
          storeId: STORE,
          receipt: orderNumber,
          currency: 'EUR',
          paymentGateway: method === 'CASH' ? 'CASH' : 'STRIPE',
          razorpayOrderId: `rzp_${txId}`,
          razorpayPaymentId: `pay_${txId}`,
          stripePaymentIntentId: method === 'CASH' ? `cash_${txId}` : `pi_${id}`,
          paymentMethodType: method === 'CASH' ? 'cash' : 'card',
          createdAt: when,
          updatedAt: when,
          paidAt: when,
          reconciled: true,
          _class: 'com.MaSoVa.payment.entity.Transaction',
        }
      : null;
    return { order, tx };
  }

  let seq = 1;
  const orderBuf = [];
  const txBuf = [];
  let histCount = 0;
  for (const [from, to, base] of monthDaily) {
    for (let day = from; day > to; day--) {
      const d = berlinDay(t0, day);
      const n = Math.max(8, Math.round(base * dowFactor(d) * (0.9 + rng() * 0.2)));
      for (let i = 0; i < n; i++) {
        const when = stampOnDay(d, pickServiceHour());
        const built = buildOrder(seq++, when, null);
        orderBuf.push(built.order);
        if (built.tx) txBuf.push(built.tx);
        histCount++;
        if (orderBuf.length >= 800) {
          await insertChunks(commerce.collection('orders'), orderBuf, 800);
          await insertChunks(payment.collection('transactions'), txBuf, 800);
          orderBuf.length = 0;
          txBuf.length = 0;
        }
      }
    }
  }
  console.log('[horizon] historical generated', histCount);

  // Today 85 completed
  for (let i = 0; i < 85; i++) {
    const when = stampOnDay(berlinDay(t0, 0), 11.5 + rng() * 7);
    const built = buildOrder(seq++, when, chance(0.5) ? 'DELIVERED' : 'COMPLETED');
    orderBuf.push(built.order);
    if (built.tx) txBuf.push(built.tx);
  }

  const livePlan = [
    ...Array(3).fill('RECEIVED'),
    ...Array(5).fill('PREPARING'),
    ...Array(4).fill('OVEN'),
    ...Array(2).fill('BAKED'),
    ...Array(3).fill('READY'),
    ...Array(2).fill('DISPATCHED'),
    ...Array(1).fill('OUT_FOR_DELIVERY'),
  ];
  const liveOrders = [];
  livePlan.forEach((st, idx) => {
    const age = st === 'RECEIVED' ? 3 : st === 'PREPARING' ? 8 : st === 'OVEN' ? 12 : st === 'BAKED' ? 16 : st === 'READY' ? 20 : 28;
    const when = new Date(t0.getTime() - age * 60000);
    const built = buildOrder(seq++, when, st);
    if (st === 'DISPATCHED' || st === 'OUT_FOR_DELIVERY') {
      built.order.assignedDriverId = driverIds[idx % driverIds.length];
      built.order.orderType = 'DELIVERY';
    }
    liveOrders.push(built);
    orderBuf.push(built.order);
    if (built.tx) txBuf.push(built.tx);
  });

  // 2 cancel requests
  for (const reason of ['Accidental double order via mobile', 'Running 1 hour late, please cancel']) {
    const when = new Date(t0.getTime() - 12 * 60000);
    const built = buildOrder(seq++, when, 'PREPARING');
    built.order.cancellationRequested = true;
    built.order.cancellationRequestReason = reason;
    built.order.cancellationRequestedBy = built.order.customerId;
    built.order.cancellationRequestedAt = t0;
    orderBuf.push(built.order);
    if (built.tx) txBuf.push(built.tx);
  }

  // 2 TSE failures
  orderBuf.slice(-4, -2).forEach((o) => {
    o.fiscalSignature = {
      signerCountry: 'DE',
      signerSystem: 'TSE',
      transactionId: `tse-fail-${o.orderNumber}`,
      signatureValue: null,
      signedAt: t0,
      signingDeviceId: 'TSE-BER-001',
      required: true,
      signingFailed: true,
      signingError: 'TSE smart card timeout (code 0x4002) during peak transaction spike',
    };
  });

  if (orderBuf.length) {
    await insertChunks(commerce.collection('orders'), orderBuf, 800);
    await insertChunks(payment.collection('transactions'), txBuf, 800);
  }
  console.log('[horizon] orders flushed seq=', seq - 1);

  // Refunds 45 + 2 today
  const paidTx = await payment.collection('transactions').find({ storeId: STORE, status: 'SUCCESS' }).limit(80).toArray();
  const refunds = [];
  for (let i = 0; i < 47 && i < paidTx.length; i++) {
    const tx = paidTx[i];
    const full = i < 32;
    const amt = full ? tx.amount : '8.50';
    refunds.push({
      transactionId: String(tx._id),
      orderId: tx.orderId,
      storeId: STORE,
      razorpayRefundId: `rfnd_hzn_${i}_${tx._id}`,
      razorpayPaymentId: tx.razorpayPaymentId || `pay_${tx._id}`,
      amount: String(amt),
      status: i >= 45 ? 'PENDING_APPROVAL' : 'PROCESSED',
      type: full ? 'FULL' : 'PARTIAL',
      reason: pick(['Customer cancelled before prep', 'Item out of stock - Burrata refunded', 'Delayed delivery > 60m refund gesture']),
      initiatedBy: 'Alexander Weber (Manager)',
      customerId: tx.customerId,
      speed: 'normal',
      notes: `horizon:refund-${i}`,
      createdAt: new Date(t0.getTime() - (i < 45 ? (10 + i) * 86400000 : 3600000)),
      updatedAt: t0,
      processedAt: i >= 45 ? null : t0,
      _class: 'com.MaSoVa.payment.entity.Refund',
    });
  }
  if (refunds.length) await payment.collection('refunds').insertMany(refunds);

  // Active deliveries
  const ofd = await commerce.collection('orders').find({
    storeId: STORE,
    orderNumber: { $regex: `^${PREFIX}-` },
    status: { $in: ['DISPATCHED', 'OUT_FOR_DELIVERY'] },
  }).limit(4).toArray();
  const tracks = ofd.map((o, i) => ({
    orderId: String(o._id),
    driverId: o.assignedDriverId || driverIds[i % driverIds.length],
    storeId: STORE,
    driverName: i % 2 === 0 ? 'Lukas Schneider' : 'Mateo Silva',
    driverPhone: '+4917198765432',
    pickupAddress: { street: 'Rosenthaler Str. 40-41', city: 'Berlin', state: 'Berlin', zipCode: '10178', latitude: 52.5297, longitude: 13.4015 },
    deliveryAddress: o.deliveryAddress || { street: 'Torstrasse 1', city: 'Berlin', zipCode: '10119', latitude: 52.53, longitude: 13.41 },
    dispatchMethod: 'MANUAL',
    priorityLevel: 'MEDIUM',
    assignedAt: t0,
    acceptedAt: t0,
    pickedUpAt: t0,
    status: o.status === 'OUT_FOR_DELIVERY' ? 'IN_TRANSIT' : 'ASSIGNED',
    distanceKm: i % 2 === 0 ? '1.4' : '2.8',
    estimatedDeliveryMinutes: i % 2 === 0 ? 12 : 18,
    notes: 'horizon',
    createdAt: t0,
    updatedAt: t0,
    _class: 'com.MaSoVa.logistics.delivery.entity.DeliveryTracking',
  }));
  if (tracks.length) await logistics.collection('delivery_trackings').insertMany(tracks);
  await logistics.collection('driver_locations').deleteMany({ storeId: STORE });
  await logistics.collection('driver_locations').insertMany([
    { driverId: driverIds[0], storeId: STORE, latitude: 52.5295, longitude: 13.4015, heading: 90, updatedAt: t0, isActive: true },
    { driverId: driverIds[1], storeId: STORE, latitude: 52.531, longitude: 13.408, heading: 180, updatedAt: t0, isActive: true },
  ]);

  // 9. POs + waste
  await logistics.collection('purchase_orders').deleteMany({ notes: { $regex: /^horizon:/ } });
  await logistics.collection('waste_records').deleteMany({ notes: { $regex: /^horizon:/ } });
  const poDocs = [];
  for (let i = 0; i < 28; i++) {
    const when = new Date(t0.getTime() - (6 + i * 6) * 86400000);
    poDocs.push({
      orderNumber: `${PREFIX}-PO-${String(i + 1).padStart(3, '0')}`,
      storeId: STORE,
      supplierId: supplierIds['LAT-IT'],
      supplierName: 'Latteria Sorrentina (Dairy)',
      items: [{ inventoryItemId: invIds['ING-003'], itemName: 'Fior di Latte Mozzarella', itemCode: 'ING-003', quantity: 20, unit: 'kg', unitPrice: '7.20', totalPrice: '144.00', receivedQuantity: 20 }],
      orderDate: when,
      expectedDeliveryDate: new Date(when.getTime() + 3 * 86400000),
      status: 'RECEIVED',
      subtotal: '144.00',
      taxAmount: '10.08',
      shippingCost: '0',
      discountAmount: '0',
      totalAmount: '154.08',
      paymentStatus: 'PAID',
      requestedBy: managerId,
      approvedBy: managerId,
      autoGenerated: false,
      notes: `horizon:po-${i}`,
      createdAt: when,
      updatedAt: when,
      _class: 'com.MaSoVa.logistics.inventory.entity.PurchaseOrder',
    });
  }
  poDocs.push(
    {
      orderNumber: 'PO-2026-088',
      storeId: STORE,
      supplierId: supplierIds['LAT-IT'],
      supplierName: 'Latteria Sorrentina (Dairy)',
      items: [
        { inventoryItemId: invIds['ING-003'], itemName: 'Fior di Latte Mozzarella', itemCode: 'ING-003', quantity: 40, unit: 'kg', unitPrice: '7.20', totalPrice: '288.00', receivedQuantity: 0 },
        { inventoryItemId: invIds['ING-004'], itemName: 'Fresh Burrata Pugliese', itemCode: 'ING-004', quantity: 80, unit: 'pcs', unitPrice: '1.80', totalPrice: '144.00', receivedQuantity: 0 },
      ],
      orderDate: t0,
      expectedDeliveryDate: new Date(t0.getTime() + 2 * 86400000),
      status: 'PENDING_APPROVAL',
      subtotal: '840.00',
      taxAmount: '0',
      totalAmount: '840.00',
      paymentStatus: 'PENDING',
      requestedBy: managerId,
      notes: 'horizon:active-088',
      createdAt: t0,
      updatedAt: t0,
      _class: 'com.MaSoVa.logistics.inventory.entity.PurchaseOrder',
    },
    {
      orderNumber: 'PO-2026-089',
      storeId: STORE,
      supplierId: supplierIds['FRU-DE'],
      supplierName: 'Fruttopoli Berlin Fresh Produce',
      items: [{ inventoryItemId: invIds['ING-010'], itemName: 'Fresh Organic Basil', itemCode: 'ING-010', quantity: 10, unit: 'kg', unitPrice: '12.00', totalPrice: '120.00', receivedQuantity: 0 }],
      orderDate: t0,
      expectedDeliveryDate: new Date(t0.getTime() + 86400000),
      status: 'SENT',
      subtotal: '420.00',
      totalAmount: '420.00',
      paymentStatus: 'PENDING',
      requestedBy: managerId,
      notes: 'horizon:active-089',
      createdAt: t0,
      updatedAt: t0,
      _class: 'com.MaSoVa.logistics.inventory.entity.PurchaseOrder',
    },
    {
      orderNumber: 'PO-2026-090',
      storeId: STORE,
      supplierId: supplierIds['CAP-IT'],
      supplierName: 'Caputo Molino SpA',
      items: [{ inventoryItemId: invIds['ING-001'], itemName: 'Caputo 00 Pizza Flour', itemCode: 'ING-001', quantity: 200, unit: 'kg', unitPrice: '1.40', totalPrice: '280.00', receivedQuantity: 80 }],
      orderDate: new Date(t0.getTime() - 2 * 86400000),
      expectedDeliveryDate: t0,
      status: 'PARTIALLY_RECEIVED',
      subtotal: '1260.00',
      totalAmount: '1260.00',
      paymentStatus: 'PENDING',
      requestedBy: managerId,
      notes: 'horizon:active-090',
      createdAt: t0,
      updatedAt: t0,
      _class: 'com.MaSoVa.logistics.inventory.entity.PurchaseOrder',
    }
  );
  await logistics.collection('purchase_orders').insertMany(poDocs);

  const wasteCats = [
    ['EXPIRED', 0.4],
    ['PREPARATION_ERROR', 0.25],
    ['SPOILED', 0.15],
    ['DAMAGED', 0.1],
    ['OVERPRODUCTION', 0.1],
  ];
  const waste = [];
  for (let i = 0; i < 40; i++) {
    const p = rng();
    let acc = 0;
    let cat = 'EXPIRED';
    for (const [c, w] of wasteCats) {
      acc += w;
      if (p <= acc) {
        cat = c;
        break;
      }
    }
    const when = new Date(t0.getTime() - (3 + i * 4) * 86400000);
    waste.push({
      storeId: STORE,
      inventoryItemId: invIds['ING-003'],
      itemName: pick(['Fior di Latte Mozzarella', 'Fresh Organic Basil', 'Fresh Burrata Pugliese', 'Caputo 00 Pizza Flour']),
      itemCode: 'ING-003',
      quantity: 1 + Math.floor(rng() * 4),
      unit: 'kg',
      unitCost: 7.2,
      totalCost: +(7.2 * (1 + rng() * 3)).toFixed(2),
      wasteCategory: cat,
      wasteReason: cat === 'PREPARATION_ERROR' ? 'Burnt pizza during Saturday rush' : 'Horizon waste log',
      wasteDate: when,
      reportedBy: managerId,
      preventable: cat !== 'DAMAGED',
      preventionNotes: 'Tighten FIFO',
      notes: `horizon:waste-${i}`,
      createdAt: when,
      _class: 'com.MaSoVa.logistics.inventory.entity.WasteRecord',
    });
  }
  await logistics.collection('waste_records').insertMany(waste);

  // 10. Reviews + campaigns + GDPR
  await core.collection('reviews').deleteMany({ comment: { $regex: /^horizon:/ } });
  await core.collection('review_responses').deleteMany({ managerName: 'Alexander Weber' });
  const ratingPlan = [...Array(110).fill(5), ...Array(45).fill(4), ...Array(15).fill(3), ...Array(6).fill(2), ...Array(4).fill(1)];
  const comments = {
    5: 'Best sourdough pizza in Berlin! Fast delivery.',
    4: 'Great food, took 10 mins longer than estimated.',
    3: 'Food was warm, not hot. Tasted okay.',
    2: 'Missing my extra garlic dip. Pizza crust slightly burnt.',
    1: 'Cold pizza delivered after 55 minutes. Very disappointing.',
  };
  const sampleOrders = await commerce.collection('orders').find({ storeId: STORE, status: { $in: ['DELIVERED', 'COMPLETED', 'SERVED'] } }).limit(200).toArray();
  const reviews = [];
  const responses = [];
  for (let i = 0; i < 180 && i < sampleOrders.length; i++) {
    const rating = ratingPlan[i];
    const o = sampleOrders[i];
    const rid = new ObjectId();
    const respId = new ObjectId();
    const needs = i >= 177 && rating <= 3;
    const sentiment = rating >= 4 ? 'POSITIVE' : rating === 3 ? 'NEUTRAL' : 'NEGATIVE';
    reviews.push({
      _id: rid,
      storeId: STORE,
      orderId: String(o._id),
      customerId: o.customerId,
      customerName: o.customerName,
      overallRating: rating,
      comment: `horizon: ${comments[rating]}`,
      foodQualityRating: rating,
      serviceRating: Math.max(1, rating - (rating <= 2 ? 0 : 0)),
      isAnonymous: false,
      isVerifiedPurchase: true,
      photoUrls: [],
      status: 'APPROVED',
      sentiment,
      sentimentScore: rating >= 4 ? 0.7 : rating === 3 ? 0 : -0.6,
      responseId: needs ? null : String(respId),
      createdAt: o.createdAt,
      updatedAt: o.createdAt,
      isDeleted: false,
      _class: 'com.MaSoVa.core.review.entity.Review',
    });
    if (!needs) {
      responses.push({
        _id: respId,
        reviewId: String(rid),
        managerId,
        managerName: 'Alexander Weber',
        responseText: rating >= 4 ? 'Grazie! See you again in Mitte.' : 'We are sorry — refund/voucher issued. Please give us another chance.',
        responseType: rating >= 4 ? 'THANK_YOU' : 'RESOLUTION_OFFERED',
        isTemplate: false,
        createdAt: o.createdAt,
        isEdited: false,
        isDeleted: false,
        _class: 'com.MaSoVa.core.review.entity.ReviewResponse',
      });
    }
  }
  if (reviews.length) await core.collection('reviews').insertMany(reviews);
  if (responses.length) await core.collection('review_responses').insertMany(responses);

  await core.collection('campaigns').deleteMany({ name: { $regex: /^HZN / } });
  const campaigns = [
    ['HZN Summer Truffle Pizza Launch', 'COMPLETED', 1420, 596, 255],
    ['HZN Winback Inactive VIPs - 15% OFF', 'ACTIVE', 280, 162, 87],
    ['HZN Tuesday Neapolitan 2-for-1', 'ACTIVE', 900, 400, 120],
    ['HZN Euro Cup Finals Delivery Special', 'COMPLETED', 2100, 800, 210],
    ['HZN Late Night Cravings Boost', 'ACTIVE', 640, 220, 70],
    ['HZN Autumn Comfort Menu Preview', 'SCHEDULED', 0, 0, 0],
    ['HZN Halloween Party Catering Blast', 'DRAFT', 0, 0, 0],
    ['HZN Loyalty Point Double Days', 'COMPLETED', 1150, 480, 140],
  ];
  await core.collection('campaigns').insertMany(
    campaigns.map(([name, status, sent, opened, clicked]) => ({
      storeId: STORE,
      name,
      description: name,
      channel: 'EMAIL',
      subject: name,
      message: name,
      status,
      segment: { type: 'ALL_CUSTOMERS' },
      sent,
      delivered: sent,
      failed: 0,
      opened,
      clicked,
      createdBy: managerId,
      createdAt: t0,
      updatedAt: t0,
      _class: 'com.MaSoVa.core.notification.entity.Campaign',
    }))
  );

  await core.collection('gdpr_consents').deleteMany({ notes: 'horizon' });
  await core.collection('gdpr_data_requests').deleteMany({ notes: 'horizon' });
  await core.collection('gdpr_consents').insertMany(
    custPool.slice(0, 40).map((c) => ({
      userId: c.userId,
      storeId: STORE,
      consentType: 'MARKETING',
      granted: true,
      grantedAt: t0,
      notes: 'horizon',
    }))
  );
  await core.collection('gdpr_data_requests').insertMany([
    { userId: custPool[0].userId, storeId: STORE, requestType: 'EXPORT', status: 'PENDING', notes: 'horizon', createdAt: t0 },
    { userId: custPool[1].userId, storeId: STORE, requestType: 'ERASURE', status: 'PENDING', notes: 'horizon', createdAt: t0 },
  ]);

  const orderCount = await commerce.collection('orders').countDocuments({ storeId: STORE });
  const txCount = await payment.collection('transactions').countDocuments({ storeId: STORE });
  const liveCount = await commerce.collection('orders').countDocuments({
    storeId: STORE,
    status: { $in: ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'DISPATCHED', 'OUT_FOR_DELIVERY'] },
  });
  console.log('[horizon] done orders=', orderCount, 'txs=', txCount, 'live=', liveCount);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
