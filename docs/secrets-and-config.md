# Secrets & Config

Essential patterns for secure configuration management in Fastify + TypeScript.

## Critical Config Rules

1. **Never hardcode secrets** in source code or logs
2. **Always validate environment variables** at startup, fail fast if missing
3. **Always use `.env` for local development** with `.env.example` template
4. **Always redact secrets** from logs and error responses

## Required Environment Validation (Example)

```ts
import { Type, type Static } from '@sinclair/typebox'

export const ConfigSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ]),
  PORT: Type.Integer({ minimum: 1, maximum: 65535, default: 3000 }),
  DATABASE_URL: Type.String({ minLength: 1 }),
  JWT_SECRET: Type.String({ minLength: 32 }),
  CORS_ORIGINS: Type.String({ default: 'http://localhost:3000' }),
})

export type Config = Static<typeof ConfigSchema>

export function loadConfig(): Config {
  const rawConfig = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000',
  }

  const result = Value.Check(ConfigSchema, rawConfig)
  if (!result) {
    const errors = [...Value.Errors(ConfigSchema, rawConfig)]
    throw new Error(
      `Invalid config: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`
    )
  }

  return rawConfig satisfies Config
}
```

## Required Secrets Redaction

```ts
export const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      'token',
      'JWT_SECRET',
      'DATABASE_URL',
    ],
    remove: true,
  },
})
```

## Required Development Setup

```bash
# .env.example (commit this)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/fantasy_characters_dev
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
CORS_ORIGINS=http://localhost:3000
```

```ts
// Load config at startup
import 'dotenv/config'
export const config = loadConfig()
```

## Quick Checklist

- [ ] TypeBox schema validates all config at startup
- [ ] `.env.example` committed, `.env` in `.gitignore`
- [ ] Secrets redacted from logs with Pino
- [ ] Environment variables injected in production (no `.env` files)
