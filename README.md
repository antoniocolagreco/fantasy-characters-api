# Fantasy Characters API

A modern, REST API for managing fantasy characters, built with Node.js,
TypeScript, and Fastify.

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd fantasy-characters-api
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development
pnpm dev
```

## 📚 Documentation Index

### 🏗️ **Project Foundation**

- [📋 Roadmap](docs/roadmap.md) - Complete development roadmap with milestones
  and dependencies
- [🛠️ Technology Stack](docs/technology-stack.md) - Technologies, libraries, and
  tools used
- [📁 Project Structure](docs/project-structure.md) - Directory organization and
  file responsibilities
- [💡 Development Principles](docs/development-principles.md) - Coding standards
  and best practices
- [🧩 Feature Dependencies](docs/feature-dependencies.md) - Managing
  dependencies between features with clear and unidirectional rules.

### 🔧 **Setup & Configuration**

- [🔐 Secrets & Config](docs/secrets-and-config.md) - Environment variables and
  configuration management
- [🐳 Docker Setup Guide](docs/docker-setup-guide.md) - Complete Docker and
  Docker Compose guide for developers
- [📦 Package Scripts](docs/package-scripts.md) - Available npm/pnpm scripts
- [🚀 CI/CD](docs/ci-cd.md) - Continuous integration and deployment pipelinefe

### 🏛️ **Architecture & Design**

- [📊 Data Models](docs/data-models.md) - Database schema and Prisma models
- [🔀 Migrations & Rollback](docs/migrations-and-rollback.md) - Database
  migration strategies
- [📋 Code Style](docs/code-style.md) - Linting, formatting, and coding
  conventions

### 🔐 **Security & Authentication**

- [🛡️ Security](docs/security.md) - Security best practices and implementations
- [🔑 Authentication](docs/authentication.md) - JWT-based authentication system
- [🚪 Authorization & RBAC](docs/authorization.md) - Complete role-based access
  control specification
- [🌐 CORS](docs/cors.md) - Cross-origin resource sharing configuration

### 🌐 **API Documentation**

- [📋 Endpoints](docs/endpoints.md) - Detailed endpoint specifications
- [🔍 Query Templates](docs/query-templates.md) - Database query patterns and
  examples
- [📋 Response Templates](docs/response-templates.md) - Response format
  standards
- [📚 Documentation](docs/documentation.md) - API documentation generation

### 🎯 **Features & Functionality**

- [🖼️ Images](docs/images.md) - Image upload, processing, and storage
- [🏥 Health](docs/health.md) - Health check endpoints and monitoring

### ⚡ **Performance & Operations**

- [💾 Caching](docs/caching.md) - Caching strategies and implementation
- [🚦 Rate Limiting](docs/rate-limiting.md) - Request throttling and abuse
  prevention
- [📊 Observability](docs/observability.md) - Logging, monitoring, and metrics
- [🚨 Error Handling](docs/error-handling.md) - Error management and user
  feedback

### 🔄 **Versioning & Evolution**

- [📌 Versioning](docs/versioning.md) - API versioning strategy

## 🎮 What This API Does

This API manages fantasy characters with rich taxonomies and relationships:

- **👤 Users** - Authentication, profiles, and role management
- **🏷️ Tags** - Flexible categorization system
- **⚔️ Skills** - Character abilities and proficiencies
- **✨ Perks** - Special traits and advantages
- **🧝 Races** - Fantasy races with attribute modifiers
- **🛡️ Archetypes** - Character classes and roles
- **🗡️ Items** - Equipment with stats and bonuses
- **🖼️ Images** - Photo upload and processing
- **👥 Characters** - Complete character profiles with relationships
- **⚙️ Equipment** - Character gear and loadouts

## 🛠️ Tech Stack Highlights

- **Backend**: Node.js 24+, TypeScript, Fastify v5+
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: TypeBox + Ajv with automatic OpenAPI generation
- **Auth**: JWT with refresh token rotation
- **Security**: Helmet, CORS, rate limiting, RBAC
- **Images**: Sharp processing pipeline (WebP conversion)
- **Testing**: Vitest with comprehensive coverage
- **Quality**: ESLint, Prettier, strict TypeScript

## 📋 Key Features

- ✅ **Type-safe** - End-to-end TypeScript with runtime validation
- ✅ **Auto-documented** - OpenAPI/Swagger generated from schemas
- ✅ **Secure by default** - RBAC, rate limiting, input validation
- ✅ **High performance** - Optimized queries, caching, cursor pagination
- ✅ **Production ready** - Docker, CI/CD, health checks, monitoring
- ✅ **Developer friendly** - Hot reload, comprehensive tests, clear structure

## 🚀 Getting Started

### Local Development

1. **Prerequisites**: Node.js 24+, PostgreSQL, pnpm
2. **Install**: `pnpm install`
3. **Configure**: Copy `.env.example` to `.env` and configure
4. **Database**: `pnpm db:migrate` and `pnpm db:seed`
5. **Develop**: `pnpm dev`
6. **Test**: `pnpm test`
7. **Build**: `pnpm build`

### Docker Deployment

#### Development with Docker

```bash
# Start PostgreSQL only (Compose v2)
pnpm docker:compose:dev

# Run API locally against containerized DB
pnpm dev
```

#### Production Deployment

```bash
# Build and start complete stack
pnpm docker:compose:prod

# Or step by step
pnpm docker:build
pnpm docker:compose:prod
```

#### Docker Commands

- `pnpm docker:build` - Build production image
- `pnpm docker:run` - Run container locally
- `pnpm docker:compose:dev` - Start development stack (DB only)
- `pnpm docker:compose:prod` - Start production stack (API + DB)
- `pnpm docker:compose:dev:down` - Stop development stack

The production image is optimized with:

- Multi-stage build for minimal size (~261MB)
- Non-root user for security
- Health checks for monitoring
- Production dependencies only

## 📖 API Documentation

Once running, visit:

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs/json`
- **Health Check**: `http://localhost:3000/api/v1/live`

## 🤝 Contributing

Please read the [Development Principles](docs/development-principles.md) and
[Code Style](docs/code-style.md) before contributing.

## 👨‍💻 Author

**Antonio Colagreco**  
📧 Email: [nevenbridge@gmail.com](mailto:nevenbridge@gmail.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file
for details.
