// ============================================================================
// ESLint Configuration for Fantasy Characters API
// ============================================================================
// Comprehensive linting configuration for TypeScript Node.js project
// using Fastify framework with functional programming principles
// ============================================================================

import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import unicorn from 'eslint-plugin-unicorn'

// ============================================================================
// PRETTIER CONFIGURATION
// ============================================================================
const prettierOptions = {
  // Core formatting
  semi: false,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 100,
  useTabs: false,
  tabWidth: 2,

  // Advanced formatting
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  // endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  insertPragma: false,
  proseWrap: 'preserve',
  requirePragma: false,
  htmlWhitespaceSensitivity: 'css',

  // File-specific overrides
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        trailingComma: 'none',
        printWidth: 120,
        semi: false,
      },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
        printWidth: 100,
        tabWidth: 2,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        semi: false,
        trailingComma: 'all',
      },
    },
    {
      files: 'package.json',
      options: {
        tabWidth: 2,
        useTabs: false,
        trailingComma: 'none',
      },
    },
  ],
}

// ============================================================================
// NODE.JS GLOBALS
// ============================================================================
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  global: 'readonly',
  module: 'readonly',
  require: 'readonly',
}

// ============================================================================
// VITEST GLOBALS
// ============================================================================
const vitestGlobals = {
  describe: 'readonly',
  test: 'readonly',
  it: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  vi: 'readonly',
}

// ============================================================================
// TYPESCRIPT RULES
// ============================================================================
const typescriptRules = {
  // Variable and type handling
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
    },
  ],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
}

// ============================================================================
// UNICORN RULES (Code Quality & Modern JavaScript)
// ============================================================================
const unicornRules = {
  // File naming conventions
  'unicorn/filename-case': [
    'error',
    {
      case: 'kebabCase',
    },
  ],

  // Modern JavaScript features
  'unicorn/prefer-module': 'error',

  // Error handling best practices
  'unicorn/error-message': 'error',
  'unicorn/throw-new-error': 'error',
}

// ============================================================================
// GENERAL JAVASCRIPT RULES
// ============================================================================
const generalRules = {
  // Variable management
  'no-unused-vars': 'off', // Disabled in favor of TypeScript version
  'prefer-const': 'error',
  'prefer-template': 'error',

  // Code quality
  'no-debugger': 'error',
  'no-duplicate-imports': 'error',
  'no-unused-expressions': 'error',

  // Console usage (controlled per environment)
  // 'no-console': ['warn', { allow: ['warn', 'error'] }], // Commented for development
}

// ============================================================================
// ESLINT CONFIGURATION EXPORT
// ============================================================================
export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Main TypeScript configuration
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: nodeGlobals,
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
      unicorn: unicorn,
    },
    rules: {
      ...typescriptRules,
      ...unicornRules,
      ...generalRules,

      // Prettier integration
      'prettier/prettier': ['error', prettierOptions],
    },
  },

  // Test files specific configuration
  {
    files: ['src/**/*.test.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: vitestGlobals,
    },
    rules: {
      // Relaxed rules for test files
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier configuration (must be last to override conflicting rules)
  prettierConfig,
]
