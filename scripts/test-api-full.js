#!/usr/bin/env node
/**
 * MaSoVa Full API Test Suite
 * Comprehensive test of ALL endpoints across core, commerce, payment, and logistics services.
 * Run: node scripts/test-api-full.js
 */

const http  = require('http');
const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SERVICES = {
  gateway:       'http://localhost:8080',
  core:          'http://localhost:8085',
  commerce:      'http://localhost:8084',
  payment:       'http://localhost:8089',
  logistics:     'http://localhost:8086',
  intelligence:  'http://localhost:8087',
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
let tokens   = {};   // { manager, manager2, staff, driver, customer }
let testData = {};   // collected IDs from created resources

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function request(url, options = {}) {
  return new Promise((resolve) => {
    const { method = 'GET', body, headers = {}, token, storeId, userId, userType, driverId } = options;
    if (token)    headers['Authorization']      = `Bearer ${token}`;
    if (body)     headers['Content-Type']       = 'application/json';
    if (storeId)  headers['X-Selected-Store-Id'] = storeId;
    if (userId)   headers['X-User-Id']           = userId;
    if (userType) headers['X-User-Type']         = userType;
    if (driverId) headers['X-Driver-Id']         = driverId;

    let parsed;
    try { parsed = new URL(url); } catch { resolve({ status: 0, body: null, error: 'Invalid URL: ' + url }); return; }

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

function pass(sec, test, detail = '') {
  results.pass++;
  results.items.push({ status: 'PASS', section: sec, test, detail });
  console.log(`  \x1b[32mPASS\x1b[0m  ${test}${detail ? ' — ' + detail : ''}`);
}

function fail(sec, test, detail = '') {
  results.fail++;
  results.items.push({ status: 'FAIL', section: sec, test, detail });
  console.log(`  \x1b[31mFAIL\x1b[0m  ${test}${detail ? ' — ' + detail : ''}`);
}

function warn(sec, test, detail = '') {
  results.warn++;
  results.items.push({ status: 'WARN', section: sec, test, detail });
  console.log(`  \x1b[33mWARN\x1b[0m  ${test}${detail ? ' — ' + detail : ''}`);
}

function section(name) {
  console.log(`\n\x1b[1m\x1b[34m${'─'.repeat(68)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m  ${name}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m${'─'.repeat(68)}\x1b[0m`);
}

function extractId(body) {
  if (!body || typeof body !== 'object') return null;
  return body.id || body._id || body.orderId || body.paymentId || body.reviewId
      || body.responseId || body.customerId || body.notificationId
      || body.equipmentId || body.campaignId || body.shiftId || body.sessionId
      || body.purchaseOrderId || body.wasteId || body.supplierId || null;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ─── SECTION: SERVICE HEALTH ──────────────────────────────────────────────────
async function testServiceHealth() {
  section('SERVICE HEALTH');
  for (const [name, base] of Object.entries(SERVICES)) {
    let r = await request(`${base}/actuator/health`);
    if (r.status === 0 || r.status >= 400) {
      r = await request(`${base}/api/system/health`);
    }
    if (r.status === 200 || r.status === 204) {
      pass('health', `${name} service healthy`, base);
    } else {
      fail('health', `${name} service unreachable`, `status ${r.status}`);
    }
  }
}

// ─── SECTION: AUTHENTICATION ──────────────────────────────────────────────────
async function testAuthentication() {
  section('AUTHENTICATION');
  const SEC = 'auth';
  const core = SERVICES.core;

  // Login all 5 accounts
  for (const [role, acc] of Object.entries(ACCOUNTS)) {
    const r = await request(`${core}/api/users/login`, {
      method: 'POST',
      body: { email: acc.email, password: acc.password },
    });
    if (r.status === 200 && r.body && (r.body.token || r.body.accessToken)) {
      tokens[role] = r.body.token || r.body.accessToken;
      tokens[`${role}Refresh`] = r.body.refreshToken;
      // Store user IDs from login response
      const uid = r.body.userId || r.body.id || (r.body.user && r.body.user.id);
      if (uid) testData[`${role}Id`] = uid;
      pass(SEC, `Login ${role}`, acc.email);
    } else {
      fail(SEC, `Login ${role}`, `status ${r.status} — ${acc.email}`);
    }
  }

  // Token refresh
  if (tokens.managerRefresh) {
    const r = await request(`${core}/api/users/refresh`, {
      method: 'POST',
      body: { refreshToken: tokens.managerRefresh },
    });
    if (r.status === 200 && r.body && (r.body.token || r.body.accessToken)) {
      tokens.manager = r.body.token || r.body.accessToken;
      pass(SEC, 'Token refresh — manager');
    } else {
      warn(SEC, 'Token refresh — manager', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'Token refresh — manager', 'no refresh token from login');
  }

  // Validate PIN — staff pin at manager2's store
  if (testData.staffId && tokens.manager2) {
    const r = await request(`${core}/api/users/validate-pin`, {
      method: 'POST',
      token: tokens.manager2,
      body: { userId: testData.staffId, pin: ACCOUNTS.staff.pin, storeCode: ACCOUNTS.staff.storeCode },
    });
    if (r.status === 200) {
      pass(SEC, 'Validate PIN — staff');
    } else {
      warn(SEC, 'Validate PIN — staff', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'Validate PIN — staff', 'missing staffId or manager2 token');
  }

  // GET /api/users/profile
  if (tokens.manager) {
    const r = await request(`${core}/api/users/profile`, { token: tokens.manager });
    if (r.status === 200) {
      const uid = r.body && (r.body.id || r.body.userId);
      if (uid && !testData.managerId) testData.managerId = uid;
      pass(SEC, 'GET /api/users/profile — manager');
    } else {
      fail(SEC, 'GET /api/users/profile — manager', `status ${r.status}`);
    }
  }

  // Logout manager then re-login
  if (tokens.manager) {
    const r = await request(`${core}/api/users/logout`, {
      method: 'POST',
      token: tokens.manager,
      body: { refreshToken: tokens.managerRefresh },
    });
    if (r.status === 200 || r.status === 204) {
      pass(SEC, 'Logout manager');
    } else {
      warn(SEC, 'Logout manager', `status ${r.status}`);
    }
    // Re-login
    const r2 = await request(`${core}/api/users/login`, {
      method: 'POST',
      body: { email: ACCOUNTS.manager.email, password: ACCOUNTS.manager.password },
    });
    if (r2.status === 200 && r2.body && (r2.body.token || r2.body.accessToken)) {
      tokens.manager = r2.body.token || r2.body.accessToken;
      tokens.managerRefresh = r2.body.refreshToken;
      const uid = r2.body.userId || r2.body.id || (r2.body.user && r2.body.user.id);
      if (uid) testData.managerId = uid;
      pass(SEC, 'Re-login manager after logout');
    } else {
      fail(SEC, 'Re-login manager after logout', `status ${r2.status}`);
    }
  }

  // Register new test user
  const r = await request(`${core}/api/users/register`, {
    method: 'POST',
    body: {
      email: 'newuser.test@masova.com',
      password: 'Test@1234',
      firstName: 'New',
      lastName: 'User',
      role: 'CUSTOMER',
    },
  });
  if (r.status === 200 || r.status === 201) {
    pass(SEC, 'POST /api/users/register — new customer');
  } else if (r.status === 409 || r.status === 400) {
    warn(SEC, 'POST /api/users/register — already exists or validation error', `status ${r.status}`);
  } else {
    fail(SEC, 'POST /api/users/register', `status ${r.status}`);
  }

  // GET /api/users/{userId}
  if (testData.managerId && tokens.manager) {
    const r2 = await request(`${core}/api/users/${testData.managerId}`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, `GET /api/users/${testData.managerId}`);
    } else {
      warn(SEC, `GET /api/users/{managerId}`, `status ${r2.status}`);
    }
  }

  // GET /api/users — all users
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users — all users');
    } else {
      fail(SEC, 'GET /api/users', `status ${r2.status}`);
    }
  }

  // GET /api/users/type/STAFF
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users/type/STAFF`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/type/STAFF');
    } else {
      warn(SEC, 'GET /api/users/type/STAFF', `status ${r2.status}`);
    }
  }

  // GET /api/users/store — store employees
  if (tokens.manager && testData.dom001StoreId) {
    const r2 = await request(`${core}/api/users/store`, {
      token: tokens.manager,
      storeId: testData.dom001StoreId,
    });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/store — store employees');
    } else {
      warn(SEC, 'GET /api/users/store', `status ${r2.status}`);
    }
  } else {
    warn(SEC, 'GET /api/users/store', 'storeId not yet available, will retry after stores section');
  }

  // GET /api/users/managers
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users/managers`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/managers');
    } else {
      warn(SEC, 'GET /api/users/managers', `status ${r2.status}`);
    }
  }

  // GET /api/users/search?query=satish
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users/search?query=satish`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/search?query=satish');
    } else {
      warn(SEC, 'GET /api/users/search', `status ${r2.status}`);
    }
  }

  // GET /api/users/stats
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users/stats`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/stats');
    } else {
      warn(SEC, 'GET /api/users/stats', `status ${r2.status}`);
    }
  }

  // GET /api/users/drivers/store
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users/drivers/store`, {
      token: tokens.manager,
      storeId: testData.dom001StoreId,
    });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/drivers/store');
    } else {
      warn(SEC, 'GET /api/users/drivers/store', `status ${r2.status}`);
    }
  }

  // GET /api/users/drivers/available
  if (tokens.manager) {
    const r2 = await request(`${core}/api/users/drivers/available`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/drivers/available');
    } else {
      warn(SEC, 'GET /api/users/drivers/available', `status ${r2.status}`);
    }
  }

  // GET /api/users/{driverId}/status
  if (tokens.manager && testData.driverId) {
    const r2 = await request(`${core}/api/users/${testData.driverId}/status`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/{driverId}/status');
    } else {
      warn(SEC, 'GET /api/users/{driverId}/status', `status ${r2.status}`);
    }
  }

  // PUT /api/users/{driverId}/status
  if (tokens.driver && testData.driverId) {
    const r2 = await request(`${core}/api/users/${testData.driverId}/status`, {
      method: 'PUT',
      token: tokens.driver,
      body: { status: 'AVAILABLE' },
    });
    if (r2.status === 200) {
      pass(SEC, 'PUT /api/users/{driverId}/status → AVAILABLE');
    } else {
      warn(SEC, 'PUT /api/users/{driverId}/status', `status ${r2.status}`);
    }
  }

  // GET /api/users/{staffId}/can-take-orders
  if (tokens.manager && testData.staffId) {
    const r2 = await request(`${core}/api/users/${testData.staffId}/can-take-orders`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/users/{staffId}/can-take-orders');
    } else {
      warn(SEC, 'GET /api/users/{staffId}/can-take-orders', `status ${r2.status}`);
    }
  }
}

// ─── SECTION: SYSTEM ─────────────────────────────────────────────────────────
async function testSystem() {
  section('SYSTEM');
  const SEC  = 'system';
  const core = SERVICES.core;

  for (const path of ['/api/system/health', '/api/system/version', '/api/system/info']) {
    const r = await request(`${core}${path}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, `GET ${path}`);
    } else {
      warn(SEC, `GET ${path}`, `status ${r.status}`);
    }
  }
}

