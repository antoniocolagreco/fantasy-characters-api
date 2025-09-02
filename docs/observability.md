# AI Observability

Essential patterns for basic logging and debugging in initial API development.

## Critical Observability Rules

1. **Always use structured JSON logging** with Pino and requestId correlation
2. **Always implement basic health check** for service availability
3. **Never log passwords or tokens** - keep other logging simple for demo/development
4. **Always use consistent log levels** (info/warn/error mapping)

## Required Structured Logging

Simple Pino setup for development and demo - minimal redaction, focus on request correlation.

```ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Minimal redaction - just sensitive auth data
  redact: ['req.body.password', 'req.headers.authorization'],
})

// Fastify integration
const app = fastify({ 
  logger,
  genReqId: () => generateUUIDv7(), // Consistent with other IDs
})
```

## Required Health Check

Single health endpoint - simple database connectivity check for basic monitoring.

```ts
app.get('/health', async (req, reply) => {
  try {
    // Quick DB check
    await prisma.$queryRaw`SELECT 1`
    
    return reply.code(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return reply.code(503).send({
      status: 'error',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    })
  }
})
```

## Required Error Logging

Centralize error handling with appropriate log levels and structured error information.

```ts
// Global error handler with structured logging
app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500
  const isServerError = statusCode >= 500
  
  // Log server errors, warn for auth issues, skip client validation errors
  if (isServerError) {
    request.log.error({
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      requestId: request.id,
      userId: (request as any).user?.id,
      url: request.url,
      method: request.method,
    }, 'Server error occurred')
  } else if ([401, 403].includes(statusCode)) {
    request.log.warn({
      errorCode: error.code,
      requestId: request.id,
      url: request.url,
    }, 'Authentication/authorization error')
  }
  
  // Return error response (see error-handling.md)
  return reply.code(statusCode).send({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: isServerError ? 'Internal server error' : error.message,
      status: statusCode,
    },
    requestId: request.id,
    timestamp: new Date().toISOString(),
  })
})
```
