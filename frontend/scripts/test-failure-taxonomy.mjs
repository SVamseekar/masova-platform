#!/usr/bin/env node
/**
 * Runs vitest JSON reporter and buckets failures by error signature.
 * Usage: cd frontend && node scripts/test-failure-taxonomy.mjs
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const env = {
  ...process.env,
  VITE_API_GATEWAY_URL: 'http://localhost:8080/api',
  VITE_API_BASE_URL: 'http://localhost:8080/api',
  VITE_WS_URL: 'http://localhost:8080/ws',
};

const raw = execSync('npx vitest run --reporter=json', {
  cwd: frontendDir,
  env,
  maxBuffer: 50 * 1024 * 1024,
});

const report = JSON.parse(raw.toString());
let failedFiles = 0;
let failedTests = 0;
const buckets = {};

for (const file of report.testResults ?? []) {
  const fails = (file.assertionResults ?? []).filter((a) => a.status === 'failed');
  if (fails.length === 0) continue;
  failedFiles++;
  failedTests += fails.length;
  for (const f of fails) {
    const msg = f.failureMessages?.[0] ?? '';
    let bucket = 'other';
    if (msg.includes('Currency code is required')) bucket = 'currency-locale';
    else if (msg.includes('without a matching request handler') || msg.includes('fetch failed')) bucket = 'msw-url';
    else if (msg.includes('pointer-events')) bucket = 'user-event';
    else if (msg.includes('Unable to find an element')) bucket = 'query-drift';
    else if (msg.includes('is not a function') || msg.includes('Cannot read properties')) bucket = 'mock-setup';
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  }
}

console.log(JSON.stringify({ failedFiles, failedTests, buckets }, null, 2));