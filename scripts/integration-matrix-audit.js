#!/usr/bin/env node
/**
 * MaSoVa Integration Matrix Auditor
 *
 * Ground-truth audit from source (not docs):
 *   Backend @RestController | Gateway route? | RTK slice? | Raw axios/fetch? |
 *   Page/UI? | MSW handler? | Unit test? | Live probe?
 *
 * Usage:
 *   node scripts/integration-matrix-audit.js
 *   node scripts/integration-matrix-audit.js --live http://192.168.50.88:8080
 *   node scripts/integration-matrix-audit.js --live http://localhost:8080 --token <jwt>
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'docs/api-contracts/INTEGRATION_MATRIX.json');
const OUT_MD = path.join(ROOT, 'docs/api-contracts/INTEGRATION_MATRIX.md');

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const liveIdx = args.indexOf('--live');
const LIVE_BASE = liveIdx >= 0 ? args[liveIdx + 1]?.replace(/\/$/, '') : null;
const tokenIdx = args.indexOf('--token');
const LIVE_TOKEN = tokenIdx >= 0 ? args[tokenIdx + 1] : null;

// ─── File discovery ──────────────────────────────────────────────────────────

function findFiles(dir, pattern, excludes = []) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (excludes.some((ex) => full.includes(ex))) continue;
    if (entry.isDirectory()) results.push(...findFiles(full, pattern, excludes));
    else if (pattern.test(entry.name)) results.push(full);
  }
  return results;
}

function readAllTsFiles(dirs) {
  const files = [];
  for (const dir of dirs) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    files.push(...findFiles(abs, /\.(ts|tsx)$/, ['/node_modules/', '/dist/']));
  }
  return files;
}

// ─── Path normalization ──────────────────────────────────────────────────────

function norm(p) {
  return p
    .replace(/\$\{[^}]+\}/g, ':param')
    .replace(/\{[^}]+\}/g, ':param')
    .replace(/:[^/?]+/g, ':param')
    .replace(/\?.*$/, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function toSegments(p) {
  return norm(p).split('/').filter(Boolean);
}

/** Ant-style: * = one segment, ** = rest */
function pathMatches(pattern, requestPath) {
  const patSegs = toSegments(pattern);
  const reqSegs = toSegments(requestPath);

  function match(pi, ri) {
    if (pi === patSegs.length) return ri === reqSegs.length;
    const p = patSegs[pi];
    if (p === '**') return true;
    if (ri >= reqSegs.length) return false;
    if (p === '*' || p === ':param') return match(pi + 1, ri + 1);
    if (p !== reqSegs[ri]) return false;
    return match(pi + 1, ri + 1);
  }
  return match(0, 0);
}

function pathsEquivalent(a, b) {
  return norm(a) === norm(b) || pathMatches(a, b) || pathMatches(b, a);
}

function tailSegments(p, n = 2) {
  const s = toSegments(p);
  return s.slice(-n).join('/');
}

function isStaleFrontendPath(frontendNorm, backendNorm) {
  if (typeof frontendNorm !== 'string' || typeof backendNorm !== 'string') return false;
  if (strictPathMatch(frontendNorm, backendNorm)) return false;
  const f = toSegments(frontendNorm);
  const b = toSegments(backendNorm);
  if (f.length < 2 || b.length < 2) return false;

  // inventory sub-resource migrations: /api/inventory/{suppliers|purchase-orders|waste} → top-level
  const inventoryMigrations = {
    'inventory/suppliers': 'suppliers',
    'inventory/purchase-orders': 'purchase-orders',
    'inventory/waste': 'waste',
  };
  const fSub = f.slice(1, 3).join('/');
  if (inventoryMigrations[fSub] === b[1]) return true;

  // Known migration: /api/users/sessions/* → /api/sessions/*
  if (f.includes('sessions') && b.includes('sessions') && f[1] !== b[1]) return true;
  // equipment rename
  if (f.includes('kitchen-equipment') && b.includes('equipment')) return true;

  // Same API namespace required for remaining heuristics (avoids approve/reject/status false positives)
  if (f[1] !== b[1]) return false;

  // inventory items → canonical /api/inventory
  if (f[1] === 'inventory' && f[2] === 'items') return true;

  // Same terminal action within namespace (e.g. /api/menu/public → /api/menu)
  if (f[f.length - 1] === b[b.length - 1] && f[f.length - 1] !== ':param' && f.join('/') !== b.join('/')) {
    return true;
  }
  // menu path migrations within namespace
  if (f[1] === 'menu' && f.join('/') !== b.join('/')) return true;
  // notification subpath migrations
  if (f[1] === 'notifications' && f.join('/') !== b.join('/')) return true;
  // bi executive paths
  if (f[1] === 'bi' && tailSegments(frontendNorm, 1) !== tailSegments(backendNorm, 1)) return true;
  return false;
}

