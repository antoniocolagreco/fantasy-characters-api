# Package Scripts Reference

This document provides a comprehensive reference for all scripts available in the Fantasy Character
API project.

## 📋 Quick Reference

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage
pnpm validate         # Full project validation

# Setup
pnpm setup            # Quick project setup
pnpm setup:full       # Complete setup with validation
```

## 📚 Complete Script Categories

### 🚀 Development & Build

| Script  | Command                  | Description                              |
| ------- | ------------------------ | ---------------------------------------- |
| `clean` | `rimraf dist`            | Remove build artifacts                   |
| `build` | `pnpm run clean && tsc`  | Clean and compile TypeScript             |
| `start` | `node dist/index.js`     | Start production server                  |
| `dev`   | `tsx watch src/index.ts` | Start development server with hot reload |

**Usage Examples:**

```bash
# Development workflow
pnpm dev                    # Start development
pnpm build                  # Build for production
pnpm start                  # Test production build
```

### 🔍 Type Checking

| Script            | Command                                                     | Description                          |
| ----------------- | ----------------------------------------------------------- | ------------------------------------ |
| `type-check`      | `tsc --noEmit`                                              | Check TypeScript types (source only) |
| `type-check:test` | `tsc --noEmit --project tsconfig.test.json`                 | Check test file types                |
| `type-check:all`  | `tsc --noEmit && tsc --noEmit --project tsconfig.test.json` | Check all TypeScript files           |

**Usage Examples:**

```bash
# Type checking during development
pnpm type-check             # Quick source check
pnpm type-check:all         # Full project check
```

### 🧪 Testing

| Script                  | Command                                                     | Description                               |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `test`                  | `vitest run`                                                | Run all tests once                        |
| `test:watch`            | `vitest`                                                    | Run tests in watch mode                   |
| `test:coverage`         | `vitest run --coverage`                                     | Run tests with coverage report            |
| `test:coverage:enforce` | `pnpm run test:coverage && node scripts/check-coverage.mjs` | Run tests and enforce coverage thresholds |
| `test:ui`               | `vitest --ui`                                               | Run tests with web UI                     |

**Usage Examples:**

```bash
# Testing workflow
pnpm test                   # Quick test run
pnpm test:watch             # Development testing
pnpm test:coverage          # Check coverage
pnpm test:ui                # Visual test interface
```

**Coverage Requirements:**

- **Security/Auth modules**: 90% minimum (Statements, Branches, Functions, Lines)
- **Other modules**: 80% minimum (Statements, Branches, Functions, Lines)

### 🧹 Code Quality

| Script         | Command                                                    | Description                        |
| -------------- | ---------------------------------------------------------- | ---------------------------------- |
| `lint`         | `eslint ./**/*.ts --fix`                                   | Lint and auto-fix TypeScript files |
| `lint:md`      | `markdownlint --fix docs/**/*.md`                          | Lint and fix markdown files        |
| `format`       | `prettier --write ./**/*.{ts,js,jsx,tsx,json,md,yml,yaml}` | Format all code files              |
| `format:check` | `prettier --check ./**/*.{ts,js,jsx,tsx,json,md,yml,yaml}` | Check if files are formatted       |

**Usage Examples:**

```bash
# Code quality workflow
pnpm lint                   # Fix TypeScript issues
pnpm format                 # Format all files
pnpm format:check           # Check formatting (CI)
```

### ✅ Validation & Checks

| Script       | Command                                                                                                                                                                                     | Description               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `check:env`  | `node -e "const fs = require('fs'); if (!fs.existsSync('.env')) { console.error('❌ .env file missing! Copy .env.example to .env'); process.exit(1); } console.log('✅ .env file found');"` | Verify .env file exists   |
| `check:deps` | `pnpm run type-check:all && pnpm run lint && pnpm run format:check`                                                                                                                         | Run all dependency checks |
| `validate`   | `pnpm run check:env && pnpm run check:deps && pnpm run test`                                                                                                                                | Full project validation   |

**Usage Examples:**

```bash
# Pre-commit validation
pnpm validate               # Complete validation
pnpm check:env              # Environment check only
pnpm check:deps             # Code quality check only
```

### 🗄️ Database & Prisma

| Script            | Command                          | Description                    |
| ----------------- | -------------------------------- | ------------------------------ |
| `prisma:generate` | `prisma generate`                | Generate Prisma client         |
| `prisma:push`     | `prisma db push`                 | Push schema to database        |
| `prisma:reset`    | `prisma migrate reset --force`   | Reset database with migrations |
| `prisma:migrate`  | `prisma migrate dev --name init` | Create and apply migration     |
| `prisma:seed`     | `tsx prisma/seed.ts`             | Seed database with test data   |
| `prisma:studio`   | `prisma studio`                  | Open Prisma Studio (GUI)       |

**Usage Examples:**

```bash
# Database development workflow
pnpm prisma:generate        # After schema changes
pnpm prisma:push            # Push to dev database
pnpm prisma:seed            # Add test data
pnpm prisma:studio          # Visual database browser
```

### 🔄 Database Management

| Script     | Command                                                                               | Description                                   |
| ---------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| `db:setup` | `pnpm run prisma:generate && pnpm run prisma:push && pnpm run prisma:seed`            | Complete database setup                       |
| `db:reset` | `pnpm run prisma:reset && pnpm run prisma:seed`                                       | Reset and reseed database                     |
| `db:wait`  | `timeout /t 10 /nobreak >nul 2>&1 \|\| sleep 10`                                      | Wait for database containers (cross-platform) |
| `db:fresh` | `pnpm run docker:down && pnpm run docker:db && pnpm run db:wait && pnpm run db:setup` | Fresh database with Docker                    |

**Usage Examples:**

```bash
# Database management
pnpm db:setup               # Initialize database
pnpm db:fresh               # Complete reset with Docker
pnpm db:reset               # Reset existing database
```

### 🐳 Docker

| Script         | Command                                                                                                                             | Description                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `docker:build` | `docker build -t fantasy-character-api .`                                                                                           | Build production Docker image       |
| `docker:run`   | `docker run -p 3000:3000 fantasy-character-api`                                                                                     | Run production container            |
| `docker:dev`   | `docker build -f Dockerfile.dev -t fantasy-character-api:dev . && docker run -p 3000:3000 -v $(pwd):/app fantasy-character-api:dev` | Build and run development container |
| `docker:up`    | `docker-compose up -d`                                                                                                              | Start all services in background    |
| `docker:down`  | `docker-compose down`                                                                                                               | Stop all services                   |
| `docker:logs`  | `docker-compose logs -f`                                                                                                            | Follow service logs                 |
| `docker:db`    | `docker-compose up -d database database-test`                                                                                       | Start only database services        |

**Usage Examples:**

```bash
# Docker development workflow
pnpm docker:db              # Start databases only
pnpm docker:up              # Start all services
pnpm docker:logs            # Monitor logs
pnpm docker:down            # Stop everything
```

### ⚙️ Setup & Initialization

| Script       | Command                                                                                               | Description                            |
| ------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `setup`      | `node scripts/setup.mjs`                                                                              | Quick project setup for new developers |
| `setup:full` | `pnpm run setup && pnpm run test:coverage:enforce && echo '✅ Project setup complete! Run: pnpm dev'` | Complete setup with full validation    |

**Usage Examples:**

```bash
# New developer onboarding
pnpm setup                  # Basic setup
pnpm setup:full             # Complete setup with tests
```

## 🔧 Development Workflows

### Daily Development

```bash
# Start development
pnpm dev

