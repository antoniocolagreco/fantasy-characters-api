import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import unicorn from 'eslint-plugin-unicorn'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
      unicorn: unicorn,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // File naming conventions using unicorn
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
        },
      ],

      // Import/Export rules
      'unicorn/prefer-module': 'error',

      // Error handling
      'unicorn/error-message': 'error',
      'unicorn/throw-new-error': 'error',

      // General JavaScript/TypeScript rules
      'no-unused-vars': 'off', // Disable base rule as we use TypeScript version
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',

      // Code style (handled by Prettier)
      'prettier/prettier': [
        'error',
        {
          semi: false,
          trailingComma: 'all',
          singleQuote: true,
          printWidth: 100,
          useTabs: false,
          tabWidth: 2,
          quoteProps: 'as-needed',
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: 'avoid',
          endOfLine: 'lf',
          embeddedLanguageFormatting: 'auto',
          insertPragma: false,
          proseWrap: 'preserve',
          requirePragma: false,
          htmlWhitespaceSensitivity: 'css',
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
                printWidth: 80,
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
        },
      ],
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
]
