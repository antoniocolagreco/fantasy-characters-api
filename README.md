# 🎮 Fantasy Character API

[![CI/CD Pipeline](https://github.com/yourusername/fantasy-character-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/fantasy-character-api/actions/workflows/ci-cd.yml)
[![Coverage](https://codecov.io/gh/yourusername/fantasy-character-api/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/fantasy-character-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org/)

A comprehensive RESTful API designed for managing fantasy characters, perfect for game developers, tabletop RPG enthusiasts, and fantasy world builders.

## ✨ Features

### 🏗️ Foundation (Chapter 1) - ✅ Complete

- **Modern Stack**: Built with Fastify, TypeScript, and Node.js 24
- **Health Monitoring**: Comprehensive health checks with system metrics
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Security**: Rate limiting, helmet protection, input validation
- **Development Tools**: Hot reload, type checking, linting, formatting
- **Testing**: Jest with coverage reporting and CI/CD integration
- **Docker Support**: Multi-stage builds for development and production
- **CI/CD Pipeline**: Automated testing, security scanning, and deployment

### 🔐 Authentication (Chapter 2) - 🚧 Coming Soon

- JWT-based authentication
- User registration and login
- Role-based access control
- Password hashing and security

### 👥 User Management (Chapter 3) - 🚧 Coming Soon

- User profiles and preferences
- Account management
- User statistics and achievements

### 🧙‍♂️ Character System (Chapter 4) - 🚧 Coming Soon

- Complete character creation and management
- Character statistics and attributes
- Character progression tracking

### 🌟 Game Elements (Chapter 5) - 🚧 Coming Soon

- Races with unique traits and bonuses
- Archetypes (classes) with specializations
- Skills system with progression
- Perks and abilities

### 🎒 Items & Equipment (Chapter 6) - 🚧 Coming Soon

- Comprehensive item system
- Equipment and inventory management
- Item rarity and enchantments

### 🏷️ Advanced Features (Chapter 7) - 🚧 Coming Soon

- Tagging and categorization
- Advanced search and filtering
- Import/export functionality

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

### Health Check Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Comprehensive health check with system metrics |
| `/health/ready` | GET | Readiness probe for orchestrators |
| `/health/live` | GET | Liveness probe for orchestrators |

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

### Run Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

### Test Coverage

Current test coverage targets:

- **Lines**: >80%
- **Functions**: >80%
- **Branches**: >80%
- **Statements**: >80%

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start development server with hot reload |
| `pnpm run build` | Build for production |
| `pnpm run start` | Start production server |
| `pnpm run test` | Run test suite |
| `pnpm run lint` | Lint code with ESLint |
| `pnpm run format` | Format code with Prettier |
| `pnpm run clean` | Clean build directory |

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
│   ├── config/         # Configuration and environment
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Utility functions
│   ├── app.ts          # Fastify app setup
│   └── index.ts        # Application entry point
├── tests/              # Test files and utilities
├── .github/            # GitHub Actions workflows
├── docs/               # Additional documentation
└── docker/             # Docker configurations
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

1. **Heroku**

   ```bash
   # Deploy to Heroku
   git push heroku main
   ```

2. **Docker**

   ```bash
   # Build production image
   docker build -t fantasy-character-api .
   
   # Run production container
   docker run -p 3000:3000 --env-file .env fantasy-character-api
   ```

3. **Manual Deployment**

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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run quality checks
6. Submit a pull request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Chapter 1: Foundation & Deployment Infrastructure ✅

- [x] Project setup and configuration
- [x] Health check system
- [x] Docker containerization
- [x] CI/CD pipeline
- [x] API documentation

### Chapter 2: Authentication System 🚧

- [ ] JWT authentication
- [ ] User registration/login
- [ ] Password security
- [ ] Session management

### Chapter 3: User Management 🚧

- [ ] User profiles
- [ ] Account settings
- [ ] User preferences
- [ ] Admin controls

### Chapter 4: Character System 🚧

- [ ] Character creation
- [ ] Character management
- [ ] Character statistics
- [ ] Character progression

### Chapter 5: Game Elements 🚧

- [ ] Races system
- [ ] Archetypes/Classes
- [ ] Skills and abilities
- [ ] Character perks

### Chapter 6: Items & Equipment 🚧

- [ ] Item management
- [ ] Equipment system
- [ ] Inventory tracking
- [ ] Item categories

### Chapter 7: Advanced Features 🚧

- [ ] Tagging system
- [ ] Search and filtering
- [ ] Data import/export
- [ ] Analytics and reporting

## 📞 Support

- **Documentation**: [API Docs](http://localhost:3000/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/fantasy-character-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/fantasy-character-api/discussions)

## 🏆 Acknowledgments

- **Fastify**: Fast and low overhead web framework
- **TypeScript**: Type safety and developer experience
- **Jest**: Delightful JavaScript testing
- **Docker**: Containerization platform
- **GitHub Actions**: CI/CD automation

---

**Built with ❤️ for the fantasy gaming community** 🎮⚔️🧙‍♂️