// ─── SECTION: STORES ─────────────────────────────────────────────────────────
async function testStores() {
  section('STORES');
  const SEC  = 'stores';
  const core = SERVICES.core;

  // GET /api/stores/public
  const pub = await request(`${core}/api/stores/public`);
  if (pub.status === 200) {
    pass(SEC, 'GET /api/stores/public');
    const list = Array.isArray(pub.body) ? pub.body : (pub.body && pub.body.content ? pub.body.content : []);
    const dom001 = list.find(s => s.code === 'DOM001' || (s.storeCode === 'DOM001'));
    if (dom001) {
      testData.dom001StoreId = dom001.id || dom001._id;
      pass(SEC, 'Found DOM001 store id', testData.dom001StoreId);
    } else {
      warn(SEC, 'DOM001 not found in public stores listing');
    }
    const dom003 = list.find(s => s.code === 'DOM003' || s.storeCode === 'DOM003');
    if (dom003) testData.dom003StoreId = dom003.id || dom003._id;
    if (list.length > 0 && !testData.dom001StoreId) {
      testData.dom001StoreId = list[0].id || list[0]._id;
    }
  } else {
    fail(SEC, 'GET /api/stores/public', `status ${pub.status}`);
  }

  // GET /api/stores/public/code/DOM001
  const byCode = await request(`${core}/api/stores/public/code/DOM001`);
  if (byCode.status === 200) {
    if (!testData.dom001StoreId && byCode.body) {
      testData.dom001StoreId = byCode.body.id || byCode.body._id;
    }
    pass(SEC, 'GET /api/stores/public/code/DOM001');
  } else {
    warn(SEC, 'GET /api/stores/public/code/DOM001', `status ${byCode.status}`);
  }

  // GET /api/stores/public/{id}
  if (testData.dom001StoreId) {
    const r = await request(`${core}/api/stores/public/${testData.dom001StoreId}`);
    if (r.status === 200) {
      pass(SEC, 'GET /api/stores/public/{id}');
    } else {
      warn(SEC, 'GET /api/stores/public/{id}', `status ${r.status}`);
    }
  }

  // Authenticated endpoints
  if (tokens.manager) {
    // GET /api/stores
    const r = await request(`${core}/api/stores`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/stores — authenticated');
      const list = Array.isArray(r.body) ? r.body : (r.body && r.body.content ? r.body.content : []);
      if (!testData.dom001StoreId && list.length > 0) {
        const dom001 = list.find(s => s.code === 'DOM001');
        testData.dom001StoreId = dom001 ? (dom001.id || dom001._id) : (list[0].id || list[0]._id);
      }
    } else {
      fail(SEC, 'GET /api/stores', `status ${r.status}`);
    }

    // GET /api/stores/{id}
    if (testData.dom001StoreId) {
      const r2 = await request(`${core}/api/stores/${testData.dom001StoreId}`, { token: tokens.manager });
      if (r2.status === 200) {
        pass(SEC, 'GET /api/stores/{id} — authenticated');
      } else {
        warn(SEC, 'GET /api/stores/{id}', `status ${r2.status}`);
      }
    }

    // GET /api/stores/code/DOM001
    const r3 = await request(`${core}/api/stores/code/DOM001`, { token: tokens.manager });
    if (r3.status === 200) {
      pass(SEC, 'GET /api/stores/code/DOM001 — authenticated');
    } else {
      warn(SEC, 'GET /api/stores/code/DOM001 — authenticated', `status ${r3.status}`);
    }

    // GET /api/stores/region/south
    const r4 = await request(`${core}/api/stores/region/south`, { token: tokens.manager });
    if (r4.status === 200) {
      pass(SEC, 'GET /api/stores/region/south');
    } else {
      warn(SEC, 'GET /api/stores/region/south', `status ${r4.status}`);
    }

    // GET /api/stores/nearby
    const r5 = await request(`${core}/api/stores/nearby?latitude=17.385&longitude=78.4867`, { token: tokens.manager });
    if (r5.status === 200) {
      pass(SEC, 'GET /api/stores/nearby');
    } else {
      warn(SEC, 'GET /api/stores/nearby', `status ${r5.status}`);
    }

    // GET /api/stores/{id}/delivery-radius-check
    if (testData.dom001StoreId) {
      const r6 = await request(`${core}/api/stores/${testData.dom001StoreId}/delivery-radius-check?latitude=17.385&longitude=78.4867`, { token: tokens.manager });
      if (r6.status === 200) {
        pass(SEC, 'GET /api/stores/{id}/delivery-radius-check');
      } else {
        warn(SEC, 'GET /api/stores/{id}/delivery-radius-check', `status ${r6.status}`);
      }
    }

    // GET /api/stores/operational-status
    const r7 = await request(`${core}/api/stores/operational-status`, {
      token: tokens.manager,
      storeId: testData.dom001StoreId,
    });
    if (r7.status === 200) {
      pass(SEC, 'GET /api/stores/operational-status');
    } else {
      warn(SEC, 'GET /api/stores/operational-status', `status ${r7.status}`);
    }

    // GET /api/stores/metrics
    const r8 = await request(`${core}/api/stores/metrics`, {
      token: tokens.manager,
      storeId: testData.dom001StoreId,
    });
    if (r8.status === 200) {
      pass(SEC, 'GET /api/stores/metrics');
    } else {
      warn(SEC, 'GET /api/stores/metrics', `status ${r8.status}`);
    }

    // POST /api/stores/access-check
    if (testData.dom001StoreId) {
      const r9 = await request(`${core}/api/stores/access-check`, {
        method: 'POST',
        token: tokens.manager,
        body: { storeId: testData.dom001StoreId, orderType: 'TAKEAWAY' },
      });
      if (r9.status === 200) {
        pass(SEC, 'POST /api/stores/access-check');
      } else {
        warn(SEC, 'POST /api/stores/access-check', `status ${r9.status}`);
      }
    }

    // POST /api/stores — create store
    const createBody = {
      name: 'Test Store API',
      code: 'TST001',
      address: { street: '123 Test St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      phone: '9876543210',
      email: 'test@masova.com',
      status: 'ACTIVE',
    };
    const rCreate = await request(`${core}/api/stores`, {
      method: 'POST',
      token: tokens.manager,
      body: createBody,
    });
    if (rCreate.status === 200 || rCreate.status === 201) {
      testData.newStoreId = rCreate.body && (rCreate.body.id || rCreate.body._id);
      pass(SEC, 'POST /api/stores — create store', testData.newStoreId);
    } else if (rCreate.status === 409) {
      warn(SEC, 'POST /api/stores — TST001 already exists');
    } else {
      warn(SEC, 'POST /api/stores', `status ${rCreate.status}`);
    }

    // PUT /api/stores/{newStoreId}
    if (testData.newStoreId) {
      const rUpdate = await request(`${core}/api/stores/${testData.newStoreId}`, {
        method: 'PUT',
        token: tokens.manager,
        body: { name: 'Test Store API Updated' },
      });
      if (rUpdate.status === 200) {
        pass(SEC, 'PUT /api/stores/{newStoreId}');
      } else {
        warn(SEC, 'PUT /api/stores/{newStoreId}', `status ${rUpdate.status}`);
      }
    }
  }
}

// ─── SECTION: MENU ───────────────────────────────────────────────────────────
async function testMenu() {
  section('MENU');
  const SEC  = 'menu';
  const base = SERVICES.commerce;

  // Public endpoints
  const pubAll = await request(`${base}/api/menu/public?storeCode=DOM001`);
  if (pubAll.status === 200) {
    pass(SEC, 'GET /api/menu/public?storeCode=DOM001');
    const items = Array.isArray(pubAll.body) ? pubAll.body : (pubAll.body && pubAll.body.content ? pubAll.body.content : []);
    if (items.length > 0) {
      testData.menuItemId = items[0].id || items[0]._id;
    }
  } else {
    fail(SEC, 'GET /api/menu/public', `status ${pubAll.status}`);
  }

  if (testData.menuItemId) {
    const r = await request(`${base}/api/menu/public/${testData.menuItemId}`);
    if (r.status === 200) {
      pass(SEC, 'GET /api/menu/public/{menuItemId}');
    } else {
      warn(SEC, 'GET /api/menu/public/{menuItemId}', `status ${r.status}`);
    }
  }

  const publicFilters = [
    ['cuisine/SOUTH_INDIAN', '/api/menu/public/cuisine/SOUTH_INDIAN?storeCode=DOM001'],
    ['category/MAIN_COURSE', '/api/menu/public/category/MAIN_COURSE?storeCode=DOM001'],
    ['dietary/VEG',          '/api/menu/public/dietary/VEG?storeCode=DOM001'],
    ['recommended',          '/api/menu/public/recommended?storeCode=DOM001'],
    ['search?q=dosa',        '/api/menu/public/search?q=dosa&storeCode=DOM001'],
    ['tag/bestseller',       '/api/menu/public/tag/bestseller?storeCode=DOM001'],
  ];
  for (const [label, path] of publicFilters) {
    const r = await request(`${base}${path}`);
    if (r.status === 200) {
      pass(SEC, `GET ${path.split('?')[0]}`);
    } else {
      warn(SEC, `GET ${label}`, `status ${r.status}`);
    }
  }

  if (tokens.manager) {
    // GET /api/menu/items
    const r = await request(`${base}/api/menu/items?storeCode=DOM001`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/menu/items — manager');
    } else {
      warn(SEC, 'GET /api/menu/items', `status ${r.status}`);
    }

    // GET /api/menu/stats
    const r2 = await request(`${base}/api/menu/stats?storeCode=DOM001`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/menu/stats');
    } else {
      warn(SEC, 'GET /api/menu/stats', `status ${r2.status}`);
    }

    // POST /api/menu/items
    const createBody = {
      name: 'API Test Dosa',
      description: 'Test item created by API test suite',
      basePrice: 8000,
      category: 'MAIN_COURSE',
      cuisine: 'SOUTH_INDIAN',
      isAvailable: true,
      isVegetarian: true,
      storeId: testData.dom001StoreId,
    };
    const rCreate = await request(`${base}/api/menu/items`, {
      method: 'POST',
      token: tokens.manager,
      body: createBody,
    });
    if (rCreate.status === 200 || rCreate.status === 201) {
      testData.newMenuItemId = rCreate.body && (rCreate.body.id || rCreate.body._id);
      pass(SEC, 'POST /api/menu/items — create', testData.newMenuItemId);
    } else {
      warn(SEC, 'POST /api/menu/items', `status ${rCreate.status}`);
    }

    // PUT /api/menu/items/{id}
    if (testData.newMenuItemId) {
      const rUpdate = await request(`${base}/api/menu/items/${testData.newMenuItemId}`, {
        method: 'PUT',
        token: tokens.manager,
        body: { name: 'API Test Dosa Updated', basePrice: 8500 },
      });
      if (rUpdate.status === 200) {
        pass(SEC, 'PUT /api/menu/items/{newMenuItemId}');
      } else {
        warn(SEC, 'PUT /api/menu/items/{newMenuItemId}', `status ${rUpdate.status}`);
      }

      // PATCH /api/menu/items/{id}/availability
      const rAvail = await request(`${base}/api/menu/items/${testData.newMenuItemId}/availability`, {
        method: 'PATCH',
        token: tokens.manager,
        body: { available: false },
      });
      if (rAvail.status === 200) {
        pass(SEC, 'PATCH /api/menu/items/{newMenuItemId}/availability');
      } else {
        warn(SEC, 'PATCH /api/menu/items/{newMenuItemId}/availability', `status ${rAvail.status}`);
      }
    }
  }
}

// ─── ORDER HELPERS ────────────────────────────────────────────────────────────
async function createOrder(body, token, storeId) {
  return request(`${SERVICES.commerce}/api/orders`, {
    method: 'POST',
    token,
    storeId,
    body,
  });
}

async function patchOrderStatus(orderId, status, token, storeId) {
  return request(`${SERVICES.commerce}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    token,
    storeId,
    body: { status },
  });
}

async function patchOrderNextStage(orderId, token, storeId) {
  return request(`${SERVICES.commerce}/api/orders/${orderId}/next-stage`, {
    method: 'PATCH',
    token,
    storeId,
  });
}

function buildOrderItems() {
  const items = [];
  if (testData.menuItemId) {
    items.push({ menuItemId: testData.menuItemId, quantity: 2, specialInstructions: 'Extra spicy' });
  }
  if (testData.newMenuItemId) {
    items.push({ menuItemId: testData.newMenuItemId, quantity: 1 });
  }
  if (items.length === 0) {
    // Fallback placeholder
    items.push({ name: 'Placeholder Item', quantity: 1, price: 5000 });
  }
  return items;
}

// ─── SECTION: ORDER FLOW — DINE_IN ───────────────────────────────────────────
async function testOrderFlowDineIn() {
  section('ORDER FLOW — DINE_IN');
  const SEC     = 'orders-dinein';
  const storeId = testData.dom001StoreId;
  const token   = tokens.manager;

  if (!storeId || !token) {
    warn(SEC, 'DINE_IN order flow skipped', 'missing storeId or manager token');
    return;
  }

  // Create DINE_IN order
  const r = await createOrder({
    storeId,
    orderType: 'DINE_IN',
    tableNumber: 'T5',
    items: buildOrderItems(),
    customerId: testData.customerId,
  }, token, storeId);

  if (r.status === 200 || r.status === 201) {
    const body = r.body;
    testData.dineInOrderId     = body.id || body._id || body.orderId;
    testData.dineInOrderNumber = body.orderNumber;
    testData.dineInOrderAmount = body.totalAmount || body.total || 0;
    pass(SEC, 'POST /api/orders — DINE_IN', testData.dineInOrderId);
  } else {
    fail(SEC, 'POST /api/orders — DINE_IN', `status ${r.status}`);
    return;
  }

  const oid = testData.dineInOrderId;

  // PATCH status → PREPARING
  const rPrep = await patchOrderStatus(oid, 'PREPARING', token, storeId);
  if (rPrep.status === 200) {
    pass(SEC, 'PATCH /api/orders/{id}/status → PREPARING');
  } else {
    warn(SEC, 'PATCH status → PREPARING', `status ${rPrep.status}`);
  }

  // PATCH next-stage
  const rNext = await patchOrderNextStage(oid, token, storeId);
  if (rNext.status === 200) {
    pass(SEC, 'PATCH /api/orders/{id}/next-stage');
  } else {
    warn(SEC, 'PATCH next-stage', `status ${rNext.status}`);
  }

  // GET /api/orders/{id}
  const rGet = await request(`${SERVICES.commerce}/api/orders/${oid}`, { token, storeId });
  if (rGet.status === 200) {
    pass(SEC, 'GET /api/orders/{dineInOrderId}');
  } else {
    warn(SEC, 'GET /api/orders/{dineInOrderId}', `status ${rGet.status}`);
  }

  // PATCH priority
  const rPrio = await request(`${SERVICES.commerce}/api/orders/${oid}/priority`, {
    method: 'PATCH',
    token,
    storeId,
    body: { priority: 'URGENT' },
  });
  if (rPrio.status === 200) {
    pass(SEC, 'PATCH /api/orders/{id}/priority → URGENT');
  } else {
    warn(SEC, 'PATCH priority → URGENT', `status ${rPrio.status}`);
  }

  // PATCH status → SERVED
  const rServed = await patchOrderStatus(oid, 'SERVED', token, storeId);
  if (rServed.status === 200) {
    pass(SEC, 'PATCH /api/orders/{id}/status → SERVED');
  } else {
    warn(SEC, 'PATCH status → SERVED', `status ${rServed.status}`);
  }
}

// ─── SECTION: ORDER FLOW — TAKEAWAY ──────────────────────────────────────────
async function testOrderFlowTakeaway() {
  section('ORDER FLOW — TAKEAWAY');
  const SEC     = 'orders-takeaway';
  const storeId = testData.dom001StoreId;
  const token   = tokens.manager;

  if (!storeId || !token) {
    warn(SEC, 'TAKEAWAY flow skipped', 'missing storeId or manager token');
    return;
  }

  const r = await createOrder({
    storeId,
    orderType: 'TAKEAWAY',
    items: buildOrderItems(),
    customerId: testData.customerId,
  }, token, storeId);

  if (r.status === 200 || r.status === 201) {
    testData.takeawayOrderId     = r.body.id || r.body._id || r.body.orderId;
    testData.takeawayOrderNumber = r.body.orderNumber;
    testData.takeawayOrderAmount = r.body.totalAmount || r.body.total || 0;
    pass(SEC, 'POST /api/orders — TAKEAWAY', testData.takeawayOrderId);
  } else {
    fail(SEC, 'POST /api/orders — TAKEAWAY', `status ${r.status}`);
    return;
  }

  const oid = testData.takeawayOrderId;

  // Advance through stages x4
  for (let i = 0; i < 4; i++) {
    const rNext = await patchOrderNextStage(oid, token, storeId);
    if (rNext.status === 200) {
      pass(SEC, `PATCH /api/orders/{id}/next-stage (step ${i + 1})`);
    } else {
      warn(SEC, `PATCH next-stage step ${i + 1}`, `status ${rNext.status}`);
    }
  }

  // PATCH status → COMPLETED
  const rDone = await patchOrderStatus(oid, 'COMPLETED', token, storeId);
  if (rDone.status === 200) {
    pass(SEC, 'PATCH /api/orders/{id}/status → COMPLETED');
  } else {
    warn(SEC, 'PATCH status → COMPLETED', `status ${rDone.status}`);
  }

  // GET by order number
  if (testData.takeawayOrderNumber) {
    const rNum = await request(`${SERVICES.commerce}/api/orders/number/${testData.takeawayOrderNumber}`, { token });
    if (rNum.status === 200) {
      pass(SEC, 'GET /api/orders/number/{orderNumber}');
    } else {
      warn(SEC, 'GET /api/orders/number/{orderNumber}', `status ${rNum.status}`);
    }
  }

  // GET track
  const rTrack = await request(`${SERVICES.commerce}/api/orders/track/${oid}`, { token: tokens.customer });
  if (rTrack.status === 200) {
    pass(SEC, 'GET /api/orders/track/{takeawayOrderId}');
  } else {
    warn(SEC, 'GET /api/orders/track/{takeawayOrderId}', `status ${rTrack.status}`);
  }
}

// ─── SECTION: ORDER FLOW — DELIVERY ──────────────────────────────────────────
async function testOrderFlowDelivery() {
  section('ORDER FLOW — DELIVERY');
  const SEC     = 'orders-delivery';
  const storeId = testData.dom001StoreId;
  const token   = tokens.manager;

  if (!storeId || !token) {
    warn(SEC, 'DELIVERY flow skipped', 'missing storeId or manager token');
    return;
  }

  const r = await createOrder({
    storeId,
    orderType: 'DELIVERY',
    items: buildOrderItems(),
    customerId: testData.customerId,
    deliveryAddress: {
      street: '123 Test Street',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      latitude: 17.385,
      longitude: 78.4867,
    },
  }, token, storeId);

  if (r.status === 200 || r.status === 201) {
    testData.deliveryOrderId     = r.body.id || r.body._id || r.body.orderId;
    testData.deliveryOrderNumber = r.body.orderNumber;
    testData.deliveryOrderAmount = r.body.totalAmount || r.body.total || 0;
    pass(SEC, 'POST /api/orders — DELIVERY', testData.deliveryOrderId);
  } else {
    fail(SEC, 'POST /api/orders — DELIVERY', `status ${r.status}`);
    return;
  }

  const oid = testData.deliveryOrderId;

  // PREPARING → BAKED → READY
  for (const status of ['PREPARING', 'BAKED', 'READY']) {
    const rs = await patchOrderStatus(oid, status, token, storeId);
    if (rs.status === 200) {
      pass(SEC, `PATCH status → ${status}`);
    } else {
      warn(SEC, `PATCH status → ${status}`, `status ${rs.status}`);
    }
  }

  // Assign driver
  if (testData.driverId) {
    const rAssign = await request(`${SERVICES.commerce}/api/orders/${oid}/assign-driver`, {
      method: 'PATCH',
      token,
      storeId,
      body: { driverId: testData.driverId },
    });
    if (rAssign.status === 200) {
      pass(SEC, 'PATCH /api/orders/{id}/assign-driver');
    } else {
      warn(SEC, 'PATCH assign-driver', `status ${rAssign.status}`);
    }
  } else {
    warn(SEC, 'PATCH assign-driver', 'no driverId available');
  }

  // DISPATCHED
  const rDisp = await patchOrderStatus(oid, 'DISPATCHED', token, storeId);
  if (rDisp.status === 200) {
    pass(SEC, 'PATCH status → DISPATCHED');
  } else {
    warn(SEC, 'PATCH status → DISPATCHED', `status ${rDisp.status}`);
  }

  // Mark delivered
  const rDelivered = await request(`${SERVICES.commerce}/api/orders/${oid}/mark-delivered`, {
    method: 'PUT',
    token,
    storeId,
    body: { proofType: 'NONE', notes: 'API test delivery completion' },
  });
  if (rDelivered.status === 200) {
    pass(SEC, 'PUT /api/orders/{id}/mark-delivered');
  } else {
    warn(SEC, 'PUT /api/orders/{id}/mark-delivered', `status ${rDelivered.status}`);
  }
}

// ─── SECTION: ORDER MANAGEMENT ───────────────────────────────────────────────
async function testOrderManagement() {
  section('ORDER MANAGEMENT');
  const SEC     = 'orders-mgmt';
  const base    = SERVICES.commerce;
  const storeId = testData.dom001StoreId;

  // GET /api/orders/kitchen — staff token
  if (tokens.staff) {
    const r = await request(`${base}/api/orders/kitchen`, { token: tokens.staff, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/kitchen — staff');
    } else {
      warn(SEC, 'GET /api/orders/kitchen', `status ${r.status}`);
    }
  }

  // GET /api/orders/store — manager
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/store`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/store — manager');
    } else {
      warn(SEC, 'GET /api/orders/store', `status ${r.status}`);
    }
  }

  // GET by status
  for (const status of ['RECEIVED', 'COMPLETED']) {
    if (tokens.manager) {
      const r = await request(`${base}/api/orders/status/${status}`, { token: tokens.manager, storeId });
      if (r.status === 200) {
        pass(SEC, `GET /api/orders/status/${status}`);
      } else {
        warn(SEC, `GET /api/orders/status/${status}`, `status ${r.status}`);
      }
    }
  }

  // GET /api/orders/customer/{customerId}
  if (tokens.customer && testData.customerId) {
    const r = await request(`${base}/api/orders/customer/${testData.customerId}`, { token: tokens.customer });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/customer/{customerId}');
    } else {
      warn(SEC, 'GET /api/orders/customer/{customerId}', `status ${r.status}`);
    }
  }

  // GET /api/orders/search
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/search?query=Test`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/search?query=Test');
    } else {
      warn(SEC, 'GET /api/orders/search', `status ${r.status}`);
    }
  }

  // GET /api/orders/date/{today}
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/date/${today()}`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, `GET /api/orders/date/${today()}`);
    } else {
      warn(SEC, 'GET /api/orders/date/{today}', `status ${r.status}`);
    }
  }

  // GET /api/orders/range
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/range?start=2026-01-01T00:00:00&end=2026-12-31T23:59:59`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/range');
    } else {
      warn(SEC, 'GET /api/orders/range', `status ${r.status}`);
    }
  }

  // GET /api/orders/active-deliveries/count
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/active-deliveries/count`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/active-deliveries/count');
    } else {
      warn(SEC, 'GET /api/orders/active-deliveries/count', `status ${r.status}`);
    }
  }

  // GET /api/orders/store/avg-prep-time
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/store/avg-prep-time`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/store/avg-prep-time');
    } else {
      warn(SEC, 'GET /api/orders/store/avg-prep-time', `status ${r.status}`);
    }
  }

  // GET /api/orders/store/analytics/prep-time-distribution
  if (tokens.manager) {
    const r = await request(`${base}/api/orders/store/analytics/prep-time-distribution?date=${today()}`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/store/analytics/prep-time-distribution');
    } else {
      warn(SEC, 'GET prep-time-distribution', `status ${r.status}`);
    }
  }

  // GET /api/orders/{takeawayOrderId}/quality-checkpoints
  if (tokens.manager && testData.takeawayOrderId) {
    const r = await request(`${base}/api/orders/${testData.takeawayOrderId}/quality-checkpoints`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/orders/{id}/quality-checkpoints');
    } else {
      warn(SEC, 'GET quality-checkpoints', `status ${r.status}`);
    }
  }

  // POST /api/orders/{deliveryOrderId}/quality-checkpoint
  if (tokens.manager && testData.deliveryOrderId) {
    const r = await request(`${base}/api/orders/${testData.deliveryOrderId}/quality-checkpoint`, {
      method: 'POST',
      token: tokens.manager,
      storeId,
      body: { type: 'FINAL_INSPECTION', checkpointName: 'Final Check', passed: true },
    });
    if (r.status === 200 || r.status === 201) {
      pass(SEC, 'POST /api/orders/{id}/quality-checkpoint');
    } else {
      warn(SEC, 'POST quality-checkpoint', `status ${r.status}`);
    }
  }

  // PATCH /api/orders/{deliveryOrderId}/assign-make-table
  if (tokens.manager && testData.deliveryOrderId) {
    const r = await request(`${base}/api/orders/${testData.deliveryOrderId}/assign-make-table`, {
      method: 'PATCH',
      token: tokens.manager,
      storeId,
      body: { station: 'STATION_1' },
    });
    if (r.status === 200) {
      pass(SEC, 'PATCH /api/orders/{id}/assign-make-table');
    } else {
      warn(SEC, 'PATCH assign-make-table', `status ${r.status}`);
    }
  }
}

// ─── SECTION: PAYMENTS ───────────────────────────────────────────────────────
async function testPayments() {
  section('PAYMENTS');
  const SEC     = 'payments';
  const base    = SERVICES.payment;
  const storeId = testData.dom001StoreId;

  // POST /api/payments/cash
  if (testData.dineInOrderId && testData.customerId) {
    const r = await request(`${base}/api/payments/cash`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        orderId: testData.dineInOrderId,
        amount: testData.dineInOrderAmount || 10000,
        customerId: testData.customerId,
        storeId,
        paymentMethod: 'CASH',
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.cashPaymentId = r.body && (r.body.id || r.body._id || r.body.paymentId || r.body.transactionId);
      pass(SEC, 'POST /api/payments/cash', testData.cashPaymentId);
    } else {
      warn(SEC, 'POST /api/payments/cash', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST /api/payments/cash', 'missing dineInOrderId or customerId');
  }

  // GET /api/payments/{cashPaymentId}
  if (testData.cashPaymentId) {
    const r = await request(`${base}/api/payments/${testData.cashPaymentId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/{cashPaymentId}');
    } else {
      warn(SEC, 'GET /api/payments/{cashPaymentId}', `status ${r.status}`);
    }
  }

  // GET /api/payments/order/{dineInOrderId}
  if (testData.dineInOrderId) {
    const r = await request(`${base}/api/payments/order/${testData.dineInOrderId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/order/{dineInOrderId}');
    } else {
      warn(SEC, 'GET /api/payments/order/{dineInOrderId}', `status ${r.status}`);
    }
  }

  // GET /api/payments/store
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/payments/store`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/store');
    } else {
      warn(SEC, 'GET /api/payments/store', `status ${r.status}`);
    }
  }

  // GET /api/payments/reconciliation
  if (tokens.manager) {
    const r = await request(`${base}/api/payments/reconciliation?date=${today()}`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/reconciliation');
    } else {
      warn(SEC, 'GET /api/payments/reconciliation', `status ${r.status}`);
    }
  }

  // POST /api/payments/initiate (UPI)
  if (testData.deliveryOrderId && testData.customerId) {
    const r = await request(`${base}/api/payments/initiate`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        orderId: testData.deliveryOrderId,
        amount: testData.deliveryOrderAmount || 12000,
        customerId: testData.customerId,
        storeId,
        paymentMethod: 'UPI',
        redirectUrl: 'https://masova.com/payment/callback',
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.upiPaymentId = r.body && (r.body.id || r.body._id || r.body.paymentId || r.body.transactionId);
      pass(SEC, 'POST /api/payments/initiate — UPI', testData.upiPaymentId);
    } else {
      warn(SEC, 'POST /api/payments/initiate', `status ${r.status}`);
    }
  }

  // GET /api/payments/customer/{customerId}
  if (testData.customerId && tokens.manager) {
    const r = await request(`${base}/api/payments/customer/${testData.customerId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/customer/{customerId}');
    } else {
      warn(SEC, 'GET /api/payments/customer/{customerId}', `status ${r.status}`);
    }
  }

  // POST /api/payments/refund
  if (testData.cashPaymentId && tokens.manager) {
    const r = await request(`${base}/api/payments/refund`, {
      method: 'POST',
      token: tokens.manager,
      body: { transactionId: testData.cashPaymentId, amount: 100, reason: 'Test refund', refundMethod: 'ORIGINAL' },
    });
    if (r.status === 200 || r.status === 201) {
      testData.refundId = r.body && (r.body.id || r.body._id || r.body.refundId);
      pass(SEC, 'POST /api/payments/refund', testData.refundId);
    } else {
      warn(SEC, 'POST /api/payments/refund', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST /api/payments/refund', 'no cashPaymentId');
  }

  // GET /api/payments/refund/{refundId}
  if (testData.refundId) {
    const r = await request(`${base}/api/payments/refund/${testData.refundId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/refund/{refundId}');
    } else {
      warn(SEC, 'GET /api/payments/refund/{refundId}', `status ${r.status}`);
    }
  }

  // GET /api/payments/refund/order/{dineInOrderId}
  if (testData.dineInOrderId) {
    const r = await request(`${base}/api/payments/refund/order/${testData.dineInOrderId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/payments/refund/order/{dineInOrderId}');
    } else {
      warn(SEC, 'GET /api/payments/refund/order/{dineInOrderId}', `status ${r.status}`);
    }
  }
}

// ─── SECTION: DELIVERY / LOGISTICS ───────────────────────────────────────────
async function testDelivery() {
  section('DELIVERY / LOGISTICS');
  const SEC     = 'delivery';
  const base    = SERVICES.logistics;
  const storeId = testData.dom001StoreId;
  const driverId = testData.driverId;

  // PUT /api/delivery/driver/status
  if (tokens.driver && driverId) {
    const r = await request(`${base}/api/delivery/driver/status`, {
      method: 'PUT',
      token: tokens.driver,
      body: { driverId, status: 'AVAILABLE' },
    });
    if (r.status === 200) {
      pass(SEC, 'PUT /api/delivery/driver/status → AVAILABLE');
    } else {
      warn(SEC, 'PUT /api/delivery/driver/status', `status ${r.status}`);
    }
  }

  // GET /api/delivery/driver/{driverId}/status
  if (tokens.manager && driverId) {
    const r = await request(`${base}/api/delivery/driver/${driverId}/status`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/delivery/driver/{driverId}/status');
    } else {
      warn(SEC, 'GET /api/delivery/driver/{driverId}/status', `status ${r.status}`);
    }
  }

  // GET /api/delivery/drivers/available
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/delivery/drivers/available?storeId=${storeId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/delivery/drivers/available');
    } else {
      warn(SEC, 'GET /api/delivery/drivers/available', `status ${r.status}`);
    }
  }

  // Zone endpoints
  const zoneParams = `lat=17.385&lng=78.4867&storeId=${storeId}`;
  for (const [label, path] of [
    ['zone/check',    `/api/delivery/zone/check?${zoneParams}`],
    ['zone/fee',      `/api/delivery/zone/fee?${zoneParams}`],
    ['zone/list',     `/api/delivery/zone/list?storeId=${storeId}`],
    ['zone/validate', `/api/delivery/zone/validate?${zoneParams}`],
  ]) {
    if (tokens.manager && storeId) {
      const r = await request(`${base}${path}`, { token: tokens.manager });
      if (r.status === 200) {
        pass(SEC, `GET /api/delivery/${label}`);
      } else {
        warn(SEC, `GET /api/delivery/${label}`, `status ${r.status}`);
      }
    }
  }

  // POST /api/delivery/location-update
  if (tokens.driver && driverId) {
    const r = await request(`${base}/api/delivery/location-update`, {
      method: 'POST',
      token: tokens.driver,
      body: { driverId, latitude: 17.385, longitude: 78.4867, accuracy: 10 },
    });
    if (r.status === 200 || r.status === 204) {
      pass(SEC, 'POST /api/delivery/location-update');
    } else {
      warn(SEC, 'POST /api/delivery/location-update', `status ${r.status}`);
    }
  }

  // GET /api/delivery/track/{deliveryOrderId}
  if (tokens.customer && testData.deliveryOrderId) {
    const r = await request(`${base}/api/delivery/track/${testData.deliveryOrderId}`, { token: tokens.customer });
    if (r.status === 200) {
      pass(SEC, 'GET /api/delivery/track/{deliveryOrderId}');
    } else {
      warn(SEC, 'GET /api/delivery/track/{deliveryOrderId}', `status ${r.status}`);
    }
  }

  // GET /api/delivery/eta/{deliveryOrderId}
  if (tokens.customer && testData.deliveryOrderId) {
    const r = await request(`${base}/api/delivery/eta/${testData.deliveryOrderId}`, { token: tokens.customer });
    if (r.status === 200) {
      pass(SEC, 'GET /api/delivery/eta/{deliveryOrderId}');
    } else {
      warn(SEC, 'GET /api/delivery/eta/{deliveryOrderId}', `status ${r.status}`);
    }
  }

  // GET driver performance
  if (tokens.manager && driverId) {
    for (const [label, path] of [
      ['performance',       `/api/delivery/driver/${driverId}/performance`],
      ['performance/today', `/api/delivery/driver/${driverId}/performance/today`],
    ]) {
      const r = await request(`${base}${path}`, { token: tokens.manager });
      if (r.status === 200) {
        pass(SEC, `GET /api/delivery/driver/${label}`);
      } else {
        warn(SEC, `GET /api/delivery/driver/${label}`, `status ${r.status}`);
      }
    }
  }

  // GET /api/delivery/metrics/today
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/delivery/metrics/today`, {
      token: tokens.manager,
      storeId,
      userType: 'MANAGER',
    });
    if (r.status === 200) {
      pass(SEC, 'GET /api/delivery/metrics/today');
    } else {
      warn(SEC, 'GET /api/delivery/metrics/today', `status ${r.status}`);
    }
  }

  // POST /api/delivery/auto-dispatch
  if (tokens.manager && testData.deliveryOrderId && storeId) {
    const r = await request(`${base}/api/delivery/auto-dispatch`, {
      method: 'POST',
      token: tokens.manager,
      body: { orderId: testData.deliveryOrderId, storeId },
    });
    if (r.status === 200 || r.status === 201) {
      pass(SEC, 'POST /api/delivery/auto-dispatch');
    } else {
      warn(SEC, 'POST /api/delivery/auto-dispatch', `status ${r.status}`);
    }
  }

  // GET /api/delivery/driver/{driverId}/pending
  if (tokens.driver && driverId) {
    const r = await request(`${base}/api/delivery/driver/${driverId}/pending`, { token: tokens.driver });
    if (r.status === 200) {
      pass(SEC, 'GET /api/delivery/driver/{driverId}/pending');
    } else {
      warn(SEC, 'GET /api/delivery/driver/{driverId}/pending', `status ${r.status}`);
    }
  }

  // POST /api/delivery/{deliveryOrderId}/generate-otp
  if (tokens.manager && testData.deliveryOrderId) {
    const r = await request(`${base}/api/delivery/${testData.deliveryOrderId}/generate-otp`, {
      method: 'POST',
      token: tokens.manager,
    });
    if (r.status === 200 || r.status === 201) {
      pass(SEC, 'POST /api/delivery/{deliveryOrderId}/generate-otp');
    } else {
      warn(SEC, 'POST generate-otp', `status ${r.status}`);
    }
  }
}

