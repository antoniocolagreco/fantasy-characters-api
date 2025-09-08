import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        reporters: ['default'],
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
                'tests/**',
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
                isolate: true,
            },
        },
        testTimeout: 3000,
        hookTimeout: 5000,
        teardownTimeout: 5000,
    },
    plugins: [tsconfigPaths({ projects: ['./tsconfig.json', './tests/tsconfig.json'] })],
})
