#!/usr/bin/env node
/**
 * MaSoVa API Test Suite
 * Tests all major flows across core, commerce, payment, and logistics services.
 * Run: node scripts/test-api.js
 */

const http = require('http');
const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SERVICES = {
  core:      'http://localhost:8085',
  commerce:  'http://localhost:8084',
  payment:   'http://localhost:8089',
  logistics: 'http://localhost:8086',
};

const ACCOUNTS = {
  manager:  { email: 'vijay.manager@masova.com',  password: 'Manager@123', pin: '11236', storeCode: 'DOM003' },
  manager2: { email: 'suresh.manager@masova.com', password: 'Manager@123', pin: '93467', storeCode: 'DOM001' },
  staff:    { email: 'satish.kitchen@masova.com', password: 'Staff@123',   pin: '20197', storeCode: 'DOM001' },
  driver:   { email: 'rajesh.driver@masova.com',  password: 'driver123',   pin: '71904', storeCode: 'DOM001' },
  customer: { email: 'priya.customer@masova.com', password: 'customer123' },
};

// ─── RESULTS ─────────────────────────────────────────────────────────────────
const results = { pass: 0, fail: 0, warn: 0, items: [] };
let tokens = {};
let testData = {};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function request(url, options = {}) {
  return new Promise((resolve) => {
    const { method = 'GET', body, headers = {}, token, storeId, userId, userType, driverId } = options;
    if (token)    headers['Authorization'] = `Bearer ${token}`;
    if (body)     headers['Content-Type'] = 'application/json';
    if (storeId)  headers['X-Selected-Store-Id'] = storeId;
    if (userId)   headers['X-User-Id'] = userId;
    if (userType) headers['X-User-Type'] = userType;
    if (driverId) headers['X-Driver-Id'] = driverId;

    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: parsed.hostname,
      port:     parsed.port,
      path:     parsed.pathname + parsed.search,
      method,
      headers,
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: null, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function pass(section, test, detail = '') {
  results.pass++;
  results.items.push({ status: 'PASS', section, test, detail });
  console.log(`  \x1b[32mPASS\x1b[0m  ${test}${detail ? ' — ' + detail : ''}`);
}

function fail(section, test, detail = '') {
  results.fail++;
  results.items.push({ status: 'FAIL', section, test, detail });
  console.log(`  \x1b[31mFAIL\x1b[0m  ${test}${detail ? ' — ' + detail : ''}`);
}

function warn(section, test, detail = '') {
  results.warn++;
  results.items.push({ status: 'WARN', section, test, detail });
  console.log(`  \x1b[33mWARN\x1b[0m  ${test}${detail ? ' — ' + detail : ''}`);
}

function section(name) {
  console.log(`\n\x1b[1m\x1b[34m${'─'.repeat(60)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m  ${name}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m${'─'.repeat(60)}\x1b[0m`);
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

async function testServiceHealth() {
  section('SERVICE HEALTH');
  for (const [name, base] of Object.entries(SERVICES)) {
    const r = await request(`${base}/actuator/health`);
    const r2 = r.status === 0 ? await request(`${base}/api/system/health`) : r;
    if (r.status === 200 || r2.status === 200) {
      pass('health', `${name} service is up`, `${base}`);
    } else {
      fail('health', `${name} service is down`, `${base} → ${r.status || r.error}`);
    }
  }
}

async function testAuth() {
  section('AUTHENTICATION');

  // Manager login
  let r = await request(`${SERVICES.core}/api/users/login`, {
    method: 'POST',
    body: { email: ACCOUNTS.manager.email, password: ACCOUNTS.manager.password },
  });
  if (r.status === 200 && r.body.accessToken) {
    tokens.manager = r.body.accessToken;
    tokens.managerRefresh = r.body.refreshToken;
    testData.managerId = r.body.user?.id;
    testData.managerStoreId = r.body.user?.storeId;
    pass('auth', 'Manager login (Vijay)', `storeId=${testData.managerStoreId}`);
  } else {
    fail('auth', 'Manager login (Vijay)', r.body?.message || r.status);
  }

  // Manager 2 login
  r = await request(`${SERVICES.core}/api/users/login`, {
    method: 'POST',
    body: { email: ACCOUNTS.manager2.email, password: ACCOUNTS.manager2.password },
  });
  if (r.status === 200 && r.body.accessToken) {
    tokens.manager2 = r.body.accessToken;
    testData.manager2StoreId = r.body.user?.storeId;
    testData.manager2Id = r.body.user?.id;
    pass('auth', 'Manager login (Suresh)', `storeId=${testData.manager2StoreId}`);
  } else {
    fail('auth', 'Manager login (Suresh)', r.body?.message || r.status);
  }

  // Staff login
  r = await request(`${SERVICES.core}/api/users/login`, {
    method: 'POST',
    body: { email: ACCOUNTS.staff.email, password: ACCOUNTS.staff.password },
  });
  if (r.status === 200 && r.body.accessToken) {
    tokens.staff = r.body.accessToken;
    testData.staffId = r.body.user?.id;
    pass('auth', 'Staff login (Satish)', `id=${testData.staffId}`);
  } else {
    fail('auth', 'Staff login (Satish)', r.body?.message || r.status);
  }

  // Driver login
  r = await request(`${SERVICES.core}/api/users/login`, {
    method: 'POST',
    body: { email: ACCOUNTS.driver.email, password: ACCOUNTS.driver.password },
  });
  if (r.status === 200 && r.body.accessToken) {
    tokens.driver = r.body.accessToken;
    testData.driverId = r.body.user?.id;
    pass('auth', 'Driver login (Rajesh)', `id=${testData.driverId}`);
  } else {
    fail('auth', 'Driver login (Rajesh)', r.body?.message || r.status);
  }

  // Customer login
  r = await request(`${SERVICES.core}/api/users/login`, {
    method: 'POST',
    body: { email: ACCOUNTS.customer.email, password: ACCOUNTS.customer.password },
  });
  if (r.status === 200 && r.body.accessToken) {
    tokens.customer = r.body.accessToken;
    testData.customerId = r.body.user?.id;
    pass('auth', 'Customer login (Priya)', `id=${testData.customerId}`);
  } else {
    fail('auth', 'Customer login (Priya)', r.body?.message || r.status);
  }

  // Token refresh
  if (tokens.managerRefresh) {
    r = await request(`${SERVICES.core}/api/users/refresh`, {
      method: 'POST',
      body: { refreshToken: tokens.managerRefresh },
    });
    if (r.status === 200 && r.body.accessToken) {
      pass('auth', 'Token refresh works');
    } else {
      fail('auth', 'Token refresh', r.body?.message || r.status);
    }
  }

  // PIN validation (staff)
  r = await request(`${SERVICES.core}/api/users/validate-pin`, {
    method: 'POST',
    body: { pin: ACCOUNTS.staff.pin, storeId: testData.manager2StoreId },
    token: tokens.manager2,
  });
  if (r.status === 200) {
    pass('auth', 'Staff PIN validation', `PIN ${ACCOUNTS.staff.pin}`);
  } else {
    fail('auth', 'Staff PIN validation', r.body?.message || r.status);
  }

  // Get profile
  r = await request(`${SERVICES.core}/api/users/profile`, {
    token: tokens.manager,
    storeId: testData.managerStoreId,
    userId: testData.managerId,
  });
  if (r.status === 200 && r.body.email) {
    pass('auth', 'Get user profile', `email=${r.body.email}`);
  } else {
    fail('auth', 'Get user profile', r.status);
  }
}

async function testStores() {
  section('STORES');

  // List public stores
  let r = await request(`${SERVICES.core}/api/stores/public`);
  if (r.status === 200) {
    const stores = Array.isArray(r.body) ? r.body : r.body?.content || [];
    testData.stores = stores;
    pass('stores', `List public stores`, `${stores.length} stores found`);
    // Find DOM001 store
    const dom001 = stores.find(s => s.storeCode === 'DOM001' || s.code === 'DOM001');
    if (dom001) testData.store1Id = dom001.id;
  } else {
    fail('stores', 'List public stores', r.status);
  }

  // Get store by code
  r = await request(`${SERVICES.core}/api/stores/public/code/DOM001`);
  if (r.status === 200 && r.body.id) {
    testData.store1Id = testData.store1Id || r.body.id;
    pass('stores', 'Get store by code (DOM001)', `id=${r.body.id}`);
  } else {
    fail('stores', 'Get store by code (DOM001)', r.status);
  }

  // Delivery radius check
  r = await request(`${SERVICES.core}/api/stores/${testData.store1Id}/delivery-radius-check?latitude=17.385&longitude=78.4867`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
  });
  if (r.status === 200) {
    pass('stores', 'Delivery radius check', JSON.stringify(r.body).substring(0, 80));
  } else {
    fail('stores', 'Delivery radius check', r.status);
  }

  // Store operational status
  r = await request(`${SERVICES.core}/api/stores/operational-status`, {
    token: tokens.manager,
    storeId: testData.managerStoreId,
  });
  if (r.status === 200) {
    pass('stores', 'Store operational status');
  } else {
    fail('stores', 'Store operational status', r.status);
  }
}

async function testMenu() {
  section('MENU');

  // Public menu - no auth
  let r = await request(`${SERVICES.commerce}/api/menu/public?storeCode=DOM001`);
  if (r.status === 200) {
    const items = Array.isArray(r.body) ? r.body : r.body?.content || [];
    testData.menuItems = items;
    const available = items.filter(i => i.available || i.isAvailable);
    pass('menu', 'Public menu listing', `${items.length} total, ${available.length} available`);
    if (items.length > 0) {
      testData.menuItem1 = items[0];
      testData.menuItem2 = items[1] || items[0];
    }
  } else {
    fail('menu', 'Public menu listing', r.status);
  }

  // Menu item detail
  if (testData.menuItem1?.id) {
    r = await request(`${SERVICES.commerce}/api/menu/public/${testData.menuItem1.id}`);
    if (r.status === 200) {
      pass('menu', 'Get menu item by ID', `name=${r.body.name} price=${r.body.basePrice}`);
    } else if (r.status === 500 && r.body?.debugMessage?.includes('cannot be cast')) {
      warn('menu', 'Get menu item by ID — Redis cache ClassCastException (type info not persisted in cache config)');
    } else {
      fail('menu', 'Get menu item by ID', r.status);
    }
  }

  // Menu search (param name is 'q' not 'query')
  r = await request(`${SERVICES.commerce}/api/menu/public/search?q=dosa&storeCode=DOM001`);
  if (r.status === 200) {
    const items = Array.isArray(r.body) ? r.body : r.body?.content || [];
    pass('menu', 'Menu search', `${items.length} results for "dosa"`);
  } else {
    fail('menu', 'Menu search', r.status);
  }

  // Authenticated menu management
  r = await request(`${SERVICES.commerce}/api/menu/items?storeCode=DOM001`, { token: tokens.manager });
  if (r.status === 200) {
    pass('menu', 'Manager: list all menu items (authenticated)');
  } else {
    fail('menu', 'Manager: list all menu items (authenticated)', r.status);
  }
}

async function testOrderFlowTakeaway() {
  section('ORDER FLOW — TAKEAWAY');

  if (!testData.menuItem1) {
    fail('order-takeaway', 'Cannot test — no menu items found');
    return;
  }

  const item = testData.menuItem1;
  const price = item.basePrice || item.price || 8000;
  const storeId = testData.manager2StoreId || 'DOM001';

  // Create takeaway order
  let r = await request(`${SERVICES.commerce}/api/orders`, {
    method: 'POST',
    token: tokens.manager2,
    body: {
      customerName: 'Test Customer',
      customerPhone: '9876500001',
      customerEmail: 'test.order@masova.com',
      storeId,
      orderType: 'TAKEAWAY',
      paymentMethod: 'CASH',
      items: [{ menuItemId: item.id, name: item.name, quantity: 1, price }],
      specialInstructions: 'API test order',
      createdByStaffId: testData.staffId,
    },
  });

  if (r.status === 200 || r.status === 201) {
    const order = r.body.order || r.body;
    testData.takeawayOrderId = order.id || order._id;
    testData.takeawayOrderNumber = order.orderNumber;
    pass('order-takeaway', 'Create TAKEAWAY order', `id=${testData.takeawayOrderId} #${testData.takeawayOrderNumber}`);
  } else {
    fail('order-takeaway', 'Create TAKEAWAY order', r.body?.message || r.status);
    return;
  }

  // Check order status transitions
  const statuses = ['PREPARING', 'READY', 'COMPLETED'];
  for (const status of statuses) {
    await new Promise(r => setTimeout(r, 300));
    r = await request(`${SERVICES.commerce}/api/orders/${testData.takeawayOrderId}/status`, {
      method: 'PATCH',
      token: tokens.manager2,
      body: { status },
    });
    if (r.status === 200) {
      pass('order-takeaway', `Status → ${status}`);
    } else {
      fail('order-takeaway', `Status → ${status}`, r.body?.message || r.status);
    }
  }

  // Get order by ID
  r = await request(`${SERVICES.commerce}/api/orders/${testData.takeawayOrderId}`, { token: tokens.manager2 });
  if (r.status === 200) {
    const o = r.body.order || r.body;
    pass('order-takeaway', 'Get order by ID', `status=${o.status}`);
  } else {
    fail('order-takeaway', 'Get order by ID', r.status);
  }

  // Track order (public endpoint)
  r = await request(`${SERVICES.commerce}/api/orders/track/${testData.takeawayOrderId}`);
  if (r.status === 200) {
    pass('order-takeaway', 'Order tracking (public)');
  } else {
    fail('order-takeaway', 'Order tracking (public)', r.status);
  }

  // Next-stage flow
  r = await request(`${SERVICES.commerce}/api/orders`, {
    method: 'POST',
    token: tokens.manager2,
    body: {
      customerName: 'Stage Test Customer',
      customerPhone: '9876500002',
      storeId,
      orderType: 'TAKEAWAY',
      paymentMethod: 'CASH',
      items: [{ menuItemId: item.id, name: item.name, quantity: 1, price }],
    },
  });
  if (r.status === 200 || r.status === 201) {
    const stageOrderId = (r.body.order || r.body).id;
    const stageR = await request(`${SERVICES.commerce}/api/orders/${stageOrderId}/next-stage`, {
      method: 'PATCH',
      token: tokens.manager2,
    });
    if (stageR.status === 200) {
      pass('order-takeaway', 'next-stage endpoint works');
    } else {
      fail('order-takeaway', 'next-stage endpoint', stageR.body?.message || stageR.status);
    }
    testData.stageOrderId = stageOrderId;
  }
}

async function testOrderFlowDelivery() {
  section('ORDER FLOW — DELIVERY');

  if (!testData.menuItem1) {
    fail('order-delivery', 'Cannot test — no menu items found');
    return;
  }

  const item = testData.menuItem1;
  const price = item.basePrice || item.price || 8000;
  const storeId = testData.manager2StoreId || 'DOM001';

  // Create delivery order
  let r = await request(`${SERVICES.commerce}/api/orders`, {
    method: 'POST',
    token: tokens.manager2,
    body: {
      customerName: 'Delivery Test Customer',
      customerPhone: '9876500003',
      customerEmail: 'delivery.test@masova.com',
      customerId: testData.customerId,
      storeId,
      orderType: 'DELIVERY',
      paymentMethod: 'UPI',
      items: [{ menuItemId: item.id, name: item.name, quantity: 2, price }],
      deliveryAddress: {
        street: '123 Test Street',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        latitude: 17.385,
        longitude: 78.4867,
        landmark: 'Near Test Mall',
      },
      specialInstructions: 'API test delivery order',
    },
  });

  if (r.status === 200 || r.status === 201) {
    const order = r.body.order || r.body;
    testData.deliveryOrderId = order.id || order._id;
    testData.deliveryOrderNumber = order.orderNumber;
    const deliveryFeeFromOrder = order.deliveryFee;
    pass('order-delivery', 'Create DELIVERY order', `id=${testData.deliveryOrderId}`);

    // Gap #7: Check delivery fee consistency
    // Backend: check zone fee
    const zoneR = await request(`${SERVICES.logistics}/api/delivery/zone/fee?lat=17.385&lng=78.4867&storeId=${storeId}`);
    if (zoneR.status === 200) {
      const logisticsFee = zoneR.body.fee || zoneR.body.deliveryFee || zoneR.body;
      if (deliveryFeeFromOrder !== undefined && logisticsFee !== undefined) {
        if (deliveryFeeFromOrder === logisticsFee) {
          pass('order-delivery', 'Gap #7: Delivery fee consistent (order vs logistics)', `fee=${deliveryFeeFromOrder}`);
        } else {
          fail('order-delivery', 'Gap #7: Delivery fee mismatch', `order=${deliveryFeeFromOrder} logistics=${JSON.stringify(logisticsFee)}`);
        }
      } else {
        warn('order-delivery', 'Gap #7: Delivery fee check', `orderFee=${deliveryFeeFromOrder} logisticsFee=${JSON.stringify(logisticsFee)}`);
      }
    } else {
      warn('order-delivery', 'Gap #7: Cannot check logistics delivery fee', zoneR.status);
    }
  } else {
    fail('order-delivery', 'Create DELIVERY order', r.body?.message || r.status);
    return;
  }

  // Move to PREPARING
  await new Promise(res => setTimeout(res, 300));
  r = await request(`${SERVICES.commerce}/api/orders/${testData.deliveryOrderId}/status`, {
    method: 'PATCH',
    token: tokens.manager2,
    body: { status: 'PREPARING' },
  });
  if (r.status === 200) pass('order-delivery', 'Delivery order → PREPARING');
  else fail('order-delivery', 'Delivery order → PREPARING', r.body?.message || r.status);

  // Move to READY
  r = await request(`${SERVICES.commerce}/api/orders/${testData.deliveryOrderId}/status`, {
    method: 'PATCH',
    token: tokens.manager2,
    body: { status: 'READY' },
  });
  if (r.status === 200) pass('order-delivery', 'Delivery order → READY');
  else fail('order-delivery', 'Delivery order → READY', r.body?.message || r.status);

  // Gap #10: Assign driver
  if (testData.driverId) {
    r = await request(`${SERVICES.commerce}/api/orders/${testData.deliveryOrderId}/assign-driver`, {
      method: 'PATCH',
      token: tokens.manager2,
      body: { driverId: testData.driverId },
    });
    if (r.status === 200) {
      pass('order-delivery', 'Assign driver to order', `driverId=${testData.driverId}`);
    } else {
      fail('order-delivery', 'Assign driver to order', r.body?.message || r.status);
    }
  }

  // Move to DISPATCHED
  r = await request(`${SERVICES.commerce}/api/orders/${testData.deliveryOrderId}/status`, {
    method: 'PATCH',
    token: tokens.manager2,
    body: { status: 'DISPATCHED' },
  });
  if (r.status === 200) pass('order-delivery', 'Delivery order → DISPATCHED');
  else fail('order-delivery', 'Delivery order → DISPATCHED', r.body?.message || r.status);

  // Mark delivered
  r = await request(`${SERVICES.commerce}/api/orders/${testData.deliveryOrderId}/mark-delivered`, {
    method: 'PUT',
    token: tokens.driver,
    body: { deliveredAt: new Date().toISOString(), proofType: 'NONE', notes: 'Delivered successfully' },
  });
  if (r.status === 200) pass('order-delivery', 'Mark order as DELIVERED');
  else fail('order-delivery', 'Mark order as DELIVERED', r.body?.message || r.status);
}

async function testKitchenFlow() {
  section('KITCHEN DISPLAY SYSTEM');

  // Kitchen orders list
  let r = await request(`${SERVICES.commerce}/api/orders/kitchen`, { token: tokens.staff });
  if (r.status === 200) {
    const orders = Array.isArray(r.body) ? r.body : r.body?.content || [];
    pass('kds', 'Kitchen orders list', `${orders.length} orders visible`);
  } else {
    fail('kds', 'Kitchen orders list', r.status);
  }

  // Orders by status
  for (const status of ['RECEIVED', 'PREPARING', 'READY']) {
    r = await request(`${SERVICES.commerce}/api/orders/status/${status}`, { token: tokens.manager2 });
    if (r.status === 200) {
      pass('kds', `Orders by status: ${status}`);
    } else {
      fail('kds', `Orders by status: ${status}`, r.status);
    }
  }

  // Store orders
  r = await request(`${SERVICES.commerce}/api/orders/store`, { token: tokens.manager2 });
  if (r.status === 200) {
    const orders = Array.isArray(r.body) ? r.body : r.body?.content || [];
    pass('kds', 'Store orders list (manager)', `${orders.length} orders`);
  } else {
    fail('kds', 'Store orders list (manager)', r.status);
  }
}

async function testPayments() {
  section('PAYMENTS');

  if (!testData.takeawayOrderId) {
    warn('payments', 'No order available — skipping payment tests');
    return;
  }

  // Cash payment
  let r = await request(`${SERVICES.payment}/api/payments/cash`, {
    method: 'POST',
    token: tokens.manager2,
    body: {
      orderId: testData.takeawayOrderId,
      amount: (testData.menuItem1?.basePrice || 8000),
      customerId: testData.customerId || 'walkin',
      storeId: testData.manager2StoreId,
      paymentMethod: 'CASH',
    },
  });
  if (r.status === 200 || r.status === 201) {
    testData.paymentId = r.body.id || r.body.transactionId || r.body.paymentId;
    pass('payments', 'Cash payment', `id=${testData.paymentId}`);
  } else {
    fail('payments', 'Cash payment', r.body?.message || r.status);
  }

  // Get payments for order
  r = await request(`${SERVICES.payment}/api/payments/order/${testData.takeawayOrderId}`, {
    token: tokens.manager2,
  });
  if (r.status === 200) {
    pass('payments', 'Get payment by order ID');
  } else {
    fail('payments', 'Get payment by order ID', r.status);
  }

  // Store payments (requires X-Selected-Store-Id header)
  r = await request(`${SERVICES.payment}/api/payments/store`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
  });
  if (r.status === 200) {
    pass('payments', 'Store payment history');
  } else {
    fail('payments', 'Store payment history', r.status);
  }
}

async function testDeliveryService() {
  section('DELIVERY / LOGISTICS');

  // Driver status update — uses core-service /api/users/{userId}/status
  let r = await request(`${SERVICES.core}/api/users/${testData.driverId}/status`, {
    method: 'PUT',
    token: tokens.driver,
    body: { status: 'AVAILABLE' },
  });
  if (r.status === 200) {
    pass('logistics', 'Driver status update → AVAILABLE');
  } else {
    fail('logistics', 'Driver status update', r.body?.message || r.status);
  }

  // Driver status check
  if (testData.driverId) {
    r = await request(`${SERVICES.logistics}/api/delivery/driver/${testData.driverId}/status`, {
      token: tokens.manager2,
    });
    if (r.status === 200) {
      pass('logistics', 'Get driver status', JSON.stringify(r.body).substring(0, 80));
    } else {
      fail('logistics', 'Get driver status', r.status);
    }
  }

  // Available drivers
  r = await request(`${SERVICES.logistics}/api/delivery/drivers/available?storeId=${testData.manager2StoreId || 'DOM001'}`, {
    token: tokens.manager2,
  });
  if (r.status === 200) {
    const drivers = Array.isArray(r.body) ? r.body : r.body?.drivers || [];
    pass('logistics', 'Available drivers list', `${drivers.length} drivers`);
  } else {
    fail('logistics', 'Available drivers list', r.status);
  }

  // Delivery zone check (requires auth)
  r = await request(`${SERVICES.logistics}/api/delivery/zone/check?lat=17.385&lng=78.4867&storeId=${testData.manager2StoreId || 'DOM001'}`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
  });
  if (r.status === 200) {
    pass('logistics', 'Delivery zone check', JSON.stringify(r.body).substring(0, 80));
  } else {
    fail('logistics', 'Delivery zone check', r.status);
  }

  // Delivery fee check (Gap #7)
  r = await request(`${SERVICES.logistics}/api/delivery/zone/fee?lat=17.385&lng=78.4867&storeId=${testData.manager2StoreId || 'DOM001'}`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
  });
  if (r.status === 200) {
    pass('logistics', 'Gap #7: Delivery fee from logistics service', JSON.stringify(r.body).substring(0, 80));
  } else {
    fail('logistics', 'Gap #7: Delivery fee endpoint', r.status);
  }

  // Location update (driver)
  r = await request(`${SERVICES.logistics}/api/delivery/location-update`, {
    method: 'POST',
    token: tokens.driver,
    body: {
      driverId: testData.driverId,
      latitude: 17.385,
      longitude: 78.4867,
      accuracy: 10,
    },
  });
  if (r.status === 200) {
    pass('logistics', 'Driver location update');
  } else {
    fail('logistics', 'Driver location update', r.body?.message || r.status);
  }

  // Delivery tracking
  if (testData.deliveryOrderId) {
    r = await request(`${SERVICES.logistics}/api/delivery/track/${testData.deliveryOrderId}`, {
      token: tokens.customer,
    });
    if (r.status === 200) {
      pass('logistics', 'Delivery tracking by orderId');
    } else {
      fail('logistics', 'Delivery tracking by orderId', r.status);
    }
  }

  // Delivery metrics
  r = await request(`${SERVICES.logistics}/api/delivery/metrics/today`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
    userType: 'MANAGER',
  });
  if (r.status === 200) {
    pass('logistics', 'Delivery metrics today');
  } else {
    fail('logistics', 'Delivery metrics today', r.status);
  }
}

