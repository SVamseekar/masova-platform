#!/usr/bin/env node
/**
 * Regenerate specs/*-spec.json from INTEGRATION_MATRIX.json so committed
 * OpenAPI files stay aligned with the canonical endpoint inventory.
 * Structure is minimal (paths + methods only) — sufficient for drift checks.
 *
 * Usage: node scripts/ci/sync-specs-from-matrix.js
 */
const fs = require('fs');
const path = require('path');

const matrixPath = path.join(__dirname, '../../docs/api-contracts/INTEGRATION_MATRIX.json');
const specsDir = path.join(__dirname, '../../specs');

const SERVICE_TITLES = {
  core: 'MaSoVa Core Service',
  commerce: 'MaSoVa Commerce Service',
  logistics: 'MaSoVa Logistics Service',
  payment: 'MaSoVa Payment Service',
  intelligence: 'MaSoVa Intelligence Service',
};

function buildSpec(rows, title) {
  const paths = {};
  for (const row of rows) {
    const method = row.method.toLowerCase();
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    if (!paths[row.path]) paths[row.path] = {};
    paths[row.path][method] = {
      summary: `${row.method} ${row.path}`,
      operationId: `${method}_${row.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      responses: { 200: { description: 'OK' } },
    };
  }
  return {
    openapi: '3.0.3',
    info: { title, version: '1.0.0', description: 'Generated from INTEGRATION_MATRIX.json' },
    paths,
  };
}

function main() {
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const byService = {};
  for (const row of matrix.matrix || []) {
    if (!row.service) continue;
    (byService[row.service] ||= []).push(row);
  }

  fs.mkdirSync(specsDir, { recursive: true });
  let total = 0;
  for (const [svc, rows] of Object.entries(byService)) {
    const spec = buildSpec(rows, SERVICE_TITLES[svc] || svc);
    const count = Object.values(spec.paths).reduce(
      (n, p) => n + Object.keys(p).filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m)).length,
      0
    );
    total += count;
    const out = path.join(specsDir, `${svc}-spec.json`);
    fs.writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
    console.log(`Wrote ${path.relative(process.cwd(), out)} (${count} operations)`);
  }
  console.log(`Total: ${total} operations`);
}

main();