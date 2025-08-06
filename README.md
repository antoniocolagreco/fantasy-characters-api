# 🎮 Fantasy Character API

[![CI/CD Pipeline](https://github.com/yourusername/fantasy-character-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/fantasy-character-api/actions/workflows/ci-cd.yml.disabled)
[![Coverage](https://codecov.io/gh/yourusername/fantasy-character-api/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/fantasy-character-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

A comprehensive RESTful API designed for managing fantasy characters, perfect for game developers, tabletop RPG enthusiasts, and fantasy world builders.

## 🚀 Current Status (August 2025)

**Progress**: 4 out of 17 chapters completed ✅  
**Test Suite**: 227 tests passing 🧪  
**Database**: Fully populated with seed data 🗄️  
**API Endpoints**: Health + Complete User Management 🌐

## ✨ Features

### 🏗️ Foundation (Chapter 1) - ✅ Complete

- **Modern Stack**: Built with Fastify v5, TypeScript, and Node.js 24
- **Health Monitoring**: Comprehensive health checks with system metrics
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Security**: Rate limiting, helmet protection, input validation
- **Development Tools**: Hot reload, type checking, linting, formatting
- **Testing**: Jest with coverage reporting and CI/CD integration
- **Docker Support**: Multi-stage builds for development and production

### 🗄️ Database Foundation (Chapter 2) - ✅ Complete

- **Prisma ORM**: Type-safe database interactions with SQLite
- **Complete Schema**: All game models (User, Character, Race, Item, etc.)
- **Database Migrations**: Version-controlled schema changes
- **Seed Data**: Realistic test data for development
- **Relationship Management**: CASCADE deletion and proper constraints

### � Infrastructure (Chapter 3) - ✅ Complete

- **Error Handling**: Centralized error management with custom error classes
- **Logging System**: Structured logging with Pino and request tracking
- **Validation**: TypeBox schemas for runtime validation
- **Response Formatting**: Standardized API response structure
- **Utilities**: Common functions following DRY principles

### 👥 User Management (Chapter 4) - ✅ Complete

- **Complete User CRUD**: Create, read, update, delete users
- **User Validation**: Email format, role validation, field constraints
- **User Statistics**: Character count and activity metrics
- **Pagination & Filtering**: List users with query parameters
- **Error Handling**: Proper validation errors and duplicate detection

### 🖼️ Image Management (Chapter 5) - 🎯 Next Priority

- File upload validation
- Image processing and WebP conversion
- Image resizing (max 350x450px)
- Storage management

### 🧙‍♂️ Character System (Chapters 6-12) - 🚧 Coming Soon

- Complete character creation and management
- Races with unique traits and bonuses
- Archetypes (classes) with specializations
- Skills system with progression
- Items & Equipment system
- Tagging and categorization

### 🔐 Authentication (Chapters 15-17) - 🚧 Coming Soon

- JWT-based authentication
- Role-based access control
- OAuth integration (Google, GitHub)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 24.x or later
- **pnpm**: 9.x or later
- **Docker**: Optional, for containerized development

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fantasy-character-api.git
   cd fantasy-character-api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   pnpm run dev
   ```

5. **Open API documentation**

   ```text
   http://localhost:3000/docs
   ```

### 🐳 Docker Development

1. **Using Docker Compose**

   ```bash
   docker-compose up
   ```

2. **Using Docker directly**

   ```bash
   # Development
   docker build -f Dockerfile.dev -t fantasy-character-api:dev .
   docker run -p 3000:3000 -v $(pwd):/app fantasy-character-api:dev
   
   # Production
   docker build -t fantasy-character-api .
   docker run -p 3000:3000 fantasy-character-api
   ```

## 📖 API Documentation

### Base URL

```text
http://localhost:3000/api
```

### Currently Available Endpoints

#### Health Check Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Comprehensive health check with system metrics |

#### User Management Endpoints ✅

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | GET | List all users with pagination and filtering |
| `/users/:id` | GET | Get user profile by ID |
| `/users` | POST | Create new user with validation |
| `/users/:id` | PUT | Update user (partial updates supported) |
| `/users/:id` | DELETE | Delete user (CASCADE deletes related data) |
| `/users/:id/stats` | GET | Get user statistics |

### User Management Examples

#### Create User

```bash
POST /api/users
Content-Type: application/json

{
  "email": "player@example.com",
  "displayName": "Epic Player",
  "bio": "A legendary adventurer",
  "role": "USER"
}
```

#### List Users with Pagination

```bash
GET /api/users?page=1&limit=10&role=USER
```

#### User Response Format

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "player@example.com",
    "displayName": "Epic Player",
    "bio": "A legendary adventurer",
    "role": "USER",
    "isEmailVerified": false,
    "isActive": true,
    "createdAt": "2025-08-06T00:00:00.000Z",
    "updatedAt": "2025-08-06T00:00:00.000Z"
  }
}
```

### Example Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 123.45,
  "memory": {
    "used": 45.67,
    "total": 128.00,
    "percentage": 35.68
  },
  "system": {
    "platform": "linux",
    "nodeVersion": "v24.0.0",
    "pid": 12345
  }
}
```

### Interactive Documentation

Visit `http://localhost:3000/docs` for the complete Swagger UI documentation with interactive API testing.

## 🧪 Testing

### Current Test Status

- **Total Tests**: 227 ✅
- **Test Coverage**: Excellent across all implemented features
- **Test Categories**: Unit tests, integration tests, controller tests

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test files
pnpm test user.controller.test.ts
```

### Test Coverage Goals

- **Lines**: >90% (achieved)
- **Functions**: >90% (achieved)
- **Branches**: >90% (achieved)
- **Statements**: >90% (achieved)

### Database Testing

All tests use isolated test databases with automatic cleanup:

```bash
# Reset and seed database for testing
pnpm prisma:reset
pnpm prisma:seed
```

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite |
| `pnpm lint` | Lint code with ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean build directory |

### Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm prisma:studio` | Open Prisma Studio (database GUI) |
| `pnpm prisma:migrate` | Create and apply database migrations |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:reset` | Reset database (⚠️ deletes all data!) |
| `pnpm prisma:seed` | Populate database with test data |

### Database Management

```bash
# View database in browser
pnpm prisma:studio

# Add test data
pnpm prisma:seed

# Check current data
echo "SELECT COUNT(*) FROM users;" | sqlite3 prisma/dev.db
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for quality gates
- **Jest**: Unit and integration testing

### Project Structure

```text
fantasy-character-api/
├── src/
│   ├── config/         # Environment configuration
│   ├── controllers/    # HTTP request handlers
│   │   ├── health.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/     # Custom middleware
│   │   └── error-handler.ts
│   ├── routes/         # API route definitions
│   │   ├── health.route.ts
│   │   └── user.route.ts
│   ├── services/       # Business logic
│   │   ├── database.service.ts
│   │   └── user.service.ts
│   ├── schemas/        # Validation schemas
│   │   ├── api.ts
│   │   └── user.ts
│   ├── types/          # TypeScript definitions
│   │   └── errors.ts
│   ├── utils/          # Utility functions
│   │   ├── common.ts
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   └── validation.ts
│   ├── app.ts          # Fastify app setup
│   └── index.ts        # Application entry point
├── tests/              # Test files (227 tests)
├── prisma/             # Database schema and migrations
│   ├── schema.prisma   # Database schema
│   ├── seed.ts         # Test data seeding
│   └── migrations/     # Database version history
├── assets/             # Static assets (character images)
└── docs/               # Additional documentation
```

## 🚀 Deployment

### Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API Configuration
API_PREFIX=/api
API_VERSION=v1

# Security
JWT_SECRET=your-super-secret-jwt-key
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000

# Database (Future chapters)
DATABASE_URL=postgresql://user:password@localhost:5432/fantasy_api
```

### Production Deployment

1. **Docker**

   ```bash
   # Build production image
   docker build -t fantasy-character-api .
   
   # Run production container
   docker run -p 3000:3000 --env-file .env fantasy-character-api
   ```

2. **Manual Deployment**

   ```bash
   # Install production dependencies
   pnpm install --prod
   
   # Build application
   pnpm run build
   
   # Start production server
   pnpm run start
   ```

## 📈 Monitoring

### Health Checks

The API provides multiple health check endpoints for monitoring:

- **`/api/health`**: Detailed health information
- **`/api/health/ready`**: Readiness check for load balancers
- **`/api/health/live`**: Basic liveness check

### Logging

Structured logging with Pino:

- Development: Pretty-printed logs
- Production: JSON structured logs
- Configurable log levels

### Metrics

System metrics included in health checks:

- Memory usage
- CPU information
- Uptime
- Node.js version
- Process information

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/fantasy-character-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/fantasy-character-api/discussions)
