# Rate Limiting

Essential patterns for protecting API from abuse with Fastify + TypeScript.

## Critical Rate Limiting Rules

1. **Always enable global rate limiting** with @fastify/rate-limit
2. **Always use different limits** for anonymous vs authenticated users
3. **Rate limits are currently configured globally** - per-route overrides not
   yet implemented
4. **Always return standard headers** (X-RateLimit-Limit, X-RateLimit-Remaining,
   X-RateLimit-Reset)

## Global Rate Limiting (implemented)

```ts
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  global: true,
  keyGenerator: req => {
    const userId = req.user?.id
    return userId ? `user:${userId}` : `ip:${req.ip}`
  },
  max: (_req, key) => (key.startsWith('user:') ? 500 : 150),
  timeWindow: '1 minute',
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  errorResponseBuilder: (request, context) => {
    return {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        status: 429,
        retryAfter: context.after,
      },
      requestId: request.id,
      timestamp: new Date().toISOString(),
    }
  },
})
```

## Pre-defined Rate Limit Configurations (available but not used yet)

The plugin provides pre-configured rate limits for different endpoint types:

```ts
// Available via app.rateLimitConfigs
{
  auth: {
    login: { max: 5, timeWindow: '1 minute' },
    register: { max: 3, timeWindow: '1 minute' },
    forgotPassword: { max: 3, timeWindow: '1 minute' },
    refreshToken: { max: 10, timeWindow: '1 minute' },
  },
  crud: {
    create: { max: 30, timeWindow: '1 minute' },
    update: { max: 50, timeWindow: '1 minute' },
    delete: { max: 15, timeWindow: '1 minute' },
    batch: { max: 5, timeWindow: '1 minute' },
  },
  expensive: {
    search: { max: 40, timeWindow: '1 minute' },
    upload: { max: 15, timeWindow: '1 minute' },
    analytics: { max: 20, timeWindow: '1 minute' },
  },
}
```

**Note**: These configurations are defined but not yet applied to individual
routes. Currently, all endpoints use the global rate limits.

## Future Per-Route Overrides (planned)

When implemented, routes will use stricter limits for sensitive endpoints:

```ts
// Auth endpoints - prevent brute force attacks (planned implementation)
app.post(
  '/auth/login',
  {
    config: { rateLimit: app.rateLimitConfigs.auth.login },
  },
  authController.login
)

// CRUD endpoints - balance usability and protection (planned implementation)
app.post(
  '/characters',
  {
    config: { rateLimit: app.rateLimitConfigs.crud.create },
  },
  characterController.create
)

// Expensive endpoints - prevent resource abuse (planned implementation)
app.post(
  '/images',
  {
    config: { rateLimit: app.rateLimitConfigs.expensive.upload },
  },
  imageController.upload
)
```

**Current Status**: All routes currently use global rate limits. Per-route
overrides are planned for future implementation.

## Business Quotas (not implemented)

Application-level limits would be enforced in services for user plans/features
(future feature):

```ts
// Future implementation example
export const characterService = {
  async createCharacter(data: CreateCharacterInput, userId: string) {
    // Check user quota (not currently implemented)
    const characterCount = await prisma.character.count({
      where: { ownerId: userId },
    })

    // User plan system not implemented yet
    // const userPlan = await getUserPlan(userId)
    // if (characterCount >= userPlan.maxCharacters) {
    //   throw err('QUOTA_EXCEEDED', `Character limit reached`)
    // }

    return createCharacterInDb(data)
  },
}
```

**Current Status**: No business quotas or user plan system implemented. All
authenticated users have the same limits.

## Error Handling (implemented)

Rate limit errors are handled with proper HTTP status and retry information:

```ts
// Implemented in rate-limit.plugin.ts
errorResponseBuilder: (request, context) => {
  return {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      status: 429,
      retryAfter: context.after,
    },
    requestId: request.id,
    timestamp: new Date().toISOString(),
  }
}
```

**Current Status**: ✅ Implemented - Rate limit errors return proper 429 status
with retry information and consistent error format.
