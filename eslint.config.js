import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.eslint.json',
                tsconfigRootDir: process.cwd(),
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                fetch: 'readonly',
                AbortController: 'readonly',
                AbortSignal: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier,
            import: importPlugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...prettierConfig.rules,

            // TypeScript specific rules (without type checking)
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/prefer-as-const': 'error',

            // General rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-template': 'error',
            'object-shorthand': 'error',
            'no-duplicate-imports': 'error',
            'no-useless-rename': 'error',
            'prefer-destructuring': ['error', { object: true, array: false }],

            // Import rules
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import/newline-after-import': 'error',
            'import/no-useless-path-segments': 'error',

            'prettier/prettier': 'error',
        },
    },
    {
        files: ['scripts/**/*.{ts,tsx}'],
        rules: {
            'no-console': 'off', // Allow console.log in scripts
            '@typescript-eslint/no-explicit-any': 'off', // Allow any types in scripts
        },
    },
    {
        files: ['*.config.{ts,js}', '*.config.*.{ts,js}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...prettierConfig.rules,

            // Relaxed rules for config files
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prettier/prettier': 'error',
        },
    },
    {
        files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    },
]
