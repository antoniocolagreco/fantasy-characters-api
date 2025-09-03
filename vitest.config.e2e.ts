import { resolve } from 'path'
import { defineConfig } from 'vitest/config.js'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['src/**/*.e2e.{test,spec}.{ts,tsx}', 'tests/e2e/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'coverage'],
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
        testTimeout: 60000,
        hookTimeout: 60000,
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