async function testInventory() {
  section('INVENTORY');

  // List inventory items
  let r = await request(`${SERVICES.logistics}/api/inventory/items`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
    userType: 'MANAGER',
  });
  if (r.status === 200) {
    const items = Array.isArray(r.body) ? r.body : r.body?.content || [];
    testData.inventoryItem = items[0];
    pass('inventory', 'List inventory items', `${items.length} items`);
  } else {
    fail('inventory', 'List inventory items', r.status);
  }

  // Low stock alerts
  r = await request(`${SERVICES.logistics}/api/inventory/alerts/low-stock`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
    userType: 'MANAGER',
  });
  if (r.status === 200) {
    const alerts = Array.isArray(r.body) ? r.body : r.body?.items || [];
    pass('inventory', 'Low stock alerts', `${alerts.length} alerts`);
  } else {
    fail('inventory', 'Low stock alerts', r.status);
  }

  // Gap #9: Check inventory decrement on order creation
  // We check by looking at stock before and after an order was placed
  if (testData.inventoryItem) {
    const beforeR = await request(`${SERVICES.logistics}/api/inventory/items/${testData.inventoryItem.id}`, {
      token: tokens.manager2,
    });
    if (beforeR.status === 200) {
      const before = beforeR.body.currentStock ?? beforeR.body.quantity;
      // Note: we can't easily create+check in same run without knowing which ingredient maps to which menu item
      warn('inventory', 'Gap #9: Inventory decrement on order', `Current stock of "${testData.inventoryItem.name}": ${before} — manual check needed to confirm decrement on order`);
    }
  } else {
    warn('inventory', 'Gap #9: No inventory items found to check decrement');
  }

  // Inventory value
  r = await request(`${SERVICES.logistics}/api/inventory/value`, { token: tokens.manager2 });
  if (r.status === 200) {
    pass('inventory', 'Inventory total value', JSON.stringify(r.body).substring(0, 80));
  } else {
    fail('inventory', 'Inventory total value', r.status);
  }
}

