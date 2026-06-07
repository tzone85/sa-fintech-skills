import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['scripts/**/*.ts', 'shared/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, statements: 80 }
    }
  }
});
