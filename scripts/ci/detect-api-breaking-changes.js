#!/usr/bin/env node
/**
 * Detect removed backend endpoints by comparing INTEGRATION_MATRIX.json
 * on the current branch vs main. Faster and more reliable than OpenAPI diff
 * when committed spec files are stale.
 *
 * Usage: node scripts/ci/detect-api-breaking-changes.js [baseRef]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baseRef = process.argv[2] || 'main';
const matrixPath = path.join(__dirname, '../../docs/api-contracts/INTEGRATION_MATRIX.json');

function loadMatrixFromRef(ref) {
  if (ref === 'WORKTREE') {
    return JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  }
  const raw = execSync(`git show ${ref}:docs/api-contracts/INTEGRATION_MATRIX.json`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(raw);
}

function endpointKey(row) {
  return `${row.method} ${row.path}`;
}

function main() {
  if (!fs.existsSync(matrixPath)) {
    console.error('FAIL: missing docs/api-contracts/INTEGRATION_MATRIX.json — run integration-matrix-audit first');
    process.exit(1);
  }

  let base;
  try {
    base = loadMatrixFromRef(baseRef);
  } catch (err) {
    console.error(`FAIL: could not load matrix from ${baseRef}:`, err.message);
    process.exit(1);
  }

  const current = loadMatrixFromRef('WORKTREE');
  const baseSet = new Map((base.matrix || []).map((row) => [endpointKey(row), row]));
  const currentSet = new Map((current.matrix || []).map((row) => [endpointKey(row), row]));

  const removed = [...baseSet.keys()].filter((key) => !currentSet.has(key));
  const added = [...currentSet.keys()].filter((key) => !baseSet.has(key));

  console.log(`Base (${baseRef}): ${baseSet.size} endpoints`);
  console.log(`Current: ${currentSet.size} endpoints`);
  console.log(`Added: ${added.length}, Removed: ${removed.length}`);

  if (added.length) {
    console.log('\nAdded endpoints:');
    added.slice(0, 30).forEach((key) => console.log(`  + ${key}`));
    if (added.length > 30) console.log(`  ... and ${added.length - 30} more`);
  }

  if (removed.length) {
    console.error('\nBREAKING: removed endpoints (present on base, missing on PR):');
    removed.forEach((key) => {
      const row = baseSet.get(key);
      console.error(`  - ${key} (${row.service}/${row.controller})`);
    });
    process.exit(1);
  }

  console.log('\nOK: no removed endpoints vs base');
}

main();