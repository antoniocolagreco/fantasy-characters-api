// ============================================================================
// ESLint Configuration for Fantasy Characters API
// ============================================================================
// Comprehensive linting configuration for TypeScript Node.js project
// using Fastify framework with functional programming principles
// ============================================================================

import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'
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
// IMPORT RULES
// (Requirement: In TypeScript files, imports that explicitly include an extension must error; other files ignore)
// We'll declare a placeholder here; actual restriction is applied inside the TS override to limit scope.
// ============================================================================
const importRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['**/*.ts', '**/*.tsx'],
          message: 'Import paths should not include .ts or .tsx extensions',
        },
        {
          group: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
          message: 'Import paths should not include .js extensions in TypeScript files',
        },
      ],
    },
  ],
}

// ============================================================================
// ASSERTION RULES (for non-test files)
// ============================================================================
const assertionRules = {
  'no-restricted-globals': [
    'error',
    {
      name: 'expect',
      message: 'Test assertions should not be used in production code. Move this to a test file.',
    },
    {
      name: 'describe',
      message: 'Test blocks should not be used in production code. Move this to a test file.',
    },
    {
      name: 'test',
      message: 'Test blocks should not be used in production code. Move this to a test file.',
    },
    {
      name: 'it',
      message: 'Test blocks should not be used in production code. Move this to a test file.',
    },
    {
      name: 'beforeAll',
      message: 'Test setup should not be used in production code. Move this to a test file.',
    },
    {
      name: 'afterAll',
      message: 'Test teardown should not be used in production code. Move this to a test file.',
    },
    {
      name: 'beforeEach',
      message: 'Test setup should not be used in production code. Move this to a test file.',
    },
    {
      name: 'afterEach',
      message: 'Test teardown should not be used in production code. Move this to a test file.',
    },
    {
      name: 'vi',
      message: 'Vitest utilities should not be used in production code. Move this to a test file.',
    },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.name='expect']",
      message: 'Assertions should not be used in production code. Move this to a test file.',
    },
    {
      selector: "CallExpression[callee.property.name='expect']",
      message: 'Assertions should not be used in production code. Move this to a test file.',
    },
    {
      selector: "CallExpression[callee.name='assert']",
      message: 'Assertions should not be used in production code. Move this to a test file.',
    },
    {
      selector: "CallExpression[callee.property.name='assert']",
      message: 'Assertions should not be used in production code. Move this to a test file.',
    },
  ],
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
      import: importPlugin,
    },
    rules: {
      // TypeScript recommended rules (manually included for ESLint v9 compatibility)
      ...typescript.configs.recommended.rules,
      ...typescriptRules,
      ...unicornRules,
      ...importRules,
      ...generalRules,

      // Prettier integration
      'prettier/prettier': ['error', prettierOptions],
    },
  },

  // Non-test files configuration (with assertion restrictions)
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/**/tests/**/*.*'],
    rules: {
      ...assertionRules,
    },
  },

  // Test files specific configuration
  {
    files: ['src/**/*.test.ts', 'src/**/tests/**/*.*'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.test.json',
      },
      globals: vitestGlobals,
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
      unicorn: unicorn,
      import: importPlugin,
    },
    rules: {
      // Relaxed rules for test files
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': 'off', // Allow any imports in test files
      'no-restricted-globals': 'off', // Allow test globals in test files
      'no-restricted-syntax': 'off', // Allow assertions in test files
    },
  },

  // For plain JavaScript files we don't enforce the import/extensions rule
  // (the TypeScript override above will enforce it for .ts/.tsx files).
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      // Ensure the restriction is not applied to JS files
      'no-restricted-imports': 'off',
    },
  },

  // Prettier configuration (must be last to override conflicting rules)
  prettierConfig,
]
