# Technology Stack

## Backend Core

- **Node.js v24+**: JavaScript runtime powering the backend, chosen for its performance and
  ecosystem
- **TypeScript**: Adds static typing to JavaScript, improving code quality and maintainability
- **Fastify v5+**: Web framework for building the API, lightweight and fast with built-in schema
  validation
- **Functional Programming**: Project follows functional programming paradigms, avoiding OOP and
  classes unless absolutely necessary

## Validation & Documentation

- **TypeBox**: Library for defining JSON Schema-compatible schemas with TypeScript types
- **Ajv**: High-performance JSON Schema validator for runtime validation
- **@fastify/swagger**: Automatically generates OpenAPI documentation
- **@fastify/swagger-ui**: Interactive Swagger UI for API testing

## Database & ORM

- **Prisma ORM**: Advanced ORM for TypeScript/Node.js with type-safe database interactions
- **SQLite**: Default database for local development (file-based)

## Authentication & Security

- **@fastify/jwt**: Official Fastify plugin for JWT token management with native integration
- **@fastify/oauth2**: OAuth 2.0 implementation for social login (Google, GitHub)
- **@fastify/session**: Session management for OAuth flows and secure user sessions
- **@fastify/helmet**: Automatic HTTP security headers
- **@fastify/rate-limit**: Rate limiting to prevent abuse
- **bcrypt**: Industry-standard password hashing with configurable rounds

## Monitoring & Logging

- **Pino**: High-performance JSON logger for Node.js with native Fastify integration (currently used
  only in Fastify core, custom logging utilities need integration)
- **@fastify/sensible**: Plugin with utilities and status codes

## Testing & Quality

- **Vitest**: Modern testing framework for unit and integration tests with excellent TypeScript
  support and native ESM support
- **@vitest/ui**: Optional web UI for test visualization and debugging

## Development Tools

- **pnpm**: Fast, disk-efficient package manager for Node.js projects
- **tsx**: TypeScript execution and watch mode for development
- **ESLint**: TypeScript linter with code quality and style rules
- **Prettier**: Opinionated code formatter for consistent style
- **Vitest**: Modern test runner with native TypeScript and ESM support

## CI/CD & Deployment

- **Docker**: Application containerization for consistency across environments
- **Kubernetes**: Container orchestration with health checks and scaling
- **GitHub Actions**: CI/CD pipeline automation
- **Multi-stage Dockerfile**: Optimized container builds for dev/staging/prod
- **Health Checks**: Kubernetes-compatible health monitoring with readiness and liveness probes
- **Horizontal Pod Autoscaler**: Automatic scaling based on CPU/memory usage
- **ConfigMaps & Secrets**: Environment-specific configuration management
