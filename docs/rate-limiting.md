# AI Rate Limiting

Essential patterns for protecting API from abuse with Fastify + TypeScript.

## Critical Rate Limiting Rules

1. **Always enable global rate limiting** with @fastify/rate-limit
2. **Always use different limits** for anonymous vs authenticated users
3. **Always add stricter limits** for sensitive endpoints (auth, search)
4. **Always return standard headers** (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

## Required Global Rate Limiting

```ts
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  global: true,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id
    return userId ? `user:${userId}` : `ip:${req.ip}`
  },
  max: (_req, key) => (key.startsWith('user:') ? 500 : 150),
  timeWindow: '1 minute',
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
})
```

## Required Per-Route Overrides

Stricter limits for sensitive or expensive endpoints.

```ts
// Auth endpoints - prevent brute force attacks
app.post('/auth/login', {
  config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
}, loginHandler)

app.post('/auth/register', {
  config: { rateLimit: { max: 3, timeWindow: '1 minute' } },
}, registerHandler)

app.post('/auth/forgot-password', {
  config: { rateLimit: { max: 3, timeWindow: '1 minute' } },
}, forgotPasswordHandler)

// CRUD endpoints - balance usability and protection
app.post('/characters', {
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
}, createCharacterHandler)

app.put('/characters/:id', {
  config: { rateLimit: { max: 50, timeWindow: '1 minute' } },
}, updateCharacterHandler)

app.delete('/characters/:id', {
  config: { rateLimit: { max: 15, timeWindow: '1 minute' } },
}, deleteCharacterHandler)

// Expensive endpoints - prevent resource abuse
app.get('/search', {
  config: { rateLimit: { max: 40, timeWindow: '1 minute' } },
}, searchHandler)

app.post('/upload', {
  config: { rateLimit: { max: 15, timeWindow: '1 minute' } },
}, uploadHandler)

app.post('/characters/batch', {
  config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
}, batchHandler)
```

## Required Business Quotas

Application-level limits enforced in services for user plans/features.

```ts
export async function createCharacter(data: CreateCharacterInput, userId: string) {
  // Check user quota
  const characterCount = await prisma.character.count({ 
    where: { ownerId: userId } 
  })
  
  const userPlan = await getUserPlan(userId)
  if (characterCount >= userPlan.maxCharacters) {
    throw err('QUOTA_EXCEEDED', `Character limit reached (${userPlan.maxCharacters})`, {
      resetHint: 'Upgrade plan or delete existing characters',
      retryAfter: null,
    })
  }
  
  return createCharacterInDb(data)
}
```

## Required Error Handling

Handle rate limit errors with proper HTTP status and retry information.

```ts
// In global error handler
app.setErrorHandler((error, request, reply) => {
  if (error.statusCode === 429) {
    return reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        status: 429,
        retryAfter: error.retryAfter,
      },
      requestId: request.id,
      timestamp: new Date().toISOString(),
    })
  }
  // ... other error handling
})
```
