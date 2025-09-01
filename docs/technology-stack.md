# Unicorn-Style Startup API Stack

## Backend Core

- **Node.js v24+**: High-performance JavaScript runtime
- **TypeScript**: Adds static typing for safer, maintainable code
- **Fastify v5+**: Lightweight, fast web framework with built-in schema validation

## File Upload

- **@fastify/multipart**: Handles multipart/form-data uploads

## Image Processing

- **Sharp**: Image processing library to resize/convert images to WebP format

## Validation

- **TypeBox**: TypeScript-first schema definitions compatible with JSON Schema
- **Ajv**: High-performance runtime JSON Schema validation
- **@fastify/type-provider-typebox**: First-class TypeBox integration for Fastify route schemas

## Documentation

- **@fastify/swagger**: Auto-generates OpenAPI documentation
- **@fastify/swagger-ui**: Interactive Swagger UI for testing API endpoints

## Database

- **PostgreSQL**: Reliable relational database with connection pooling and ACID compliance
  
## ORM

- **Prisma ORM**: Type-safe database client with migrations

## Authentication

- **JWT (@fastify/jwt)**: Fastify JWT plugin for signing/verification and request decorators
- **jsonwebtoken**: Low-level JWT utilities (sign/verify) if used outside Fastify decorators
- **OAuth (optional, via @fastify/oauth2)**: Server-side OAuth2 code flow (Google/GitHub) with backend JWT issuance
- **@fastify/session** (optional): Session-based auth when needed (e.g., admin panels); not used for stateless API JWT

## Security

- **@fastify/helmet**: Automatic HTTP security headers
- **@fastify/rate-limit**: Request throttling to prevent abuse
- **argon2**: Modern password hashing for classic login
- **@fastify/cors**: CORS configuration for browser clients (see docs/cors.md)

## Monitoring & Logging

- **Pino**: High-performance structured logger
- **pino-pretty** (dev): Human-friendly log formatting during development

## Caching

- **@fastify/etag**: Generates HTTP ETag headers for JSON responses to enable conditional GETs (304) and efficient caching

## Error Handling

- **Custom Global Error Handler**: Captures unhandled exceptions and returns Google-style JSON errors.

## Testing

- **Vitest**: Unit, integration, and E2E testing with TypeScript support
- **@vitest/ui**: Optional web interface for test visualization

## Quality

- **ESLint**: Linting for consistent code style
- **Prettier**: Automatic code formatting

## Development Tools

- **pnpm**: Fast, disk-efficient package manager
- **tsx**: TypeScript execution & watch mode for dev
- **dotenv**: Load environment variables from .env files

## CI/CD & Deployment

- **Docker**: Containerize app for dev, staging, and production
- **GitHub Actions / GitLab CI**: Automated build, test, and deploy pipeline
- **Multi-stage Dockerfile**: Optimized container builds
- **Health Checks**: Endpoint for monitoring service availability

## Notes

- **Ready for frontend consumption**: Works seamlessly with Next.js, Nuxt, SvelteKit, HTMX, or other clients
- **Flexible auth**: Supports classic username/password or OAuth login (server-side via @fastify/oauth2) + backend JWT issuance