/** Strict segment match for RTK↔backend (same depth; :param = one segment) */
function strictPathMatch(a, b) {
  const as = toSegments(a);
  const bs = toSegments(b);
  if (as.length !== bs.length) return false;
  for (let i = 0; i < as.length; i++) {
    if (as[i] === ':param' || bs[i] === ':param') continue;
    if (as[i] !== bs[i]) return false;
  }
  return true;
}

function combineApiPath(prefix, url) {
  if (!url) return norm(prefix || '/api');
  if (url.startsWith('http')) {
    try {
      return norm(new URL(url).pathname);
    } catch {
      return norm(url);
    }
  }
  if (url.startsWith('/api/')) return norm(url);
  const p = (prefix || '').replace(/\/$/, '');
  const u = url.startsWith('/') ? url : `/${url}`;
  if (p.startsWith('/api')) return norm(p + u);
  if (p) return norm(`/api${p}${u}`);
  return norm(`/api${u}`);
}

function extractSliceResourcePrefix(src) {
  const m = src.match(/baseUrl:\s*`?\$\{[^}]+\}([^`"']*)`?|baseUrl:\s*[`'"]([^`'"]+)[`'"]|baseUrl:\s*(AGENT_URL|API_CONFIG\.[A-Z_]+)/);
  if (!m) return '';
  const raw = (m[1] || m[2] || m[3] || '').trim();
  if (raw.includes('8000') || raw === 'AGENT_URL' || m[3] === 'AGENT_URL') return '__agent__';
  // e.g. /customers, /payments, /inventory
  const suffix = raw.match(/(\/[a-z-]+)\s*$/i);
  return suffix ? suffix[1] : '';
}

// ─── 1. Backend endpoints ────────────────────────────────────────────────────

function extractBackendEndpoints() {
  const excludes = ['/archive/', '/backup', '/backups/', '/.worktrees/'];
  const javaFiles = findFiles(ROOT, /Controller\.java$/, excludes);
  const endpoints = [];

  for (const file of javaFiles) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes('@RestController')) continue;
    const controller = path.basename(file, '.java');
    const service = file.includes('core-service')
      ? 'core'
      : file.includes('commerce-service')
        ? 'commerce'
        : file.includes('payment-service')
          ? 'payment'
          : file.includes('logistics-service')
            ? 'logistics'
            : file.includes('intelligence-service')
              ? 'intelligence'
              : 'unknown';

    const classMapping = src.match(/@RequestMapping\(["']([^"']+)["']\)/);
    const basePath = classMapping ? classMapping[1] : '';

    for (const m of src.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping\(["']([^"']*?)["']\)/g)) {
      const fullPath = (basePath + m[2]).replace(/\/+/g, '/');
      endpoints.push({ method: m[1].toUpperCase(), path: fullPath, controller, service, source: rel(file) });
    }
    for (const m of src.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(\)|\b(?!\())/g)) {
      if (basePath) endpoints.push({ method: m[1].toUpperCase(), path: basePath, controller, service, source: rel(file) });
    }
  }

  const seen = new Set();
  return endpoints
    .filter((e) => {
      const k = `${e.method}:${e.path}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function rel(f) {
  return path.relative(ROOT, f).replace(/\\/g, '/');
}

// ─── 2. Gateway routes ───────────────────────────────────────────────────────

function extractGatewayRoutes() {
  const gatewayFile = path.join(ROOT, 'api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java');
  const systemFile = path.join(ROOT, 'api-gateway/src/main/java/com/MaSoVa/gateway/config/SystemRouterConfig.java');
  const routes = [];
  const blocked = [];

  if (fs.existsSync(gatewayFile)) {
    const src = fs.readFileSync(gatewayFile, 'utf8');
    const routeBlocks = src.split(/\.route\(/).slice(1);
    for (const block of routeBlocks) {
      const nameMatch = block.match(/^"([^"]+)"/);
      const name = nameMatch ? nameMatch[1] : 'unknown';
      const isBlocked = block.includes('HttpStatus.FORBIDDEN') || block.includes('not accessible externally');
      const pathMatch = block.match(/\.path\(([^)]+)\)/);
      if (!pathMatch) continue;
      const pathArgs = pathMatch[1];
      const patterns = [...pathArgs.matchAll(/"(\/[^"]+)"/g)].map((m) => m[1]);
      const methodMatch = block.match(/\.method\(([^)]+)\)/);
      const methods = methodMatch
        ? [...methodMatch[1].matchAll(/"([A-Z]+)"/g)].map((m) => m[1])
        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      const uriMatch = block.match(/\.uri\("([^"]+)"\)/);
      const target = uriMatch ? uriMatch[1] : null;

      for (const pattern of patterns) {
        const entry = { name, pattern, methods, target, blocked: isBlocked };
        if (isBlocked) blocked.push(entry);
        else if (name !== 'fallback') routes.push(entry);
      }
    }
  }

  if (fs.existsSync(systemFile)) {
    const src = fs.readFileSync(systemFile, 'utf8');
    for (const m of src.matchAll(/(?:\.route|\.andRoute)\(GET\("(\/[^"]+)"\)/g)) {
      routes.push({ name: 'system_router', pattern: m[1], methods: ['GET'], target: 'gateway-local', blocked: false });
    }
  }

  return { routes, blocked };
}

function resolveGateway(endpoint, gateway) {
  const { routes, blocked } = gateway;
  for (const b of blocked) {
    if (b.methods.includes(endpoint.method) && pathMatches(b.pattern, endpoint.path)) {
      return { status: 'blocked', route: b.name, pattern: b.pattern };
    }
  }
  for (const r of routes) {
    if (!r.methods.includes(endpoint.method)) continue;
    if (pathMatches(r.pattern, endpoint.path)) {
      return { status: 'routed', route: r.name, pattern: r.pattern, target: r.target };
    }
  }
  return { status: 'missing', route: null, pattern: null, target: null };
}

// ─── 3. RTK Query slices ─────────────────────────────────────────────────────

function extractRtkEndpoints() {
  const sliceDir = path.join(ROOT, 'frontend/src/store/api');
  const files = fs
    .readdirSync(sliceDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'baseQueryWithAuth.ts');

  const entries = [];
  const hookExports = {}; // slice -> [hook names]

  for (const file of files) {
    const src = fs.readFileSync(path.join(sliceDir, file), 'utf8');
    const slice = file.replace('.ts', '');
    const resourcePrefix = extractSliceResourcePrefix(src);
    const usesBaseQueryWithAuth = src.includes('baseQueryWithAuth');

    const hooks = [...src.matchAll(/export const (use[A-Za-z0-9]+)/g)].map((m) => m[1]);
    hookExports[slice] = hooks;

    const add = (url, method = 'GET') => {
      if (!url || url.includes('${')) {
        const cleaned = (url || '').replace(/\$\{[^}]+\}/g, ':param').split('?')[0];
        if (!cleaned || cleaned.includes('${')) return;
        url = cleaned;
      }
      const full = resourcePrefix === '__agent__'
        ? url
        : combineApiPath(usesBaseQueryWithAuth ? '' : resourcePrefix, url.split('?')[0]);
      if (!full.startsWith('/api/') && !full.startsWith('http')) return;
      entries.push({ slice, file, url, fullPath: full, norm: norm(full), method });
    };

    for (const m of src.matchAll(/\burl:\s*[`'"]([^`'"]+)[`'"]/g)) add(m[1]);
    for (const m of src.matchAll(/\bquery:\s*\([^)]*\)\s*=>\s*[`'"]([^`'"]+)[`'"]/g)) add(m[1]);
    for (const m of src.matchAll(/\bquery:\s*\([^)]*\)\s*=>\s*`([^`]+)`/g)) {
      add(m[1].replace(/\$\{[^}]+\}/g, ':param').split('?')[0]);
    }
    for (const m of src.matchAll(/\bquery:\s*\(\)\s*=>\s*[`'"]([^`'"]+)[`'"]/g)) add(m[1]);
    for (const m of src.matchAll(/\bquery:\s*\(\)\s*=>\s*`([^`]+)`/g)) {
      add(m[1].replace(/\$\{[^}]+\}/g, ':param').split('?')[0]);
    }
    for (const m of src.matchAll(/query:\s*\([^)]*\)\s*=>\s*\(\{[^}]*url:\s*[`'"]([^`'"]+)[`'"][^}]*method:\s*['"](\w+)['"]/gs)) {
      add(m[1], m[2].toUpperCase());
    }
    for (const m of src.matchAll(/query:\s*\([^)]*\)\s*=>\s*\(\{[^}]*url:\s*`([^`]+)`[^}]*method:\s*['"](\w+)['"]/gs)) {
      add(m[1].replace(/\$\{[^}]+\}/g, ':param').split('?')[0], m[2].toUpperCase());
    }
    for (const m of src.matchAll(/query:\s*\(\)\s*=>\s*\(\{[^}]*url:\s*[`'"]([^`'"]+)[`'"][^}]*method:\s*['"](\w+)['"]/gs)) {
      add(m[1], m[2].toUpperCase());
    }
  }

  return { entries, hookExports };
}

