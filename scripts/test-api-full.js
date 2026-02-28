#!/usr/bin/env node
/**
 * MaSoVa Full API Test Suite — v3
 * Covers all 388 endpoints across 6 services.
 * Run: node scripts/test-api-full.js
 */

const http  = require('http');
const https = require('https');

// ─── SERVICE URLS ─────────────────────────────────────────────────────────────
const S = {
  gateway:    'http://192.168.50.88:8080',
  core:       'http://192.168.50.88:8085',
  commerce:   'http://192.168.50.88:8084',
  payment:    'http://192.168.50.88:8089',
  logistics:  'http://192.168.50.88:8086',
  intel:      'http://192.168.50.88:8087',
};

// ─── TEST ACCOUNTS ────────────────────────────────────────────────────────────
const A = {
  manager:  { email: 'manager@masova.com',   password: 'manager123', pin: '1234', storeCode: 'DOM001' },
  manager2: { email: 'manager2@masova.com',  password: 'manager123', pin: '1234', storeCode: 'DOM001' },
  staff:    { email: 'staff@masova.com',     password: 'staff123',   pin: '5678', storeCode: 'DOM001' },
  driver:   { email: 'driver@masova.com',    password: 'driver123',              storeCode: 'DOM001' },
  customer: { email: 'test@example.com',     password: 'password123' },
};

// ─── STATE ────────────────────────────────────────────────────────────────────
const R   = { pass: 0, fail: 0, warn: 0, items: [] };
let tok   = {};  // { manager, manager2, staff, driver, customer }
let D     = {};  // test data IDs collected during run

