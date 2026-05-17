#!/usr/bin/env node
/**
 * API Mismatch Auditor
 * Extracts backend endpoints from Java controllers and frontend URLs from RTK Query slices + MSW handlers.
 * Produces a diff: missing /api/ prefix, wrong paths, dead endpoints, baseUrl problems.
 *
 * Usage: node scripts/audit-api-mismatches.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ─── helpers ──────────────────────────────────────────────────────────────────

function findFiles(dir, pattern, excludes = []) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (excludes.some(ex => full.includes(ex))) continue;
    if (entry.isDirectory()) results.push(...findFiles(full, pattern, excludes));
    else if (pattern.test(entry.name)) results.push(full);
  }
  return results;
}

// ─── 1. Backend endpoints from Java controllers ───────────────────────────────

function extractBackendEndpoints() {
  const excludes = ['/archive/', '/backup', '/.worktrees/', '/test/'];
  const javaFiles = findFiles(ROOT, /Controller\.java$/, excludes);
  const endpoints = [];

  for (const file of javaFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const controllerName = path.basename(file, '.java');
    const classMapping = src.match(/@RequestMapping\(["']([^"']+)["']\)/);
    const basePath = classMapping ? classMapping[1] : '';

    // Method-level mappings with explicit path: @GetMapping("/path")
    for (const m of src.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping\(["']([^"']*?)["']\)/g)) {
      const fullPath = (basePath + m[2]).replace(/\/+/g, '/');
      endpoints.push({ method: m[1].toUpperCase(), path: fullPath, controller: controllerName });
    }
    // Method-level mappings with no path (bare @GetMapping)
    for (const m of src.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(\)|\b(?!\())/g)) {
      if (basePath) endpoints.push({ method: m[1].toUpperCase(), path: basePath, controller: controllerName });
    }
  }

  // Deduplicate
  const seen = new Set();
  return endpoints.filter(e => {
    const k = `${e.method}:${e.path}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).sort((a, b) => a.path.localeCompare(b.path));
}

// ─── 2. RTK Query slice URLs ──────────────────────────────────────────────────

function extractSliceUrls() {
  const sliceDir = path.join(ROOT, 'frontend/src/store/api');
  const files = fs.readdirSync(sliceDir)
    .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'baseQueryWithAuth.ts');

  const entries = [];
  for (const file of files) {
    const src = fs.readFileSync(path.join(sliceDir, file), 'utf8');
    const baseUrlMatch = src.match(/baseUrl:\s*[`'"]([^`'"]+)[`'"]/);
    const baseUrl = baseUrlMatch ? baseUrlMatch[1] : 'BASE_URL';

    // url: '/path' and url: `/path`
    for (const m of src.matchAll(/\burl:\s*[`'"]([^`'"]+)[`'"]/g))
      entries.push({ slice: file, baseUrl, url: m[1] });

    // query: (x) => '/path' or `/path`
    for (const m of src.matchAll(/\bquery:.*?=>\s*[`'"]([^`'"]+)[`'"]/g))
      entries.push({ slice: file, baseUrl, url: m[1] });

    // query: (x) => `/template/${x}` — normalize params
    for (const m of src.matchAll(/\bquery:.*?=>\s*`([^`]+)`/g)) {
      const norm = m[1].replace(/\$\{[^}]+\}/g, ':param').replace(/\?.*$/, '');
      entries.push({ slice: file, baseUrl, url: norm, isTemplate: true });
    }
  }
  return entries;
}

// ─── 3. MSW handler URLs ─────────────────────────────────────────────────────

function extractHandlerUrls() {
  const handlerDir = path.join(ROOT, 'frontend/src/test/mocks/handlers');
  const files = fs.readdirSync(handlerDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
  const entries = [];
  for (const file of files) {
    const src = fs.readFileSync(path.join(handlerDir, file), 'utf8');
    for (const m of src.matchAll(/http\.(get|post|put|patch|delete)\(`\$\{API\}([^`]+)`/g))
      entries.push({ handler: file, method: m[1].toUpperCase(), url: m[2] });
  }
  return entries;
}

// ─── 4. Normalise path for comparison ────────────────────────────────────────

function norm(p) {
  return p.replace(/\{[^}]+\}/g, ':param').replace(/:[^/]+/g, ':param').replace(/\?.*$/, '').replace(/\/+$/, '') || '/';
}

// ─── 5. Run ───────────────────────────────────────────────────────────────────

const backend  = extractBackendEndpoints();
const slices   = extractSliceUrls();
const handlers = extractHandlerUrls();

const backendNorms = backend.map(e => ({ ...e, norm: norm(e.path) }));

// ── Report A: backend endpoint map ──
console.log('\n' + '='.repeat(72));
console.log('BACKEND ENDPOINTS (verified from @RequestMapping annotations)');
console.log('='.repeat(72));
for (const e of backendNorms)
  console.log(`  ${e.method.padEnd(7)} ${e.path.padEnd(55)} [${e.controller}]`);

// ── Report B: MSW handlers missing /api/ prefix ──
console.log('\n' + '='.repeat(72));
console.log('MSW HANDLERS — MISSING /api/ PREFIX');
console.log('='.repeat(72));
const handlersMissingApi = handlers.filter(h => !h.url.startsWith('/api/'));
if (!handlersMissingApi.length) console.log('  ✅ All handlers have /api/ prefix');
else handlersMissingApi.forEach(h =>
  console.log(`  ❌ ${h.method.padEnd(7)} ${h.url.padEnd(50)} [${h.handler}]`));

// ── Report C: MSW handler paths not found in backend ──
console.log('\n' + '='.repeat(72));
console.log('MSW HANDLERS — PATH NOT IN ANY BACKEND CONTROLLER');
console.log('='.repeat(72));
for (const h of handlers.filter(h => h.url.startsWith('/api/'))) {
  const hn = norm(h.url);
  const found = backendNorms.some(e => e.norm === hn);
  if (!found) console.log(`  ⚠️  ${h.method.padEnd(7)} ${h.url.padEnd(50)} [${h.handler}]`);
}

// ── Report D: Slice baseUrls with resource path baked in ──
console.log('\n' + '='.repeat(72));
console.log('RTK QUERY SLICES — baseUrl WITH RESOURCE PATH BAKED IN');
console.log('='.repeat(72));
const badBase = [...new Set(slices
  .filter(s => s.baseUrl.includes('/') && !s.baseUrl.includes('AGENT') && !s.baseUrl.includes('8000') && !s.baseUrl.includes('BASE_URL'))
  .map(s => `  ❌ baseUrl="${s.baseUrl}"  →  [${s.slice}]`))];
if (!badBase.length) console.log('  ✅ No slices baking resource path into baseUrl');
else badBase.forEach(l => console.log(l));

// ── Report E: Slice URLs missing /api/ prefix ──
console.log('\n' + '='.repeat(72));
console.log('RTK QUERY SLICES — ABSOLUTE URL MISSING /api/ PREFIX');
console.log('='.repeat(72));
const slicesMissingApi = slices.filter(s => s.url.startsWith('/') && !s.url.startsWith('/api/'));
if (!slicesMissingApi.length) console.log('  ✅ All absolute slice URLs have /api/ prefix');
else [...new Set(slicesMissingApi.map(s => `  ❌ "${s.url.padEnd(50)}"  [${s.slice}]`))].forEach(l => console.log(l));

// ── Report F: Slice URLs with /api/ but not found in backend ──
console.log('\n' + '='.repeat(72));
console.log('RTK QUERY SLICES — /api/ URL NOT FOUND IN BACKEND CONTROLLERS');
console.log('='.repeat(72));
const seen = new Set();
for (const s of slices.filter(s => s.url.startsWith('/api/'))) {
  const sn = norm(s.url);
  const key = `${s.slice}:${sn}`;
  if (seen.has(key)) continue; seen.add(key);
  const found = backendNorms.some(e => e.norm === sn);
  if (!found) console.log(`  ⚠️  "${s.url.padEnd(50)}"  [${s.slice}]`);
}

// ── Report G: Backend endpoints with no MSW handler ──
const INTERNAL = ['gdpr','webhook','test-data','system-info','rating/send','staff/earnings','staff/tips','/tip','/anonymize'];
console.log('\n' + '='.repeat(72));
console.log('BACKEND ENDPOINTS — NO MSW HANDLER (potential test gap)');
console.log('='.repeat(72));
let gaps = 0;
for (const e of backendNorms) {
  if (INTERNAL.some(i => e.path.includes(i))) continue;
  const covered = handlers.some(h => norm(h.url) === e.norm);
  if (!covered) { console.log(`  📭 ${e.method.padEnd(7)} ${e.path.padEnd(55)} [${e.controller}]`); gaps++; }
}
if (!gaps) console.log('  ✅ All public endpoints have MSW handler coverage');

console.log('\n' + '='.repeat(72));
console.log(`SUMMARY | Backend: ${backend.length} endpoints | Handlers: ${handlers.length} | Slice URLs: ${slices.length}`);
console.log('='.repeat(72) + '\n');
