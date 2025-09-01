# Secrets and configuration

Goals

- Keep secrets out of code and logs.
- Easy local development; safe production.

Local development

- Use a `.env` file loaded by `dotenv`.
- Do not commit `.env`.
- Provide `.env.example` with non-sensitive placeholders.

Production

- Prefer environment variables injected by the platform (container/VM). Avoid mounting `.env` files with real secrets.
- For multi-env setups or rotation, consider a secret manager (AWS Secrets Manager, GCP Secret Manager, Vault). Cache values in memory with short TTL.

Validation at startup

- Create a config module that reads all required env vars and validates them (TypeBox/Zod/simple checks). Fail fast if missing/invalid.

Recommended variables (examples)

- NODE_ENV, PORT
- DATABASE_URL
- JWT_SECRET (rotate periodically)
- CORS_ORIGINS, CORS_CREDENTIALS
- RATE_LIMIT_MAX_ANON, RATE_LIMIT_MAX_AUTH (optional overrides)
- OAUTH_* (only if OAuth enabled)

Handling

- Never log secrets. Redact Authorization, Set-Cookie, tokens.
- When rotating JWT secrets, support key IDs (kid) and keep old keys until all tokens expire.

Checklist

- [ ] `.env` ignored; `.env.example` present.
- [ ] Config validated on boot; process exits if invalid.
- [ ] Secrets are not printed or stored in logs.
- [ ] Rotation plan for JWT and OAuth client secrets.
