import { defineConfig } from 'vitest/config';
import path from 'path';

// Dedicated Vitest config for Pact consumer contract tests.
//
// These tests must NOT load src/test/setup.ts: that file starts the MSW
// (Mock Service Worker) server, which intercepts every outgoing axios
// request — including ones aimed at Pact's native FFI mock server. The
// resulting MSW-vs-Pact race corrupts the request/response objects that
// cross Vitest's worker-thread RPC boundary, surfacing as unrelated
// "could not be cloned" structured-clone errors.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/pact/**/*.{test,spec}.{ts,tsx}'],
    // On CI an interaction now and then fails with "request was expected but not received" even though
    // the Pact core log shows that same request received and matched. It is a different interaction each
    // time and never reproduces locally, so it looks like a timing race inside pact-js rather than a contract
    // problem. A retry re-runs only the failed interaction; a real contract break still fails every attempt.
    retry: 2,
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: 'forks',
    // Vitest 4 moved pool options to the top level; poolOptions is ignored
    maxWorkers: 2,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
