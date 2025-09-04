import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        reporters: ['verbose'],
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/**',
                'dist/**',
                'coverage/**',
                'scripts/**',
                '**/*.d.ts',
                '**/*.type.ts',
                '**/index.ts',
                '**/*.schema.ts',
                '**/*.config.*',
                '**/*.test.*',
                '**/*.spec.*',
                '**/types/**',
                '**/plugins/**',
                '**/migrations/**',
                '**/*.generator.ts',
                '**/*.fixture.ts',
                '**/*.mock.ts',
                'src/infrastructure/database/seed.ts',
                'src/server.ts',
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
                isolate: false,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 5000,
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
