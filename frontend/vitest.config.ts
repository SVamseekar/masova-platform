import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Custom jsdom environment that preserves native AbortController/AbortSignal.
    // Fixes "Expected signal to be an instance of AbortSignal" on Node 22+ with MSW 2.x.
    environment: './vitest-environment.ts',

    // Setup file to run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        '**/vite-env.d.ts',
        '**/*.config.{ts,js}',
        '**/dist/',
        'src/pact/**',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },

    // Include test files
    include: ['**/*.{test,spec}.{ts,tsx}'],

    // Exclude files
    // src/pact is excluded here: it has its own runner (vitest.pact.config.ts,
    // `npm run test:pact`) that skips MSW setup — see that file for why.
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'tests/**',
      'src/pact/**',
    ],

    // Test timeout
    testTimeout: 15000,

    // Hooks timeout
    hookTimeout: 15000,

    // Mock reset between tests is disabled: most test files set return values once
    // inside vi.mock() factories (module load time) and reuse them across every test
    // in the file. With mockReset/clearMocks/restoreMocks on, those values are wiped
    // after the first test, silently breaking every subsequent test in the file unless
    // it re-applies the mock in beforeEach (which most files don't do).
    clearMocks: false,
    restoreMocks: false,
    mockReset: false,

    // Pool config: forks prevents OOM by isolating each worker in its own process
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
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/apps': path.resolve(__dirname, './src/apps'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/test': path.resolve(__dirname, './src/test'),
    },
  },
});
