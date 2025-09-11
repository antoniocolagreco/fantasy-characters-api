# Observability

Structured logging, health monitoring, and request correlation for production
debugging and monitoring.

## Core Features

1. **Structured JSON logging** with request correlation
2. **Health/readiness endpoints** for monitoring
3. **Request performance tracking** with timing metrics
4. **Security-aware data redaction** for sensitive information

## Logging Implementation

### Environment-Specific Configuration

```ts
// Development: Pretty-printed logs
const developmentConfig = {
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss' },
  },
}

// Production: Structured JSON
const productionConfig = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.body.password', 'req.headers.authorization'],
}
```

### Request Correlation

Every request gets a UUID v7 correlation ID for tracking across the system:

```ts
// Automatic correlation ID generation
const app = Fastify({
  genReqId: () => generateUUIDv7(),
  logger: {
    /* redaction config */
  },
})

// Expose correlation ID to clients
reply.header('x-request-id', request.id)
```

## Performance Monitoring

### Request Timing

High-resolution performance tracking with nanosecond precision:

```ts
// Start timing on request
request.requestStartTime = process.hrtime.bigint()

// Calculate response time
const diff = process.hrtime.bigint() - request.requestStartTime
const responseTimeMs = Number(diff / 1_000_000n) // Convert to milliseconds

// Log with metrics
request.log.info(
  {
    requestId: request.id,
    method: request.method,
    statusCode: reply.statusCode,
    responseTime: `${responseTimeMs}ms`,
    userId: request.user?.id,
  },
  'Request completed'
)
```

## Health Monitoring

### Essential Health Checks

Simple endpoints for load balancers and orchestration:

```ts
// Basic health check
app.get('/api/health', async (request, reply) => {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ])

    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    return reply.status(503).send({ status: 'error' })
  }
})

// Detailed readiness check
app.get('/api/ready', async (request, reply) => {
  const checks = {
    database: await checkDatabase(),
    migrations: await checkMigrations(),
  }

  const isReady = Object.values(checks).every(check => check.status === 'ready')
  return reply
    .status(isReady ? 200 : 503)
    .send({ status: isReady ? 'ready' : 'not_ready', checks })
})
```

## Error Observability

### Structured Error Logging

Context-aware error logging with intelligent severity levels:

```ts
// Log based on error type and severity
if (error.status >= 500) {
  request.log.error(
    {
      requestId: request.id,
      error: { message: error.message, stack: error.stack },
      userId: request.user?.id,
      method: request.method,
      url: request.url,
    },
    'Server error'
  )
} else {
  request.log.warn(
    {
      requestId: request.id,
      errorCode: error.code,
      userId: request.user?.id,
    },
    'Client error'
  )
}
```

## Data Security

### Sensitive Data Redaction

Automatic redaction of sensitive information from logs:

```ts
// Comprehensive redaction paths
const redactPaths = [
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'password',
  'token',
  'JWT_SECRET',
  'DATABASE_URL',
]

// Applied automatically to all log entries
const logger = pino({ redact: { paths: redactPaths, remove: true } })
```
