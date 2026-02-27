#!/usr/bin/env node

/**
 * API Contract Analyzer
 * Automatically extracts and compares API contracts between backend and frontend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BACKEND_SERVICES = [
  'analytics-service',
  'customer-service',
  'delivery-service',
  'inventory-service',
  'menu-service',
  'notification-service',
  'order-service',
  'payment-service',
  'review-service',
  'user-service'
];

const FRONTEND_API_DIR = 'frontend/src/store/api';

// Results storage
const backendAPIs = {};
const frontendAPIs = {};
const mismatches = [];

/**
 * Extract API endpoints from Java Spring controllers
 */
function extractBackendAPIs() {
  console.log('📡 Extracting Backend API Endpoints...\n');

  BACKEND_SERVICES.forEach(service => {
    const controllerPath = `${service}/src/main/java/com/MaSoVa/${service.replace('-service', '')}/controller`;

    if (!fs.existsSync(controllerPath)) {
      console.log(`⚠️  Controller path not found for ${service}`);
      return;
    }

    const controllers = fs.readdirSync(controllerPath)
      .filter(file => file.endsWith('.java'));

    backendAPIs[service] = [];

    controllers.forEach(controller => {
      const filePath = path.join(controllerPath, controller);
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract base request mapping
      const classMapping = content.match(/@RequestMapping\(['"](.*?)['"]\)/);
      const basePath = classMapping ? classMapping[1] : '';

      // Extract all HTTP method mappings
      const mappingRegex = /@(Get|Post|Put|Delete|Patch)Mapping(?:\(['"](.*?)['"]|\(value\s*=\s*['"](.*?)['"])?/g;
      let match;

      while ((match = mappingRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const endpoint = match[2] || match[3] || '';
        const fullPath = basePath + endpoint;

        // Extract method name
        const methodNameMatch = content.slice(match.index).match(/public\s+\w+(?:<[\w\s,<>]+>)?\s+(\w+)\s*\(/);
        const methodName = methodNameMatch ? methodNameMatch[1] : 'unknown';

        // Extract request/response types
        const returnTypeMatch = content.slice(match.index).match(/public\s+([\w<>,\s?]+)\s+\w+\s*\(/);
        const returnType = returnTypeMatch ? returnTypeMatch[1].trim() : 'void';

        backendAPIs[service].push({
          controller: controller.replace('.java', ''),
          method,
          path: fullPath,
          methodName,
          returnType
        });
      }
    });

    console.log(`✅ ${service}: Found ${backendAPIs[service].length} endpoints`);
  });
}

/**
 * Extract API calls from frontend RTK Query files
 */
function extractFrontendAPIs() {
  console.log('\n\n🎨 Extracting Frontend API Calls...\n');

  if (!fs.existsSync(FRONTEND_API_DIR)) {
    console.log('⚠️  Frontend API directory not found');
    return;
  }

  const apiFiles = fs.readdirSync(FRONTEND_API_DIR)
    .filter(file => file.endsWith('.ts') && file !== 'baseQueryWithAuth.ts');

  apiFiles.forEach(file => {
    const filePath = path.join(FRONTEND_API_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const apiName = file.replace('.ts', '');

    frontendAPIs[apiName] = [];

    // Extract RTK Query endpoints
    const endpointRegex = /(\w+):\s*build(?:er)?\.(?:query|mutation)(?:<[\w\s,<>[\]]+>)?\(\{[^}]*query:\s*(?:\([^)]*\)\s*=>)?\s*\(\{[^}]*url:\s*[`'"]([^`'"]+)[`'"][^}]*method:\s*['"](GET|POST|PUT|DELETE|PATCH)['"]|(\w+):\s*build(?:er)?\.(?:query|mutation)(?:<[\w\s,<>[\]]+>)?\(\{[^}]*query:\s*[`'"]([^`'"]+)[`'"]/g;

    let match;
    while ((match = endpointRegex.exec(content)) !== null) {
      const endpointName = match[1] || match[4];
      const url = match[2] || match[5];
      const method = match[3] || (content.includes(`${endpointName}: builder.mutation`) ? 'POST' : 'GET');

      if (endpointName && url) {
        frontendAPIs[apiName].push({
          endpointName,
          method: method.toUpperCase(),
          url: url.replace(/\$\{[^}]+\}/g, '{param}') // Normalize template strings
        });
      }
    }

    console.log(`✅ ${apiName}: Found ${frontendAPIs[apiName].length} endpoints`);
  });
}

/**
 * Compare and identify mismatches
 */
function findMismatches() {
  console.log('\n\n🔍 Analyzing API Mismatches...\n');

  // Create a map of backend endpoints
  const backendEndpointMap = {};
  Object.entries(backendAPIs).forEach(([service, endpoints]) => {
    endpoints.forEach(ep => {
      const key = `${ep.method}:${ep.path}`;
      backendEndpointMap[key] = { service, ...ep };
    });
  });

  // Check frontend calls against backend
  Object.entries(frontendAPIs).forEach(([apiFile, endpoints]) => {
    endpoints.forEach(ep => {
      // Try to match with backend
      const key = `${ep.method}:${ep.url}`;
      const possibleKeys = Object.keys(backendEndpointMap).filter(k => {
        const backendPath = k.split(':')[1];
        const frontendPath = ep.url;

        // Normalize paths for comparison
        const normalizedBackend = backendPath.replace(/\{[^}]+\}/g, '{param}');
        const normalizedFrontend = frontendPath.replace(/\$\{[^}]+\}/g, '{param}');

        return normalizedBackend.includes(normalizedFrontend) ||
               normalizedFrontend.includes(normalizedBackend);
      });

      if (possibleKeys.length === 0) {
        mismatches.push({
          type: 'MISSING_BACKEND',
          frontend: { apiFile, ...ep },
          severity: 'HIGH'
        });
      } else if (!backendEndpointMap[key]) {
        // Path matches but method might differ
        const matchingPath = possibleKeys.find(k => k.split(':')[1] === ep.url);
        if (matchingPath && matchingPath.split(':')[0] !== ep.method) {
          mismatches.push({
            type: 'METHOD_MISMATCH',
            frontend: { apiFile, ...ep },
            backend: backendEndpointMap[matchingPath],
            severity: 'MEDIUM'
          });
        }
      }
    });
  });

  // Check for unused backend endpoints
  const frontendEndpointSet = new Set();
  Object.values(frontendAPIs).forEach(endpoints => {
    endpoints.forEach(ep => frontendEndpointSet.add(`${ep.method}:${ep.url}`));
  });

  Object.entries(backendEndpointMap).forEach(([key, endpoint]) => {
    if (!frontendEndpointSet.has(key)) {
      // Check if path is similar
      const isSimilar = Array.from(frontendEndpointSet).some(feKey => {
        const fePath = feKey.split(':')[1];
        return endpoint.path.includes(fePath) || fePath.includes(endpoint.path);
      });

      if (!isSimilar) {
        mismatches.push({
          type: 'UNUSED_BACKEND',
          backend: endpoint,
          severity: 'LOW'
        });
      }
    }
  });
}

/**
 * Generate detailed report
 */
function generateReport() {
  console.log('\n\n📊 API MISMATCH REPORT\n');
  console.log('='.repeat(80));

  const highSeverity = mismatches.filter(m => m.severity === 'HIGH');
  const mediumSeverity = mismatches.filter(m => m.severity === 'MEDIUM');
  const lowSeverity = mismatches.filter(m => m.severity === 'LOW');

  console.log(`\n🔴 HIGH SEVERITY (${highSeverity.length}): Missing Backend Endpoints`);
  console.log('-'.repeat(80));
  highSeverity.slice(0, 10).forEach(m => {
    console.log(`\n  Frontend: ${m.frontend.apiFile}`);
    console.log(`  Endpoint: ${m.frontend.method} ${m.frontend.url}`);
    console.log(`  Issue: Backend endpoint not found`);
  });
  if (highSeverity.length > 10) {
    console.log(`\n  ... and ${highSeverity.length - 10} more`);
  }

  console.log(`\n\n🟡 MEDIUM SEVERITY (${mediumSeverity.length}): Method Mismatches`);
  console.log('-'.repeat(80));
  mediumSeverity.slice(0, 10).forEach(m => {
    console.log(`\n  Path: ${m.frontend.url}`);
    console.log(`  Frontend: ${m.frontend.method}`);
    console.log(`  Backend: ${m.backend.method}`);
  });
  if (mediumSeverity.length > 10) {
    console.log(`\n  ... and ${mediumSeverity.length - 10} more`);
  }

  console.log(`\n\n🟢 LOW SEVERITY (${lowSeverity.length}): Potentially Unused Backend Endpoints`);
  console.log('-'.repeat(80));
  lowSeverity.slice(0, 5).forEach(m => {
    console.log(`\n  Service: ${m.backend.service}`);
    console.log(`  Endpoint: ${m.backend.method} ${m.backend.path}`);
  });
  if (lowSeverity.length > 5) {
    console.log(`\n  ... and ${lowSeverity.length - 5} more`);
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));

  const totalBackend = Object.values(backendAPIs).reduce((sum, eps) => sum + eps.length, 0);
  const totalFrontend = Object.values(frontendAPIs).reduce((sum, eps) => sum + eps.length, 0);

  console.log(`\nTotal Backend Endpoints: ${totalBackend}`);
  console.log(`Total Frontend API Calls: ${totalFrontend}`);
  console.log(`\nMismatches Found: ${mismatches.length}`);
  console.log(`  🔴 High Priority: ${highSeverity.length}`);
  console.log(`  🟡 Medium Priority: ${mediumSeverity.length}`);
  console.log(`  🟢 Low Priority: ${lowSeverity.length}`);

  // Save detailed report to file
  const reportPath = 'API_MISMATCH_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalBackend,
      totalFrontend,
      totalMismatches: mismatches.length,
      highSeverity: highSeverity.length,
      mediumSeverity: mediumSeverity.length,
      lowSeverity: lowSeverity.length
    },
    backendAPIs,
    frontendAPIs,
    mismatches
  }, null, 2));

  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  console.log('\n' + '='.repeat(80) + '\n');
}

// Main execution
try {
  extractBackendAPIs();
  extractFrontendAPIs();
  findMismatches();
  generateReport();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
