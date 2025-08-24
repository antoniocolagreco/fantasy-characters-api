# 🎮 Fantasy Character API

A comprehensive RESTful API designed for managing fantasy characters, built with modern functional
programming principles.

## 🛠️ Technology Stack

### Backend Core

- **Node.js v24+**: JavaScript runtime
- **TypeScript**: Static typing with strict configuration
- **Fastify v5+**: High-performance web framework

### Database & ORM

- **Prisma ORM**: Type-safe database interactions
- **PostgreSQL**: Database for all environments

### Validation & Documentation

- **TypeBox**: JSON Schema with TypeScript types
- **Ajv**: High-performance validation
- **Swagger/OpenAPI**: Interactive API documentation

### Testing & Quality

- **Vitest**: Modern testing framework with TypeScript support
- **ESLint & Prettier**: Code linting and formatting
- **pnpm**: Fast package manager

### Security & Monitoring

- **@fastify/helmet**: Security headers
- **@fastify/rate-limit**: Request throttling
- **Pino**: High-performance JSON logging

## 🚀 Quick Start

### Prerequisites

- **Node.js v24+**: [Download](https://nodejs.org/)
- **pnpm v9+**: [Install](https://pnpm.io/installation)
- **Docker & Docker Compose**: [Install](https://docs.docker.com/get-docker/)

### Automated Setup (Recommended)

Choose your platform:

**Cross-platform (Node.js script):**

```bash
# Clone the repository
git clone https://github.com/antoniocolagreco/fantasy-character-api.git
cd fantasy-character-api

# Run automated setup script
pnpm setup
```

**Windows (PowerShell):**

```powershell
# Clone the repository
git clone https://github.com/antoniocolagreco/fantasy-character-api.git
cd fantasy-character-api

# Run Windows setup script
.\scripts\setup.ps1
```

**Linux/macOS (Bash):**

```bash
# Clone the repository
git clone https://github.com/antoniocolagreco/fantasy-character-api.git
cd fantasy-character-api

# Run Unix setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:

- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Set up environment file
- ✅ Start PostgreSQL containers
- ✅ Set up database schema
- ✅ Seed with test data
- ✅ Run initial tests

### Manual Setup

If you prefer manual setup:

```bash
# Clone and install
git clone https://github.com/antoniocolagreco/fantasy-character-api.git
cd fantasy-character-api
pnpm install

# Set up environment
cp .env.example .env
# Edit .env file as needed

# Start databases
pnpm run docker:db

# Wait for database and set up schema
pnpm run db:setup

# Start development server
pnpm dev
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# View API docs
open http://localhost:3000/docs

# View database in Prisma Studio
pnpm prisma:studio
```

### Available Test Accounts

After running setup, you can log in with these accounts:

- **Admin**: `admin@fantasy-api.com` / `admin123`
- **Moderator**: `moderator@fantasy-api.com` / `mod123`
- **User**: `user@fantasy-api.com` / `user123`
- **Designer**: `designer@fantasy-api.com` / `design123`

## 📋 Available Scripts

### Development Scripts

```bash
pnpm dev                    # Start development server with hot reload
pnpm build                  # Build for production
pnpm start                  # Start production server
```

### Database Scripts

```bash
pnpm db:setup              # Generate client, push schema, and seed
pnpm db:reset              # Reset database and reseed
pnpm db:fresh              # Stop containers, restart, and setup
pnpm prisma:studio         # Open database browser UI
pnpm prisma:generate       # Generate Prisma client
pnpm prisma:push           # Push schema to database
pnpm prisma:seed           # Seed database with test data
```

### Testing Scripts

```bash
pnpm test                  # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests with coverage report
pnpm test:ui               # Open Vitest UI
```

### Code Quality Scripts

```bash
pnpm lint                  # Lint TypeScript code
pnpm lint:fix              # Fix linting errors
pnpm format                # Format code with Prettier
pnpm type-check            # Check TypeScript types
pnpm validate              # Run all quality checks
```

### Docker Scripts

```bash
pnpm docker:up             # Start all services with Docker Compose
pnpm docker:down           # Stop all Docker services
pnpm docker:db             # Start only database containers
pnpm docker:logs           # View Docker container logs
```

### Setup Scripts

```bash
pnpm setup                 # Automated project setup (recommended)
pnpm setup:full            # Full setup including tests
pnpm check:env             # Verify environment configuration
pnpm check:deps            # Check dependencies and code quality
```

## 📖 API Documentation

### Currently Available Endpoints

- **Health Check**: `GET /api/health`
- **User Management**: Full CRUD operations at `/api/users`

### Interactive Documentation

Visit `http://localhost:3000/docs` for complete Swagger UI documentation.

## 🧪 Testing

```bash
pnpm test              # Run all tests
pnpm test:coverage     # Run with coverage
```

**Current Status**: 227 tests passing with excellent coverage

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.