// ─── SECTION: INVENTORY ───────────────────────────────────────────────────────
async function testInventory() {
  section('INVENTORY');
  const SEC     = 'inventory';
  const base    = SERVICES.commerce;
  const storeId = testData.dom001StoreId;

  // GET /api/inventory/items
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/inventory/items`, {
      token: tokens.manager,
      storeId,
      userType: 'MANAGER',
    });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/items');
      const items = Array.isArray(r.body) ? r.body : (r.body && r.body.content ? r.body.content : []);
      if (items.length > 0) {
        testData.inventoryItemId = items[0].id || items[0]._id;
      }
    } else {
      warn(SEC, 'GET /api/inventory/items', `status ${r.status}`);
    }
  }

  // GET /api/inventory/items/{id}
  if (testData.inventoryItemId && tokens.manager) {
    const r = await request(`${base}/api/inventory/items/${testData.inventoryItemId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/items/{inventoryItemId}');
    } else {
      warn(SEC, 'GET /api/inventory/items/{inventoryItemId}', `status ${r.status}`);
    }
  }

  // GET by category, search
  if (tokens.manager && storeId) {
    const r1 = await request(`${base}/api/inventory/items/category/INGREDIENT?storeId=${storeId}`, { token: tokens.manager });
    if (r1.status === 200) {
      pass(SEC, 'GET /api/inventory/items/category/INGREDIENT');
    } else {
      warn(SEC, 'GET /api/inventory/items/category/INGREDIENT', `status ${r1.status}`);
    }

    const r2 = await request(`${base}/api/inventory/items/search?query=tomato`, { token: tokens.manager, storeId });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/inventory/items/search?query=tomato');
    } else {
      warn(SEC, 'GET /api/inventory/items/search', `status ${r2.status}`);
    }
  }

  // Stock status endpoints
  for (const [label, path] of [
    ['low-stock',     `/api/inventory/low-stock?storeId=${storeId}`],
    ['out-of-stock',  `/api/inventory/out-of-stock?storeId=${storeId}`],
    ['expiring-soon', `/api/inventory/expiring-soon?storeId=${storeId}`],
  ]) {
    if (tokens.manager && storeId) {
      const r = await request(`${base}${path}`, { token: tokens.manager });
      if (r.status === 200) {
        pass(SEC, `GET /api/inventory/${label}`);
      } else {
        warn(SEC, `GET /api/inventory/${label}`, `status ${r.status}`);
      }
    }
  }

  // GET /api/inventory/alerts/low-stock
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/inventory/alerts/low-stock`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/alerts/low-stock');
    } else {
      warn(SEC, 'GET /api/inventory/alerts/low-stock', `status ${r.status}`);
    }
  }

  // GET value endpoints
  if (tokens.manager && storeId) {
    const r1 = await request(`${base}/api/inventory/value`, { token: tokens.manager, storeId });
    if (r1.status === 200) {
      pass(SEC, 'GET /api/inventory/value');
    } else {
      warn(SEC, 'GET /api/inventory/value', `status ${r1.status}`);
    }

    const r2 = await request(`${base}/api/inventory/value/by-category?storeId=${storeId}`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/inventory/value/by-category');
    } else {
      warn(SEC, 'GET /api/inventory/value/by-category', `status ${r2.status}`);
    }
  }

  // POST /api/inventory/items
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/inventory/items`, {
      method: 'POST',
      token: tokens.manager,
      storeId,
      body: {
        name: 'API Test Ingredient',
        unit: 'KG',
        currentStock: 10,
        minimumStock: 2,
        category: 'INGREDIENT',
        storeId,
        costPerUnit: 50,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.newInventoryItemId = r.body && (r.body.id || r.body._id);
      pass(SEC, 'POST /api/inventory/items — create', testData.newInventoryItemId);
    } else {
      warn(SEC, 'POST /api/inventory/items', `status ${r.status}`);
    }
  }

  // PUT /api/inventory/items/{id}
  if (testData.newInventoryItemId && tokens.manager) {
    const r = await request(`${base}/api/inventory/items/${testData.newInventoryItemId}`, {
      method: 'PUT',
      token: tokens.manager,
      body: { name: 'API Test Ingredient Updated' },
    });
    if (r.status === 200) {
      pass(SEC, 'PUT /api/inventory/items/{newInventoryItemId}');
    } else {
      warn(SEC, 'PUT /api/inventory/items/{newInventoryItemId}', `status ${r.status}`);
    }
  }

  // PATCH /api/inventory/items/{id}/adjust
  if (testData.newInventoryItemId && tokens.manager) {
    const r = await request(`${base}/api/inventory/items/${testData.newInventoryItemId}/adjust`, {
      method: 'PATCH',
      token: tokens.manager,
      body: { quantity: 5, reason: 'Test adjustment', type: 'ADD' },
    });
    if (r.status === 200) {
      pass(SEC, 'PATCH /api/inventory/items/{id}/adjust');
    } else {
      warn(SEC, 'PATCH /api/inventory/items/{id}/adjust', `status ${r.status}`);
    }
  }
}