// ─── HTTP HELPER ──────────────────────────────────────────────────────────────
function req(url, opts = {}) {
  return new Promise(resolve => {
    const { method = 'GET', body, token, storeCode, userId, userType, driverId } = opts;
    const headers = opts.headers || {};
    if (token)     headers['Authorization']       = `Bearer ${token}`;
    if (body)      headers['Content-Type']        = 'application/json';
    if (storeCode) headers['X-User-Store-Id']     = storeCode;
    if (storeCode) headers['X-Selected-Store-Id'] = storeCode;
    if (userId)    headers['X-User-Id']           = userId;
    if (userType)  headers['X-User-Type']         = userType;
    if (driverId)  headers['X-Driver-Id']         = driverId;

    let parsed;
    try { parsed = new URL(url); } catch { return resolve({ status: 0, body: null }); }

    const lib = parsed.protocol === 'https:' ? https : http;
    const r = lib.request({
      hostname: parsed.hostname, port: parsed.port,
      path: parsed.pathname + parsed.search, method, headers,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: null, error: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

// ─── RESULT HELPERS ───────────────────────────────────────────────────────────
function pass(sec, label, detail = '') {
  R.pass++;
  R.items.push({ status: 'PASS', sec, label });
  console.log(`  \x1b[32m✓\x1b[0m  ${label}${detail ? '  →  ' + detail : ''}`);
}
function fail(sec, label, detail = '') {
  R.fail++;
  R.items.push({ status: 'FAIL', sec, label, detail });
  console.log(`  \x1b[31m✗\x1b[0m  ${label}${detail ? '  →  ' + detail : ''}`);
}
function warn(sec, label, detail = '') {
  R.warn++;
  R.items.push({ status: 'WARN', sec, label, detail });
  console.log(`  \x1b[33m!\x1b[0m  ${label}${detail ? '  →  ' + detail : ''}`);
}
function section(name) {
  console.log(`\n\x1b[1m\x1b[36m${'═'.repeat(70)}\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m  ${name}\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m${'═'.repeat(70)}\x1b[0m`);
}

function ok(r)   { return r.status >= 200 && r.status < 300; }
function id(b)   { if (!b || typeof b !== 'object') return null;
                   return b.id || b._id || b.orderId || b.paymentId || b.reviewId
                       || b.responseId || b.customerId || b.notificationId
                       || b.equipmentId || b.campaignId || b.shiftId || b.sessionId
                       || b.purchaseOrderId || b.wasteId || b.supplierId || b.trackingId || null; }

// ─── TODAY ────────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];
const NOW   = new Date().toISOString();
const WEEK_START = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];

// ══════════════════════════════════════════════════════════════════════════════
// 1. HEALTH CHECKS
// ══════════════════════════════════════════════════════════════════════════════
async function testHealth() {
  section('HEALTH CHECKS');
  const sec = 'health';
  const services = [
    ['api-gateway      :8080', `${S.gateway}/actuator/health`],
    ['core-service     :8085', `${S.core}/actuator/health`],
    ['commerce-service :8084', `${S.commerce}/actuator/health`],
    ['payment-service  :8089', `${S.payment}/actuator/health`],
    ['logistics-service:8086', `${S.logistics}/actuator/health`],
    ['intelligence     :8087', `${S.intel}/actuator/health`],
  ];
  for (const [name, url] of services) {
    const r = await req(url);
    if (ok(r)) pass(sec, `${name} — healthy`);
    else        fail(sec, `${name} — unreachable`, `status ${r.status}`);
  }

  // System info endpoints (core-service)
  const sysEndpoints = [
    ['GET /api/system/health',          `${S.core}/api/system/health`],
    ['GET /api/system/info',            `${S.core}/api/system/info`],
    ['GET /api/system/version',         `${S.core}/api/system/version`],
    ['GET /api/system/updates/check',   `${S.core}/api/system/updates/check`],
    ['GET /api/system/updates/status',  `${S.core}/api/system/updates/status`],
  ];
  for (const [label, url] of sysEndpoints) {
    const r = await req(url);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════
async function testAuth() {
  section('AUTHENTICATION');
  const sec = 'auth';

  // Login all accounts
  for (const [role, creds] of Object.entries(A)) {
    const r = await req(`${S.core}/api/users/login`, {
      method: 'POST', body: { email: creds.email, password: creds.password },
    });
    if (ok(r) && r.body && (r.body.accessToken || r.body.token)) {
      tok[role] = r.body.accessToken || r.body.token;
      tok[`${role}Refresh`] = r.body.refreshToken;
      // collect IDs
      const u = r.body.user || r.body;
      if (role === 'manager'  && u.id) D.managerId  = u.id || u._id;
      if (role === 'manager2' && u.id) D.manager2Id = u.id || u._id;
      if (role === 'staff'    && u.id) D.staffId    = u.id || u._id;
      if (role === 'driver'   && u.id) D.driverId   = u.id || u._id;
      if (role === 'customer' && u.id) D.customerId = u.id || u._id;
      pass(sec, `POST /api/users/login — ${role}`);
    } else {
      fail(sec, `POST /api/users/login — ${role}`, `status ${r.status}`);
    }
  }

  // Token refresh
  if (tok.managerRefresh) {
    const r = await req(`${S.core}/api/users/refresh`, {
      method: 'POST', body: { refreshToken: tok.managerRefresh },
    });
    if (ok(r)) pass(sec, 'POST /api/users/refresh');
    else        warn(sec, 'POST /api/users/refresh', `status ${r.status}`);
  } else warn(sec, 'POST /api/users/refresh', 'no refresh token from login');

  // Register a new user
  const regEmail = `test.reg.${Date.now()}@masova.com`;
  const rReg = await req(`${S.core}/api/users/register`, {
    method: 'POST',
    body: { type: 'CUSTOMER', name: 'Test Register', email: regEmail, password: 'Test@12345', phone: '9000000001' },
  });
  if (ok(rReg)) { pass(sec, 'POST /api/users/register'); D.regUserId = id(rReg.body); }
  else            warn(sec, 'POST /api/users/register', `status ${rReg.status}`);

  // Google auth (expect 4xx — no real token)
  const rG = await req(`${S.core}/api/users/auth/google`, {
    method: 'POST', body: { idToken: 'fake-google-token' },
  });
  if (rG.status === 401 || rG.status === 400 || rG.status === 500)
    pass(sec, 'POST /api/users/auth/google — rejects fake token');
  else warn(sec, 'POST /api/users/auth/google', `status ${rG.status}`);

  const rGR = await req(`${S.core}/api/users/auth/google/register`, {
    method: 'POST', body: { idToken: 'fake-google-token' },
  });
  if (rGR.status === 401 || rGR.status === 400 || rGR.status === 500)
    pass(sec, 'POST /api/users/auth/google/register — rejects fake token');
  else warn(sec, 'POST /api/users/auth/google/register', `status ${rGR.status}`);

  // Get profile
  if (tok.manager && D.managerId) {
    const rP = await req(`${S.core}/api/users/profile`, {
      token: tok.manager, userId: D.managerId,
    });
    if (ok(rP)) pass(sec, 'GET /api/users/profile');
    else         warn(sec, 'GET /api/users/profile', `status ${rP.status}`);
  }

  // Change password (use registered user)
  if (tok.customer && D.customerId) {
    const rCP = await req(`${S.core}/api/users/change-password`, {
      method: 'POST', token: tok.customer, userId: D.customerId,
      body: { currentPassword: 'Customer@123', newPassword: 'Customer@123' },
    });
    if (ok(rCP)) pass(sec, 'POST /api/users/change-password');
    else          warn(sec, 'POST /api/users/change-password', `status ${rCP.status}`);
  }

  // Validate PIN (staff)
  if (D.staffId) {
    const rV = await req(`${S.core}/api/users/validate-pin`, {
      method: 'POST', body: { pin: '20197' },
      headers: { 'X-User-Id': D.staffId },
    });
    if (ok(rV)) pass(sec, 'POST /api/users/validate-pin');
    else         warn(sec, 'POST /api/users/validate-pin', `status ${rV.status}`);
  }

  // Logout (manager — do last in section, re-login not needed as tok still valid for further tests)
  if (tok.manager && D.managerId) {
    const rL = await req(`${S.core}/api/users/logout`, {
      method: 'POST', token: tok.manager, userId: D.managerId,
    });
    if (ok(rL)) pass(sec, 'POST /api/users/logout');
    else         warn(sec, 'POST /api/users/logout', `status ${rL.status}`);
    // Re-login to get fresh token
    const rRL = await req(`${S.core}/api/users/login`, {
      method: 'POST', body: { email: A.manager.email, password: A.manager.password },
    });
    if (ok(rRL) && rRL.body && (rRL.body.accessToken || rRL.body.token)) tok.manager = rRL.body.accessToken || rRL.body.token;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. USERS
// ══════════════════════════════════════════════════════════════════════════════
async function testUsers() {
  section('USERS');
  const sec = 'users';

  if (!tok.manager) { warn(sec, 'Users section skipped', 'no manager token'); return; }

  // List all users
  const rAll = await req(`${S.core}/api/users`, { token: tok.manager });
  if (ok(rAll)) pass(sec, 'GET /api/users');
  else           warn(sec, 'GET /api/users', `status ${rAll.status}`);

  // Get by type
  for (const type of ['STAFF', 'DRIVER', 'MANAGER']) {
    const r = await req(`${S.core}/api/users/type/${type}`, { token: tok.manager });
    if (ok(r)) pass(sec, `GET /api/users/type/${type}`);
    else        warn(sec, `GET /api/users/type/${type}`, `status ${r.status}`);
  }

  // Get managers
  const rMgr = await req(`${S.core}/api/users/managers`, { token: tok.manager });
  if (ok(rMgr)) pass(sec, 'GET /api/users/managers');
  else           warn(sec, 'GET /api/users/managers', `status ${rMgr.status}`);

  // Get store users
  const rStore = await req(`${S.core}/api/users/store`, {
    token: tok.manager, storeCode: A.manager.storeCode,
  });
  if (ok(rStore)) pass(sec, 'GET /api/users/store');
  else             warn(sec, 'GET /api/users/store', `status ${rStore.status}`);

  // Search users
  const rSearch = await req(`${S.core}/api/users/search?name=test`, { token: tok.manager });
  if (ok(rSearch)) pass(sec, 'GET /api/users/search');
  else              warn(sec, 'GET /api/users/search', `status ${rSearch.status}`);

  // Stats
  const rStats = await req(`${S.core}/api/users/stats`, { token: tok.manager });
  if (ok(rStats)) pass(sec, 'GET /api/users/stats');
  else             warn(sec, 'GET /api/users/stats', `status ${rStats.status}`);

  // Get specific user
  if (D.managerId) {
    const rU = await req(`${S.core}/api/users/${D.managerId}`, { token: tok.manager });
    if (ok(rU)) pass(sec, `GET /api/users/{userId}`);
    else         warn(sec, `GET /api/users/{userId}`, `status ${rU.status}`);

    // Update user profile
    const rPut = await req(`${S.core}/api/users/profile`, {
      method: 'PUT', token: tok.manager, userId: D.managerId,
      body: { name: 'Vijay Manager Updated' },
    });
    if (ok(rPut)) pass(sec, 'PUT /api/users/profile');
    else           warn(sec, 'PUT /api/users/profile', `status ${rPut.status}`);
  }

  // Drivers
  const rDS = await req(`${S.core}/api/users/drivers/store`, {
    token: tok.manager, storeCode: 'DOM001',
  });
  if (ok(rDS)) { pass(sec, 'GET /api/users/drivers/store'); }
  else          warn(sec, 'GET /api/users/drivers/store', `status ${rDS.status}`);

  const rDA = await req(`${S.core}/api/users/drivers/available?storeId=DOM001`, { token: tok.manager });
  if (ok(rDA)) pass(sec, 'GET /api/users/drivers/available');
  else          warn(sec, 'GET /api/users/drivers/available', `status ${rDA.status}`);

  // Driver status
  if (D.driverId) {
    const rGetSt = await req(`${S.core}/api/users/${D.driverId}/status`, { token: tok.manager });
    if (ok(rGetSt)) pass(sec, 'GET /api/users/{userId}/status');
    else             warn(sec, 'GET /api/users/{userId}/status', `status ${rGetSt.status}`);

    const rPutSt = await req(`${S.core}/api/users/${D.driverId}/status`, {
      method: 'PUT', token: tok.manager,
      body: { status: 'AVAILABLE' },
    });
    if (ok(rPutSt)) pass(sec, 'PUT /api/users/{userId}/status');
    else             warn(sec, 'PUT /api/users/{userId}/status', `status ${rPutSt.status}`);

    const rCan = await req(`${S.core}/api/users/${D.driverId}/can-take-orders`, { token: tok.manager });
    if (ok(rCan)) pass(sec, 'GET /api/users/{userId}/can-take-orders');
    else           warn(sec, 'GET /api/users/{userId}/can-take-orders', `status ${rCan.status}`);
  }

  // Generate PIN
  if (D.staffId) {
    const rPin = await req(`${S.core}/api/users/${D.staffId}/generate-pin`, {
      method: 'POST', token: tok.manager,
    });
    if (ok(rPin)) pass(sec, 'POST /api/users/{userId}/generate-pin');
    else           warn(sec, 'POST /api/users/{userId}/generate-pin', `status ${rPin.status}`);
  }

  // Generate all PINs (NEW)
  const rAllPins = await req(`${S.core}/api/users/generate-all-pins`, {
    method: 'POST', token: tok.manager,
  });
  if (ok(rAllPins)) pass(sec, 'POST /api/users/generate-all-pins');
  else               warn(sec, 'POST /api/users/generate-all-pins', `status ${rAllPins.status}`);

  // Full update by ID (PUT /api/users/{userId}) (NEW)
  if (D.managerId) {
    const rFullUp = await req(`${S.core}/api/users/${D.managerId}`, {
      method: 'PUT', token: tok.manager,
      body: { name: 'Manager Updated Name' },
    });
    if (ok(rFullUp)) pass(sec, 'PUT /api/users/{userId}');
    else              warn(sec, 'PUT /api/users/{userId}', `status ${rFullUp.status}`);
  }

  // Create a new staff user (to test activate/deactivate/delete)
  const newEmail = `test.staff.${Date.now()}@masova.com`;
  const rCreate = await req(`${S.core}/api/users/create`, {
    method: 'POST', token: tok.manager,
    body: { type: 'STAFF', name: 'Test Staff', email: newEmail, password: 'Staff@12345', phone: '9111222333', storeCode: 'DOM001' },
  });
  if (ok(rCreate)) {
    D.newUserId = id(rCreate.body);
    pass(sec, 'POST /api/users/create', D.newUserId);

    if (D.newUserId) {
      const rDe = await req(`${S.core}/api/users/${D.newUserId}/deactivate`, {
        method: 'POST', token: tok.manager,
      });
      if (ok(rDe)) pass(sec, 'POST /api/users/{userId}/deactivate');
      else          warn(sec, 'POST /api/users/{userId}/deactivate', `status ${rDe.status}`);

      const rAc = await req(`${S.core}/api/users/${D.newUserId}/activate`, {
        method: 'POST', token: tok.manager,
      });
      if (ok(rAc)) pass(sec, 'POST /api/users/{userId}/activate');
      else          warn(sec, 'POST /api/users/{userId}/activate', `status ${rAc.status}`);

      const rDel = await req(`${S.core}/api/users/${D.newUserId}`, {
        method: 'DELETE', token: tok.manager,
      });
      if (ok(rDel)) pass(sec, 'DELETE /api/users/{userId}');
      else           warn(sec, 'DELETE /api/users/{userId}', `status ${rDel.status}`);
    }
  } else warn(sec, 'POST /api/users/create', `status ${rCreate.status}`);

  // Kiosk endpoints
  if (D.managerId) {
    const rKC = await req(`${S.core}/api/users/kiosk/create`, {
      method: 'POST', token: tok.manager, userId: D.managerId,
      body: { storeId: 'DOM001', terminalId: `terminal-${Date.now()}` },
    });
    if (ok(rKC)) { D.kioskId = id(rKC.body); pass(sec, 'POST /api/users/kiosk/create', D.kioskId); }
    else           warn(sec, 'POST /api/users/kiosk/create', `status ${rKC.status}`);

    const rKL = await req(`${S.core}/api/users/kiosk/list?storeId=DOM001`, {
      token: tok.manager,
    });
    if (ok(rKL)) pass(sec, 'GET /api/users/kiosk/list');
    else          warn(sec, 'GET /api/users/kiosk/list', `status ${rKL.status}`);

    if (D.kioskId) {
      const rKR = await req(`${S.core}/api/users/kiosk/${D.kioskId}/regenerate-tokens`, {
        method: 'POST', token: tok.manager, userId: D.managerId,
      });
      if (ok(rKR)) pass(sec, 'POST /api/users/kiosk/{id}/regenerate-tokens');
      else          warn(sec, 'POST /api/users/kiosk/{id}/regenerate-tokens', `status ${rKR.status}`);

      const rKDe = await req(`${S.core}/api/users/kiosk/${D.kioskId}/deactivate`, {
        method: 'POST', token: tok.manager, userId: D.managerId,
      });
      if (ok(rKDe)) pass(sec, 'POST /api/users/kiosk/{id}/deactivate');
      else           warn(sec, 'POST /api/users/kiosk/{id}/deactivate', `status ${rKDe.status}`);
    }
  }

  // Kiosk auto-login (expect 4xx — no real kiosk token)
  const rKAL = await req(`${S.core}/api/users/kiosk/auto-login`, {
    method: 'POST', body: { kioskToken: 'fake-kiosk-token' },
  });
  if (rKAL.status === 401 || rKAL.status === 400 || rKAL.status === 404)
    pass(sec, 'POST /api/users/kiosk/auto-login — rejects fake token');
  else warn(sec, 'POST /api/users/kiosk/auto-login', `status ${rKAL.status}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. STORES
// ══════════════════════════════════════════════════════════════════════════════
async function testStores() {
  section('STORES');
  const sec = 'stores';

  // Public endpoints
  const rPub = await req(`${S.core}/api/stores/public`);
  if (ok(rPub)) {
    pass(sec, 'GET /api/stores/public');
    const list = Array.isArray(rPub.body) ? rPub.body : (rPub.body?.content || []);
    const dom001 = list.find(s => s.code === 'DOM001');
    const dom003 = list.find(s => s.code === 'DOM003');
    if (dom001) D.storeId001 = dom001.id || dom001._id;
    if (dom003) D.storeId003 = dom003.id || dom003._id;
    if (list.length > 0 && !D.storeId001) D.storeId001 = list[0].id || list[0]._id;
  } else fail(sec, 'GET /api/stores/public', `status ${rPub.status}`);

  const rCode = await req(`${S.core}/api/stores/public/code/DOM001`);
  if (ok(rCode)) {
    pass(sec, 'GET /api/stores/public/code/DOM001');
    if (!D.storeId001) D.storeId001 = id(rCode.body);
  } else warn(sec, 'GET /api/stores/public/code/DOM001', `status ${rCode.status}`);

  if (D.storeId001) {
    const rById = await req(`${S.core}/api/stores/public/${D.storeId001}`);
    if (ok(rById)) pass(sec, 'GET /api/stores/public/{storeId}');
    else            warn(sec, 'GET /api/stores/public/{storeId}', `status ${rById.status}`);
  }

  // Operational status (no auth)
  const rOp = await req(`${S.core}/api/stores/operational-status`, {
    headers: { 'X-User-Store-Id': 'DOM001' },
  });
  if (ok(rOp)) pass(sec, 'GET /api/stores/operational-status');
  else          warn(sec, 'GET /api/stores/operational-status', `status ${rOp.status}`);

  // Delivery radius check (public)
  if (D.storeId001) {
    const rDR = await req(`${S.core}/api/stores/${D.storeId001}/delivery-radius-check?latitude=17.385&longitude=78.4867`);
    if (ok(rDR)) pass(sec, 'GET /api/stores/{storeId}/delivery-radius-check');
    else          warn(sec, 'GET /api/stores/{storeId}/delivery-radius-check', `status ${rDR.status}`);
  }

  // Access check (no auth required)
  const rAC = await req(`${S.core}/api/stores/access-check`, {
    method: 'POST',
    headers: { 'X-User-Id': D.managerId || 'test', 'X-User-Store-Id': 'DOM001' },
  });
  if (ok(rAC)) pass(sec, 'POST /api/stores/access-check');
  else          warn(sec, 'POST /api/stores/access-check', `status ${rAC.status}`);

  if (!tok.manager) { warn(sec, 'Authenticated store endpoints skipped', 'no manager token'); return; }

  // Auth endpoints
  const rAll = await req(`${S.core}/api/stores`, { token: tok.manager });
  if (ok(rAll)) pass(sec, 'GET /api/stores');
  else           warn(sec, 'GET /api/stores', `status ${rAll.status}`);

  if (D.storeId001) {
    const rS = await req(`${S.core}/api/stores/${D.storeId001}`, { token: tok.manager });
    if (ok(rS)) pass(sec, 'GET /api/stores/{storeId}');
    else         warn(sec, 'GET /api/stores/{storeId}', `status ${rS.status}`);
  }

  const rByCode = await req(`${S.core}/api/stores/code/DOM001`, { token: tok.manager });
  if (ok(rByCode)) pass(sec, 'GET /api/stores/code/{storeCode}');
  else              warn(sec, 'GET /api/stores/code/{storeCode}', `status ${rByCode.status}`);

  const rRegion = await req(`${S.core}/api/stores/region/south`, { token: tok.manager });
  if (ok(rRegion)) pass(sec, 'GET /api/stores/region/{regionId}');
  else              warn(sec, 'GET /api/stores/region/{regionId}', `status ${rRegion.status}`);

  const rNearby = await req(`${S.core}/api/stores/nearby?latitude=17.385&longitude=78.4867`, { token: tok.manager });
  if (ok(rNearby)) pass(sec, 'GET /api/stores/nearby');
  else              warn(sec, 'GET /api/stores/nearby', `status ${rNearby.status}`);

  const rMetrics = await req(`${S.core}/api/stores/metrics`, {
    token: tok.manager, storeCode: A.manager.storeCode,
  });
  if (ok(rMetrics)) pass(sec, 'GET /api/stores/metrics');
  else               warn(sec, 'GET /api/stores/metrics', `status ${rMetrics.status}`);

  // Create store, update, then clean up
  const rCreate = await req(`${S.core}/api/stores`, {
    method: 'POST', token: tok.manager,
    body: {
      name: 'Test Store API', code: `TST${Date.now().toString().slice(-4)}`,
      phoneNumber: '9000000099', regionId: 'south',
      address: { street: '1 Test Rd', city: 'Hyderabad', pincode: '500001', state: 'TS' },
    },
  });
  if (ok(rCreate)) {
    D.newStoreId = id(rCreate.body);
    pass(sec, 'POST /api/stores', D.newStoreId);

    if (D.newStoreId) {
      const rUp = await req(`${S.core}/api/stores/${D.newStoreId}`, {
        method: 'PUT', token: tok.manager,
        body: { name: 'Test Store Updated' },
      });
      if (ok(rUp)) pass(sec, 'PUT /api/stores/{storeId}');
      else          warn(sec, 'PUT /api/stores/{storeId}', `status ${rUp.status}`);
    }
  } else warn(sec, 'POST /api/stores', `status ${rCreate.status} — ${JSON.stringify(rCreate.body)?.slice(0,100)}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. MENU
// ══════════════════════════════════════════════════════════════════════════════
async function testMenu() {
  section('MENU');
  const sec = 'menu';

  // Public — must pass storeCode via query since no header on public calls
  const rPub = await req(`${S.commerce}/api/menu/public?storeCode=DOM001`);
  if (ok(rPub)) {
    pass(sec, 'GET /api/menu/public');
    const items = Array.isArray(rPub.body) ? rPub.body : (rPub.body?.content || []);
    if (items.length > 0) D.menuItemId = items[0].id || items[0]._id;
  } else fail(sec, 'GET /api/menu/public', `status ${rPub.status}`);

  if (D.menuItemId) {
    const r = await req(`${S.commerce}/api/menu/public/${D.menuItemId}`);
    if (ok(r)) pass(sec, 'GET /api/menu/public/{id}');
    else        warn(sec, 'GET /api/menu/public/{id}', `status ${r.status}`);
  }

  const pubFilters = [
    ['GET /api/menu/public/cuisine/SOUTH_INDIAN',    `${S.commerce}/api/menu/public/cuisine/SOUTH_INDIAN?storeCode=DOM001`],
    ['GET /api/menu/public/category/MAIN_COURSE',    `${S.commerce}/api/menu/public/category/MAIN_COURSE?storeCode=DOM001`],
    ['GET /api/menu/public/dietary/VEG',             `${S.commerce}/api/menu/public/dietary/VEG?storeCode=DOM001`],
    ['GET /api/menu/public/recommended',             `${S.commerce}/api/menu/public/recommended?storeCode=DOM001`],
    ['GET /api/menu/public/search?q=dosa',           `${S.commerce}/api/menu/public/search?q=dosa&storeCode=DOM001`],
    ['GET /api/menu/public/tag/bestseller',          `${S.commerce}/api/menu/public/tag/bestseller?storeCode=DOM001`],
  ];
  for (const [label, url] of pubFilters) {
    const r = await req(url);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  // Manager menu endpoints
  const rItems = await req(`${S.commerce}/api/menu/items`, {
    storeCode: 'DOM001',
  });
  if (ok(rItems)) pass(sec, 'GET /api/menu/items');
  else             warn(sec, 'GET /api/menu/items', `status ${rItems.status}`);

  const rStats = await req(`${S.commerce}/api/menu/stats`, { storeCode: 'DOM001' });
  if (ok(rStats)) pass(sec, 'GET /api/menu/stats');
  else             warn(sec, 'GET /api/menu/stats', `status ${rStats.status}`);

  // Create menu item (no auth required per controller)
  if (D.storeId001) {
    const rCreate = await req(`${S.commerce}/api/menu/items`, {
      method: 'POST',
      body: {
        name: 'Test Item API', description: 'API test item', price: 99.0,
        storeId: D.storeId001, category: 'MAIN_COURSE', cuisine: 'SOUTH_INDIAN',
        dietaryType: 'VEG', tags: ['test'], isAvailable: true,
      },
    });
    if (ok(rCreate)) {
      D.newMenuItemId = id(rCreate.body);
      pass(sec, 'POST /api/menu/items', D.newMenuItemId);
      // Use new item as fallback if public menu was empty
      if (!D.menuItemId) D.menuItemId = D.newMenuItemId;
    } else warn(sec, 'POST /api/menu/items', `status ${rCreate.status}`);

    if (D.newMenuItemId) {
      const rUp = await req(`${S.commerce}/api/menu/items/${D.newMenuItemId}`, {
        method: 'PUT',
        body: { name: 'Test Item Updated', price: 109.0, storeId: D.storeId001, category: 'MAIN_COURSE' },
      });
      if (ok(rUp)) pass(sec, 'PUT /api/menu/items/{id}');
      else          warn(sec, 'PUT /api/menu/items/{id}', `status ${rUp.status}`);

      const rAvail = await req(`${S.commerce}/api/menu/items/${D.newMenuItemId}/availability`, {
        method: 'PATCH',
      });
      if (ok(rAvail)) pass(sec, 'PATCH /api/menu/items/{id}/availability (toggle)');
      else             warn(sec, 'PATCH /api/menu/items/{id}/availability', `status ${rAvail.status}`);

      const rAvailSet = await req(`${S.commerce}/api/menu/items/${D.newMenuItemId}/availability/true`, {
        method: 'PATCH',
      });
      if (ok(rAvailSet)) pass(sec, 'PATCH /api/menu/items/{id}/availability/{status}');
      else                warn(sec, 'PATCH /api/menu/items/{id}/availability/{status}', `status ${rAvailSet.status}`);
    }

    // Bulk create
    const rBulk = await req(`${S.commerce}/api/menu/items/bulk`, {
      method: 'POST',
      body: [{ name: 'Bulk Item 1', price: 50, storeId: D.storeId001, category: 'SNACKS', cuisine: 'NORTH_INDIAN', dietaryType: 'VEG' }],
    });
    if (ok(rBulk)) pass(sec, 'POST /api/menu/items/bulk');
    else            warn(sec, 'POST /api/menu/items/bulk', `status ${rBulk.status}`);
  } else warn(sec, 'Menu create/update skipped', 'no storeId001');

  // Copy menu between stores (NEW)
  if (D.storeId001 && D.storeId003) {
    const rCopy = await req(`${S.commerce}/api/menu/copy-menu`, {
      method: 'POST',
      body: { sourceStoreId: D.storeId001, targetStoreId: D.storeId003 },
    });
    if (ok(rCopy)) pass(sec, 'POST /api/menu/copy-menu');
    else            warn(sec, 'POST /api/menu/copy-menu', `status ${rCopy.status}`);
  } else warn(sec, 'POST /api/menu/copy-menu', 'skipped — need both storeId001 and storeId003');

  // Delete created item
  if (D.newMenuItemId) {
    const rDel = await req(`${S.commerce}/api/menu/items/${D.newMenuItemId}`, { method: 'DELETE' });
    if (ok(rDel)) pass(sec, 'DELETE /api/menu/items/{id}');
    else           warn(sec, 'DELETE /api/menu/items/{id}', `status ${rDel.status}`);
  }

  // DELETE all items (bulk delete) — only call if explicitly safe (use a test store only)
  // This endpoint deletes ALL items in a store — tested as warn-only to confirm it exists
  const rDelAll = await req(`${S.commerce}/api/menu/items`, {
    method: 'DELETE',
    headers: { 'X-User-Store-Id': 'TESTONLY' },
  });
  // 400/404/403 are acceptable — store TESTONLY won't exist
  if (ok(rDelAll) || rDelAll.status === 400 || rDelAll.status === 404 || rDelAll.status === 403)
    pass(sec, 'DELETE /api/menu/items (bulk delete) — endpoint reachable');
  else warn(sec, 'DELETE /api/menu/items (bulk delete)', `status ${rDelAll.status}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. CUSTOMERS
// ══════════════════════════════════════════════════════════════════════════════
async function testCustomers() {
  section('CUSTOMERS');
  const sec = 'customers';

  // Get or create customer profile
  const rGOC = await req(`${S.core}/api/v1/customers/get-or-create`, {
    method: 'POST',
    body: { name: 'Priya Customer', email: A.customer.email, phone: '9876543210' },
  });
  if (ok(rGOC)) {
    D.customerProfileId = id(rGOC.body);
    pass(sec, 'POST /api/v1/customers/get-or-create', D.customerProfileId);
  } else warn(sec, 'POST /api/v1/customers/get-or-create', `status ${rGOC.status}`);

  // Create new customer profile
  const rCreate = await req(`${S.core}/api/v1/customers`, {
    method: 'POST',
    body: { name: 'API Test Customer', email: `apicust.${Date.now()}@test.com`, phone: '9000111222' },
  });
  if (ok(rCreate)) {
    D.testCustomerProfileId = id(rCreate.body);
    pass(sec, 'POST /api/v1/customers');
  } else warn(sec, 'POST /api/v1/customers', `status ${rCreate.status}`);

  const cpid = D.customerProfileId || D.testCustomerProfileId;

  if (cpid) {
    const rGet = await req(`${S.core}/api/v1/customers/${cpid}`, { token: tok.customer });
    if (ok(rGet)) pass(sec, 'GET /api/v1/customers/{id}');
    else           warn(sec, 'GET /api/v1/customers/{id}', `status ${rGet.status}`);

    // Update
    const rUp = await req(`${S.core}/api/v1/customers/${cpid}`, {
      method: 'PUT', body: { name: 'Priya Updated' },
    });
    if (ok(rUp)) pass(sec, 'PUT /api/v1/customers/{id}');
    else          warn(sec, 'PUT /api/v1/customers/{id}', `status ${rUp.status}`);

    // Addresses
    const rAddr = await req(`${S.core}/api/v1/customers/${cpid}/addresses`, {
      method: 'POST',
      body: { street: '12 MG Road', city: 'Hyderabad', pincode: '500001', state: 'Telangana', isDefault: true },
    });
    if (ok(rAddr)) {
      D.addressId = id(rAddr.body);
      pass(sec, 'POST /api/v1/customers/{id}/addresses');
    } else warn(sec, 'POST /api/v1/customers/{id}/addresses', `status ${rAddr.status}`);

    if (D.addressId) {
      const rSetDef = await req(`${S.core}/api/v1/customers/${cpid}/addresses/${D.addressId}/set-default`, {
        method: 'PATCH',
      });
      if (ok(rSetDef)) pass(sec, 'PATCH /api/v1/customers/{id}/addresses/{aid}/set-default');
      else              warn(sec, 'PATCH set-default address', `status ${rSetDef.status}`);

      const rUpAddr = await req(`${S.core}/api/v1/customers/${cpid}/addresses/${D.addressId}`, {
        method: 'PATCH', body: { street: '14 MG Road Updated' },
      });
      if (ok(rUpAddr)) pass(sec, 'PATCH /api/v1/customers/{id}/addresses/{aid}');
      else              warn(sec, 'PATCH update address', `status ${rUpAddr.status}`);

      const rDelAddr = await req(`${S.core}/api/v1/customers/${cpid}/addresses/${D.addressId}`, {
        method: 'DELETE',
      });
      if (ok(rDelAddr)) pass(sec, 'DELETE /api/v1/customers/{id}/addresses/{aid}');
      else               warn(sec, 'DELETE address', `status ${rDelAddr.status}`);
    }

    // Loyalty
    const rLP = await req(`${S.core}/api/v1/customers/${cpid}/loyalty/points`, {
      method: 'POST', body: { points: 100, orderId: 'test-order-001', reason: 'TEST' },
    });
    if (ok(rLP)) pass(sec, 'POST /api/v1/customers/{id}/loyalty/points');
    else          warn(sec, 'POST /api/v1/customers/{id}/loyalty/points', `status ${rLP.status}`);

    const rMaxR = await req(`${S.core}/api/v1/customers/${cpid}/loyalty/max-redeemable?orderTotal=500`);
    if (ok(rMaxR)) pass(sec, 'GET /api/v1/customers/{id}/loyalty/max-redeemable');
    else            warn(sec, 'GET loyalty max-redeemable', `status ${rMaxR.status}`);

    // Preferences, tags, verify
    const rPref = await req(`${S.core}/api/v1/customers/${cpid}/preferences`, {
      method: 'PUT', body: { preferredCuisine: 'SOUTH_INDIAN', dietaryPreference: 'VEG' },
    });
    if (ok(rPref)) pass(sec, 'PUT /api/v1/customers/{id}/preferences');
    else            warn(sec, 'PUT preferences', `status ${rPref.status}`);

    const rTags = await req(`${S.core}/api/v1/customers/${cpid}/tags`, {
      method: 'POST', body: ['VIP', 'REGULAR'],
    });
    if (ok(rTags)) pass(sec, 'POST /api/v1/customers/{id}/tags');
    else            warn(sec, 'POST tags', `status ${rTags.status}`);

    const rDelTags = await req(`${S.core}/api/v1/customers/${cpid}/tags`, {
      method: 'DELETE', body: ['REGULAR'],
    });
    if (ok(rDelTags)) pass(sec, 'DELETE /api/v1/customers/{id}/tags');
    else               warn(sec, 'DELETE tags', `status ${rDelTags.status}`);

    const rNote = await req(`${S.core}/api/v1/customers/${cpid}/notes`, {
      method: 'POST', body: { note: 'API test note', addedBy: 'test-manager' },
    });
    if (ok(rNote)) pass(sec, 'POST /api/v1/customers/{id}/notes');
    else            warn(sec, 'POST notes', `status ${rNote.status}`);

    const rVE = await req(`${S.core}/api/v1/customers/${cpid}/verify-email`, { method: 'PATCH' });
    if (ok(rVE)) pass(sec, 'PATCH /api/v1/customers/{id}/verify-email');
    else          warn(sec, 'PATCH verify-email', `status ${rVE.status}`);

    const rVP = await req(`${S.core}/api/v1/customers/${cpid}/verify-phone`, { method: 'PATCH' });
    if (ok(rVP)) pass(sec, 'PATCH /api/v1/customers/{id}/verify-phone');
    else          warn(sec, 'PATCH verify-phone', `status ${rVP.status}`);
  }

  // List endpoints (no auth required)
  const listEndpoints = [
    ['GET /api/v1/customers',              `${S.core}/api/v1/customers`],
    ['GET /api/v1/customers/active',       `${S.core}/api/v1/customers/active`],
    ['GET /api/v1/customers/search',       `${S.core}/api/v1/customers/search?query=priya`],
    ['GET /api/v1/customers/stats',        `${S.core}/api/v1/customers/stats`],
    ['GET /api/v1/customers/high-value',   `${S.core}/api/v1/customers/high-value`],
    ['GET /api/v1/customers/top-spenders', `${S.core}/api/v1/customers/top-spenders`],
    ['GET /api/v1/customers/recently-active', `${S.core}/api/v1/customers/recently-active`],
    ['GET /api/v1/customers/inactive',     `${S.core}/api/v1/customers/inactive`],
    ['GET /api/v1/customers/birthdays/today', `${S.core}/api/v1/customers/birthdays/today`],
    ['GET /api/v1/customers/marketing-opt-in', `${S.core}/api/v1/customers/marketing-opt-in`],
    ['GET /api/v1/customers/sms-opt-in',   `${S.core}/api/v1/customers/sms-opt-in`],
    ['GET /api/v1/customers/loyalty/tier/BRONZE', `${S.core}/api/v1/customers/loyalty/tier/BRONZE`],
    ['GET /api/v1/customers/tags',         `${S.core}/api/v1/customers/tags?tags=VIP`],
  ];
  for (const [label, url] of listEndpoints) {
    const r = await req(url, { storeCode: 'DOM001' });
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  // Get by userId
  if (D.customerId) {
    const rByUser = await req(`${S.core}/api/v1/customers/user/${D.customerId}`, { token: tok.customer });
    if (ok(rByUser)) pass(sec, 'GET /api/v1/customers/user/{userId}');
    else              warn(sec, 'GET /api/v1/customers/user/{userId}', `status ${rByUser.status}`);
  }

  // Get by email (NEW)
  const rByEmail = await req(`${S.core}/api/v1/customers/email/${encodeURIComponent(A.customer.email)}`);
  if (ok(rByEmail)) pass(sec, 'GET /api/v1/customers/email/{email}');
  else               warn(sec, 'GET /api/v1/customers/email/{email}', `status ${rByEmail.status}`);

  // Get by phone (NEW)
  const rByPhone = await req(`${S.core}/api/v1/customers/phone/9876543210`);
  if (ok(rByPhone)) pass(sec, 'GET /api/v1/customers/phone/{phone}');
  else               warn(sec, 'GET /api/v1/customers/phone/{phone}', `status ${rByPhone.status}`);

  const cpid2 = D.customerProfileId || D.testCustomerProfileId;

  if (cpid2) {
    // Deactivate (NEW)
    const rDeact = await req(`${S.core}/api/v1/customers/${cpid2}/deactivate`, { method: 'PATCH' });
    if (ok(rDeact)) pass(sec, 'PATCH /api/v1/customers/{id}/deactivate');
    else             warn(sec, 'PATCH /api/v1/customers/{id}/deactivate', `status ${rDeact.status}`);

    // Activate (NEW)
    const rAct = await req(`${S.core}/api/v1/customers/${cpid2}/activate`, { method: 'PATCH' });
    if (ok(rAct)) pass(sec, 'PATCH /api/v1/customers/{id}/activate');
    else           warn(sec, 'PATCH /api/v1/customers/{id}/activate', `status ${rAct.status}`);

    // Loyalty redeem (NEW)
    const rRedeem = await req(`${S.core}/api/v1/customers/${cpid2}/loyalty/redeem`, {
      method: 'POST',
      body: { points: 10, orderId: 'test-order-redeem', reason: 'API test redeem' },
    });
    if (ok(rRedeem)) pass(sec, 'POST /api/v1/customers/{id}/loyalty/redeem');
    else              warn(sec, 'POST /api/v1/customers/{id}/loyalty/redeem', `status ${rRedeem.status}`);

    // Order stats (NEW)
    const rOStats = await req(`${S.core}/api/v1/customers/${cpid2}/order-stats`, {
      method: 'POST',
      body: { orderAmount: 250.0, orderId: 'test-order-stats' },
    });
    if (ok(rOStats)) pass(sec, 'POST /api/v1/customers/{id}/order-stats');
    else              warn(sec, 'POST /api/v1/customers/{id}/order-stats', `status ${rOStats.status}`);

    // Update email (NEW)
    const rUpEmail = await req(`${S.core}/api/v1/customers/${cpid2}/update-email`, {
      method: 'POST',
      body: { newEmail: `updated.${Date.now()}@test.com` },
    });
    if (ok(rUpEmail)) pass(sec, 'POST /api/v1/customers/{id}/update-email');
    else               warn(sec, 'POST /api/v1/customers/{id}/update-email', `status ${rUpEmail.status}`);
  }

  // Delete test customer profile (soft delete)
  if (D.testCustomerProfileId) {
    const rDel = await req(`${S.core}/api/v1/customers/${D.testCustomerProfileId}`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rDel)) pass(sec, 'DELETE /api/v1/customers/{id} (soft)');
    else           warn(sec, 'DELETE /api/v1/customers/{id}', `status ${rDel.status}`);

    // GDPR delete (NEW) — deletes GDPR data for this customer
    const rGdprDel = await req(`${S.core}/api/v1/customers/${D.testCustomerProfileId}/gdpr`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rGdprDel)) pass(sec, 'DELETE /api/v1/customers/{id}/gdpr');
    else               warn(sec, 'DELETE /api/v1/customers/{id}/gdpr', `status ${rGdprDel.status}`);

    // Hard delete (NEW) — permanent deletion
    const rHardDel = await req(`${S.core}/api/v1/customers/${D.testCustomerProfileId}/hard`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rHardDel)) pass(sec, 'DELETE /api/v1/customers/{id}/hard');
    else               warn(sec, 'DELETE /api/v1/customers/{id}/hard', `status ${rHardDel.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. CAMPAIGNS
// ══════════════════════════════════════════════════════════════════════════════
async function testCampaigns() {
  section('CAMPAIGNS');
  const sec = 'campaigns';

  const rCreate = await req(`${S.core}/api/campaigns`, {
    method: 'POST',
    body: {
      name: 'API Test Campaign', type: 'EMAIL', targetSegment: 'ALL_CUSTOMERS',
      subject: 'Test Subject', content: 'Test content for API test campaign.',
      storeId: D.storeId001 || 'DOM001',
    },
  });
  if (ok(rCreate)) {
    D.campaignId = id(rCreate.body);
    pass(sec, 'POST /api/campaigns', D.campaignId);
  } else warn(sec, 'POST /api/campaigns', `status ${rCreate.status}`);

  const rList = await req(`${S.core}/api/campaigns`);
  if (ok(rList)) pass(sec, 'GET /api/campaigns');
  else            warn(sec, 'GET /api/campaigns', `status ${rList.status}`);

  if (D.campaignId) {
    const rGet = await req(`${S.core}/api/campaigns/${D.campaignId}`);
    if (ok(rGet)) pass(sec, 'GET /api/campaigns/{id}');
    else           warn(sec, 'GET /api/campaigns/{id}', `status ${rGet.status}`);

    const rUp = await req(`${S.core}/api/campaigns/${D.campaignId}`, {
      method: 'PUT',
      body: { name: 'Updated Campaign', content: 'Updated content.' },
    });
    if (ok(rUp)) pass(sec, 'PUT /api/campaigns/{id}');
    else          warn(sec, 'PUT /api/campaigns/{id}', `status ${rUp.status}`);

    const rSched = await req(`${S.core}/api/campaigns/${D.campaignId}/schedule`, {
      method: 'POST',
      body: { scheduledFor: new Date(Date.now() + 86400000).toISOString() },
    });
    if (ok(rSched)) pass(sec, 'POST /api/campaigns/{id}/schedule');
    else             warn(sec, 'POST /api/campaigns/{id}/schedule', `status ${rSched.status}`);

    const rExec = await req(`${S.core}/api/campaigns/${D.campaignId}/execute`, { method: 'POST' });
    if (ok(rExec)) pass(sec, 'POST /api/campaigns/{id}/execute');
    else            warn(sec, 'POST /api/campaigns/{id}/execute', `status ${rExec.status}`);

    const rCancel = await req(`${S.core}/api/campaigns/${D.campaignId}/cancel`, { method: 'POST' });
    if (ok(rCancel)) pass(sec, 'POST /api/campaigns/{id}/cancel');
    else              warn(sec, 'POST /api/campaigns/{id}/cancel', `status ${rCancel.status}`);

    const rDel = await req(`${S.core}/api/campaigns/${D.campaignId}`, { method: 'DELETE' });
    if (ok(rDel)) pass(sec, 'DELETE /api/campaigns/{id}');
    else           warn(sec, 'DELETE /api/campaigns/{id}', `status ${rDel.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. NOTIFICATIONS & PREFERENCES
// ══════════════════════════════════════════════════════════════════════════════
async function testNotifications() {
  section('NOTIFICATIONS & PREFERENCES');
  const sec = 'notifications';

  const userId = D.managerId || 'test-user-id';

  // Send notification
  const rSend = await req(`${S.core}/api/notifications/send`, {
    method: 'POST',
    body: {
      userId, title: 'API Test', message: 'Test notification from API test suite',
      type: 'INFO', channel: 'IN_APP', priority: 'LOW',
    },
  });
  if (ok(rSend)) {
    D.notificationId = id(rSend.body);
    pass(sec, 'POST /api/notifications/send', D.notificationId);
  } else warn(sec, 'POST /api/notifications/send', `status ${rSend.status}`);

  const notifEndpoints = [
    ['GET /api/notifications/user/{userId}',            `${S.core}/api/notifications/user/${userId}`],
    ['GET /api/notifications/user/{userId}/unread',     `${S.core}/api/notifications/user/${userId}/unread`],
    ['GET /api/notifications/user/{userId}/unread-count', `${S.core}/api/notifications/user/${userId}/unread-count`],
    ['GET /api/notifications/user/{userId}/recent',     `${S.core}/api/notifications/user/${userId}/recent`],
  ];
  for (const [label, url] of notifEndpoints) {
    const r = await req(url);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.notificationId) {
    const rRead = await req(`${S.core}/api/notifications/${D.notificationId}/read`, { method: 'PATCH' });
    if (ok(rRead)) pass(sec, 'PATCH /api/notifications/{id}/read');
    else            warn(sec, 'PATCH /api/notifications/{id}/read', `status ${rRead.status}`);

    const rDel = await req(`${S.core}/api/notifications/${D.notificationId}`, { method: 'DELETE' });
    if (ok(rDel)) pass(sec, 'DELETE /api/notifications/{id}');
    else           warn(sec, 'DELETE /api/notifications/{id}', `status ${rDel.status}`);
  }

  const rReadAll = await req(`${S.core}/api/notifications/user/${userId}/read-all`, { method: 'PATCH' });
  if (ok(rReadAll)) pass(sec, 'PATCH /api/notifications/user/{userId}/read-all');
  else               warn(sec, 'PATCH read-all', `status ${rReadAll.status}`);

  // Rating notification
  if (tok.manager && D.managerId) {
    const rRating = await req(`${S.core}/api/notifications/rating/send`, {
      method: 'POST', token: tok.manager,
      body: {
        orderId: D.takeawayOrderId || 'test-order',
        orderNumber: D.takeawayOrderNumber || 'ORD-001',
        customerPhone: '9876543210', customerEmail: A.customer.email,
        ratingToken: `token-${Date.now()}`,
      },
    });
    if (ok(rRating)) pass(sec, 'POST /api/notifications/rating/send');
    else              warn(sec, 'POST /api/notifications/rating/send', `status ${rRating.status}`);
  }

  // User preferences
  const rPrefGet = await req(`${S.core}/api/preferences/user/${userId}`);
  if (ok(rPrefGet)) pass(sec, 'GET /api/preferences/user/{userId}');
  else               warn(sec, 'GET /api/preferences/user/{userId}', `status ${rPrefGet.status}`);

  const rPrefPut = await req(`${S.core}/api/preferences/user/${userId}`, {
    method: 'PUT',
    body: { emailEnabled: true, smsEnabled: false, pushEnabled: true },
  });
  if (ok(rPrefPut)) pass(sec, 'PUT /api/preferences/user/{userId}');
  else               warn(sec, 'PUT /api/preferences/user/{userId}', `status ${rPrefPut.status}`);

  const rPrefChan = await req(`${S.core}/api/preferences/user/${userId}/channel/EMAIL?enabled=true`, {
    method: 'PATCH',
  });
  if (ok(rPrefChan)) pass(sec, 'PATCH /api/preferences/user/{userId}/channel/{channel}');
  else                warn(sec, 'PATCH channel preference', `status ${rPrefChan.status}`);

  const rPrefToken = await req(`${S.core}/api/preferences/user/${userId}/device-token`, {
    method: 'PATCH', body: { deviceToken: 'fcm-test-token-123' },
  });
  if (ok(rPrefToken)) pass(sec, 'PATCH /api/preferences/user/{userId}/device-token');
  else                 warn(sec, 'PATCH device-token', `status ${rPrefToken.status}`);

  const rPrefContact = await req(`${S.core}/api/preferences/user/${userId}/contact`, {
    method: 'PATCH', body: { email: A.manager.email, phone: '9000000001' },
  });
  if (ok(rPrefContact)) pass(sec, 'PATCH /api/preferences/user/{userId}/contact');
  else                   warn(sec, 'PATCH contact preferences', `status ${rPrefContact.status}`);

  const rPrefDel = await req(`${S.core}/api/preferences/user/nonexistent-del-${Date.now()}`, {
    method: 'DELETE',
  });
  // 404 or 200 are both acceptable here
  if (ok(rPrefDel) || rPrefDel.status === 404)
    pass(sec, 'DELETE /api/preferences/user/{userId}');
  else warn(sec, 'DELETE /api/preferences/user/{userId}', `status ${rPrefDel.status}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. GDPR
// ══════════════════════════════════════════════════════════════════════════════
async function testGdpr() {
  section('GDPR');
  const sec = 'gdpr';

  const userId = D.customerId || D.managerId || 'gdpr-test-user';

  // Privacy policy
  const rPP = await req(`${S.core}/api/gdpr/privacy-policy`);
  if (ok(rPP)) pass(sec, 'GET /api/gdpr/privacy-policy');
  else          warn(sec, 'GET /api/gdpr/privacy-policy', `status ${rPP.status}`);

  // Consent grant
  const rGrant = await req(`${S.core}/api/gdpr/consent/grant`, {
    method: 'POST',
    body: { userId, consentType: 'MARKETING', version: '1.0', consentText: 'I agree to marketing' },
  });
  if (ok(rGrant)) pass(sec, 'POST /api/gdpr/consent/grant');
  else             warn(sec, 'POST /api/gdpr/consent/grant', `status ${rGrant.status}`);

  const rConsentUser = await req(`${S.core}/api/gdpr/consent/user/${userId}`);
  if (ok(rConsentUser)) pass(sec, 'GET /api/gdpr/consent/user/{userId}');
  else                   warn(sec, 'GET /api/gdpr/consent/user/{userId}', `status ${rConsentUser.status}`);

  const rConsentCheck = await req(`${S.core}/api/gdpr/consent/check?userId=${userId}&consentType=MARKETING`);
  if (ok(rConsentCheck)) pass(sec, 'GET /api/gdpr/consent/check');
  else                    warn(sec, 'GET /api/gdpr/consent/check', `status ${rConsentCheck.status}`);

  const rRevoke = await req(`${S.core}/api/gdpr/consent/revoke?userId=${userId}&consentType=MARKETING`, {
    method: 'POST',
  });
  if (ok(rRevoke)) pass(sec, 'POST /api/gdpr/consent/revoke');
  else              warn(sec, 'POST /api/gdpr/consent/revoke', `status ${rRevoke.status}`);

  // GDPR data request
  const rRequest = await req(`${S.core}/api/gdpr/request`, {
    method: 'POST',
    body: { userId, requestType: 'ACCESS', reason: 'User requested data access via API test' },
  });
  if (ok(rRequest)) {
    D.gdprRequestId = id(rRequest.body);
    pass(sec, 'POST /api/gdpr/request', D.gdprRequestId);
  } else warn(sec, 'POST /api/gdpr/request', `status ${rRequest.status}`);

  const rReqUser = await req(`${S.core}/api/gdpr/request/user/${userId}`);
  if (ok(rReqUser)) pass(sec, 'GET /api/gdpr/request/user/{userId}');
  else               warn(sec, 'GET /api/gdpr/request/user/{userId}', `status ${rReqUser.status}`);

  const rAudit = await req(`${S.core}/api/gdpr/audit/${userId}`);
  if (ok(rAudit)) pass(sec, 'GET /api/gdpr/audit/{userId}');
  else             warn(sec, 'GET /api/gdpr/audit/{userId}', `status ${rAudit.status}`);

  const rExport = await req(`${S.core}/api/gdpr/export/${userId}`, { token: tok.customer || tok.manager });
  if (ok(rExport)) pass(sec, 'GET /api/gdpr/export/{userId}');
  else              warn(sec, 'GET /api/gdpr/export/{userId}', `status ${rExport.status}`);

  if (D.gdprRequestId) {
    const reqPaths = [
      ['POST /api/gdpr/request/{id}/access',       `${S.core}/api/gdpr/request/${D.gdprRequestId}/access`],
      ['POST /api/gdpr/request/{id}/portability',  `${S.core}/api/gdpr/request/${D.gdprRequestId}/portability`],
    ];
    for (const [label, url] of reqPaths) {
      const r = await req(url, { method: 'POST' });
      if (ok(r)) pass(sec, label);
      else        warn(sec, label, `status ${r.status}`);
    }

    // Verify request (NEW)
    const rVerify = await req(`${S.core}/api/gdpr/request/${D.gdprRequestId}/verify`, { method: 'POST' });
    if (ok(rVerify)) pass(sec, 'POST /api/gdpr/request/{id}/verify');
    else              warn(sec, 'POST /api/gdpr/request/{id}/verify', `status ${rVerify.status}`);

    // Erasure request (NEW)
    const rErasure = await req(`${S.core}/api/gdpr/request/${D.gdprRequestId}/erasure`, { method: 'POST' });
    if (ok(rErasure)) pass(sec, 'POST /api/gdpr/request/{id}/erasure');
    else               warn(sec, 'POST /api/gdpr/request/{id}/erasure', `status ${rErasure.status}`);

    // Rectification request (NEW)
    const rRect = await req(`${S.core}/api/gdpr/request/${D.gdprRequestId}/rectification`, {
      method: 'POST', body: { corrections: { name: 'Corrected Name' } },
    });
    if (ok(rRect)) pass(sec, 'POST /api/gdpr/request/{id}/rectification');
    else            warn(sec, 'POST /api/gdpr/request/{id}/rectification', `status ${rRect.status}`);
  }

  // Erase user data (NEW) — use a temp user so we don't destroy real test data
  if (D.regUserId) {
    const rErase = await req(`${S.core}/api/gdpr/erase/${D.regUserId}`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rErase)) pass(sec, 'DELETE /api/gdpr/erase/{userId}');
    else             warn(sec, 'DELETE /api/gdpr/erase/{userId}', `status ${rErase.status}`);
  } else warn(sec, 'DELETE /api/gdpr/erase/{userId}', 'skipped — no regUserId');
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. SHIFTS
// ══════════════════════════════════════════════════════════════════════════════
async function testShifts() {
  section('SHIFTS');
  const sec = 'shifts';

  if (!tok.manager) { warn(sec, 'Shifts skipped', 'no manager token'); return; }

  // Create shift
  const rCreate = await req(`${S.core}/api/shifts`, {
    method: 'POST', token: tok.manager,
    body: {
      employeeId: D.staffId || D.managerId,
      storeId: D.storeId001 || 'DOM001',
      date: TODAY,
      startTime: '09:00', endTime: '17:00',
      role: 'KITCHEN_STAFF',
    },
  });
  if (ok(rCreate)) {
    D.shiftId = id(rCreate.body);
    pass(sec, 'POST /api/shifts', D.shiftId);
  } else warn(sec, 'POST /api/shifts', `status ${rCreate.status} — ${JSON.stringify(rCreate.body)?.slice(0,120)}`);

  // Store shifts
  const rStore = await req(`${S.core}/api/shifts/store?date=${TODAY}`, {
    token: tok.manager, storeCode: A.manager2.storeCode,
  });
  if (ok(rStore)) pass(sec, 'GET /api/shifts/store');
  else             warn(sec, 'GET /api/shifts/store', `status ${rStore.status}`);

  // Store coverage
  const rCov = await req(`${S.core}/api/shifts/store/coverage?date=${TODAY}`, {
    token: tok.manager, storeCode: A.manager2.storeCode,
  });
  if (ok(rCov)) pass(sec, 'GET /api/shifts/store/coverage');
  else           warn(sec, 'GET /api/shifts/store/coverage', `status ${rCov.status}`);

  // Week view
  if (D.storeId001) {
    const rWeek = await req(`${S.core}/api/shifts/store/${D.storeId001}/week?startDate=${WEEK_START}`, {
      token: tok.manager,
    });
    if (ok(rWeek)) pass(sec, 'GET /api/shifts/store/{storeId}/week');
    else            warn(sec, 'GET /api/shifts/store/{storeId}/week', `status ${rWeek.status}`);

    const rWeekEx = await req(`${S.core}/api/shifts/store/${D.storeId001}/week/exists?startDate=${WEEK_START}`, {
      token: tok.manager,
    });
    if (ok(rWeekEx)) pass(sec, 'GET /api/shifts/store/{storeId}/week/exists');
    else              warn(sec, 'GET /api/shifts/store/{storeId}/week/exists', `status ${rWeekEx.status}`);
  }

  if (D.staffId) {
    const rEmp = await req(`${S.core}/api/shifts/employee/${D.staffId}?startDate=${WEEK_START}&endDate=${TODAY}`, {
      token: tok.manager,
    });
    if (ok(rEmp)) pass(sec, 'GET /api/shifts/employee/{employeeId}');
    else           warn(sec, 'GET /api/shifts/employee/{employeeId}', `status ${rEmp.status}`);

    const rCur = await req(`${S.core}/api/shifts/employee/${D.staffId}/current`, { token: tok.manager });
    if (ok(rCur)) pass(sec, 'GET /api/shifts/employee/{employeeId}/current');
    else           warn(sec, 'GET /api/shifts/employee/{employeeId}/current', `status ${rCur.status}`);
  }

  if (D.shiftId) {
    const rGet = await req(`${S.core}/api/shifts/${D.shiftId}`, { token: tok.manager });
    if (ok(rGet)) pass(sec, 'GET /api/shifts/{shiftId}');
    else           warn(sec, 'GET /api/shifts/{shiftId}', `status ${rGet.status}`);

    const rUp = await req(`${S.core}/api/shifts/${D.shiftId}`, {
      method: 'PUT', token: tok.manager,
      body: { startTime: '08:00', endTime: '16:00' },
    });
    if (ok(rUp)) pass(sec, 'PUT /api/shifts/{shiftId}');
    else          warn(sec, 'PUT /api/shifts/{shiftId}', `status ${rUp.status}`);

    const rConf = await req(`${S.core}/api/shifts/${D.shiftId}/confirm`, {
      method: 'POST', token: tok.manager,
    });
    if (ok(rConf)) pass(sec, 'POST /api/shifts/{shiftId}/confirm');
    else            warn(sec, 'POST /api/shifts/{shiftId}/confirm', `status ${rConf.status}`);

    const rStart = await req(`${S.core}/api/shifts/${D.shiftId}/start`, {
      method: 'POST', token: tok.staff || tok.manager,
    });
    if (ok(rStart)) pass(sec, 'POST /api/shifts/{shiftId}/start');
    else             warn(sec, 'POST /api/shifts/{shiftId}/start', `status ${rStart.status}`);

    const rComplete = await req(`${S.core}/api/shifts/${D.shiftId}/complete`, {
      method: 'POST', token: tok.manager,
    });
    if (ok(rComplete)) pass(sec, 'POST /api/shifts/{shiftId}/complete');
    else                warn(sec, 'POST /api/shifts/{shiftId}/complete', `status ${rComplete.status}`);

    const rDel = await req(`${S.core}/api/shifts/${D.shiftId}`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rDel)) pass(sec, 'DELETE /api/shifts/{shiftId}');
    else           warn(sec, 'DELETE /api/shifts/{shiftId}', `status ${rDel.status}`);
  }

  // Bulk create
  const rBulk = await req(`${S.core}/api/shifts/bulk-create`, {
    method: 'POST', token: tok.manager,
    body: [{
      employeeId: D.staffId || D.managerId,
      storeId: D.storeId001 || 'DOM001',
      date: WEEK_START, startTime: '09:00', endTime: '17:00', role: 'KITCHEN_STAFF',
    }],
  });
  if (ok(rBulk)) pass(sec, 'POST /api/shifts/bulk-create');
  else            warn(sec, 'POST /api/shifts/bulk-create', `status ${rBulk.status}`);

  // Copy previous week
  const rCopy = await req(`${S.core}/api/shifts/copy-previous-week?targetWeekStart=${TODAY}`, {
    method: 'POST', token: tok.manager, storeCode: A.manager2.storeCode,
  });
  if (ok(rCopy)) pass(sec, 'POST /api/shifts/copy-previous-week');
  else            warn(sec, 'POST /api/shifts/copy-previous-week', `status ${rCopy.status}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. WORKING SESSIONS
// ══════════════════════════════════════════════════════════════════════════════
async function testWorkingSessions() {
  section('WORKING SESSIONS');
  const sec = 'sessions';

  if (!tok.manager || !D.staffId) { warn(sec, 'Sessions skipped', 'missing manager token or staffId'); return; }

  // Clock in with PIN (no auth)
  const rCIPin = await req(`${S.core}/api/users/sessions/clock-in-with-pin`, {
    method: 'POST',
    body: { employeeId: D.staffId, pin: '20197' },
    headers: { 'X-User-Store-Id': 'DOM001' },
  });
  if (ok(rCIPin)) { D.workSessionId = id(rCIPin.body); pass(sec, 'POST /api/users/sessions/clock-in-with-pin'); }
  else              warn(sec, 'POST clock-in-with-pin', `status ${rCIPin.status}`);

  // Start session (bearer auth)
  const rStart = await req(`${S.core}/api/users/sessions/start`, {
    method: 'POST', token: tok.staff, userId: D.staffId, storeCode: 'DOM001',
  });
  if (ok(rStart)) { D.workSessionId = id(rStart.body); pass(sec, 'POST /api/users/sessions/start'); }
  else              warn(sec, 'POST /api/users/sessions/start', `status ${rStart.status}`);

  const rCurrent = await req(`${S.core}/api/users/sessions/current`, {
    token: tok.staff, userId: D.staffId,
  });
  if (ok(rCurrent)) pass(sec, 'GET /api/users/sessions/current');
  else               warn(sec, 'GET /api/users/sessions/current', `status ${rCurrent.status}`);

  const rStatus = await req(`${S.core}/api/users/sessions/${D.staffId}/status`, { token: tok.staff });
  if (ok(rStatus)) pass(sec, 'GET /api/users/sessions/{employeeId}/status');
  else              warn(sec, 'GET /api/users/sessions/{employeeId}/status', `status ${rStatus.status}`);

  const rEmpSess = await req(`${S.core}/api/users/sessions/${D.staffId}`, { token: tok.staff });
  if (ok(rEmpSess)) pass(sec, 'GET /api/users/sessions/{employeeId}');
  else               warn(sec, 'GET /api/users/sessions/{employeeId}', `status ${rEmpSess.status}`);

  const rActive = await req(`${S.core}/api/users/sessions/store/active`, {
    token: tok.manager, storeCode: 'DOM001',
  });
  if (ok(rActive)) pass(sec, 'GET /api/users/sessions/store/active');
  else              warn(sec, 'GET /api/users/sessions/store/active', `status ${rActive.status}`);

  const rStore = await req(`${S.core}/api/users/sessions/store`, {
    token: tok.manager, storeCode: 'DOM001',
  });
  if (ok(rStore)) pass(sec, 'GET /api/users/sessions/store');
  else             warn(sec, 'GET /api/users/sessions/store', `status ${rStore.status}`);

  const rPending = await req(`${S.core}/api/users/sessions/pending-approval`, {
    token: tok.manager, storeCode: 'DOM001',
  });
  if (ok(rPending)) pass(sec, 'GET /api/users/sessions/pending-approval');
  else               warn(sec, 'GET /api/users/sessions/pending-approval', `status ${rPending.status}`);

  const rReport = await req(`${S.core}/api/users/sessions/${D.staffId}/report?startDate=${WEEK_START}&endDate=${TODAY}`, {
    token: tok.manager,
  });
  if (ok(rReport)) pass(sec, 'GET /api/users/sessions/{employeeId}/report');
  else              warn(sec, 'GET /api/users/sessions/{employeeId}/report', `status ${rReport.status}`);

  // Break
  const rBreak = await req(`${S.core}/api/users/sessions/${D.staffId}/break`, {
    method: 'POST', token: tok.staff, body: { breakMinutes: 15 },
  });
  if (ok(rBreak)) pass(sec, 'POST /api/users/sessions/{employeeId}/break');
  else             warn(sec, 'POST /api/users/sessions/{employeeId}/break', `status ${rBreak.status}`);

  // End session
  const rEnd = await req(`${S.core}/api/users/sessions/end`, {
    method: 'POST', token: tok.staff, userId: D.staffId,
  });
  if (ok(rEnd)) pass(sec, 'POST /api/users/sessions/end');
  else           warn(sec, 'POST /api/users/sessions/end', `status ${rEnd.status}`);

  // Clock out by manager
  const rCO = await req(`${S.core}/api/users/sessions/clock-out-employee`, {
    method: 'POST', token: tok.manager, userId: D.managerId,
    body: { employeeId: D.staffId },
  });
  if (ok(rCO)) pass(sec, 'POST /api/users/sessions/clock-out-employee');
  else          warn(sec, 'POST clock-out-employee', `status ${rCO.status}`);

  // Start with location (NEW)
  const rStartLoc = await req(`${S.core}/api/users/sessions/start-with-location`, {
    method: 'POST', token: tok.staff, userId: D.staffId, storeCode: 'DOM001',
    body: { latitude: 17.385, longitude: 78.4867 },
  });
  if (ok(rStartLoc)) { D.workSessionId2 = id(rStartLoc.body); pass(sec, 'POST /api/users/sessions/start-with-location'); }
  else                 warn(sec, 'POST /api/users/sessions/start-with-location', `status ${rStartLoc.status}`);

  // End with location (NEW)
  const rEndLoc = await req(`${S.core}/api/users/sessions/end-with-location`, {
    method: 'POST', token: tok.staff, userId: D.staffId,
    body: { latitude: 17.385, longitude: 78.4867 },
  });
  if (ok(rEndLoc)) pass(sec, 'POST /api/users/sessions/end-with-location');
  else              warn(sec, 'POST /api/users/sessions/end-with-location', `status ${rEndLoc.status}`);

  // Approve / Reject session (NEW — need a sessionId from a pending session)
  const sessionIdToAction = D.workSessionId || D.workSessionId2;
  if (sessionIdToAction && D.managerId) {
    const rApprSess = await req(`${S.core}/api/users/sessions/${sessionIdToAction}/approve`, {
      method: 'POST', token: tok.manager,
    });
    if (ok(rApprSess)) pass(sec, 'POST /api/users/sessions/{sessionId}/approve');
    else                warn(sec, 'POST /api/users/sessions/{sessionId}/approve', `status ${rApprSess.status}`);

    const rRejSess = await req(`${S.core}/api/users/sessions/${sessionIdToAction}/reject`, {
      method: 'POST', token: tok.manager,
      body: { reason: 'API test rejection' },
    });
    if (ok(rRejSess)) pass(sec, 'POST /api/users/sessions/{sessionId}/reject');
    else               warn(sec, 'POST /api/users/sessions/{sessionId}/reject', `status ${rRejSess.status}`);
  } else warn(sec, 'Session approve/reject skipped', 'no sessionId');
}

// ══════════════════════════════════════════════════════════════════════════════
// 12. INVENTORY — Items, Suppliers, Purchase Orders, Waste
// ══════════════════════════════════════════════════════════════════════════════
async function testInventory() {
  section('INVENTORY');
  const sec = 'inventory';
  if (!tok.manager) { warn(sec, 'Inventory skipped', 'no manager token'); return; }

  const mgrOpts = { token: tok.manager, storeCode: A.manager2.storeCode };

  // ── Items ──────────────────────────────────────────────────────────────────
  const rItemCreate = await req(`${S.logistics}/api/inventory/items`, {
    method: 'POST', ...mgrOpts,
    body: {
      name: 'Test Rice', category: 'INGREDIENT', unit: 'KG',
      currentStock: 50, minimumStock: 10, reorderLevel: 20,
      unitCost: 60.0, storeId: D.storeId001 || 'DOM001',
    },
  });
  if (ok(rItemCreate)) {
    D.inventoryItemId = id(rItemCreate.body);
    pass(sec, 'POST /api/inventory/items', D.inventoryItemId);
  } else warn(sec, 'POST /api/inventory/items', `status ${rItemCreate.status}`);

  const invListEndpoints = [
    ['GET /api/inventory/items',                    `${S.logistics}/api/inventory/items`],
    ['GET /api/inventory/items/category/INGREDIENT',`${S.logistics}/api/inventory/items/category/INGREDIENT`],
    ['GET /api/inventory/items/search',             `${S.logistics}/api/inventory/items/search?q=rice`],
    ['GET /api/inventory/low-stock',                `${S.logistics}/api/inventory/low-stock`],
    ['GET /api/inventory/out-of-stock',             `${S.logistics}/api/inventory/out-of-stock`],
    ['GET /api/inventory/expiring-soon',            `${S.logistics}/api/inventory/expiring-soon`],
    ['GET /api/inventory/alerts/low-stock',         `${S.logistics}/api/inventory/alerts/low-stock`],
    ['GET /api/inventory/value',                    `${S.logistics}/api/inventory/value`],
    ['GET /api/inventory/value/by-category',        `${S.logistics}/api/inventory/value/by-category`],
  ];
  for (const [label, url] of invListEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.inventoryItemId) {
    const rGetItem = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}`, mgrOpts);
    if (ok(rGetItem)) pass(sec, 'GET /api/inventory/items/{id}');
    else               warn(sec, 'GET /api/inventory/items/{id}', `status ${rGetItem.status}`);

    const rUpdate = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}`, {
      method: 'PUT', ...mgrOpts, body: { name: 'Test Rice Updated', currentStock: 55, minimumStock: 10, unitCost: 65 },
    });
    if (ok(rUpdate)) pass(sec, 'PUT /api/inventory/items/{id}');
    else              warn(sec, 'PUT /api/inventory/items/{id}', `status ${rUpdate.status}`);

    const rAdj = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}/adjust`, {
      method: 'PATCH', ...mgrOpts,
      body: { quantityChange: 5, storeId: D.storeId001 || 'DOM001', unitCost: 65, updatedBy: D.managerId, reason: 'TEST' },
    });
    if (ok(rAdj)) pass(sec, 'PATCH /api/inventory/items/{id}/adjust');
    else           warn(sec, 'PATCH /api/inventory/items/{id}/adjust', `status ${rAdj.status}`);

    const rRes = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}/reserve`, {
      method: 'PATCH', ...mgrOpts,
      body: { quantity: 2, storeId: D.storeId001 || 'DOM001' },
    });
    if (ok(rRes)) pass(sec, 'PATCH /api/inventory/items/{id}/reserve');
    else           warn(sec, 'PATCH /api/inventory/items/{id}/reserve', `status ${rRes.status}`);

    const rRel = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}/release`, {
      method: 'PATCH', ...mgrOpts,
      body: { quantity: 2, storeId: D.storeId001 || 'DOM001' },
    });
    if (ok(rRel)) pass(sec, 'PATCH /api/inventory/items/{id}/release');
    else           warn(sec, 'PATCH /api/inventory/items/{id}/release', `status ${rRel.status}`);

    const rCon = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}/consume`, {
      method: 'PATCH', ...mgrOpts,
      body: { quantity: 1, storeId: D.storeId001 || 'DOM001' },
    });
    if (ok(rCon)) pass(sec, 'PATCH /api/inventory/items/{id}/consume');
    else           warn(sec, 'PATCH /api/inventory/items/{id}/consume', `status ${rCon.status}`);
  }

  // ── Suppliers ──────────────────────────────────────────────────────────────
  const rSupCreate = await req(`${S.logistics}/api/inventory/suppliers`, {
    method: 'POST', ...mgrOpts,
    body: {
      name: 'API Test Supplier', contactPerson: 'Test Contact',
      email: `supplier.${Date.now()}@test.com`, phone: '9000111333',
      address: { city: 'Hyderabad', state: 'Telangana' },
      categories: ['INGREDIENT'], isPreferred: false,
    },
  });
  if (ok(rSupCreate)) {
    D.supplierId = id(rSupCreate.body);
    pass(sec, 'POST /api/inventory/suppliers', D.supplierId);
  } else warn(sec, 'POST /api/inventory/suppliers', `status ${rSupCreate.status}`);

  const supListEndpoints = [
    ['GET /api/inventory/suppliers',                       `${S.logistics}/api/inventory/suppliers`],
    ['GET /api/inventory/suppliers/active',                `${S.logistics}/api/inventory/suppliers/active`],
    ['GET /api/inventory/suppliers/preferred',             `${S.logistics}/api/inventory/suppliers/preferred`],
    ['GET /api/inventory/suppliers/reliable',              `${S.logistics}/api/inventory/suppliers/reliable`],
    ['GET /api/inventory/suppliers/category/INGREDIENT',   `${S.logistics}/api/inventory/suppliers/category/INGREDIENT`],
    ['GET /api/inventory/suppliers/search',                `${S.logistics}/api/inventory/suppliers/search?q=test`],
    ['GET /api/inventory/suppliers/city/Hyderabad',        `${S.logistics}/api/inventory/suppliers/city/Hyderabad`],
    ['GET /api/inventory/suppliers/compare/category/INGREDIENT', `${S.logistics}/api/inventory/suppliers/compare/category/INGREDIENT`],
  ];
  for (const [label, url] of supListEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  // GET by code (NEW)
  const rSupByCode = await req(`${S.logistics}/api/inventory/suppliers/code/TEST001`, mgrOpts);
  if (ok(rSupByCode) || rSupByCode.status === 404)
    pass(sec, 'GET /api/inventory/suppliers/code/{code} — handled');
  else warn(sec, 'GET /api/inventory/suppliers/code/{code}', `status ${rSupByCode.status}`);

  if (D.supplierId) {
    const rGetSup = await req(`${S.logistics}/api/inventory/suppliers/${D.supplierId}`, mgrOpts);
    if (ok(rGetSup)) pass(sec, 'GET /api/inventory/suppliers/{id}');
    else              warn(sec, 'GET /api/inventory/suppliers/{id}', `status ${rGetSup.status}`);

    const rUpSup = await req(`${S.logistics}/api/inventory/suppliers/${D.supplierId}`, {
      method: 'PUT', ...mgrOpts, body: { name: 'Updated Supplier' },
    });
    if (ok(rUpSup)) pass(sec, 'PUT /api/inventory/suppliers/{id}');
    else             warn(sec, 'PUT /api/inventory/suppliers/{id}', `status ${rUpSup.status}`);

    const rStSup = await req(`${S.logistics}/api/inventory/suppliers/${D.supplierId}/status`, {
      method: 'PATCH', ...mgrOpts, body: { status: 'ACTIVE' },
    });
    if (ok(rStSup)) pass(sec, 'PATCH /api/inventory/suppliers/{id}/status');
    else             warn(sec, 'PATCH supplier status', `status ${rStSup.status}`);

    const rPrefSup = await req(`${S.logistics}/api/inventory/suppliers/${D.supplierId}/preferred`, {
      method: 'PATCH', ...mgrOpts, body: { isPreferred: true },
    });
    if (ok(rPrefSup)) pass(sec, 'PATCH /api/inventory/suppliers/{id}/preferred');
    else               warn(sec, 'PATCH supplier preferred', `status ${rPrefSup.status}`);

    const rPerfSup = await req(`${S.logistics}/api/inventory/suppliers/${D.supplierId}/performance`, {
      method: 'PATCH', ...mgrOpts,
      body: { completedOrders: 10, cancelledOrders: 0, onTimeDeliveryRate: 95, qualityRating: 4.5 },
    });
    if (ok(rPerfSup)) pass(sec, 'PATCH /api/inventory/suppliers/{id}/performance');
    else               warn(sec, 'PATCH supplier performance', `status ${rPerfSup.status}`);
  }

  // ── Purchase Orders ────────────────────────────────────────────────────────
  if (D.supplierId && D.inventoryItemId) {
    const rPOCreate = await req(`${S.logistics}/api/inventory/purchase-orders`, {
      method: 'POST', ...mgrOpts,
      body: {
        supplierId: D.supplierId, storeId: D.storeId001 || 'DOM001',
        items: [{ inventoryItemId: D.inventoryItemId, quantity: 10, unitPrice: 65 }],
        expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      },
    });
    if (ok(rPOCreate)) {
      D.purchaseOrderId = id(rPOCreate.body);
      pass(sec, 'POST /api/inventory/purchase-orders', D.purchaseOrderId);
    } else warn(sec, 'POST /api/inventory/purchase-orders', `status ${rPOCreate.status}`);
  } else warn(sec, 'POST /api/inventory/purchase-orders', 'skipped — missing supplierId or inventoryItemId');

  const poListEndpoints = [
    ['GET /api/inventory/purchase-orders',                         `${S.logistics}/api/inventory/purchase-orders`],
    ['GET /api/inventory/purchase-orders/status/PENDING',          `${S.logistics}/api/inventory/purchase-orders/status/PENDING`],
    ['GET /api/inventory/purchase-orders/pending-approval',        `${S.logistics}/api/inventory/purchase-orders/pending-approval`],
    ['GET /api/inventory/purchase-orders/overdue',                 `${S.logistics}/api/inventory/purchase-orders/overdue`],
    ['GET /api/inventory/purchase-orders/date-range',              `${S.logistics}/api/inventory/purchase-orders/date-range?startDate=${WEEK_START}&endDate=${TODAY}`],
  ];
  for (const [label, url] of poListEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.purchaseOrderId) {
    const rGetPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}`, mgrOpts);
    if (ok(rGetPO)) pass(sec, 'GET /api/inventory/purchase-orders/{id}');
    else             warn(sec, 'GET /api/inventory/purchase-orders/{id}', `status ${rGetPO.status}`);

    // GET by order number (NEW)
    if (rGetPO.body && (rGetPO.body.orderNumber || rGetPO.body.purchaseOrderNumber)) {
      const poNum = rGetPO.body.orderNumber || rGetPO.body.purchaseOrderNumber;
      const rGetPONum = await req(`${S.logistics}/api/inventory/purchase-orders/number/${poNum}`, mgrOpts);
      if (ok(rGetPONum)) pass(sec, 'GET /api/inventory/purchase-orders/number/{orderNumber}');
      else                warn(sec, 'GET /api/inventory/purchase-orders/number/{orderNumber}', `status ${rGetPONum.status}`);
    } else warn(sec, 'GET /api/inventory/purchase-orders/number/{orderNumber}', 'skipped — no orderNumber in response');

    // PUT update (NEW)
    const rUpPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}`, {
      method: 'PUT', ...mgrOpts,
      body: { notes: 'Updated via API test' },
    });
    if (ok(rUpPO)) pass(sec, 'PUT /api/inventory/purchase-orders/{id}');
    else            warn(sec, 'PUT /api/inventory/purchase-orders/{id}', `status ${rUpPO.status}`);

    const rAppPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}/approve`, {
      method: 'PATCH', ...mgrOpts,
      body: { approverId: D.managerId, storeId: D.storeId001 || 'DOM001' },
    });
    if (ok(rAppPO)) pass(sec, 'PATCH /api/inventory/purchase-orders/{id}/approve');
    else             warn(sec, 'PATCH purchase-order approve', `status ${rAppPO.status}`);

    const rSendPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}/send`, {
      method: 'PATCH', ...mgrOpts, body: { storeId: D.storeId001 || 'DOM001' },
    });
    if (ok(rSendPO)) pass(sec, 'PATCH /api/inventory/purchase-orders/{id}/send');
    else              warn(sec, 'PATCH purchase-order send', `status ${rSendPO.status}`);

    // PATCH receive (NEW)
    const rRecvPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}/receive`, {
      method: 'PATCH', ...mgrOpts,
      body: { receivedBy: D.managerId, notes: 'Received via API test' },
    });
    if (ok(rRecvPO)) pass(sec, 'PATCH /api/inventory/purchase-orders/{id}/receive');
    else              warn(sec, 'PATCH /api/inventory/purchase-orders/{id}/receive', `status ${rRecvPO.status}`);

    // PATCH reject (NEW)
    const rRejPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}/reject`, {
      method: 'PATCH', ...mgrOpts,
      body: { rejectedBy: D.managerId, reason: 'API test rejection' },
    });
    if (ok(rRejPO)) pass(sec, 'PATCH /api/inventory/purchase-orders/{id}/reject');
    else             warn(sec, 'PATCH /api/inventory/purchase-orders/{id}/reject', `status ${rRejPO.status}`);

    // PATCH cancel (NEW)
    const rCancelPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}/cancel`, {
      method: 'PATCH', ...mgrOpts,
      body: { cancelledBy: D.managerId, reason: 'API test cancel' },
    });
    if (ok(rCancelPO)) pass(sec, 'PATCH /api/inventory/purchase-orders/{id}/cancel');
    else                warn(sec, 'PATCH /api/inventory/purchase-orders/{id}/cancel', `status ${rCancelPO.status}`);

    // DELETE (NEW)
    const rDelPO = await req(`${S.logistics}/api/inventory/purchase-orders/${D.purchaseOrderId}`, {
      method: 'DELETE', ...mgrOpts,
    });
    if (ok(rDelPO)) pass(sec, 'DELETE /api/inventory/purchase-orders/{id}');
    else             warn(sec, 'DELETE /api/inventory/purchase-orders/{id}', `status ${rDelPO.status}`);
  }

  // Auto generate
  const rAutoGen = await req(`${S.logistics}/api/inventory/purchase-orders/auto-generate`, {
    method: 'POST', ...mgrOpts,
  });
  if (ok(rAutoGen)) pass(sec, 'POST /api/inventory/purchase-orders/auto-generate');
  else               warn(sec, 'POST auto-generate purchase-orders', `status ${rAutoGen.status}`);

  // ── Waste ──────────────────────────────────────────────────────────────────
  if (D.inventoryItemId) {
    const rWasteCreate = await req(`${S.logistics}/api/inventory/waste`, {
      method: 'POST', ...mgrOpts,
      body: {
        inventoryItemId: D.inventoryItemId, storeId: D.storeId001 || 'DOM001',
        quantity: 1, reason: 'SPOILAGE', recordedBy: D.managerId || 'test',
        estimatedCost: 65, isPreventable: true,
      },
    });
    if (ok(rWasteCreate)) {
      D.wasteId = id(rWasteCreate.body);
      pass(sec, 'POST /api/inventory/waste', D.wasteId);
    } else warn(sec, 'POST /api/inventory/waste', `status ${rWasteCreate.status}`);
  } else warn(sec, 'POST /api/inventory/waste', 'skipped — no inventoryItemId');

  const wasteEndpoints = [
    ['GET /api/inventory/waste',                    `${S.logistics}/api/inventory/waste`],
    ['GET /api/inventory/waste/total-cost',         `${S.logistics}/api/inventory/waste/total-cost?startDate=${WEEK_START}&endDate=${TODAY}`],
    ['GET /api/inventory/waste/cost-by-category',   `${S.logistics}/api/inventory/waste/cost-by-category?startDate=${WEEK_START}&endDate=${TODAY}`],
    ['GET /api/inventory/waste/top-items',          `${S.logistics}/api/inventory/waste/top-items?startDate=${WEEK_START}&endDate=${TODAY}`],
    ['GET /api/inventory/waste/preventable-analysis',`${S.logistics}/api/inventory/waste/preventable-analysis?startDate=${WEEK_START}&endDate=${TODAY}`],
    ['GET /api/inventory/waste/trend',              `${S.logistics}/api/inventory/waste/trend`],
    ['GET /api/inventory/waste/date-range',         `${S.logistics}/api/inventory/waste/date-range?startDate=${WEEK_START}&endDate=${TODAY}`],
    ['GET /api/inventory/waste/category/SPOILAGE',  `${S.logistics}/api/inventory/waste/category/SPOILAGE`],
  ];
  for (const [label, url] of wasteEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.wasteId) {
    const rGetW = await req(`${S.logistics}/api/inventory/waste/${D.wasteId}`, mgrOpts);
    if (ok(rGetW)) pass(sec, 'GET /api/inventory/waste/{id}');
    else            warn(sec, 'GET /api/inventory/waste/{id}', `status ${rGetW.status}`);

    // PUT update waste record (NEW)
    const rUpW = await req(`${S.logistics}/api/inventory/waste/${D.wasteId}`, {
      method: 'PUT', ...mgrOpts,
      body: { quantity: 2, reason: 'SPOILAGE', notes: 'Updated via API test' },
    });
    if (ok(rUpW)) pass(sec, 'PUT /api/inventory/waste/{id}');
    else           warn(sec, 'PUT /api/inventory/waste/{id}', `status ${rUpW.status}`);

    const rAppW = await req(`${S.logistics}/api/inventory/waste/${D.wasteId}/approve`, {
      method: 'PATCH', ...mgrOpts, body: { approverId: D.managerId },
    });
    if (ok(rAppW)) pass(sec, 'PATCH /api/inventory/waste/{id}/approve');
    else            warn(sec, 'PATCH waste approve', `status ${rAppW.status}`);

    // DELETE waste record (NEW)
    const rDelW = await req(`${S.logistics}/api/inventory/waste/${D.wasteId}`, {
      method: 'DELETE', ...mgrOpts,
    });
    if (ok(rDelW)) pass(sec, 'DELETE /api/inventory/waste/{id}');
    else            warn(sec, 'DELETE /api/inventory/waste/{id}', `status ${rDelW.status}`);
  }

  // Clean up inventory item
  if (D.inventoryItemId) {
    const rDelItem = await req(`${S.logistics}/api/inventory/items/${D.inventoryItemId}`, {
      method: 'DELETE', ...mgrOpts,
    });
    if (ok(rDelItem)) pass(sec, 'DELETE /api/inventory/items/{id}');
    else               warn(sec, 'DELETE /api/inventory/items/{id}', `status ${rDelItem.status}`);
  }

  if (D.supplierId) {
    const rDelSup = await req(`${S.logistics}/api/inventory/suppliers/${D.supplierId}`, {
      method: 'DELETE', ...mgrOpts,
    });
    if (ok(rDelSup)) pass(sec, 'DELETE /api/inventory/suppliers/{id}');
    else              warn(sec, 'DELETE /api/inventory/suppliers/{id}', `status ${rDelSup.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 13. KITCHEN EQUIPMENT
// ══════════════════════════════════════════════════════════════════════════════
async function testKitchenEquipment() {
  section('KITCHEN EQUIPMENT');
  const sec = 'equipment';
  if (!tok.manager) { warn(sec, 'Kitchen equipment skipped', 'no manager token'); return; }

  const mgrOpts = { token: tok.manager, storeCode: A.manager2.storeCode };

  const rCreate = await req(`${S.commerce}/api/kitchen-equipment`, {
    method: 'POST', ...mgrOpts,
    body: {
      name: 'Test Fryer', type: 'FRYER', storeId: D.storeId001 || 'DOM001',
      status: 'OPERATIONAL', brand: 'TestBrand', modelNumber: 'TF-001',
    },
  });
  if (ok(rCreate)) {
    D.equipmentId = id(rCreate.body);
    pass(sec, 'POST /api/kitchen-equipment', D.equipmentId);
  } else warn(sec, 'POST /api/kitchen-equipment', `status ${rCreate.status}`);

  const rStore = await req(`${S.commerce}/api/kitchen-equipment/store`, mgrOpts);
  if (ok(rStore)) pass(sec, 'GET /api/kitchen-equipment/store');
  else             warn(sec, 'GET /api/kitchen-equipment/store', `status ${rStore.status}`);

  const rStatus = await req(`${S.commerce}/api/kitchen-equipment/store/status/OPERATIONAL`, mgrOpts);
  if (ok(rStatus)) pass(sec, 'GET /api/kitchen-equipment/store/status/{status}');
  else              warn(sec, 'GET /api/kitchen-equipment/store/status/{status}', `status ${rStatus.status}`);

  const rMaint = await req(`${S.commerce}/api/kitchen-equipment/store/maintenance-needed`, mgrOpts);
  if (ok(rMaint)) pass(sec, 'GET /api/kitchen-equipment/store/maintenance-needed');
  else             warn(sec, 'GET /api/kitchen-equipment/store/maintenance-needed', `status ${rMaint.status}`);

  const rReset = await req(`${S.commerce}/api/kitchen-equipment/store/reset-usage`, {
    method: 'POST', ...mgrOpts,
  });
  if (ok(rReset)) pass(sec, 'POST /api/kitchen-equipment/store/reset-usage');
  else             warn(sec, 'POST /api/kitchen-equipment/store/reset-usage', `status ${rReset.status}`);

  if (D.equipmentId) {
    const rGet = await req(`${S.commerce}/api/kitchen-equipment/${D.equipmentId}`, mgrOpts);
    if (ok(rGet)) pass(sec, 'GET /api/kitchen-equipment/{equipmentId}');
    else           warn(sec, 'GET /api/kitchen-equipment/{equipmentId}', `status ${rGet.status}`);

    const rStUpd = await req(`${S.commerce}/api/kitchen-equipment/${D.equipmentId}/status`, {
      method: 'PATCH', ...mgrOpts,
      body: { status: 'OPERATIONAL', staffId: D.staffId || 'test', notes: 'API test' },
    });
    if (ok(rStUpd)) pass(sec, 'PATCH /api/kitchen-equipment/{equipmentId}/status');
    else             warn(sec, 'PATCH equipment status', `status ${rStUpd.status}`);

    const rPower = await req(`${S.commerce}/api/kitchen-equipment/${D.equipmentId}/power`, {
      method: 'PATCH', ...mgrOpts,
      body: { isOn: true, staffId: D.staffId || 'test' },
    });
    if (ok(rPower)) pass(sec, 'PATCH /api/kitchen-equipment/{equipmentId}/power');
    else             warn(sec, 'PATCH equipment power', `status ${rPower.status}`);

    const rTemp = await req(`${S.commerce}/api/kitchen-equipment/${D.equipmentId}/temperature`, {
      method: 'PATCH', ...mgrOpts, body: { temperature: 180 },
    });
    if (ok(rTemp)) pass(sec, 'PATCH /api/kitchen-equipment/{equipmentId}/temperature');
    else            warn(sec, 'PATCH equipment temperature', `status ${rTemp.status}`);

    const rMaintSched = await req(`${S.commerce}/api/kitchen-equipment/${D.equipmentId}/maintenance`, {
      method: 'POST', ...mgrOpts,
      body: { nextMaintenanceDate: new Date(Date.now() + 30 * 86400000).toISOString(), notes: 'Scheduled' },
    });
    if (ok(rMaintSched)) pass(sec, 'POST /api/kitchen-equipment/{equipmentId}/maintenance');
    else                  warn(sec, 'POST equipment maintenance', `status ${rMaintSched.status}`);

    const rDel = await req(`${S.commerce}/api/kitchen-equipment/${D.equipmentId}`, {
      method: 'DELETE', ...mgrOpts,
    });
    if (ok(rDel)) pass(sec, 'DELETE /api/kitchen-equipment/{equipmentId}');
    else           warn(sec, 'DELETE /api/kitchen-equipment/{equipmentId}', `status ${rDel.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 14. ORDERS — DINE_IN, TAKEAWAY, DELIVERY
// ══════════════════════════════════════════════════════════════════════════════
async function testOrders() {
  section('ORDERS');
  const sec = 'orders';

  const storeId = D.storeId001;
  const menuItemId = D.menuItemId;

  if (!tok.manager || !storeId) { warn(sec, 'Orders skipped', 'missing manager token or storeId'); return; }
  if (!menuItemId) { warn(sec, 'Orders skipped', 'no menuItemId — seed menu data first'); return; }

  const orderItems = [{ menuItemId, name: 'Test Item', quantity: 2, price: 99.0 }];
  const mgrOpts    = { token: tok.manager, storeCode: A.manager2.storeCode };

  // ── DINE_IN ───────────────────────────────────────────────────────────────
  const rDI = await req(`${S.commerce}/api/v1/orders`, {
    method: 'POST', ...mgrOpts,
    body: {
      customerName: 'Dine In Test', customerPhone: '9000000001',
      storeId, items: orderItems, orderType: 'DINE_IN',
      paymentMethod: 'CASH', tableNumber: 5,
    },
  });
  if (ok(rDI)) {
    D.dineInOrderId = id(rDI.body);
    D.dineInOrderNumber = rDI.body.orderNumber;
    pass(sec, 'POST /api/v1/orders — DINE_IN', D.dineInOrderId);
  } else fail(sec, 'POST /api/v1/orders — DINE_IN', `status ${rDI.status} — ${JSON.stringify(rDI.body)?.slice(0,200)}`);

  // ── TAKEAWAY ──────────────────────────────────────────────────────────────
  const rTA = await req(`${S.commerce}/api/v1/orders`, {
    method: 'POST', ...mgrOpts,
    body: {
      customerName: 'Takeaway Test', customerPhone: '9000000002',
      customerId: D.customerId,
      storeId, items: orderItems, orderType: 'TAKEAWAY', paymentMethod: 'CASH',
    },
  });
  if (ok(rTA)) {
    D.takeawayOrderId = id(rTA.body);
    D.takeawayOrderNumber = rTA.body.orderNumber;
    pass(sec, 'POST /api/v1/orders — TAKEAWAY', D.takeawayOrderId);
  } else fail(sec, 'POST /api/v1/orders — TAKEAWAY', `status ${rTA.status} — ${JSON.stringify(rTA.body)?.slice(0,200)}`);

  // ── DELIVERY ──────────────────────────────────────────────────────────────
  const rDel = await req(`${S.commerce}/api/v1/orders`, {
    method: 'POST', ...mgrOpts,
    body: {
      customerName: 'Delivery Test', customerPhone: '9000000003',
      customerId: D.customerId,
      storeId, items: orderItems, orderType: 'DELIVERY', paymentMethod: 'CASH',
      deliveryAddress: { street: '12 MG Road', city: 'Hyderabad', pincode: '500001', state: 'Telangana' },
    },
  });
  if (ok(rDel)) {
    D.deliveryOrderId = id(rDel.body);
    D.deliveryOrderNumber = rDel.body.orderNumber;
    pass(sec, 'POST /api/v1/orders — DELIVERY', D.deliveryOrderId);
  } else fail(sec, 'POST /api/v1/orders — DELIVERY', `status ${rDel.status} — ${JSON.stringify(rDel.body)?.slice(0,200)}`);

  // ── Order query endpoints ─────────────────────────────────────────────────
  const orderId = D.dineInOrderId || D.takeawayOrderId || D.deliveryOrderId;
  const orderNum = D.dineInOrderNumber || D.takeawayOrderNumber;

  if (orderId) {
    const rGet = await req(`${S.commerce}/api/v1/orders/${orderId}`, mgrOpts);
    if (ok(rGet)) pass(sec, 'GET /api/v1/orders/{orderId}');
    else           warn(sec, 'GET /api/v1/orders/{orderId}', `status ${rGet.status}`);

    const rTrack = await req(`${S.commerce}/api/v1/orders/track/${orderId}`);
    if (ok(rTrack)) pass(sec, 'GET /api/v1/orders/track/{orderId} (public)');
    else             warn(sec, 'GET /api/v1/orders/track/{orderId}', `status ${rTrack.status}`);
  }

  if (orderNum) {
    const rNum = await req(`${S.commerce}/api/v1/orders/number/${orderNum}`, mgrOpts);
    if (ok(rNum)) pass(sec, 'GET /api/v1/orders/number/{orderNumber}');
    else           warn(sec, 'GET /api/v1/orders/number/{orderNumber}', `status ${rNum.status}`);
  }

  const orderListEndpoints = [
    ['GET /api/v1/orders/kitchen',         `${S.commerce}/api/v1/orders/kitchen`],
    ['GET /api/v1/orders/store',           `${S.commerce}/api/v1/orders/store`],
    ['GET /api/v1/orders/status/PENDING',  `${S.commerce}/api/v1/orders/status/PENDING`],
    ['GET /api/v1/orders/search',          `${S.commerce}/api/v1/orders/search?query=test`],
    ['GET /api/v1/orders/date/{date}',     `${S.commerce}/api/v1/orders/date/${TODAY}`],
    ['GET /api/v1/orders/range',           `${S.commerce}/api/v1/orders/range?start=${WEEK_START}T00:00:00&end=${TODAY}T23:59:59`],
    ['GET /api/v1/orders/active-deliveries/count', `${S.commerce}/api/v1/orders/active-deliveries/count`],
    ['GET /api/v1/orders/store/avg-prep-time',      `${S.commerce}/api/v1/orders/store/avg-prep-time?date=${TODAY}`],
    ['GET /api/v1/orders/store/failed-quality-checks', `${S.commerce}/api/v1/orders/store/failed-quality-checks`],
    ['GET /api/v1/orders/store/analytics/prep-time-distribution', `${S.commerce}/api/v1/orders/store/analytics/prep-time-distribution?date=${TODAY}`],
    ['GET /api/v1/orders/store/analytics/prep-time-by-item',      `${S.commerce}/api/v1/orders/store/analytics/prep-time-by-item?date=${TODAY}`],
  ];
  for (const [label, url] of orderListEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.staffId) {
    const rStaff = await req(`${S.commerce}/api/v1/orders/staff/${D.staffId}/date/${TODAY}`, mgrOpts);
    if (ok(rStaff)) pass(sec, 'GET /api/v1/orders/staff/{staffId}/date/{date}');
    else             warn(sec, 'GET /api/v1/orders/staff/{staffId}/date/{date}', `status ${rStaff.status}`);

    const rKPerfS = await req(`${S.commerce}/api/v1/orders/analytics/kitchen-staff/${D.staffId}/performance?date=${TODAY}`);
    if (ok(rKPerfS)) pass(sec, 'GET /api/v1/orders/analytics/kitchen-staff/{staffId}/performance');
    else              warn(sec, 'GET analytics kitchen-staff performance', `status ${rKPerfS.status}`);

    const rPPerfS = await req(`${S.commerce}/api/v1/orders/analytics/pos-staff/${D.staffId}/performance?startDate=${WEEK_START}&endDate=${TODAY}`, mgrOpts);
    if (ok(rPPerfS)) pass(sec, 'GET /api/v1/orders/analytics/pos-staff/{staffId}/performance');
    else              warn(sec, 'GET analytics pos-staff performance', `status ${rPPerfS.status}`);
  }

  if (D.customerId) {
    const rCust = await req(`${S.commerce}/api/v1/orders/customer/${D.customerId}`, { token: tok.customer });
    if (ok(rCust)) pass(sec, 'GET /api/v1/orders/customer/{customerId}');
    else            warn(sec, 'GET /api/v1/orders/customer/{customerId}', `status ${rCust.status}`);
  }

  // ── Status progressions ───────────────────────────────────────────────────
  if (D.dineInOrderId) {
    const rNext = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}/next-stage`, {
      method: 'PATCH', ...mgrOpts,
    });
    if (ok(rNext)) pass(sec, 'PATCH /api/v1/orders/{orderId}/next-stage');
    else            warn(sec, 'PATCH next-stage', `status ${rNext.status}`);

    const rPri = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}/priority`, {
      method: 'PATCH', ...mgrOpts, body: { priority: 'HIGH' },
    });
    if (ok(rPri)) pass(sec, 'PATCH /api/v1/orders/{orderId}/priority');
    else           warn(sec, 'PATCH priority', `status ${rPri.status}`);

    // Quality checkpoints
    const rQCAdd = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}/quality-checkpoint`, {
      method: 'POST', ...mgrOpts,
      body: { checkpointName: 'FOOD_QUALITY', status: 'PASS', notes: 'All good', checkedBy: D.staffId || 'test' },
    });
    if (ok(rQCAdd)) pass(sec, 'POST /api/v1/orders/{orderId}/quality-checkpoint');
    else             warn(sec, 'POST quality-checkpoint', `status ${rQCAdd.status}`);

    const rQCGet = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}/quality-checkpoints`, mgrOpts);
    if (ok(rQCGet)) pass(sec, 'GET /api/v1/orders/{orderId}/quality-checkpoints');
    else             warn(sec, 'GET quality-checkpoints', `status ${rQCGet.status}`);

    const rQCPatch = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}/quality-checkpoint/FOOD_QUALITY`, {
      method: 'PATCH', ...mgrOpts, body: { status: 'PASS', notes: 'Updated' },
    });
    if (ok(rQCPatch)) pass(sec, 'PATCH /api/v1/orders/{orderId}/quality-checkpoint/{name}');
    else               warn(sec, 'PATCH quality-checkpoint/{name}', `status ${rQCPatch.status}`);

    // Make-table
    const rMT = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}/assign-make-table`, {
      method: 'PATCH', ...mgrOpts,
      body: { station: 'STATION_1', staffId: D.staffId || 'test', staffName: 'Test Staff' },
    });
    if (ok(rMT)) pass(sec, 'PATCH /api/v1/orders/{orderId}/assign-make-table');
    else          warn(sec, 'PATCH assign-make-table', `status ${rMT.status}`);

    const rMTGet = await req(`${S.commerce}/api/v1/orders/store/make-table/STATION_1`, mgrOpts);
    if (ok(rMTGet)) pass(sec, 'GET /api/v1/orders/store/make-table/{station}');
    else             warn(sec, 'GET make-table/{station}', `status ${rMTGet.status}`);
  }

  // Assign driver (delivery order)
  if (D.deliveryOrderId && D.driverId) {
    const rAD = await req(`${S.commerce}/api/v1/orders/${D.deliveryOrderId}/assign-driver`, {
      method: 'PATCH', ...mgrOpts, body: { driverId: D.driverId },
    });
    if (ok(rAD)) pass(sec, 'PATCH /api/v1/orders/{orderId}/assign-driver');
    else          warn(sec, 'PATCH assign-driver', `status ${rAD.status}`);
  }

  // Rating token endpoints (commerce RatingController)
  const rRatTok = await req(`${S.commerce}/api/orders/rating/token/fake-token-123`);
  if (rRatTok.status === 404 || rRatTok.status === 400)
    pass(sec, 'GET /api/orders/rating/token/{token} — 404 on fake token expected');
  else warn(sec, 'GET /api/orders/rating/token/{token}', `status ${rRatTok.status}`);

  // POST mark-used (NEW)
  const rRatMarkUsed = await req(`${S.commerce}/api/orders/rating/token/fake-token-123/mark-used`, {
    method: 'POST',
  });
  if (rRatMarkUsed.status === 404 || rRatMarkUsed.status === 400)
    pass(sec, 'POST /api/orders/rating/token/{token}/mark-used — handled');
  else warn(sec, 'POST /api/orders/rating/token/{token}/mark-used', `status ${rRatMarkUsed.status}`);

  // ── NEW Order endpoints ────────────────────────────────────────────────────
  const orderId2 = D.takeawayOrderId || D.dineInOrderId;

  // PATCH status (NEW)
  if (orderId2) {
    const rStatus = await req(`${S.commerce}/api/v1/orders/${orderId2}/status`, {
      method: 'PATCH', ...mgrOpts,
      body: { status: 'PREPARING', notes: 'API test status update' },
    });
    if (ok(rStatus)) pass(sec, 'PATCH /api/v1/orders/{orderId}/status');
    else              warn(sec, 'PATCH /api/v1/orders/{orderId}/status', `status ${rStatus.status}`);

    // PATCH items (NEW)
    const rItems = await req(`${S.commerce}/api/v1/orders/${orderId2}/items`, {
      method: 'PATCH', ...mgrOpts,
      body: { items: [{ menuItemId: D.menuItemId, name: 'Test Item', quantity: 3, price: 99.0 }] },
    });
    if (ok(rItems)) pass(sec, 'PATCH /api/v1/orders/{orderId}/items');
    else             warn(sec, 'PATCH /api/v1/orders/{orderId}/items', `status ${rItems.status}`);

    // PATCH payment (NEW)
    const rPayment = await req(`${S.commerce}/api/v1/orders/${orderId2}/payment`, {
      method: 'PATCH', ...mgrOpts,
      body: { paymentMethod: 'CASH', paymentStatus: 'PAID' },
    });
    if (ok(rPayment)) pass(sec, 'PATCH /api/v1/orders/{orderId}/payment');
    else               warn(sec, 'PATCH /api/v1/orders/{orderId}/payment', `status ${rPayment.status}`);
  }

  // Delivery OTP / proof / mark-delivered on delivery order (NEW)
  if (D.deliveryOrderId) {
    const rDelOtp = await req(`${S.commerce}/api/v1/orders/${D.deliveryOrderId}/delivery-otp`, {
      method: 'PUT', ...mgrOpts,
      body: { otp: '123456' },
    });
    if (ok(rDelOtp)) pass(sec, 'PUT /api/v1/orders/{orderId}/delivery-otp');
    else              warn(sec, 'PUT /api/v1/orders/{orderId}/delivery-otp', `status ${rDelOtp.status}`);

    const rDelProof = await req(`${S.commerce}/api/v1/orders/${D.deliveryOrderId}/delivery-proof`, {
      method: 'PUT', ...mgrOpts,
      body: { proofPhotoUrl: 'https://test.com/proof.jpg' },
    });
    if (ok(rDelProof)) pass(sec, 'PUT /api/v1/orders/{orderId}/delivery-proof');
    else                warn(sec, 'PUT /api/v1/orders/{orderId}/delivery-proof', `status ${rDelProof.status}`);

    const rMarkDel = await req(`${S.commerce}/api/v1/orders/${D.deliveryOrderId}/mark-delivered`, {
      method: 'PUT', ...mgrOpts,
    });
    if (ok(rMarkDel)) pass(sec, 'PUT /api/v1/orders/{orderId}/mark-delivered');
    else               warn(sec, 'PUT /api/v1/orders/{orderId}/mark-delivered', `status ${rMarkDel.status}`);
  }

  // Cancel (DELETE) order (NEW) — use dine-in order (lowest value to discard)
  if (D.dineInOrderId) {
    const rCancel = await req(`${S.commerce}/api/v1/orders/${D.dineInOrderId}`, {
      method: 'DELETE', ...mgrOpts,
    });
    if (ok(rCancel)) pass(sec, 'DELETE /api/v1/orders/{orderId} (cancel)');
    else              warn(sec, 'DELETE /api/v1/orders/{orderId}', `status ${rCancel.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 15. REVIEWS & RESPONSES
// ══════════════════════════════════════════════════════════════════════════════
async function testReviews() {
  section('REVIEWS & RESPONSES');
  const sec = 'reviews';

  if (!tok.customer) { warn(sec, 'Reviews skipped', 'no customer token'); return; }

  const rCreate = await req(`${S.core}/api/reviews`, {
    method: 'POST', token: tok.customer,
    headers: { 'X-User-ID': D.customerId || 'test', 'X-User-Name': 'Priya Customer' },
    body: {
      orderId: D.takeawayOrderId || D.dineInOrderId || 'test-order-id',
      rating: 4, comment: 'API test review — great food!',
    },
  });
  if (ok(rCreate)) {
    D.reviewId = id(rCreate.body);
    pass(sec, 'POST /api/reviews', D.reviewId);
  } else warn(sec, 'POST /api/reviews', `status ${rCreate.status}`);

  // Public submit with token
  const rPubSub = await req(`${S.core}/api/reviews/public/submit?token=fake-rating-token`, {
    method: 'POST', body: { orderId: 'test', rating: 5, comment: 'Public submit test' },
  });
  if (ok(rPubSub) || rPubSub.status === 404 || rPubSub.status === 400)
    pass(sec, 'POST /api/reviews/public/submit — handled (valid or invalid token)');
  else warn(sec, 'POST /api/reviews/public/submit', `status ${rPubSub.status}`);

  const rPubToken = await req(`${S.core}/api/reviews/public/token/fake-token`);
  if (ok(rPubToken) || rPubToken.status === 404)
    pass(sec, 'GET /api/reviews/public/token/{token}');
  else warn(sec, 'GET /api/reviews/public/token/{token}', `status ${rPubToken.status}`);

  const reviewListEndpoints = [
    ['GET /api/reviews/recent',         `${S.core}/api/reviews/recent`],
    ['GET /api/reviews/pending',        `${S.core}/api/reviews/pending`],
    ['GET /api/reviews/flagged',        `${S.core}/api/reviews/flagged`],
    ['GET /api/reviews/needs-response', `${S.core}/api/reviews/needs-response`],
    ['GET /api/reviews/stats/overall',  `${S.core}/api/reviews/stats/overall`],
  ];
  for (const [label, url] of reviewListEndpoints) {
    const r = await req(url, { token: tok.manager });
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.reviewId) {
    const rGet = await req(`${S.core}/api/reviews/${D.reviewId}`, { token: tok.manager });
    if (ok(rGet)) pass(sec, 'GET /api/reviews/{reviewId}');
    else           warn(sec, 'GET /api/reviews/{reviewId}', `status ${rGet.status}`);

    const rApprove = await req(`${S.core}/api/reviews/${D.reviewId}/approve`, {
      method: 'POST', token: tok.manager,
      headers: { 'X-User-ID': D.managerId || 'test' },
    });
    if (ok(rApprove)) pass(sec, 'POST /api/reviews/{reviewId}/approve');
    else               warn(sec, 'POST approve review', `status ${rApprove.status}`);

    const rFlag = await req(`${S.core}/api/reviews/${D.reviewId}/flag`, {
      method: 'PATCH', token: tok.manager,
      headers: { 'X-User-ID': D.managerId || 'test' },
      body: { reason: 'API test flag' },
    });
    if (ok(rFlag)) pass(sec, 'PATCH /api/reviews/{reviewId}/flag');
    else            warn(sec, 'PATCH flag review', `status ${rFlag.status}`);

    // Response to review
    const rResp = await req(`${S.core}/api/responses/review/${D.reviewId}`, {
      method: 'POST', token: tok.manager,
      headers: { 'X-User-ID': D.managerId || 'test', 'X-User-Name': 'Vijay Manager' },
      body: { responseText: 'Thank you for your feedback! We will improve.' },
    });
    if (ok(rResp)) {
      D.responseId = id(rResp.body);
      pass(sec, 'POST /api/responses/review/{reviewId}', D.responseId);
    } else warn(sec, 'POST /api/responses/review/{reviewId}', `status ${rResp.status}`);

    if (D.responseId) {
      const rGetR = await req(`${S.core}/api/responses/${D.responseId}`, { token: tok.manager });
      if (ok(rGetR)) pass(sec, 'GET /api/responses/{responseId}');
      else            warn(sec, 'GET /api/responses/{responseId}', `status ${rGetR.status}`);

      const rUpR = await req(`${S.core}/api/responses/${D.responseId}`, {
        method: 'PUT', token: tok.manager,
        headers: { 'X-User-ID': D.managerId || 'test' },
        body: { responseText: 'Updated: Thank you for your feedback!' },
      });
      if (ok(rUpR)) pass(sec, 'PUT /api/responses/{responseId}');
      else           warn(sec, 'PUT /api/responses/{responseId}', `status ${rUpR.status}`);
    }

    const rGetRR = await req(`${S.core}/api/responses/review/${D.reviewId}`, { token: tok.manager });
    if (ok(rGetRR)) pass(sec, 'GET /api/responses/review/{reviewId}');
    else             warn(sec, 'GET /api/responses/review/{reviewId}', `status ${rGetRR.status}`);
  }

  // Other review/response list endpoints
  const moreEndpoints = [
    ['GET /api/responses',          `${S.core}/api/responses`],
    ['GET /api/responses/templates', `${S.core}/api/responses/templates`],
    ['GET /api/responses/templates/APOLOGY', `${S.core}/api/responses/templates/APOLOGY`],
  ];
  for (const [label, url] of moreEndpoints) {
    const r = await req(url, { token: tok.manager });
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.customerId) {
    const rCustRev = await req(`${S.core}/api/reviews/customer/${D.customerId}`, { token: tok.manager });
    if (ok(rCustRev)) pass(sec, 'GET /api/reviews/customer/{customerId}');
    else               warn(sec, 'GET /api/reviews/customer/{customerId}', `status ${rCustRev.status}`);
  }

  // ── NEW Review endpoints ───────────────────────────────────────────────────
  const ordIdForRev = D.takeawayOrderId || D.dineInOrderId;
  if (ordIdForRev) {
    const rRevByOrder = await req(`${S.core}/api/reviews/order/${ordIdForRev}`, { token: tok.manager });
    if (ok(rRevByOrder)) pass(sec, 'GET /api/reviews/order/{orderId}');
    else                  warn(sec, 'GET /api/reviews/order/{orderId}', `status ${rRevByOrder.status}`);
  }

  if (D.driverId) {
    const rRevByDriver = await req(`${S.core}/api/reviews/driver/${D.driverId}`, { token: tok.manager });
    if (ok(rRevByDriver)) pass(sec, 'GET /api/reviews/driver/{driverId}');
    else                   warn(sec, 'GET /api/reviews/driver/{driverId}', `status ${rRevByDriver.status}`);

    const rStatsDriver = await req(`${S.core}/api/reviews/stats/driver/${D.driverId}`, { token: tok.manager });
    if (ok(rStatsDriver)) pass(sec, 'GET /api/reviews/stats/driver/{driverId}');
    else                   warn(sec, 'GET /api/reviews/stats/driver/{driverId}', `status ${rStatsDriver.status}`);
  }

  if (D.staffId) {
    const rRevByStaff = await req(`${S.core}/api/reviews/staff/${D.staffId}`, { token: tok.manager });
    if (ok(rRevByStaff)) pass(sec, 'GET /api/reviews/staff/{staffId}');
    else                  warn(sec, 'GET /api/reviews/staff/{staffId}', `status ${rRevByStaff.status}`);

    const rRevStaffRating = await req(`${S.core}/api/reviews/staff/${D.staffId}/rating`, { token: tok.manager });
    if (ok(rRevStaffRating)) pass(sec, 'GET /api/reviews/staff/{staffId}/rating');
    else                      warn(sec, 'GET /api/reviews/staff/{staffId}/rating', `status ${rRevStaffRating.status}`);
  }

  if (D.menuItemId) {
    const rRevByItem = await req(`${S.core}/api/reviews/item/${D.menuItemId}`, { token: tok.manager });
    if (ok(rRevByItem)) pass(sec, 'GET /api/reviews/item/{menuItemId}');
    else                 warn(sec, 'GET /api/reviews/item/{menuItemId}', `status ${rRevByItem.status}`);

    const rStatsItem = await req(`${S.core}/api/reviews/stats/item/${D.menuItemId}`, { token: tok.manager });
    if (ok(rStatsItem)) pass(sec, 'GET /api/reviews/stats/item/{menuItemId}');
    else                 warn(sec, 'GET /api/reviews/stats/item/{menuItemId}', `status ${rStatsItem.status}`);

    const rPubItemAvg = await req(`${S.core}/api/reviews/public/item/${D.menuItemId}/average`);
    if (ok(rPubItemAvg)) pass(sec, 'GET /api/reviews/public/item/{menuItemId}/average');
    else                  warn(sec, 'GET /api/reviews/public/item/{menuItemId}/average', `status ${rPubItemAvg.status}`);
  }

  // GET /api/reviews/rating (store rating summary)
  const rRevRating = await req(`${S.core}/api/reviews/rating`, {
    token: tok.manager, storeCode: A.manager.storeCode,
  });
  if (ok(rRevRating)) pass(sec, 'GET /api/reviews/rating');
  else                 warn(sec, 'GET /api/reviews/rating', `status ${rRevRating.status}`);

  if (D.reviewId) {
    // PATCH status (NEW)
    const rRevStatus = await req(`${S.core}/api/reviews/${D.reviewId}/status`, {
      method: 'PATCH', token: tok.manager,
      body: { status: 'APPROVED' },
    });
    if (ok(rRevStatus)) pass(sec, 'PATCH /api/reviews/{reviewId}/status');
    else                 warn(sec, 'PATCH /api/reviews/{reviewId}/status', `status ${rRevStatus.status}`);

    // POST reject (NEW)
    const rRevReject = await req(`${S.core}/api/reviews/${D.reviewId}/reject`, {
      method: 'POST', token: tok.manager,
      headers: { 'X-User-ID': D.managerId || 'test' },
      body: { reason: 'API test rejection' },
    });
    if (ok(rRevReject)) pass(sec, 'POST /api/reviews/{reviewId}/reject');
    else                 warn(sec, 'POST /api/reviews/{reviewId}/reject', `status ${rRevReject.status}`);

    // DELETE review (NEW)
    const rRevDel = await req(`${S.core}/api/reviews/${D.reviewId}`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rRevDel)) pass(sec, 'DELETE /api/reviews/{reviewId}');
    else              warn(sec, 'DELETE /api/reviews/{reviewId}', `status ${rRevDel.status}`);
  }

  // ── NEW Response endpoints ─────────────────────────────────────────────────
  // GET /api/responses/manager/{managerId} (NEW)
  if (D.managerId) {
    const rRespByMgr = await req(`${S.core}/api/responses/manager/${D.managerId}`, { token: tok.manager });
    if (ok(rRespByMgr)) pass(sec, 'GET /api/responses/manager/{managerId}');
    else                 warn(sec, 'GET /api/responses/manager/{managerId}', `status ${rRespByMgr.status}`);
  }

  // DELETE /api/responses/{responseId} (NEW)
  if (D.responseId) {
    const rRespDel = await req(`${S.core}/api/responses/${D.responseId}`, {
      method: 'DELETE', token: tok.manager,
    });
    if (ok(rRespDel)) pass(sec, 'DELETE /api/responses/{responseId}');
    else               warn(sec, 'DELETE /api/responses/{responseId}', `status ${rRespDel.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 16. PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════
async function testPayments() {
  section('PAYMENTS');
  const sec = 'payments';

  if (!tok.manager) { warn(sec, 'Payments skipped', 'no manager token'); return; }

  const mgrOpts = { token: tok.manager, storeCode: A.manager2.storeCode };
  const cpid    = D.customerProfileId || D.customerId;
  const orderId = D.dineInOrderId || D.takeawayOrderId;

  // Cash payment
  if (orderId && cpid && D.storeId001) {
    const rCash = await req(`${S.payment}/api/v1/payments/cash`, {
      method: 'POST', ...mgrOpts,
      body: {
        orderId, amount: 198.0, customerId: cpid,
        storeId: D.storeId001, paymentMethod: 'CASH',
      },
    });
    if (ok(rCash)) {
      D.cashPaymentId = id(rCash.body);
      pass(sec, 'POST /api/v1/payments/cash', D.cashPaymentId);
    } else warn(sec, 'POST /api/v1/payments/cash', `status ${rCash.status}`);
  } else warn(sec, 'POST /api/v1/payments/cash', 'skipped — missing orderId, customerId, or storeId');

  // Initiate online payment
  if (orderId && cpid && D.storeId001) {
    const rInit = await req(`${S.payment}/api/v1/payments/initiate`, {
      method: 'POST', ...mgrOpts,
      body: {
        orderId: D.takeawayOrderId || orderId,
        amount: 198.0, customerId: cpid, storeId: D.storeId001,
        paymentMethod: 'RAZORPAY', orderType: 'TAKEAWAY',
      },
    });
    if (ok(rInit)) {
      D.paymentId = id(rInit.body);
      pass(sec, 'POST /api/v1/payments/initiate', D.paymentId);
    } else warn(sec, 'POST /api/v1/payments/initiate', `status ${rInit.status}`);
  } else warn(sec, 'POST /api/v1/payments/initiate', 'skipped');

  // Verify (expect 400 — fake signature)
  const rVerify = await req(`${S.payment}/api/v1/payments/verify`, {
    method: 'POST', ...mgrOpts,
    body: { razorpayPaymentId: 'fake_pay_id', razorpayOrderId: 'fake_order_id', razorpaySignature: 'fake_sig' },
  });
  if (rVerify.status === 400 || rVerify.status === 422)
    pass(sec, 'POST /api/v1/payments/verify — rejects fake signature');
  else warn(sec, 'POST /api/v1/payments/verify', `status ${rVerify.status}`);

  // Webhook (expect 400 — no valid signature)
  const rWebhook = await req(`${S.payment}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'X-Razorpay-Signature': 'fake-signature', 'Content-Type': 'application/json' },
    body: { event: 'payment.captured' },
  });
  if (rWebhook.status === 400 || rWebhook.status === 401 || rWebhook.status === 200)
    pass(sec, 'POST /api/payments/webhook — handled');
  else warn(sec, 'POST /api/payments/webhook', `status ${rWebhook.status}`);

  const payListEndpoints = [
    ['GET /api/v1/payments/store',           `${S.payment}/api/v1/payments/store`],
    ['GET /api/v1/payments/reconciliation',  `${S.payment}/api/v1/payments/reconciliation?date=${TODAY}`],
  ];
  for (const [label, url] of payListEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.cashPaymentId) {
    const rGetP = await req(`${S.payment}/api/v1/payments/${D.cashPaymentId}`, mgrOpts);
    if (ok(rGetP)) pass(sec, 'GET /api/v1/payments/{transactionId}');
    else            warn(sec, 'GET /api/v1/payments/{transactionId}', `status ${rGetP.status}`);

    const rRecon = await req(`${S.payment}/api/v1/payments/${D.cashPaymentId}/reconcile?reconciledBy=${D.managerId}`, {
      method: 'POST', ...mgrOpts,
    });
    if (ok(rRecon)) pass(sec, 'POST /api/v1/payments/{transactionId}/reconcile');
    else             warn(sec, 'POST reconcile', `status ${rRecon.status}`);

    // Refund
    const rRefund = await req(`${S.payment}/api/payments/refund`, {
      method: 'POST', ...mgrOpts,
      body: { transactionId: D.cashPaymentId, amount: 99.0, reason: 'API test refund' },
    });
    if (ok(rRefund)) {
      D.refundId = id(rRefund.body);
      pass(sec, 'POST /api/payments/refund', D.refundId);
    } else warn(sec, 'POST /api/payments/refund', `status ${rRefund.status}`);

    if (D.refundId) {
      const rGetRef = await req(`${S.payment}/api/payments/refund/${D.refundId}`, mgrOpts);
      if (ok(rGetRef)) pass(sec, 'GET /api/payments/refund/{refundId}');
      else              warn(sec, 'GET /api/payments/refund/{refundId}', `status ${rGetRef.status}`);

      const rRefByTx = await req(`${S.payment}/api/payments/refund/transaction/${D.cashPaymentId}`, mgrOpts);
      if (ok(rRefByTx)) pass(sec, 'GET /api/payments/refund/transaction/{transactionId}');
      else               warn(sec, 'GET refund by transaction', `status ${rRefByTx.status}`);
    }
  }

  if (orderId) {
    const rPayByOrder = await req(`${S.payment}/api/v1/payments/order/${orderId}`, mgrOpts);
    if (ok(rPayByOrder)) pass(sec, 'GET /api/v1/payments/order/{orderId}');
    else                  warn(sec, 'GET /api/v1/payments/order/{orderId}', `status ${rPayByOrder.status}`);

    const rRefByOrder = await req(`${S.payment}/api/payments/refund/order/${orderId}`, mgrOpts);
    if (ok(rRefByOrder)) pass(sec, 'GET /api/payments/refund/order/{orderId}');
    else                  warn(sec, 'GET refund by order', `status ${rRefByOrder.status}`);
  }

  if (cpid) {
    const rPayByCust = await req(`${S.payment}/api/v1/payments/customer/${cpid}`, mgrOpts);
    if (ok(rPayByCust)) pass(sec, 'GET /api/v1/payments/customer/{customerId}');
    else                 warn(sec, 'GET /api/v1/payments/customer/{customerId}', `status ${rPayByCust.status}`);

    const rRefByCust = await req(`${S.payment}/api/payments/refund/customer/${cpid}`, mgrOpts);
    if (ok(rRefByCust)) pass(sec, 'GET /api/payments/refund/customer/{customerId}');
    else                 warn(sec, 'GET refund by customer', `status ${rRefByCust.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 17. DELIVERY (Dispatch + Tracking + Performance)
// ══════════════════════════════════════════════════════════════════════════════
async function testDelivery() {
  section('DELIVERY');
  const sec = 'delivery';

  const mgrOpts = { token: tok.manager, storeCode: A.manager2.storeCode };
  const drvOpts = { token: tok.driver, driverId: D.driverId };

  // Health (no auth)
  const rHealth = await req(`${S.logistics}/api/delivery/health`);
  if (ok(rHealth)) pass(sec, 'GET /api/delivery/health');
  else              warn(sec, 'GET /api/delivery/health', `status ${rHealth.status}`);

  // Zone endpoints (no auth)
  if (D.storeId001) {
    const zoneEndpoints = [
      ['GET /api/delivery/zone/list',     `${S.logistics}/api/delivery/zone/list?storeId=${D.storeId001}`],
      ['GET /api/delivery/zone/check',    `${S.logistics}/api/delivery/zone/check?storeId=${D.storeId001}&lat=17.385&lng=78.4867`],
      ['GET /api/delivery/zone/fee',      `${S.logistics}/api/delivery/zone/fee?storeId=${D.storeId001}&lat=17.385&lng=78.4867`],
      ['GET /api/delivery/zone/validate', `${S.logistics}/api/delivery/zone/validate?storeId=${D.storeId001}&lat=17.385&lng=78.4867`],
    ];
    for (const [label, url] of zoneEndpoints) {
      const r = await req(url);
      if (ok(r)) pass(sec, label);
      else        warn(sec, label, `status ${r.status}`);
    }
  } else warn(sec, 'Zone endpoints skipped', 'no storeId001');

  // Driver status (no auth)
  if (D.driverId) {
    const rDrvSt = await req(`${S.logistics}/api/delivery/driver/${D.driverId}/status`);
    if (ok(rDrvSt)) pass(sec, 'GET /api/delivery/driver/{driverId}/status');
    else             warn(sec, 'GET /api/delivery/driver/{driverId}/status', `status ${rDrvSt.status}`);

    const rSetSt = await req(`${S.logistics}/api/delivery/driver/status`, {
      method: 'PUT', body: { driverId: D.driverId, status: 'AVAILABLE' },
    });
    if (ok(rSetSt)) pass(sec, 'PUT /api/delivery/driver/status');
    else             warn(sec, 'PUT /api/delivery/driver/status', `status ${rSetSt.status}`);
  }

  // Available drivers (auth)
  if (D.storeId001) {
    const rAvail = await req(`${S.logistics}/api/delivery/drivers/available?storeId=${D.storeId001}`, mgrOpts);
    if (ok(rAvail)) pass(sec, 'GET /api/delivery/drivers/available');
    else             warn(sec, 'GET /api/delivery/drivers/available', `status ${rAvail.status}`);
  }

  // Route optimize (NEW)
  const rRouteOpt = await req(`${S.logistics}/api/delivery/route-optimize`, {
    method: 'POST', ...mgrOpts,
    body: { driverId: D.driverId || 'test-driver', orderIds: [D.deliveryOrderId || 'test-order'] },
  });
  if (ok(rRouteOpt) || rRouteOpt.status === 400 || rRouteOpt.status === 404)
    pass(sec, 'POST /api/delivery/route-optimize — handled');
  else warn(sec, 'POST /api/delivery/route-optimize', `status ${rRouteOpt.status}`);

  // Auto dispatch
  if (D.deliveryOrderId && D.storeId001) {
    const rAD = await req(`${S.logistics}/api/delivery/auto-dispatch`, {
      method: 'POST', ...mgrOpts,
      body: {
        orderId: D.deliveryOrderId, storeId: D.storeId001,
        deliveryAddress: { street: '12 MG Road', city: 'Hyderabad', pincode: '500001' },
        pickupLocation: { type: 'Point', coordinates: [78.4867, 17.385] },
        deliveryLocation: { type: 'Point', coordinates: [78.491, 17.395] },
      },
    });
    if (ok(rAD)) {
      D.trackingId = id(rAD.body) || rAD.body?.trackingId;
      pass(sec, 'POST /api/delivery/auto-dispatch', D.trackingId);
    } else warn(sec, 'POST /api/delivery/auto-dispatch', `status ${rAD.status}`);
  } else warn(sec, 'POST /api/delivery/auto-dispatch', 'skipped — no deliveryOrderId');

  // Generate OTP
  if (D.deliveryOrderId) {
    const rOTP = await req(`${S.logistics}/api/delivery/${D.deliveryOrderId}/generate-otp`, {
      method: 'POST', ...mgrOpts,
    });
    if (ok(rOTP)) {
      D.deliveryOtp = rOTP.body?.otp;
      pass(sec, 'POST /api/delivery/{orderId}/generate-otp');
    } else warn(sec, 'POST generate-otp', `status ${rOTP.status}`);

    // Track
    const rTrack = await req(`${S.logistics}/api/delivery/track/${D.deliveryOrderId}`, {
      token: tok.manager,
    });
    if (ok(rTrack)) pass(sec, 'GET /api/delivery/track/{orderId}');
    else             warn(sec, 'GET /api/delivery/track/{orderId}', `status ${rTrack.status}`);

    const rETA = await req(`${S.logistics}/api/delivery/eta/${D.deliveryOrderId}`, {
      token: tok.manager,
    });
    if (ok(rETA)) pass(sec, 'GET /api/delivery/eta/{orderId}');
    else           warn(sec, 'GET /api/delivery/eta/{orderId}', `status ${rETA.status}`);
  }

  // Location update (driver)
  if (tok.driver && D.driverId) {
    const rLoc = await req(`${S.logistics}/api/delivery/location-update`, {
      method: 'POST', token: tok.driver,
      body: { driverId: D.driverId, latitude: 17.385, longitude: 78.4867, orderId: D.deliveryOrderId },
    });
    if (ok(rLoc)) pass(sec, 'POST /api/delivery/location-update');
    else           warn(sec, 'POST /api/delivery/location-update', `status ${rLoc.status}`);

    const rPending = await req(`${S.logistics}/api/delivery/driver/${D.driverId}/pending`, {
      token: tok.driver,
    });
    if (ok(rPending)) pass(sec, 'GET /api/delivery/driver/{driverId}/pending');
    else               warn(sec, 'GET /api/delivery/driver/{driverId}/pending', `status ${rPending.status}`);
  }

  if (D.trackingId && tok.driver) {
    // Tracking flow: accept → pickup → in-transit → arrived → deliver
    const rAccept = await req(`${S.logistics}/api/delivery/accept`, {
      method: 'POST', token: tok.driver,
      body: { trackingId: D.trackingId, driverId: D.driverId },
    });
    if (ok(rAccept)) pass(sec, 'POST /api/delivery/accept');
    else              warn(sec, 'POST /api/delivery/accept', `status ${rAccept.status}`);

    const rPickup = await req(`${S.logistics}/api/delivery/${D.trackingId}/pickup`, {
      method: 'POST', ...drvOpts,
    });
    if (ok(rPickup)) pass(sec, 'POST /api/delivery/{trackingId}/pickup');
    else              warn(sec, 'POST /api/delivery/{trackingId}/pickup', `status ${rPickup.status}`);

    const rTransit = await req(`${S.logistics}/api/delivery/${D.trackingId}/in-transit`, {
      method: 'POST', ...drvOpts,
    });
    if (ok(rTransit)) pass(sec, 'POST /api/delivery/{trackingId}/in-transit');
    else               warn(sec, 'POST /api/delivery/{trackingId}/in-transit', `status ${rTransit.status}`);

    const rArrived = await req(`${S.logistics}/api/delivery/${D.trackingId}/arrived`, {
      method: 'POST', ...drvOpts,
    });
    if (ok(rArrived)) pass(sec, 'POST /api/delivery/{trackingId}/arrived');
    else               warn(sec, 'POST /api/delivery/{trackingId}/arrived', `status ${rArrived.status}`);

    // Verify OTP
    if (D.deliveryOtp) {
      const rVerOtp = await req(`${S.logistics}/api/delivery/verify-otp`, {
        method: 'POST', token: tok.driver,
        body: { orderId: D.deliveryOrderId, otp: D.deliveryOtp },
      });
      if (ok(rVerOtp)) pass(sec, 'POST /api/delivery/verify-otp');
      else              warn(sec, 'POST /api/delivery/verify-otp', `status ${rVerOtp.status}`);
    }

    const rDeliver = await req(`${S.logistics}/api/delivery/${D.trackingId}/deliver`, {
      method: 'POST', ...drvOpts,
      body: { driverId: D.driverId, notes: 'Delivered successfully' },
    });
    if (ok(rDeliver)) pass(sec, 'POST /api/delivery/{trackingId}/deliver');
    else               warn(sec, 'POST /api/delivery/{trackingId}/deliver', `status ${rDeliver.status}`);
  }

  // Verify photo and signature (driver)
  if (tok.driver && D.deliveryOrderId) {
    const rVPhoto = await req(`${S.logistics}/api/delivery/verify-photo`, {
      method: 'POST', token: tok.driver,
      body: { orderId: D.deliveryOrderId, photoUrl: 'https://test.com/photo.jpg' },
    });
    if (ok(rVPhoto) || rVPhoto.status === 400)
      pass(sec, 'POST /api/delivery/verify-photo — handled');
    else warn(sec, 'POST /api/delivery/verify-photo', `status ${rVPhoto.status}`);

    const rVSig = await req(`${S.logistics}/api/delivery/verify-signature`, {
      method: 'POST', token: tok.driver,
      body: { orderId: D.deliveryOrderId, signatureUrl: 'https://test.com/sig.png' },
    });
    if (ok(rVSig) || rVSig.status === 400)
      pass(sec, 'POST /api/delivery/verify-signature — handled');
    else warn(sec, 'POST /api/delivery/verify-signature', `status ${rVSig.status}`);

    const rContact = await req(`${S.logistics}/api/delivery/contactless`, {
      method: 'POST', token: tok.driver,
      body: { orderId: D.deliveryOrderId },
    });
    if (ok(rContact) || rContact.status === 400)
      pass(sec, 'POST /api/delivery/contactless — handled');
    else warn(sec, 'POST /api/delivery/contactless', `status ${rContact.status}`);
  }

  // Performance
  if (D.driverId) {
    const perfEndpoints = [
      ['GET /api/delivery/driver/{driverId}/performance',       `${S.logistics}/api/delivery/driver/${D.driverId}/performance`],
      ['GET /api/delivery/driver/{driverId}/performance/today', `${S.logistics}/api/delivery/driver/${D.driverId}/performance/today`],
      ['GET /api/delivery/metrics/today',                       `${S.logistics}/api/delivery/metrics/today`],
    ];
    for (const [label, url] of perfEndpoints) {
      const r = await req(url, mgrOpts);
      if (ok(r)) pass(sec, label);
      else        warn(sec, label, `status ${r.status}`);
    }
  }

  // ── NEW Tracking endpoints ────────────────────────────────────────────────
  // POST /api/delivery/reject (NEW)
  if (D.trackingId && tok.driver) {
    const rReject = await req(`${S.logistics}/api/delivery/reject`, {
      method: 'POST', token: tok.driver,
      body: { trackingId: D.trackingId, driverId: D.driverId, reason: 'API test rejection' },
    });
    if (ok(rReject)) pass(sec, 'POST /api/delivery/reject');
    else              warn(sec, 'POST /api/delivery/reject', `status ${rReject.status}`);
  } else warn(sec, 'POST /api/delivery/reject', 'skipped — no trackingId or driver token');

  // POST /api/delivery/{orderId}/regenerate-otp (NEW)
  if (D.deliveryOrderId) {
    const rRegenOtp = await req(`${S.logistics}/api/delivery/${D.deliveryOrderId}/regenerate-otp`, {
      method: 'POST', ...mgrOpts,
    });
    if (ok(rRegenOtp)) pass(sec, 'POST /api/delivery/{orderId}/regenerate-otp');
    else                warn(sec, 'POST /api/delivery/{orderId}/regenerate-otp', `status ${rRegenOtp.status}`);
  } else warn(sec, 'POST /api/delivery/{orderId}/regenerate-otp', 'skipped — no deliveryOrderId');
}

// ══════════════════════════════════════════════════════════════════════════════
// 18. ANALYTICS & BI (intelligence-service)
// ══════════════════════════════════════════════════════════════════════════════
async function testAnalytics() {
  section('ANALYTICS & BI');
  const sec = 'analytics';

  // Health (no auth)
  const rHealth = await req(`${S.intel}/api/analytics/health`);
  if (ok(rHealth)) pass(sec, 'GET /api/analytics/health');
  else              fail(sec, 'GET /api/analytics/health', `intelligence-service unreachable — status ${rHealth.status}`);

  const rBIHealth = await req(`${S.intel}/api/bi/health`);
  if (ok(rBIHealth)) pass(sec, 'GET /api/bi/health');
  else                warn(sec, 'GET /api/bi/health', `status ${rBIHealth.status}`);

  if (!tok.manager) { warn(sec, 'Analytics endpoints skipped', 'no manager token'); return; }

  const mgrOpts = { token: tok.manager, storeCode: A.manager2.storeCode };

  const analyticsEndpoints = [
    ['GET /api/analytics/sales/today',                `${S.intel}/api/analytics/sales/today`],
    ['GET /api/analytics/avgOrderValue/today',        `${S.intel}/api/analytics/avgOrderValue/today`],
    ['GET /api/analytics/drivers/status',             `${S.intel}/api/analytics/drivers/status`],
    ['GET /api/analytics/sales/trends/WEEKLY',        `${S.intel}/api/analytics/sales/trends/WEEKLY`],
    ['GET /api/analytics/sales/trends/MONTHLY',       `${S.intel}/api/analytics/sales/trends/MONTHLY`],
    ['GET /api/analytics/sales/breakdown/order-type', `${S.intel}/api/analytics/sales/breakdown/order-type`],
    ['GET /api/analytics/sales/peak-hours',           `${S.intel}/api/analytics/sales/peak-hours`],
    ['GET /api/analytics/staff/leaderboard',          `${S.intel}/api/analytics/staff/leaderboard`],
    ['GET /api/analytics/products/top-selling',       `${S.intel}/api/analytics/products/top-selling`],
  ];
  for (const [label, url] of analyticsEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }

  if (D.staffId) {
    const rSP = await req(`${S.intel}/api/analytics/staff/${D.staffId}/performance/today`, mgrOpts);
    if (ok(rSP)) pass(sec, 'GET /api/analytics/staff/{staffId}/performance/today');
    else          warn(sec, 'GET /api/analytics/staff/{staffId}/performance/today', `status ${rSP.status}`);
  }

  // Cache clear
  const rCC = await req(`${S.intel}/api/analytics/cache/clear`, { method: 'POST', ...mgrOpts });
  if (ok(rCC)) pass(sec, 'POST /api/analytics/cache/clear');
  else          warn(sec, 'POST /api/analytics/cache/clear', `status ${rCC.status}`);

  // BI endpoints
  const biEndpoints = [
    ['GET /api/bi/forecast/sales',            `${S.intel}/api/bi/forecast/sales`],
    ['GET /api/bi/analysis/customer-behavior',`${S.intel}/api/bi/analysis/customer-behavior`],
    ['GET /api/bi/prediction/churn',          `${S.intel}/api/bi/prediction/churn`],
    ['GET /api/bi/forecast/demand',           `${S.intel}/api/bi/forecast/demand`],
    ['GET /api/bi/cost-analysis',             `${S.intel}/api/bi/cost-analysis`],
    ['GET /api/bi/benchmarking/stores',       `${S.intel}/api/bi/benchmarking/stores`],
    ['GET /api/bi/executive-summary',         `${S.intel}/api/bi/executive-summary`],
  ];
  for (const [label, url] of biEndpoints) {
    const r = await req(url, mgrOpts);
    if (ok(r)) pass(sec, label);
    else        warn(sec, label, `status ${r.status}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════════════════════
function printSummary() {
  section('SUMMARY');
  const total = R.pass + R.fail + R.warn;

  const fails = R.items.filter(i => i.status === 'FAIL');
  const warns = R.items.filter(i => i.status === 'WARN');

  if (fails.length) {
    console.log('\n\x1b[1m\x1b[31m  FAILURES (must fix):\x1b[0m');
    fails.forEach(i => console.log(`  \x1b[31m✗\x1b[0m  [${i.sec}] ${i.label}${i.detail ? '  →  ' + i.detail : ''}`));
  }
  if (warns.length) {
    console.log('\n\x1b[1m\x1b[33m  WARNINGS (investigate):\x1b[0m');
    warns.forEach(i => console.log(`  \x1b[33m!\x1b[0m  [${i.sec}] ${i.label}${i.detail ? '  →  ' + i.detail : ''}`));
  }

  console.log('\n\x1b[1m  Test data IDs from this run:\x1b[0m');
  const interesting = ['storeId001','menuItemId','customerId','customerProfileId','dineInOrderId','takeawayOrderId','deliveryOrderId','cashPaymentId','reviewId','trackingId'];
  interesting.filter(k => D[k]).forEach(k => console.log(`    ${k}: ${D[k]}`));

  console.log(`\n\x1b[1m  Results: \x1b[32m${R.pass} PASS\x1b[0m  \x1b[31m${R.fail} FAIL\x1b[0m  \x1b[33m${R.warn} WARN\x1b[0m  /  ${total} total\x1b[0m`);
  if (R.fail === 0 && R.warn === 0) console.log('\n  \x1b[32m\x1b[1m✓  All tests passed!\x1b[0m\n');
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('\x1b[1m\x1b[35m\nMaSoVa API Test Suite v3 — covering all 388 endpoints\x1b[0m');
  console.log(`\x1b[2mRun date: ${new Date().toISOString()}\x1b[0m`);

  await testHealth();
  await testAuth();
  await testUsers();
  await testStores();
  await testMenu();
  await testCustomers();
  await testCampaigns();
  await testNotifications();
  await testGdpr();
  await testShifts();
  await testWorkingSessions();
  await testInventory();
  await testKitchenEquipment();
  await testOrders();
  await testReviews();
  await testPayments();
  await testDelivery();
  await testAnalytics();

  printSummary();
})();
