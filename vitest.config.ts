import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        reporters: ['verbose'],
        setupFiles: ['./tests/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'coverage', '**/*.d.ts', '**/index.ts', '**/*.schema.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'coverage/**',
                'dist/**',
                'node_modules/**',
                '**/*.config.*',
                '**/*.test.*',
                '**/*.spec.*',
                'src/infrastructure/database/migrations/**',
                'src/infrastructure/database/seed.ts',
                'scripts/**',
                // Test data generation utilities (exclude from coverage)
                '**/*.generators.ts',
                '**/*.fixtures.ts',
                '**/*.mocks.ts',
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
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
        testTimeout: 30000,
        hookTimeout: 30000,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@/features': resolve(__dirname, './src/features'),
            '@/infrastructure': resolve(__dirname, './src/infrastructure'),
            '@/shared': resolve(__dirname, './src/shared'),
            '@/tests': resolve(__dirname, './tests'),
        },
    },
})