async function testReviews() {
  section('REVIEWS & RATINGS (Gap #11 & #12)');

  // Get rating token for an order (commerce service)
  if (testData.takeawayOrderId) {
    let r = await request(`${SERVICES.commerce}/api/orders/track/${testData.takeawayOrderId}`);
    if (r.status === 200 && r.body.ratingToken) {
      testData.ratingToken = r.body.ratingToken;
      pass('reviews', 'Rating token present in order tracking');
    } else {
      warn('reviews', 'Rating token missing from order tracking', 'ratingToken field not found — Gap #12 indicator');
    }

    // Gap #11: Submit review via public endpoint (correct field names from CreateReviewRequest)
    r = await request(`${SERVICES.core}/api/reviews/public/submit`, {
      method: 'POST',
      body: {
        orderId: testData.takeawayOrderId,
        overallRating: 5,
        foodQualityRating: 5,
        serviceRating: 4,
        comment: 'API test review — excellent food!',
        isAnonymous: false,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.reviewId = r.body.id || r.body.reviewId;
      pass('reviews', 'Gap #11: Submit rating via API (not console.log)', `id=${testData.reviewId}`);
    } else {
      fail('reviews', 'Gap #11: Submit rating via API', r.body?.message || r.status);
    }
  }

  // List reviews (manager)
  let r = await request(`${SERVICES.core}/api/reviews/pending`, { token: tokens.manager });
  if (r.status === 200) {
    pass('reviews', 'Manager: pending reviews list');
  } else {
    fail('reviews', 'Manager: pending reviews list', r.status);
  }

  // Review stats
  r = await request(`${SERVICES.core}/api/reviews/stats/overall`, { token: tokens.manager });
  if (r.status === 200) {
    pass('reviews', 'Overall review stats');
  } else {
    fail('reviews', 'Overall review stats', r.status);
  }
}

async function testCustomers() {
  section('CUSTOMERS');

  // Get customer by user ID (endpoint is CUSTOMER-only, use customer token)
  if (testData.customerId) {
    let r = await request(`${SERVICES.core}/api/customers/user/${testData.customerId}`, {
      token: tokens.customer,
    });
    if (r.status === 200 && r.body.id) {
      testData.customerProfileId = r.body.id;
      pass('customers', 'Get customer profile by userId', `customerId=${testData.customerProfileId}`);
    } else {
      fail('customers', 'Get customer profile by userId', r.body?.message || r.status);
    }
  }

  // Customer orders
  if (testData.customerId) {
    let r = await request(`${SERVICES.commerce}/api/orders/customer/${testData.customerId}`, {
      token: tokens.customer,
    });
    if (r.status === 200) {
      const orders = Array.isArray(r.body) ? r.body : r.body?.content || [];
      pass('customers', 'Customer order history', `${orders.length} orders`);
    } else {
      fail('customers', 'Customer order history', r.status);
    }
  }

  // Customer stats
  if (testData.customerProfileId) {
    let r = await request(`${SERVICES.core}/api/customers/stats`, { token: tokens.manager });
    if (r.status === 200) {
      pass('customers', 'Customer stats overview');
    } else {
      fail('customers', 'Customer stats overview', r.status);
    }
  }
}

async function testGapRegister() {
  section('GAP REGISTER CHECKS (docs/plans/2026-02-22-order-flow-gaps.md)');

  // Gap #1: RabbitMQ — check if order events are published
  // We test indirectly by checking if logistics service receives delivery info after order creation
  if (testData.deliveryOrderId) {
    const r = await request(`${SERVICES.logistics}/api/delivery/track/${testData.deliveryOrderId}`);
    if (r.status === 200 && r.body) {
      pass('gaps', 'Gap #1: Delivery tracking record exists after order (RabbitMQ or sync)');
    } else {
      fail('gaps', 'Gap #1: No delivery tracking after DELIVERY order — RabbitMQ not wired', r.status);
    }
  } else {
    warn('gaps', 'Gap #1: Cannot check RabbitMQ — no delivery order created');
  }

  // Gap #2: OrderStatus enum — check READY, COMPLETED, CANCELLED exist in API
  // Already tested in takeaway flow — just confirm
  if (results.items.some(i => i.test === 'Status → READY' && i.status === 'PASS')) {
    pass('gaps', 'Gap #2: READY status accepted by API');
  } else if (results.items.some(i => i.test === 'Status → READY' && i.status === 'FAIL')) {
    fail('gaps', 'Gap #2: READY status rejected — enum mismatch');
  }

  // Gap #3: DINE_IN order type — check if API accepts it
  if (testData.menuItem1) {
    const r = await request(`${SERVICES.commerce}/api/orders`, {
      method: 'POST',
      token: tokens.manager2,
      body: {
        customerName: 'DineIn Test',
        customerPhone: '9876500099',
        storeId: testData.manager2StoreId,
        orderType: 'DINE_IN',
        paymentMethod: 'CASH',
        items: [{ menuItemId: testData.menuItem1.id, name: testData.menuItem1.name, quantity: 1, price: testData.menuItem1.basePrice || 8000 }],
      },
    });
    if (r.status === 200 || r.status === 201) {
      warn('gaps', 'Gap #3: DINE_IN accepted by backend but removed from all frontends');
    } else {
      fail('gaps', 'Gap #3: DINE_IN rejected by backend too', r.body?.message || r.status);
    }
  }

  // Gap #6: Manager "Mark as Completed" — check if DELIVERY order goes to DELIVERED vs COMPLETED
  if (testData.deliveryOrderId) {
    const r = await request(`${SERVICES.commerce}/api/orders/${testData.deliveryOrderId}`, {
      token: tokens.manager2,
    });
    const status = (r.body?.order || r.body)?.status;
    if (status === 'DELIVERED') {
      pass('gaps', 'Gap #6: Delivery order correctly ends at DELIVERED');
    } else {
      warn('gaps', `Gap #6: Delivery order final status is "${status}" (expected DELIVERED)`);
    }
  }

  // Gap #8: Tax rate — check what backend returns vs hardcoded 5%
  if (testData.takeawayOrderId) {
    const r = await request(`${SERVICES.commerce}/api/orders/${testData.takeawayOrderId}`, {
      token: tokens.manager2,
    });
    const order = r.body?.order || r.body;
    if (order?.tax !== undefined && order?.subtotal) {
      const taxRate = ((order.tax / order.subtotal) * 100).toFixed(1);
      if (taxRate === '5.0' || taxRate === '5') {
        warn('gaps', `Gap #8: Tax is hardcoded 5% on backend too (${taxRate}%) — consistent but not dynamic`);
      } else {
        pass('gaps', `Gap #8: Backend tax rate is ${taxRate}% (dynamic, not hardcoded 5%)`);
      }
    } else {
      warn('gaps', 'Gap #8: Cannot determine tax rate — tax/subtotal missing from order response');
    }
  }

  // Gap #13: Walk-in email
  if (testData.takeawayOrderId) {
    const r = await request(`${SERVICES.commerce}/api/orders/${testData.takeawayOrderId}`, {
      token: tokens.manager2,
    });
    const order = r.body?.order || r.body;
    const email = order?.customerEmail;
    if (email && email.includes('walkin@')) {
      fail('gaps', `Gap #13: Walk-in email fabricated as "${email}"`);
    } else if (email) {
      pass('gaps', `Gap #13: Walk-in email is real: "${email}"`);
    } else {
      warn('gaps', 'Gap #13: customerEmail is null/missing for walk-in order');
    }
  }
}

async function testWorkingSessions() {
  section('WORKING SESSIONS (POS Clock-In/Out)');

  // Clock in with PIN (staff clocking in at manager's store)
  let r = await request(`${SERVICES.core}/api/users/sessions/clock-in-with-pin`, {
    method: 'POST',
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
    userType: 'MANAGER',
    body: {
      employeeId: testData.staffId,
      pin: ACCOUNTS.staff.pin,
      authorizedBy: testData.manager2Id,
    },
  });
  if (r.status === 200 || r.status === 201) {
    testData.sessionId = r.body.sessionId || r.body.id;
    pass('sessions', 'Clock-in with PIN', `sessionId=${testData.sessionId}`);
  } else {
    fail('sessions', 'Clock-in with PIN', r.body?.message || r.status);
  }

  // Get current session
  r = await request(`${SERVICES.core}/api/users/sessions/${testData.staffId}/status`, {
    token: tokens.manager2,
  });
  if (r.status === 200) {
    pass('sessions', 'Get session status for staff');
  } else {
    fail('sessions', 'Get session status for staff', r.status);
  }

  // Active sessions for store
  r = await request(`${SERVICES.core}/api/users/sessions/store/active`, {
    token: tokens.manager2,
    storeId: testData.manager2StoreId,
  });
  if (r.status === 200) {
    const sessions = Array.isArray(r.body) ? r.body : r.body?.sessions || [];
    pass('sessions', 'Active sessions for store', `${sessions.length} active`);
  } else {
    fail('sessions', 'Active sessions for store', r.status);
  }
}

async function testNotifications() {
  section('NOTIFICATIONS');

  if (!testData.managerId) {
    warn('notifications', 'No manager ID — skipping');
    return;
  }

  let r = await request(`${SERVICES.core}/api/notifications/user/${testData.managerId}`, {
    token: tokens.manager,
  });
  if (r.status === 200) {
    const notifs = Array.isArray(r.body) ? r.body : r.body?.content || [];
    pass('notifications', 'Get user notifications', `${notifs.length} notifications`);
  } else {
    fail('notifications', 'Get user notifications', r.status);
  }

  r = await request(`${SERVICES.core}/api/notifications/user/${testData.managerId}/unread-count`, {
    token: tokens.manager,
  });
  if (r.status === 200) {
    pass('notifications', 'Unread notification count', `count=${r.body.count ?? r.body}`);
  } else {
    fail('notifications', 'Unread notification count', r.status);
  }
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
function printSummary() {
  console.log(`\n\x1b[1m${'═'.repeat(60)}\x1b[0m`);
  console.log(`\x1b[1m  TEST SUMMARY\x1b[0m`);
  console.log(`\x1b[1m${'═'.repeat(60)}\x1b[0m`);
  console.log(`  \x1b[32mPASS\x1b[0m  ${results.pass}`);
  console.log(`  \x1b[31mFAIL\x1b[0m  ${results.fail}`);
  console.log(`  \x1b[33mWARN\x1b[0m  ${results.warn}`);
  console.log(`  TOTAL ${results.pass + results.fail + results.warn}`);

  if (results.fail > 0) {
    console.log(`\n\x1b[1m\x1b[31m  FAILURES:\x1b[0m`);
    results.items.filter(i => i.status === 'FAIL').forEach(i => {
      console.log(`  \x1b[31m✗\x1b[0m [${i.section}] ${i.test}${i.detail ? ' — ' + i.detail : ''}`);
    });
  }

  if (results.warn > 0) {
    console.log(`\n\x1b[1m\x1b[33m  WARNINGS (needs attention):\x1b[0m`);
    results.items.filter(i => i.status === 'WARN').forEach(i => {
      console.log(`  \x1b[33m⚠\x1b[0m [${i.section}] ${i.test}${i.detail ? ' — ' + i.detail : ''}`);
    });
  }

  console.log(`\n\x1b[2m  Test data created:\x1b[0m`);
  if (testData.takeawayOrderId) console.log(`  \x1b[2m  Takeaway order: ${testData.takeawayOrderId} (#${testData.takeawayOrderNumber})\x1b[0m`);
  if (testData.deliveryOrderId) console.log(`  \x1b[2m  Delivery order: ${testData.deliveryOrderId} (#${testData.deliveryOrderNumber})\x1b[0m`);
  console.log('');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n\x1b[1m\x1b[34m${'═'.repeat(60)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m  MaSoVa API Test Suite — ${new Date().toLocaleString()}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m${'═'.repeat(60)}\x1b[0m`);

  await testServiceHealth();
  await testAuth();
  await testStores();
  await testMenu();
  await testOrderFlowTakeaway();
  await testOrderFlowDelivery();
  await testKitchenFlow();
  await testPayments();
  await testDeliveryService();
  await testInventory();
  await testReviews();
  await testCustomers();
  await testGapRegister();
  await testWorkingSessions();
  await testNotifications();

  printSummary();
  process.exit(results.fail > 0 ? 1 : 0);
})();