// ─── 4. Raw HTTP (axios/fetch) ───────────────────────────────────────────────

function extractRawHttp() {
  const files = readAllTsFiles(['frontend/src/pages', 'frontend/src/apps', 'frontend/src/components', 'frontend/src/hooks']);
  const entries = [];

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const r = rel(file);

    // axios.get/post/put/patch/delete
    for (const m of src.matchAll(/axios\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*[`'"]([^`'"]+)[`'"]/gi)) {
      entries.push({ file: r, method: m[1].toUpperCase(), url: m[2], norm: norm(resolveRawUrl(m[2])) });
    }
    for (const m of src.matchAll(/axios\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*`([^`]+)`/gi)) {
      entries.push({ file: r, method: m[1].toUpperCase(), url: m[2], norm: norm(resolveRawUrl(m[2].replace(/\$\{[^}]+\}/g, ':param'))) });
    }
    for (const m of src.matchAll(/axios\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*\$\{[^}]+\}([^`]+)`/gi)) {
      entries.push({ file: r, method: m[1].toUpperCase(), url: m[2], norm: norm(resolveRawUrl(m[2])) });
    }
    for (const m of src.matchAll(/axios\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*`\$\{[^}]+\}([^`]+)`/gi)) {
      entries.push({ file: r, method: m[1].toUpperCase(), url: m[2], norm: norm(resolveRawUrl(m[2])) });
    }

    // fetch with API path
    for (const m of src.matchAll(/fetch\(\s*[`'"](\/api\/[^`'"]+)[`'"]/g)) {
      entries.push({ file: r, method: 'GET', url: m[1], norm: norm(m[1]) });
    }
    for (const m of src.matchAll(/fetch\(\s*`\$\{[^}]+\}([^`]+)`/g)) {
      const u = m[1].replace(/\$\{[^}]+\}/g, ':param');
      if (u.includes('/api/') || u.startsWith('/users/') || u.startsWith('/auth/') || u.startsWith('/bi/')) {
        entries.push({ file: r, method: 'GET', url: u, norm: norm(resolveRawUrl(u)) });
      }
    }
    for (const m of src.matchAll(/fetch\(\s*`(\/api\/[^`]+)`/g)) {
      entries.push({ file: r, method: 'GET', url: m[1], norm: norm(m[1].replace(/\$\{[^}]+\}/g, ':param')) });
    }
  }

  return entries;
}

function resolveRawUrl(url) {
  if (url.startsWith('/api/')) return url;
  if (url.startsWith('/')) return '/api' + url;
  return url;
}

// ─── 5. UI usage (hook imports + path strings) ─────────────────────────────

function buildUiIndex(hookExports, slices) {
  const uiFiles = readAllTsFiles(['frontend/src/pages', 'frontend/src/apps', 'frontend/src/components']);
  const hookToFiles = {};
  const pathToFiles = {};
  const sliceToFiles = {};

  for (const slice of slices) sliceToFiles[slice] = [];
  for (const [slice, hooks] of Object.entries(hookExports)) {
    for (const hook of hooks) hookToFiles[hook] = [];
  }

  for (const file of uiFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const r = rel(file);
    for (const slice of slices) {
      if (src.includes(`store/api/${slice}`)) sliceToFiles[slice].push(r);
    }
    for (const hook of Object.keys(hookToFiles)) {
      if (src.includes(hook)) hookToFiles[hook].push(r);
    }
    for (const m of src.matchAll(/[`'"](\/api\/[^`'"]+)[`'"]/g)) {
      const n = norm(m[1]);
      if (!pathToFiles[n]) pathToFiles[n] = [];
      if (!pathToFiles[n].includes(r)) pathToFiles[n].push(r);
    }
  }

  return { hookToFiles, pathToFiles, sliceToFiles };
}

// ─── 6. MSW handlers ─────────────────────────────────────────────────────────

function extractMswHandlers() {
  const handlerDir = path.join(ROOT, 'frontend/src/test/mocks/handlers');
  const files = fs.readdirSync(handlerDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
  const entries = [];

  for (const file of files) {
    const src = fs.readFileSync(path.join(handlerDir, file), 'utf8');
    for (const m of src.matchAll(/http\.(get|post|put|patch|delete)\(apiUrl\(['"]([^'"]+)['"]\)/g)) {
      const full = combineApiPath('', m[2]);
      entries.push({ handler: file, method: m[1].toUpperCase(), url: full, norm: norm(full) });
    }
    for (const m of src.matchAll(/http\.(get|post|put|patch|delete)\(apiUrl\(`([^`]+)`\)/g)) {
      const full = combineApiPath('', m[2].replace(/\$\{[^}]+\}/g, ':param'));
      entries.push({ handler: file, method: m[1].toUpperCase(), url: full, norm: norm(full) });
    }
    for (const m of src.matchAll(/http\.(get|post|put|patch|delete)\(`\$\{API\}([^`]+)`/g)) {
      entries.push({ handler: file, method: m[1].toUpperCase(), url: m[2], norm: norm('/api' + m[2].replace(/^\/api/, '')) });
    }
  }
  return entries;
}

// ─── 7. Unit tests ───────────────────────────────────────────────────────────

function extractApiTests() {
  const testDir = path.join(ROOT, 'frontend/src/store/api');
  const tests = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.ts'));
  const pactDir = path.join(ROOT, 'frontend/src/pact/consumers');
  const pactTests = fs.existsSync(pactDir) ? fs.readdirSync(pactDir).filter((f) => f.endsWith('.ts')) : [];

  const sliceTests = {};
  for (const t of tests) {
    const slice = t.replace('.test.ts', '');
    const src = fs.readFileSync(path.join(testDir, t), 'utf8');
    const urls = [...src.matchAll(/[`'"](\/api\/[^`'"]+)[`'"]/g)].map((m) => norm(m[1]));
    sliceTests[slice] = { file: rel(path.join(testDir, t)), urls };
  }

  const pactUrls = [];
  for (const t of pactTests) {
    const src = fs.readFileSync(path.join(pactDir, t), 'utf8');
    for (const m of src.matchAll(/[`'"](\/api\/[^`'"]+)[`'"]/g)) pactUrls.push(norm(m[1]));
  }

  return { sliceTests, pactTests: pactTests.map((f) => rel(path.join(pactDir, f))), pactUrls };
}

// ─── 8. Live probe ───────────────────────────────────────────────────────────

function probeUrl(base, method, apiPath) {
  return new Promise((resolve) => {
    const url = new URL(apiPath.startsWith('/api') ? apiPath : '/api' + apiPath, base.replace(/\/api$/, '') + (base.endsWith('/api') ? '' : ''));
    // base is like http://host:8080 — paths are /api/...
    const full = base.includes('/api') ? base.replace(/\/api$/, '') + apiPath : base + apiPath;
    const parsed = new URL(full);
    const lib = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      timeout: 5000,
      headers: LIVE_TOKEN ? { Authorization: `Bearer ${LIVE_TOKEN}` } : {},
    };
    const req = lib.request(opts, (res) => {
      res.resume();
      resolve({ status: res.statusCode, ok: res.statusCode < 500 });
    });
    req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false, error: 'timeout' });
    });
    req.end();
  });
}

// ─── 9. Match helpers ────────────────────────────────────────────────────────

function findRtkMatches(endpoint, rtkEntries) {
  const en = norm(endpoint.path);
  return rtkEntries.filter((r) => r.method === endpoint.method && strictPathMatch(r.norm, en));
}

function findRawMatches(endpoint, rawEntries) {
  const en = norm(endpoint.path);
  return rawEntries.filter((r) => r.method === endpoint.method && strictPathMatch(r.norm, en));
}

function findMswMatch(endpoint, handlers) {
  const en = norm(endpoint.path);
  return handlers.find((h) => h.method === endpoint.method && strictPathMatch(h.norm, en));
}

function findUiForEndpoint(endpoint, rtkMatches, rawMatches, uiIndex) {
  const files = new Set();
  for (const r of rawMatches) files.add(r.file);
  const en = norm(endpoint.path);
  if (uiIndex.pathToFiles[en]) uiIndex.pathToFiles[en].forEach((f) => files.add(f));
  return [...files].sort();
}

function findTestsForEndpoint(endpoint, rtkMatches, apiTests) {
  const en = norm(endpoint.path);
  const hits = [];
  for (const [slice, info] of Object.entries(apiTests.sliceTests)) {
    if (info.urls.some((u) => u === en || pathMatches(u, en))) hits.push(info.file);
  }
  if (apiTests.pactUrls.some((u) => u === en || pathMatches(u, en))) hits.push('pact');
  for (const r of rtkMatches) {
    if (apiTests.sliceTests[r.slice]) hits.push(apiTests.sliceTests[r.slice].file);
  }
  return [...new Set(hits)];
}

// ─── 10. Frontend-only paths (no backend) ────────────────────────────────────

function findFrontendOnly(backend, rtkEntries, rawEntries) {
  const backendNorms = backend.map((e) => norm(e.path));
  const orphans = [];

  const check = (method, fullPath, source) => {
    if (source.includes('agentApi.ts')) return;
    const n = norm(fullPath);
    if (!n.startsWith('/api/')) return;
    const found = backendNorms.some((b) => strictPathMatch(b, n));
    if (!found) orphans.push({ method, path: fullPath, norm: n, source });
  };

  for (const r of rtkEntries) check(r.method, r.fullPath, `${r.file}`);
  for (const r of rawEntries) check(r.method, resolveRawUrl(r.url), r.file);

  const seen = new Set();
  return orphans.filter((o) => {
    const k = `${o.method}:${o.norm}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── 11. Build matrix ────────────────────────────────────────────────────────

async function buildMatrix() {
  const backend = extractBackendEndpoints();
  const gateway = extractGatewayRoutes();
  const { entries: rtkEntries, hookExports } = extractRtkEndpoints();
  const slices = [...new Set(rtkEntries.map((r) => r.slice))].sort();
  const rawEntries = extractRawHttp();
  const uiIndex = buildUiIndex(hookExports, slices);
  const mswHandlers = extractMswHandlers();
  const apiTests = extractApiTests();
  const frontendOnly = findFrontendOnly(backend, rtkEntries, rawEntries);

  const matrix = [];
  const PROBE_METHODS = new Set(['GET']);
  const PROBE_LIMIT = 30;
  let probed = 0;

  for (const ep of backend) {
    const gw = resolveGateway(ep, gateway);
    const rtk = findRtkMatches(ep, rtkEntries);
    const raw = findRawMatches(ep, rawEntries);
    const msw = findMswMatch(ep, mswHandlers);
    const ui = findUiForEndpoint(ep, rtk, raw, uiIndex);
    const tests = findTestsForEndpoint(ep, rtk, apiTests);

    let live = null;
    if (LIVE_BASE && PROBE_METHODS.has(ep.method) && probed < PROBE_LIMIT) {
      // Only probe public-ish GET endpoints
      const isPublic =
        ep.path.includes('/public/') ||
        ep.path.includes('/health') ||
        ep.path.includes('/version') ||
        ep.path === '/api/menu' ||
        ep.path === '/api/stores';
      if (isPublic) {
        live = await probeUrl(LIVE_BASE, ep.method, ep.path);
        probed++;
      }
    }

    const en = norm(ep.path);
    const staleRtk = rtkEntries.filter(
      (r) => r.method === ep.method && isStaleFrontendPath(r.norm, en)
    );
    const staleRaw = rawEntries.filter(
      (r) => r.method === ep.method && isStaleFrontendPath(r.norm, en)
    );
    const wired =
      rtk.length > 0 || (raw.length > 0 && strictPathMatch(raw[0].norm, en))
        ? 'canonical'
        : staleRtk.length > 0 || staleRaw.length > 0
          ? 'stale'
          : 'none';

    matrix.push({
      method: ep.method,
      path: ep.path,
      norm: norm(ep.path),
      controller: ep.controller,
      service: ep.service,
      gateway: gw.status,
      gatewayRoute: gw.route,
      gatewayPattern: gw.pattern,
      rtkSlice: rtk.map((r) => ({ slice: r.slice, path: r.fullPath, norm: r.norm })),
      staleFrontend: [
        ...staleRtk.map((r) => ({ kind: 'rtk', slice: r.slice, path: r.fullPath })),
        ...staleRaw.map((r) => ({ kind: 'raw', file: r.file, path: r.url })),
      ],
      rawHttp: raw.map((r) => ({ file: r.file, path: r.url })),
      uiPages: ui,
      mswHandler: msw ? msw.handler : null,
      unitTest: tests,
      liveProbe: live,
      frontendWiring: wired,
    });
  }

  const storeSrc = fs.readFileSync(path.join(ROOT, 'frontend/src/store/store.ts'), 'utf8');

  // Slice coverage summary
  const sliceCoverage = slices.map((slice) => {
    const urls = rtkEntries.filter((r) => r.slice === slice);
    const hasTest = !!apiTests.sliceTests[slice];
    const hooks = hookExports[slice] || [];
    const uiUses = [
      ...(uiIndex.sliceToFiles[slice] || []),
      ...hooks.flatMap((h) => uiIndex.hookToFiles[h] || []),
    ];
    return {
      slice,
      endpointCount: urls.length,
      hasUnitTest: hasTest,
      testFile: apiTests.sliceTests[slice]?.file || null,
      hooks,
      uiFileCount: new Set(uiUses).size,
      uiFiles: [...new Set(uiUses)].slice(0, 10),
      registeredInStore: storeSrc.includes(`./api/${slice}`) || storeSrc.includes(`'./api/${slice}'`),
    };
  });

  const unwiredSlices = sliceCoverage.filter((s) => s.uiFileCount === 0);
  const gatewayGaps = matrix.filter((m) => m.gateway === 'missing');
  const staleWiring = matrix.filter((m) => m.frontendWiring === 'stale');
  const noWiring = matrix.filter((m) => m.frontendWiring === 'none' && !isInternalEndpoint(m.path));
  const noMsw = matrix.filter((m) => !m.mswHandler && !isInternalEndpoint(m.path));
  const noTest = matrix.filter((m) => m.unitTest.length === 0 && m.frontendWiring !== 'none' && !isInternalEndpoint(m.path));

  return {
    generatedAt: new Date().toISOString(),
    liveBase: LIVE_BASE,
    summary: {
      backendEndpoints: backend.length,
      gatewayRoutes: gateway.routes.length,
      gatewayBlocked: gateway.blocked.length,
      rtkSlices: slices.length,
      rtkUrls: rtkEntries.length,
      rawHttpCalls: rawEntries.length,
      mswHandlers: mswHandlers.length,
      apiTestFiles: Object.keys(apiTests.sliceTests).length,
      gatewayGaps: gatewayGaps.length,
      staleFrontendWiring: staleWiring.length,
      unwiredBackendPublic: noWiring.length,
      frontendOnlyPaths: frontendOnly.length,
      unwiredSlices: unwiredSlices.length,
      noMswCoverage: noMsw.length,
      noTestCoverage: noTest.length,
    },
    gatewayGaps: gatewayGaps.map((m) => ({ method: m.method, path: m.path, controller: m.controller })),
    staleWiring: staleWiring.map((m) => ({
      method: m.method,
      path: m.path,
      frontend: m.staleFrontend || [],
    })),
    frontendOnly,
    unwiredSlices,
    sliceCoverage,
    matrix,
  };
}

function isInternalEndpoint(p) {
  const internal = [
    'gdpr/anonymize',
    'get-or-create',
    'webhook',
    'TestData',
    '/tip',
    'staff/',
    'aggregator',
    'ws/',
  ];
  return internal.some((i) => p.includes(i));
}

// ─── 12. Markdown report ─────────────────────────────────────────────────────

function writeMarkdown(report) {
  const s = report.summary;
  let md = `# MaSoVa Integration Matrix\n\n`;
  md += `Generated: ${report.generatedAt}\n\n`;
  if (report.liveBase) md += `Live probe base: ${report.liveBase}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  for (const [k, v] of Object.entries(s)) {
    md += `| ${k} | ${v} |\n`;
  }

  md += `\n## Gateway gaps (backend exists, no gateway route)\n\n`;
  if (!report.gatewayGaps.length) md += `_None_\n`;
  else {
    md += `| Method | Path | Controller |\n|--------|------|------------|\n`;
    for (const g of report.gatewayGaps) md += `| ${g.method} | ${g.path} | ${g.controller} |\n`;
  }

  md += `\n## Stale frontend wiring (calls wrong path)\n\n`;
  if (!report.staleWiring.length) md += `_None_\n`;
  else {
    for (const sw of report.staleWiring.slice(0, 40)) {
      md += `- **${sw.method} ${sw.path}** → ${JSON.stringify(sw.frontend)}\n`;
    }
    if (report.staleWiring.length > 40) md += `\n_...and ${report.staleWiring.length - 40} more (see JSON)_\n`;
  }

  md += `\n## RTK slices with zero UI usage\n\n`;
  for (const u of report.unwiredSlices) {
    md += `- \`${u.slice}\` (${u.endpointCount} endpoints, test: ${u.hasUnitTest ? 'yes' : 'no'})\n`;
  }

  md += `\n## Frontend paths with no backend controller\n\n`;
  for (const f of report.frontendOnly.slice(0, 30)) {
    md += `- ${f.method} ${f.path} [${f.source}]\n`;
  }
  if (report.frontendOnly.length > 30) md += `\n_...and ${report.frontendOnly.length - 30} more_\n`;

  md += `\n## Full matrix\n\n`;
  md += `See \`INTEGRATION_MATRIX.json\` for per-endpoint detail.\n\n`;
  md += `Columns: gateway | RTK | raw HTTP | UI | MSW | test | wiring status\n\n`;

  const critical = report.matrix.filter(
    (m) => m.gateway === 'missing' || m.frontendWiring === 'stale' || (m.frontendWiring === 'none' && !isInternalEndpoint(m.path) && m.path.includes('/api/'))
  );

  md += `### Critical rows (${critical.length})\n\n`;
  md += `| Method | Backend path | Gateway | RTK | UI | MSW | Test | Wiring |\n`;
  md += `|--------|--------------|---------|-----|----|----|------|--------|\n`;
  for (const m of critical.slice(0, 60)) {
    md += `| ${m.method} | ${m.path} | ${m.gateway} | ${m.rtkSlice.length ? m.rtkSlice[0].slice : '—'} | ${m.uiPages.length || '—'} | ${m.mswHandler || '—'} | ${m.unitTest.length || '—'} | ${m.frontendWiring} |\n`;
  }

  fs.writeFileSync(OUT_MD, md);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('MaSoVa Integration Matrix Audit\n');
  const report = await buildMatrix();
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
  writeMarkdown(report);

  const s = report.summary;
  console.log('SUMMARY');
  console.log('─'.repeat(50));
  for (const [k, v] of Object.entries(s)) console.log(`  ${k.padEnd(28)} ${v}`);
  console.log(`\nWritten: ${rel(OUT_JSON)}`);
  console.log(`Written: ${rel(OUT_MD)}`);
  console.log(`\nGateway gaps: ${report.gatewayGaps.length}`);
  report.gatewayGaps.slice(0, 10).forEach((g) => console.log(`  ❌ ${g.method} ${g.path}`));
  console.log(`\nStale wiring: ${report.staleWiring.length}`);
  report.staleWiring.slice(0, 10).forEach((sw) => console.log(`  ⚠️  ${sw.method} ${sw.path}`));
  console.log(`\nUnwired slices (no UI): ${report.unwiredSlices.map((u) => u.slice).join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});