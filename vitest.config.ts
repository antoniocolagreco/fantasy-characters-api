import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/tests/**/*.*',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/*.type.ts',
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/test.ts',
        'src/**/test-utils.ts',
        'src/shared/config.ts',
        'src/shared/constants.ts',
        'src/app.ts',
        'src/shared/middleware.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    // ESM optimization
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@/auth': new URL('./src/auth', import.meta.url).pathname,
      '@/users': new URL('./src/users', import.meta.url).pathname,
      '@/health': new URL('./src/health', import.meta.url).pathname,
      '@/shared': new URL('./src/shared', import.meta.url).pathname,
      '@/images': new URL('./src/images', import.meta.url).pathname,
      '@/archetypes': new URL('./src/archetypes', import.meta.url).pathname,
      '@/perks': new URL('./src/perks', import.meta.url).pathname,
      '@/races': new URL('./src/races', import.meta.url).pathname,
      '@/skills': new URL('./src/skills', import.meta.url).pathname,
    },
  },
  esbuild: {
    target: 'node20',
  },
})
