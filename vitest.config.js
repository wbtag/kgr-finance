import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.js'],
    testTimeout: 300000,
    hookTimeout: 300000,
  },
});