#!/usr/bin/env node
/**
 * Detect removed backend endpoints by comparing live controller scans
 * on the PR branch vs a base ref (default: origin/main).
 *
 * Usage: node .github/ci/detect-api-breaking-changes.js [baseRef]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const baseRef = process.argv[2] || 'origin/main';
const AUDIT = path.join(__dirname, 'integration-matrix-audit.js');

function endpointKey(row) {
  return `${row.method} ${row.path}`;
}

function auditEndpoints(repoDir) {
  const json = execSync(`node "${AUDIT}" --json-stdout`, {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const report = JSON.parse(json);
  return {
    size: report.matrix.length,
    set: new Map(report.matrix.map((row) => [endpointKey(row), row])),
  };
}

function main() {
  const current = auditEndpoints(ROOT);
  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), 'masova-base-'));

  try {
    execSync(`git worktree add "${worktree}" "${baseRef}"`, {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const base = auditEndpoints(worktree);

    const removed = [...base.set.keys()].filter((key) => !current.set.has(key));
    const added = [...current.set.keys()].filter((key) => !base.set.has(key));

    console.log(`Base (${baseRef}): ${base.size} endpoints`);
    console.log(`Current: ${current.size} endpoints`);
    console.log(`Added: ${added.length}, Removed: ${removed.length}`);

    if (added.length) {
      console.log('\nAdded endpoints:');
      added.slice(0, 30).forEach((key) => console.log(`  + ${key}`));
      if (added.length > 30) console.log(`  ... and ${added.length - 30} more`);
    }

    if (removed.length) {
      console.error('\nBREAKING: removed endpoints (present on base, missing on PR):');
      removed.forEach((key) => {
        const row = base.set.get(key);
        console.error(`  - ${key} (${row.service}/${row.controller})`);
      });
      process.exit(1);
    }

    console.log('\nOK: no removed endpoints vs base');
  } finally {
    try {
      execSync(`git worktree remove "${worktree}" --force`, {
        cwd: ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      fs.rmSync(worktree, { recursive: true, force: true });
    }
  }
}

main();