# Run tests while developing
pnpm test:watch

# Check code quality
pnpm validate
```

### Before Committing

```bash
# Full validation
pnpm validate

# Or step by step
pnpm check:env
pnpm type-check:all
pnpm lint
pnpm format
pnpm test:coverage
```

### Database Development

```bash
# After schema changes
pnpm prisma:generate
pnpm prisma:push

# Reset database
pnpm db:reset

# Fresh start with Docker
pnpm db:fresh
```

### New Developer Setup

```bash
# Copy environment file
cp .env.example .env

# Complete setup
pnpm setup:full

# Start development
pnpm dev
```

## 🚀 Production Deployment

```bash
# Build for production
pnpm build

# Test production build
pnpm start

# Docker production
pnpm docker:build
pnpm docker:run
```

## 📊 Testing Guidelines

### Coverage Requirements

The project maintains strict testing standards:

- **Authentication/Security modules**: 90% minimum coverage
- **General business logic**: 80% minimum coverage
- **Test execution**: All tests must pass before deployment

### Testing Commands

```bash
# Quick test run
pnpm test

# Development testing with watch
pnpm test:watch

# Coverage analysis
pnpm test:coverage

# Visual test interface
pnpm test:ui

# Enforce coverage thresholds (for CI)
pnpm test:coverage:enforce
```

## 🔗 Related Documentation

- [Development Standards](./development-standards.md) - Quality gates and workflows
- [Testing Strategy](./testing-strategy.md) - Testing approach and coverage requirements
- [Technology Stack](./technology-stack.md) - Backend technologies and frameworks
- [Project Structure](./project-structure.md) - Directory organization and architecture

## 💡 Tips

1. **Use `pnpm validate` before every commit** to ensure code quality
2. **Run `pnpm setup:full` on fresh clones** for complete initialization
3. **Use `pnpm test:watch` during development** for immediate feedback
4. **Run `pnpm db:fresh` when database issues occur** for clean reset
5. **Use `pnpm test:ui` for visual test debugging** and coverage analysis
