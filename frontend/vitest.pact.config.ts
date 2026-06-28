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
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
