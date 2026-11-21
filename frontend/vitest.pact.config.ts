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
    // Only the Pact setup (no MSW): turns off HTTP keep-alive for calls to the mock servers
    setupFiles: ['./src/pact/setup.ts'],
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
