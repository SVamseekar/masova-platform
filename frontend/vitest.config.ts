import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',

    // Setup file to run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        '**/vite-env.d.ts',
        '**/*.config.{ts,js}',
        '**/dist/',
      ],
      // Coverage thresholds (will gradually increase these)
      thresholds: {
        lines: 30,
        branches: 25,
        functions: 30,
        statements: 30,
      },
    },

    // Include test files
    include: ['**/*.{test,spec}.{ts,tsx}'],

    // Exclude files
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],

    // Test timeout (10 seconds)
    testTimeout: 10000,

    // Hooks timeout
    hookTimeout: 10000,

    // Mock reset between tests
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
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
