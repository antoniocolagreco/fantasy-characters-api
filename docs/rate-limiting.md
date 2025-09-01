# Rate limiting and quotas

Goals

- Protect the API from abuse and spikes.
- Keep generous defaults for normal users; stricter for anonymous traffic.

Plugin

- Use `@fastify/rate-limit` globally, with per-route overrides when needed.

Defaults (public API)

- Window: 1 minute.
- Anonymous (no auth): 100 requests/minute per IP.
- Authenticated users: 600 requests/minute per userId (fallback to IP if userId not available).
- Bursts: allow short spikes with `skipOnError: false` and in-memory token bucket.

Fastify config (example)

```ts
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  global: true,
  // IP-based key for anonymous
  keyGenerator: (req) => {
    const auth = req.headers.authorization
    const userId = (req as any).user?.id
    return userId ? `user:${userId}` : `ip:${req.ip}`
  },
  max: (req, key) => (key.startsWith('user:') ? 600 : 100),
  timeWindow: '1 minute',
  ban: 0,
  addHeadersOnExceeding: { 'x-ratelimit-remaining': true },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
})
```

Per-route overrides

```ts
// Expensive search endpoint
fastify.get('/api/v1/search', {
  config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
}, handler)

// Auth endpoints: stricter
fastify.post('/api/v1/auth/login', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
}, handler)
```

Quotas (business limits)

- For per-user plan limits (e.g., max characters, daily uploads), enforce in application logic and return `QUOTA_EXCEEDED` (429) with reset hints.

Headers

- The plugin returns 429 with standard headers. We expose:
  - X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - Retry-After on 429 responses

Testing

- Unit-test the keyGenerator (user vs IP).
- E2E: hit a route > limit and assert 429 + headers.

Checklist

- [ ] Global rate limit registered with sane defaults.
- [ ] Auth endpoints have stricter per-route limits.
- [ ] Expensive endpoints override limits.
- [ ] 429 maps to `RATE_LIMIT_EXCEEDED` in error handler (already covered).
