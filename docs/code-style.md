# Code style and linting (simple and strict)

Goals

- Readable, consistent code for everyone.
- Automation first: editor formats, linter flags, CI blocks.
- No surprises in production.

Project constraints

- Indentation: 4 spaces, never tabs.
- No semicolons at end of line.
- Max line length: 100 characters (wrap beyond 100).
- Filenames: kebab-case (e.g., `character-service.ts`).
- Forbidden: `any` and type assertions (including `as`, `<Type>expr`, and non-null `!`).

## Formatting (Prettier)

File: `.prettierrc.json`

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 4,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Recommended: `.editorconfig` for editor consistency

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 4
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

## Linting (ESLint + TypeScript)

Suggested dependencies

- eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin
- eslint-plugin-unicorn, eslint-plugin-import, eslint-plugin-promise, eslint-plugin-security
- eslint-config-prettier, eslint-plugin-prettier (optional; only if you want Prettier as a rule)

File: `.eslintrc.cjs`

```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2023: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { project: false, sourceType: 'module', ecmaVersion: 'latest' },
  plugins: [
    '@typescript-eslint',
    'import',
    'promise',
    'security',
    'unicorn'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:promise/recommended',
    'plugin:security/recommended',
    'plugin:unicorn/recommended',
    'prettier'
  ],
  settings: {
    'import/resolver': { typescript: true }
  },
  rules: {
    // Base style
    'semi': ['error', 'never'],
    'no-extra-semi': 'error',
    'max-len': [
      'error',
      { code: 100, ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true }
    ],
    // Console is forbidden in source (allowed in tests via override)
    'no-console': 'error',
    // File naming
    'unicorn/filename-case': [
      'error',
      { case: 'kebabCase' }
    ],
    // Strict TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-expect-error': 'allow-with-description', 'minimumDescriptionLength': 5 }
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ],
    // Ban all type assertions (as, <Type>expr, non-null !)
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSAsExpression',
        message: 'Type assertion is forbidden. Use narrowing, type guards, or refactor.'
      },
      {
        selector: 'TSTypeAssertion',
        message: 'Type assertion is forbidden. Use narrowing, type guards, or refactor.'
      },
      {
        selector: 'TSNonNullExpression',
        message: 'Non-null assertion is forbidden. Handle null/undefined explicitly.'
      }
    ],
    // Imports
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    // Quality
    'security/detect-object-injection': 'off', // noisy: we validate inputs via schemas
    'unicorn/prevent-abbreviations': 'off', // allow common names (req, res, ctx)
    'unicorn/no-null': 'off',
    'unicorn/no-array-reduce': 'off'
  },
  overrides: [
    {
      files: ['**/*.ts']
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/'
  ]
}
```

Notes

- 4-space indentation is enforced by Prettier; avoid ESLint `indent` for TS projects.
- Filenames must be `kebab-case.ts`. Avoid spaces or uppercase in folder/file names.
- Console is forbidden by ESLint (no-console) in source; use the logger (Pino). It is allowed in tests via override.

## TypeScript (tsconfig)

Recommended options to forbid implicit `any` and improve type safety.

File: `tsconfig.json` (excerpt)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "useDefineForClassFields": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Import order and aliases

- Import types with `import type { Foo } from '...'`.
- Order: builtin → third-party → aliases → relative. Keep a blank line between groups.
- Avoid imports with implicit side effects.

## Tests and specifics

- Test files: `*.spec.ts` or `*.test.ts`.
- No TS assertions in tests; rely on framework matchers (e.g., Vitest) and type utilities.

## Git hooks (optional but recommended)

- Pre-commit: `lint-staged` to run Prettier + ESLint only on changed files.
- Pre-push: run quick tests.

Example `lint-staged` (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,md}": [
      "prettier --write",
      "eslint --max-warnings=0"
    ]
  }
}
```

## Review checklist

- [ ] 4 spaces, no `;`, line ≤ 100 chars.
- [ ] Filenames are kebab-case.
- [ ] `any`, `as`, `<Type>`, `!` are forbidden.
- [ ] No `console.*` in source (allowed in tests).
- [ ] Imports ordered; use `import type` for types only.
- [ ] Input is validated by schemas.