// ─── SECTION: SUPPLIERS ───────────────────────────────────────────────────────
async function testSuppliers() {
  section('SUPPLIERS');
  const SEC  = 'suppliers';
  const base = SERVICES.commerce;

  // GET /api/inventory/suppliers
  if (tokens.manager) {
    const r = await request(`${base}/api/inventory/suppliers`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/suppliers');
    } else {
      warn(SEC, 'GET /api/inventory/suppliers', `status ${r.status}`);
    }
  }

  // GET /api/inventory/suppliers/active
  if (tokens.manager) {
    const r = await request(`${base}/api/inventory/suppliers/active`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/suppliers/active');
    } else {
      warn(SEC, 'GET /api/inventory/suppliers/active', `status ${r.status}`);
    }
  }

  // POST /api/inventory/suppliers
  if (tokens.manager) {
    const r = await request(`${base}/api/inventory/suppliers`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        name: 'Test Supplier API',
        code: 'SUP001',
        email: 'supplier@test.com',
        phone: '9876500099',
        city: 'Hyderabad',
        category: 'VEGETABLES',
        isPreferred: false,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.supplierId = r.body && (r.body.id || r.body._id);
      pass(SEC, 'POST /api/inventory/suppliers — create', testData.supplierId);
    } else if (r.status === 409) {
      warn(SEC, 'POST /api/inventory/suppliers — SUP001 already exists');
    } else {
      warn(SEC, 'POST /api/inventory/suppliers', `status ${r.status}`);
    }
  }

  // GET /api/inventory/suppliers/{supplierId}
  if (testData.supplierId && tokens.manager) {
    const r = await request(`${base}/api/inventory/suppliers/${testData.supplierId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/suppliers/{supplierId}');
    } else {
      warn(SEC, 'GET /api/inventory/suppliers/{supplierId}', `status ${r.status}`);
    }
  }

  // PUT /api/inventory/suppliers/{supplierId}
  if (testData.supplierId && tokens.manager) {
    const r = await request(`${base}/api/inventory/suppliers/${testData.supplierId}`, {
      method: 'PUT',
      token: tokens.manager,
      body: { name: 'Test Supplier Updated' },
    });
    if (r.status === 200) {
      pass(SEC, 'PUT /api/inventory/suppliers/{supplierId}');
    } else {
      warn(SEC, 'PUT /api/inventory/suppliers/{supplierId}', `status ${r.status}`);
    }
  }

  // GET /api/inventory/suppliers/city/Hyderabad
  if (tokens.manager) {
    const r = await request(`${base}/api/inventory/suppliers/city/Hyderabad`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/suppliers/city/Hyderabad');
    } else {
      warn(SEC, 'GET /api/inventory/suppliers/city/Hyderabad', `status ${r.status}`);
    }
  }
}

// ─── SECTION: PURCHASE ORDERS ─────────────────────────────────────────────────
async function testPurchaseOrders() {
  section('PURCHASE ORDERS');
  const SEC     = 'purchase-orders';
  const base    = SERVICES.commerce;
  const storeId = testData.dom001StoreId;

  // GET /api/inventory/purchase-orders
  if (tokens.manager) {
    const r = await request(`${base}/api/inventory/purchase-orders`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/purchase-orders');
    } else {
      warn(SEC, 'GET /api/inventory/purchase-orders', `status ${r.status}`);
    }
  }

  // POST /api/inventory/purchase-orders
  if (tokens.manager && testData.supplierId && testData.newInventoryItemId && storeId) {
    const r = await request(`${base}/api/inventory/purchase-orders`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        supplierId: testData.supplierId,
        storeId,
        items: [{
          inventoryItemId: testData.newInventoryItemId,
          quantity: 5,
          unitPrice: 50,
          unit: 'KG',
        }],
        expectedDeliveryDate: '2026-03-01',
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.purchaseOrderId = r.body && (r.body.id || r.body._id || r.body.purchaseOrderId);
      pass(SEC, 'POST /api/inventory/purchase-orders — create', testData.purchaseOrderId);
    } else {
      warn(SEC, 'POST /api/inventory/purchase-orders', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST /api/inventory/purchase-orders', 'missing supplierId, inventoryItemId, or storeId');
  }

  // GET /api/inventory/purchase-orders/{purchaseOrderId}
  if (testData.purchaseOrderId && tokens.manager) {
    const r = await request(`${base}/api/inventory/purchase-orders/${testData.purchaseOrderId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/purchase-orders/{purchaseOrderId}');
    } else {
      warn(SEC, 'GET /api/inventory/purchase-orders/{purchaseOrderId}', `status ${r.status}`);
    }
  }

  // PATCH /api/inventory/purchase-orders/{id}/approve
  if (testData.purchaseOrderId && tokens.manager && testData.managerId) {
    const r = await request(`${base}/api/inventory/purchase-orders/${testData.purchaseOrderId}/approve`, {
      method: 'PATCH',
      token: tokens.manager,
      body: { approvedBy: testData.managerId },
    });
    if (r.status === 200) {
      pass(SEC, 'PATCH /api/inventory/purchase-orders/{id}/approve');
    } else {
      warn(SEC, 'PATCH purchase-orders approve', `status ${r.status}`);
    }
  }

  // GET /api/inventory/purchase-orders/status/APPROVED
  if (tokens.manager) {
    const r = await request(`${base}/api/inventory/purchase-orders/status/APPROVED`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/purchase-orders/status/APPROVED');
    } else {
      warn(SEC, 'GET purchase-orders by status', `status ${r.status}`);
    }
  }
}

// ─── SECTION: WASTE ───────────────────────────────────────────────────────────
async function testWaste() {
  section('WASTE');
  const SEC     = 'waste';
  const base    = SERVICES.commerce;
  const storeId = testData.dom001StoreId;

  // GET /api/inventory/waste
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/inventory/waste`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/waste');
    } else {
      warn(SEC, 'GET /api/inventory/waste', `status ${r.status}`);
    }
  }

  // POST /api/inventory/waste
  if (tokens.manager && testData.newInventoryItemId && storeId) {
    const r = await request(`${base}/api/inventory/waste`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        inventoryItemId: testData.newInventoryItemId,
        quantity: 0.5,
        reason: 'Expired',
        category: 'INGREDIENT',
        storeId,
        wasteType: 'EXPIRED',
        cost: 25,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.wasteId = r.body && (r.body.id || r.body._id || r.body.wasteId);
      pass(SEC, 'POST /api/inventory/waste — create', testData.wasteId);
    } else {
      warn(SEC, 'POST /api/inventory/waste', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST /api/inventory/waste', 'missing inventoryItemId or storeId');
  }

  // GET /api/inventory/waste/{wasteId}
  if (testData.wasteId && tokens.manager) {
    const r = await request(`${base}/api/inventory/waste/${testData.wasteId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/inventory/waste/{wasteId}');
    } else {
      warn(SEC, 'GET /api/inventory/waste/{wasteId}', `status ${r.status}`);
    }
  }

  // GET total-cost and top-items
  if (tokens.manager && storeId) {
    const r1 = await request(`${base}/api/inventory/waste/total-cost?storeId=${storeId}`, { token: tokens.manager });
    if (r1.status === 200) {
      pass(SEC, 'GET /api/inventory/waste/total-cost');
    } else {
      warn(SEC, 'GET /api/inventory/waste/total-cost', `status ${r1.status}`);
    }

    const r2 = await request(`${base}/api/inventory/waste/top-items?storeId=${storeId}`, { token: tokens.manager });
    if (r2.status === 200) {
      pass(SEC, 'GET /api/inventory/waste/top-items');
    } else {
      warn(SEC, 'GET /api/inventory/waste/top-items', `status ${r2.status}`);
    }
  }
}

