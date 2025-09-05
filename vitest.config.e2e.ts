import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['src/**/*.e2e.{test,spec}.{ts,tsx}', 'tests/e2e/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'coverage'],
        passWithNoTests: true,
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    plugins: [tsconfigPaths({ projects: ['./tsconfig.json', './tests/tsconfig.json'] })],
})
