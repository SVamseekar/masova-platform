#!/usr/bin/env node
/**
 * Verify OpenAPI spec operation counts against committed baselines.
 * Usage: node scripts/ci/verify-openapi-counts.js [specsDir]
 */
const fs = require('fs');
const path = require('path');

const specsDir = process.argv[2];
if (!specsDir) {
  console.error('Usage: node verify-openapi-counts.js <specsDir>');
  process.exit(1);
}
const baselinesPath = path.join(__dirname, 'openapi-endpoint-baselines.json');

function countOperations(spec) {
  return Object.values(spec.paths || {})
    .flatMap((p) => Object.keys(p))
    .filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m)).length;
}

function main() {
  const baselines = JSON.parse(fs.readFileSync(baselinesPath, 'utf8'));
  const services = Object.keys(baselines.services);
  let total = 0;
  let failed = false;

  for (const svc of services) {
    const file = path.join(specsDir, `${svc}-spec.json`);
    if (!fs.existsSync(file)) {
      console.error(`FAIL: missing ${file}`);
      failed = true;
      continue;
    }
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    const count = countOperations(spec);
    const { min, max } = baselines.services[svc];
    total += count;
    if (count < min || count > max) {
      console.error(`FAIL ${svc}: ${count} endpoints (expected ${min}-${max})`);
      failed = true;
    } else {
      console.log(`OK ${svc}: ${count} endpoints`);
    }
  }

  const { min: tMin, max: tMax } = baselines.total;
  console.log(`Total: ${total}`);
  if (total < tMin || total > tMax) {
    console.error(`FAIL total: ${total} (expected ${tMin}-${tMax})`);
    failed = true;
  } else {
    console.log(`OK total within ${tMin}-${tMax}`);
  }

  process.exit(failed ? 1 : 0);
}

main();