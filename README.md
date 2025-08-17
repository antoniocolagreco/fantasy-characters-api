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
- **SQLite**: Development database (file-based)

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

```bash
# Clone and install
git clone https://github.com/antoniocolagreco/fantasy-character-api.git
cd fantasy-character-api
pnpm install

# Start development
pnpm run dev

# View API docs
open http://localhost:3000/docs
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