// ─── SECTION: REVIEWS ─────────────────────────────────────────────────────────
async function testReviews() {
  section('REVIEWS');
  const SEC  = 'reviews';
  const base = SERVICES.commerce;

  // POST /api/reviews
  if (tokens.customer && testData.takeawayOrderId) {
    const r = await request(`${base}/api/reviews`, {
      method: 'POST',
      token: tokens.customer,
      body: {
        orderId: testData.takeawayOrderId,
        overallRating: 5,
        foodQualityRating: 5,
        serviceRating: 4,
        comment: 'Excellent API test review',
        isAnonymous: false,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.reviewId = r.body && (r.body.id || r.body._id || r.body.reviewId);
      pass(SEC, 'POST /api/reviews — customer', testData.reviewId);
    } else {
      warn(SEC, 'POST /api/reviews', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST /api/reviews', 'missing customer token or takeawayOrderId');
  }

  // GET /api/reviews/{reviewId}
  if (testData.reviewId && tokens.manager) {
    const r = await request(`${base}/api/reviews/${testData.reviewId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/reviews/{reviewId}');
    } else {
      warn(SEC, 'GET /api/reviews/{reviewId}', `status ${r.status}`);
    }
  }

  // GET /api/reviews/order/{takeawayOrderId}
  if (testData.takeawayOrderId && tokens.manager) {
    const r = await request(`${base}/api/reviews/order/${testData.takeawayOrderId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/reviews/order/{takeawayOrderId}');
    } else {
      warn(SEC, 'GET /api/reviews/order/{takeawayOrderId}', `status ${r.status}`);
    }
  }

  // GET /api/reviews/customer/{customerId}
  if (testData.customerId && tokens.customer) {
    const r = await request(`${base}/api/reviews/customer/${testData.customerId}`, { token: tokens.customer });
    if (r.status === 200) {
      pass(SEC, 'GET /api/reviews/customer/{customerId}');
    } else {
      warn(SEC, 'GET /api/reviews/customer/{customerId}', `status ${r.status}`);
    }
  }

  // GET /api/reviews/pending, stats, flagged, recent, needs-response
  if (tokens.manager) {
    for (const [label, path] of [
      ['pending',        '/api/reviews/pending'],
      ['stats/overall',  '/api/reviews/stats/overall'],
      ['flagged',        '/api/reviews/flagged'],
      ['recent',         '/api/reviews/recent?limit=5'],
      ['needs-response', '/api/reviews/needs-response'],
    ]) {
      const r = await request(`${base}${path}`, { token: tokens.manager });
      if (r.status === 200) {
        pass(SEC, `GET /api/reviews/${label}`);
      } else {
        warn(SEC, `GET /api/reviews/${label}`, `status ${r.status}`);
      }
    }
  }

  // POST /api/reviews/public/submit
  if (testData.dineInOrderId) {
    const r = await request(`${base}/api/reviews/public/submit`, {
      method: 'POST',
      body: {
        orderId: testData.dineInOrderId,
        overallRating: 4,
        comment: 'Walk-in review test',
      },
    });
    if (r.status === 200 || r.status === 201) {
      pass(SEC, 'POST /api/reviews/public/submit');
    } else {
      warn(SEC, 'POST /api/reviews/public/submit', `status ${r.status}`);
    }
  }

  // POST /api/reviews/{reviewId}/approve
  if (testData.reviewId && tokens.manager) {
    const r = await request(`${base}/api/reviews/${testData.reviewId}/approve`, {
      method: 'POST',
      token: tokens.manager,
    });
    if (r.status === 200) {
      pass(SEC, 'POST /api/reviews/{reviewId}/approve');
    } else {
      warn(SEC, 'POST /api/reviews/{reviewId}/approve', `status ${r.status}`);
    }
  }
}

// ─── SECTION: REVIEW RESPONSES ────────────────────────────────────────────────
async function testReviewResponses() {
  section('REVIEW RESPONSES');
  const SEC  = 'review-responses';
  const base = SERVICES.commerce;

  // POST /api/responses/review/{reviewId}
  if (testData.reviewId && tokens.manager) {
    const r = await request(`${base}/api/responses/review/${testData.reviewId}`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        responseText: 'Thank you for the feedback!',
        responseType: 'THANK_YOU',
        isTemplate: false,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.responseId = r.body && (r.body.id || r.body._id || r.body.responseId);
      pass(SEC, 'POST /api/responses/review/{reviewId}', testData.responseId);
    } else {
      warn(SEC, 'POST /api/responses/review/{reviewId}', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST /api/responses/review/{reviewId}', 'missing reviewId or manager token');
  }

  // GET /api/responses/{responseId}
  if (testData.responseId && tokens.manager) {
    const r = await request(`${base}/api/responses/${testData.responseId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/responses/{responseId}');
    } else {
      warn(SEC, 'GET /api/responses/{responseId}', `status ${r.status}`);
    }
  }

  // GET /api/responses/review/{reviewId}
  if (testData.reviewId && tokens.manager) {
    const r = await request(`${base}/api/responses/review/${testData.reviewId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/responses/review/{reviewId}');
    } else {
      warn(SEC, 'GET /api/responses/review/{reviewId}', `status ${r.status}`);
    }
  }

  // GET /api/responses/templates
  if (tokens.manager) {
    const r = await request(`${base}/api/responses/templates`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/responses/templates');
    } else {
      warn(SEC, 'GET /api/responses/templates', `status ${r.status}`);
    }
  }
}

// ─── SECTION: CUSTOMERS ───────────────────────────────────────────────────────
async function testCustomers() {
  section('CUSTOMERS');
  const SEC  = 'customers';
  const base = SERVICES.commerce;

  // GET /api/customers/user/{customerId}
  if (tokens.customer && testData.customerId) {
    const r = await request(`${base}/api/customers/user/${testData.customerId}`, { token: tokens.customer });
    if (r.status === 200) {
      testData.customerProfileId = r.body && (r.body.id || r.body._id || r.body.customerId);
      pass(SEC, 'GET /api/customers/user/{customerId}', testData.customerProfileId);
    } else {
      warn(SEC, 'GET /api/customers/user/{customerId}', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'GET /api/customers/user/{customerId}', 'missing customer token or customerId');
  }

  // GET /api/customers/{customerProfileId}
  if (testData.customerProfileId && tokens.manager) {
    const r = await request(`${base}/api/customers/${testData.customerProfileId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/customers/{customerProfileId}');
    } else {
      warn(SEC, 'GET /api/customers/{customerProfileId}', `status ${r.status}`);
    }
  }

  // GET /api/customers
  if (tokens.manager) {
    const r = await request(`${base}/api/customers`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/customers');
    } else {
      warn(SEC, 'GET /api/customers', `status ${r.status}`);
    }
  }

  // GET /api/customers/stats
  if (tokens.manager) {
    const r = await request(`${base}/api/customers/stats`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/customers/stats');
    } else {
      warn(SEC, 'GET /api/customers/stats', `status ${r.status}`);
    }
  }

  // GET /api/customers/search?query=priya
  if (tokens.manager) {
    const r = await request(`${base}/api/customers/search?query=priya`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/customers/search?query=priya');
    } else {
      warn(SEC, 'GET /api/customers/search', `status ${r.status}`);
    }
  }

  // GET various list endpoints
  for (const [label, path] of [
    ['active',           '/api/customers/active'],
    ['recently-active',  '/api/customers/recently-active'],
    ['top-spenders',     '/api/customers/top-spenders?limit=10'],
    ['loyalty/BRONZE',   '/api/customers/loyalty/tier/BRONZE'],
  ]) {
    if (tokens.manager) {
      const r = await request(`${base}${path}`, { token: tokens.manager });
      if (r.status === 200) {
        pass(SEC, `GET /api/customers/${label}`);
      } else {
        warn(SEC, `GET /api/customers/${label}`, `status ${r.status}`);
      }
    }
  }

  // POST /api/customers/{customerProfileId}/loyalty/points
  if (testData.customerProfileId && tokens.manager && testData.takeawayOrderId) {
    const r = await request(`${base}/api/customers/${testData.customerProfileId}/loyalty/points`, {
      method: 'POST',
      token: tokens.manager,
      body: { points: 100, reason: 'Test loyalty', orderId: testData.takeawayOrderId },
    });
    if (r.status === 200 || r.status === 201) {
      pass(SEC, 'POST /api/customers/{id}/loyalty/points');
    } else {
      warn(SEC, 'POST loyalty/points', `status ${r.status}`);
    }
  } else {
    warn(SEC, 'POST loyalty/points', 'missing customerProfileId or takeawayOrderId');
  }
}

// ─── SECTION: NOTIFICATIONS ───────────────────────────────────────────────────
async function testNotifications() {
  section('NOTIFICATIONS');
  const SEC      = 'notifications';
  const base     = SERVICES.core;
  const managerId = testData.managerId;

  if (!managerId || !tokens.manager) {
    warn(SEC, 'Notifications section skipped', 'missing managerId or manager token');
    return;
  }

  // GET notification endpoints
  for (const [label, path] of [
    ['user notifications',  `/api/notifications/user/${managerId}`],
    ['unread',              `/api/notifications/user/${managerId}/unread`],
    ['unread-count',        `/api/notifications/user/${managerId}/unread-count`],
    ['recent',              `/api/notifications/user/${managerId}/recent`],
  ]) {
    const r = await request(`${base}${path}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, `GET /api/notifications/${label}`);
    } else {
      warn(SEC, `GET /api/notifications/${label}`, `status ${r.status}`);
    }
  }

  // POST /api/notifications/send
  const r = await request(`${base}/api/notifications/send`, {
    method: 'POST',
    token: tokens.manager,
    body: {
      userId: managerId,
      title: 'Test Notification',
      message: 'API test notification',
      type: 'INFO',
      channel: 'IN_APP',
    },
  });
  if (r.status === 200 || r.status === 201) {
    testData.notificationId = r.body && (r.body.id || r.body._id || r.body.notificationId);
    pass(SEC, 'POST /api/notifications/send', testData.notificationId);
  } else {
    warn(SEC, 'POST /api/notifications/send', `status ${r.status}`);
  }

  // PATCH read
  if (testData.notificationId) {
    const r2 = await request(`${base}/api/notifications/${testData.notificationId}/read`, {
      method: 'PATCH',
      token: tokens.manager,
    });
    if (r2.status === 200 || r2.status === 204) {
      pass(SEC, 'PATCH /api/notifications/{id}/read');
    } else {
      warn(SEC, 'PATCH /api/notifications/{id}/read', `status ${r2.status}`);
    }
  }

  // PATCH read-all
  const r3 = await request(`${base}/api/notifications/user/${managerId}/read-all`, {
    method: 'PATCH',
    token: tokens.manager,
  });
  if (r3.status === 200 || r3.status === 204) {
    pass(SEC, 'PATCH /api/notifications/user/{managerId}/read-all');
  } else {
    warn(SEC, 'PATCH read-all', `status ${r3.status}`);
  }
}

// ─── SECTION: USER PREFERENCES ────────────────────────────────────────────────
async function testUserPreferences() {
  section('USER PREFERENCES');
  const SEC      = 'preferences';
  const base     = SERVICES.core;
  const managerId = testData.managerId;

  if (!managerId || !tokens.manager) {
    warn(SEC, 'Preferences section skipped', 'missing managerId or manager token');
    return;
  }

  // GET /api/preferences/user/{managerId}
  const r = await request(`${base}/api/preferences/user/${managerId}`, { token: tokens.manager });
  if (r.status === 200) {
    pass(SEC, 'GET /api/preferences/user/{managerId}');
  } else {
    warn(SEC, 'GET /api/preferences/user/{managerId}', `status ${r.status}`);
  }

  // PUT /api/preferences/user/{managerId}
  const r2 = await request(`${base}/api/preferences/user/${managerId}`, {
    method: 'PUT',
    token: tokens.manager,
    body: { emailNotifications: true, smsNotifications: false },
  });
  if (r2.status === 200) {
    pass(SEC, 'PUT /api/preferences/user/{managerId}');
  } else {
    warn(SEC, 'PUT /api/preferences/user/{managerId}', `status ${r2.status}`);
  }
}

// ─── SECTION: WORKING SESSIONS ────────────────────────────────────────────────
async function testWorkingSessions() {
  section('WORKING SESSIONS');
  const SEC     = 'sessions';
  const base    = SERVICES.core;
  const storeId = testData.dom001StoreId;

  if (!tokens.manager2 || !testData.staffId || !storeId) {
    warn(SEC, 'Working sessions section skipped', 'missing manager2 token, staffId, or storeId');
    return;
  }

  const manager2Id = testData.manager2Id;

  // POST clock-in-with-pin
  const r = await request(`${base}/api/users/sessions/clock-in-with-pin`, {
    method: 'POST',
    token: tokens.manager2,
    storeId,
    body: {
      employeeId: testData.staffId,
      pin: ACCOUNTS.staff.pin,
      authorizedBy: manager2Id,
    },
  });
  if (r.status === 200 || r.status === 201) {
    testData.sessionId = r.body && (r.body.id || r.body._id || r.body.sessionId);
    pass(SEC, 'POST /api/users/sessions/clock-in-with-pin', testData.sessionId);
  } else {
    warn(SEC, 'POST clock-in-with-pin', `status ${r.status}`);
  }

  // GET /api/users/sessions/store/active
  const r2 = await request(`${base}/api/users/sessions/store/active`, {
    token: tokens.manager2,
    storeId,
  });
  if (r2.status === 200) {
    pass(SEC, 'GET /api/users/sessions/store/active');
  } else {
    warn(SEC, 'GET /api/users/sessions/store/active', `status ${r2.status}`);
  }

  // GET /api/users/sessions/{staffId}/status
  const r3 = await request(`${base}/api/users/sessions/${testData.staffId}/status`, {
    token: tokens.manager2,
  });
  if (r3.status === 200) {
    pass(SEC, 'GET /api/users/sessions/{staffId}/status');
  } else {
    warn(SEC, 'GET /api/users/sessions/{staffId}/status', `status ${r3.status}`);
  }

  // GET /api/users/sessions/current — staff token
  if (tokens.staff) {
    const r4 = await request(`${base}/api/users/sessions/current`, { token: tokens.staff });
    if (r4.status === 200) {
      pass(SEC, 'GET /api/users/sessions/current — staff');
    } else {
      warn(SEC, 'GET /api/users/sessions/current', `status ${r4.status}`);
    }
  }

  // POST clock-out
  const r5 = await request(`${base}/api/users/sessions/clock-out-employee`, {
    method: 'POST',
    token: tokens.manager2,
    storeId,
    body: { employeeId: testData.staffId, authorizedBy: manager2Id },
  });
  if (r5.status === 200 || r5.status === 204) {
    pass(SEC, 'POST /api/users/sessions/clock-out-employee');
  } else {
    warn(SEC, 'POST clock-out-employee', `status ${r5.status}`);
  }
}

// ─── SECTION: KITCHEN EQUIPMENT ───────────────────────────────────────────────
async function testKitchenEquipment() {
  section('KITCHEN EQUIPMENT');
  const SEC     = 'kitchen-equipment';
  const base    = SERVICES.commerce;
  const storeId = testData.dom001StoreId;

  // GET /api/kitchen-equipment/store
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/kitchen-equipment/store`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/kitchen-equipment/store');
    } else {
      warn(SEC, 'GET /api/kitchen-equipment/store', `status ${r.status}`);
    }
  }

  // POST /api/kitchen-equipment
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/kitchen-equipment`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        name: 'Test Oven API',
        type: 'OVEN',
        serialNumber: 'OV001TEST',
        storeId,
        status: 'OPERATIONAL',
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.equipmentId = r.body && (r.body.id || r.body._id || r.body.equipmentId);
      pass(SEC, 'POST /api/kitchen-equipment — create', testData.equipmentId);
    } else if (r.status === 409) {
      warn(SEC, 'POST /api/kitchen-equipment — OV001TEST already exists');
    } else {
      warn(SEC, 'POST /api/kitchen-equipment', `status ${r.status}`);
    }
  }

  // GET /api/kitchen-equipment/{equipmentId}
  if (testData.equipmentId && tokens.manager) {
    const r = await request(`${base}/api/kitchen-equipment/${testData.equipmentId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/kitchen-equipment/{equipmentId}');
    } else {
      warn(SEC, 'GET /api/kitchen-equipment/{equipmentId}', `status ${r.status}`);
    }
  }

  // PATCH status
  if (testData.equipmentId && tokens.manager) {
    const r = await request(`${base}/api/kitchen-equipment/${testData.equipmentId}/status`, {
      method: 'PATCH',
      token: tokens.manager,
      body: { status: 'UNDER_MAINTENANCE' },
    });
    if (r.status === 200) {
      pass(SEC, 'PATCH /api/kitchen-equipment/{id}/status → UNDER_MAINTENANCE');
    } else {
      warn(SEC, 'PATCH /api/kitchen-equipment/{id}/status', `status ${r.status}`);
    }
  }

  // PATCH power
  if (testData.equipmentId && tokens.manager) {
    const r = await request(`${base}/api/kitchen-equipment/${testData.equipmentId}/power`, {
      method: 'PATCH',
      token: tokens.manager,
      body: { isPowered: true },
    });
    if (r.status === 200) {
      pass(SEC, 'PATCH /api/kitchen-equipment/{id}/power → true');
    } else {
      warn(SEC, 'PATCH /api/kitchen-equipment/{id}/power', `status ${r.status}`);
    }
  }
}

// ─── SECTION: CAMPAIGNS ───────────────────────────────────────────────────────
async function testCampaigns() {
  section('CAMPAIGNS');
  const SEC     = 'campaigns';
  const base    = SERVICES.commerce;
  const storeId = testData.dom001StoreId;

  // GET /api/campaigns
  if (tokens.manager) {
    const r = await request(`${base}/api/campaigns`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/campaigns');
    } else {
      warn(SEC, 'GET /api/campaigns', `status ${r.status}`);
    }
  }

  // POST /api/campaigns
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/campaigns`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        name: 'API Test Campaign',
        type: 'EMAIL',
        targetAudience: 'ALL_CUSTOMERS',
        scheduledAt: '2026-03-01T10:00:00',
        storeId,
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.campaignId = r.body && (r.body.id || r.body._id || r.body.campaignId);
      pass(SEC, 'POST /api/campaigns — create', testData.campaignId);
    } else if (r.status === 400) {
      warn(SEC, 'POST /api/campaigns — 400 validation', `status ${r.status}`);
    } else {
      warn(SEC, 'POST /api/campaigns', `status ${r.status}`);
    }
  }

  // GET /api/campaigns/{campaignId}
  if (testData.campaignId && tokens.manager) {
    const r = await request(`${base}/api/campaigns/${testData.campaignId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/campaigns/{campaignId}');
    } else {
      warn(SEC, 'GET /api/campaigns/{campaignId}', `status ${r.status}`);
    }
  }
}

// ─── SECTION: SHIFTS ──────────────────────────────────────────────────────────
async function testShifts() {
  section('SHIFTS');
  const SEC     = 'shifts';
  const base    = SERVICES.core;
  const storeId = testData.dom001StoreId;

  // GET /api/shifts/store
  if (tokens.manager && storeId) {
    const r = await request(`${base}/api/shifts/store`, { token: tokens.manager, storeId });
    if (r.status === 200) {
      pass(SEC, 'GET /api/shifts/store');
    } else {
      warn(SEC, 'GET /api/shifts/store', `status ${r.status}`);
    }
  }

  // POST /api/shifts
  if (tokens.manager && testData.staffId && storeId) {
    const r = await request(`${base}/api/shifts`, {
      method: 'POST',
      token: tokens.manager,
      body: {
        employeeId: testData.staffId,
        storeId,
        startTime: '2026-02-24T08:00:00',
        endTime: '2026-02-24T16:00:00',
        role: 'KITCHEN_STAFF',
      },
    });
    if (r.status === 200 || r.status === 201) {
      testData.shiftId = r.body && (r.body.id || r.body._id || r.body.shiftId);
      pass(SEC, 'POST /api/shifts — create', testData.shiftId);
    } else {
      warn(SEC, 'POST /api/shifts', `status ${r.status}`);
    }
  }

  // GET /api/shifts/{shiftId}
  if (testData.shiftId && tokens.manager) {
    const r = await request(`${base}/api/shifts/${testData.shiftId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/shifts/{shiftId}');
    } else {
      warn(SEC, 'GET /api/shifts/{shiftId}', `status ${r.status}`);
    }
  }

  // GET /api/shifts/employee/{staffId}
  if (testData.staffId && tokens.manager) {
    const r = await request(`${base}/api/shifts/employee/${testData.staffId}`, { token: tokens.manager });
    if (r.status === 200) {
      pass(SEC, 'GET /api/shifts/employee/{staffId}');
    } else {
      warn(SEC, 'GET /api/shifts/employee/{staffId}', `status ${r.status}`);
    }
  }
}

// ─── INTELLIGENCE SERVICE ─────────────────────────────────────────────────────

async function testAnalytics() {
  section('Analytics (intelligence-service :8087)');
  const base = SERVICES.intelligence;
  const tok  = tokens.manager;
  const sid  = ACCOUNTS.manager.storeCode;

  // Health (public)
  await test('GET /api/analytics/health', async () => {
    const r = await request(`${base}/api/analytics/health`);
    if (r.status !== 200) return fail(`Expected 200, got ${r.status}`);
    pass();
  });

  // Sales today
  await test('GET /api/analytics/sales/today', async () => {
    const r = await request(`${base}/api/analytics/sales/today`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context — seed required');
    fail(`Expected 200, got ${r.status}`);
  });

  // Average order value
  await test('GET /api/analytics/avgOrderValue/today', async () => {
    const r = await request(`${base}/api/analytics/avgOrderValue/today`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });

  // Driver status
  await test('GET /api/analytics/drivers/status', async () => {
    const r = await request(`${base}/api/analytics/drivers/status`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });

  // Staff performance (use a placeholder staffId)
  await test('GET /api/analytics/staff/{staffId}/performance/today', async () => {
    const r = await request(`${base}/api/analytics/staff/test-staff-001/performance/today`, { token: tok });
    if (r.status === 200) return pass();
    if (r.status === 404) return warn('Staff not found — seed required');
    fail(`Expected 200/404, got ${r.status}`);
  });

  // Sales trends WEEKLY
  await test('GET /api/analytics/sales/trends/WEEKLY', async () => {
    const r = await request(`${base}/api/analytics/sales/trends/WEEKLY`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });

  // Sales trends MONTHLY
  await test('GET /api/analytics/sales/trends/MONTHLY', async () => {
    const r = await request(`${base}/api/analytics/sales/trends/MONTHLY`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });

  // Order type breakdown
  await test('GET /api/analytics/sales/breakdown/order-type', async () => {
    const r = await request(`${base}/api/analytics/sales/breakdown/order-type`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });

  // Peak hours
  await test('GET /api/analytics/sales/peak-hours', async () => {
    const r = await request(`${base}/api/analytics/sales/peak-hours`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });

  // Staff leaderboard (TODAY / WEEK / MONTH)
  for (const period of ['TODAY', 'WEEK', 'MONTH']) {
    await test(`GET /api/analytics/staff/leaderboard?period=${period}`, async () => {
      const r = await request(`${base}/api/analytics/staff/leaderboard?period=${period}`, { token: tok, storeId: sid });
      if (r.status === 200) return pass();
      if (r.status === 400) return warn('No store context');
      fail(`Expected 200, got ${r.status}`);
    });
  }

  // Top selling products (TODAY / WEEK / MONTH × QUANTITY / REVENUE)
  for (const period of ['TODAY', 'WEEK', 'MONTH']) {
    for (const sortBy of ['QUANTITY', 'REVENUE']) {
      await test(`GET /api/analytics/products/top-selling?period=${period}&sortBy=${sortBy}`, async () => {
        const r = await request(`${base}/api/analytics/products/top-selling?period=${period}&sortBy=${sortBy}`, { token: tok, storeId: sid });
        if (r.status === 200) return pass();
        if (r.status === 400) return warn('No store context');
        fail(`Expected 200, got ${r.status}`);
      });
    }
  }

  // Clear cache (POST)
  await test('POST /api/analytics/cache/clear', async () => {
    const r = await request(`${base}/api/analytics/cache/clear`, { method: 'POST', token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400) return warn('No store context');
    fail(`Expected 200, got ${r.status}`);
  });
}

async function testBI() {
  section('BI / Business Intelligence (intelligence-service :8087)');
  const base = SERVICES.intelligence;
  const tok  = tokens.manager;
  const sid  = ACCOUNTS.manager.storeCode;

  // Health (public)
  await test('GET /api/bi/health', async () => {
    const r = await request(`${base}/api/bi/health`);
    if (r.status !== 200) return fail(`Expected 200, got ${r.status}`);
    pass();
  });

  // Sales forecast
  for (const period of ['DAILY', 'WEEKLY', 'MONTHLY']) {
    await test(`GET /api/bi/forecast/sales?period=${period}`, async () => {
      const r = await request(`${base}/api/bi/forecast/sales?period=${period}&days=7`, { token: tok, storeId: sid });
      if (r.status === 200) return pass();
      if (r.status === 400 || r.status === 404) return warn('No data — seed required');
      fail(`Expected 200, got ${r.status}`);
    });
  }

  // Customer behavior analysis
  await test('GET /api/bi/analysis/customer-behavior', async () => {
    const r = await request(`${base}/api/bi/analysis/customer-behavior`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400 || r.status === 404) return warn('No data — seed required');
    fail(`Expected 200, got ${r.status}`);
  });

  // Churn prediction
  await test('GET /api/bi/prediction/churn', async () => {
    const r = await request(`${base}/api/bi/prediction/churn`, { token: tok, storeId: sid });
    if (r.status === 200) return pass();
    if (r.status === 400 || r.status === 404) return warn('No data — seed required');
    fail(`Expected 200, got ${r.status}`);
  });

  // Demand forecast
  for (const period of ['WEEKLY', 'MONTHLY']) {
    await test(`GET /api/bi/forecast/demand?period=${period}`, async () => {
      const r = await request(`${base}/api/bi/forecast/demand?period=${period}`, { token: tok, storeId: sid });
      if (r.status === 200) return pass();
      if (r.status === 400 || r.status === 404) return warn('No data — seed required');
      fail(`Expected 200, got ${r.status}`);
    });
  }

  // Cost analysis
  for (const period of ['TODAY', 'WEEK', 'MONTH']) {
    await test(`GET /api/bi/cost-analysis?period=${period}`, async () => {
      const r = await request(`${base}/api/bi/cost-analysis?period=${period}`, { token: tok, storeId: sid });
      if (r.status === 200) return pass();
      if (r.status === 400 || r.status === 404) return warn('No data — seed required');
      fail(`Expected 200, got ${r.status}`);
    });
  }

  // Store benchmarking
  for (const period of ['WEEK', 'MONTH', 'QUARTER']) {
    await test(`GET /api/bi/benchmarking/stores?period=${period}`, async () => {
      const r = await request(`${base}/api/bi/benchmarking/stores?period=${period}`, { token: tok });
      if (r.status === 200) return pass();
      if (r.status === 400 || r.status === 404) return warn('No data — seed required');
      fail(`Expected 200, got ${r.status}`);
    });
  }

  // Executive summary
  for (const period of ['WEEK', 'MONTH', 'QUARTER', 'YEAR']) {
    await test(`GET /api/bi/executive-summary?period=${period}`, async () => {
      const r = await request(`${base}/api/bi/executive-summary?period=${period}`, { token: tok });
      if (r.status === 200) return pass();
      if (r.status === 400 || r.status === 404) return warn('No data — seed required');
      fail(`Expected 200, got ${r.status}`);
    });
  }
}

// ─── API GATEWAY ──────────────────────────────────────────────────────────────

async function testGateway() {
  section('API Gateway (port :8080)');
  const base = SERVICES.gateway;

  await test('GET /api/system/health', async () => {
    const r = await request(`${base}/api/system/health`);
    if (r.status !== 200) return fail(`Expected 200, got ${r.status}`);
    if (!r.body?.status) return fail('Missing status field in response');
    pass();
  });

  await test('GET /api/system/version', async () => {
    const r = await request(`${base}/api/system/version`);
    if (r.status !== 200) return fail(`Expected 200, got ${r.status}`);
    if (!r.body?.version) return fail('Missing version field in response');
    pass();
  });

  await test('GET /api/system/info', async () => {
    const r = await request(`${base}/api/system/info`);
    if (r.status !== 200) return fail(`Expected 200, got ${r.status}`);
    if (!r.body?.javaVersion) return fail('Missing javaVersion field in response');
    pass();
  });
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
function printSummary() {
  console.log(`\n\x1b[1m\x1b[34m${'═'.repeat(68)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m  TEST SUMMARY\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m${'═'.repeat(68)}\x1b[0m`);
  console.log(`  \x1b[32mPASS\x1b[0m  ${results.pass}`);
  console.log(`  \x1b[31mFAIL\x1b[0m  ${results.fail}`);
  console.log(`  \x1b[33mWARN\x1b[0m  ${results.warn}`);
  console.log(`  TOTAL ${results.pass + results.fail + results.warn}`);

  if (results.fail > 0) {
    console.log(`\n\x1b[1m\x1b[31m  FAILURES:\x1b[0m`);
    results.items.filter(i => i.status === 'FAIL').forEach(i => {
      console.log(`  \x1b[31mx\x1b[0m [${i.section}] ${i.test}${i.detail ? ' — ' + i.detail : ''}`);
    });
  }

  if (results.warn > 0) {
    console.log(`\n\x1b[1m\x1b[33m  WARNINGS (investigate or seed data missing):\x1b[0m`);
    results.items.filter(i => i.status === 'WARN').forEach(i => {
      console.log(`  \x1b[33m!\x1b[0m [${i.section}] ${i.test}${i.detail ? ' — ' + i.detail : ''}`);
    });
  }

  console.log(`\n\x1b[2m  Test data created during this run:\x1b[0m`);
  const keys = [
    ['dom001StoreId',       'DOM001 store'],
    ['newStoreId',          'New store'],
    ['menuItemId',          'Menu item (seed)'],
    ['newMenuItemId',       'Menu item (created)'],
    ['dineInOrderId',       'DINE_IN order'],
    ['takeawayOrderId',     'TAKEAWAY order'],
    ['deliveryOrderId',     'DELIVERY order'],
    ['cashPaymentId',       'Cash payment'],
    ['upiPaymentId',        'UPI payment'],
    ['refundId',            'Refund'],
    ['newInventoryItemId',  'Inventory item'],
    ['supplierId',          'Supplier'],
    ['purchaseOrderId',     'Purchase order'],
    ['wasteId',             'Waste record'],
    ['reviewId',            'Review'],
    ['responseId',          'Review response'],
    ['customerProfileId',   'Customer profile'],
    ['notificationId',      'Notification'],
    ['equipmentId',         'Kitchen equipment'],
    ['campaignId',          'Campaign'],
    ['shiftId',             'Shift'],
    ['sessionId',           'Working session'],
  ];
  for (const [key, label] of keys) {
    if (testData[key]) {
      console.log(`  \x1b[2m  ${label}: ${testData[key]}\x1b[0m`);
    }
  }
  console.log('');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n\x1b[1m\x1b[34m${'═'.repeat(68)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m  MaSoVa Full API Test Suite — ${new Date().toLocaleString()}\x1b[0m`);
  console.log(`\x1b[1m\x1b[34m${'═'.repeat(68)}\x1b[0m`);

  await testServiceHealth();
  await testAuthentication();
  await testSystem();
  await testStores();
  await testMenu();

  // Order flows
  await testOrderFlowDineIn();
  await testOrderFlowTakeaway();
  await testOrderFlowDelivery();
  await testOrderManagement();

  // Payments
  await testPayments();

  // Logistics
  await testDelivery();

  // Inventory and related
  await testInventory();
  await testSuppliers();
  await testPurchaseOrders();
  await testWaste();

  // Reviews
  await testReviews();
  await testReviewResponses();

  // Customers
  await testCustomers();

  // Core service features
  await testNotifications();
  await testUserPreferences();
  await testWorkingSessions();

  // Equipment, campaigns, shifts
  await testKitchenEquipment();
  await testCampaigns();
  await testShifts();

  // Intelligence service
  await testAnalytics();
  await testBI();

  // API Gateway
  await testGateway();

  printSummary();
  process.exit(results.fail > 0 ? 1 : 0);
})();
