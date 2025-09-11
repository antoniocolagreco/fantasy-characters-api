# 📘 Script List

These are the main scripts you will use when developing our API.  
They cover setup, development, testing, and deployment in a standardized way.

---

## 🚀 Setup environment

- **`pnpm run setup`**  
  Installs dependencies, prepares the database, and compiles the project.  
  👉 Use this the **first time you clone the repo** or when dependencies are
  updated.

- **`pnpm run setup:fresh`**  
  Same as `setup`, but cleans everything first.  
  👉 Use this if you run into cache, build, or DB issues.

---

## 💻 Development

- **`pnpm run dev`**  
  Starts the server in development mode with hot reload.  
  👉 This is the command you will use most often while coding.

- **`pnpm run dev:debug`**  
  Starts the server in debug mode (with breakpoint support).  
  👉 Use this if you need to investigate complex bugs.

- **`pnpm run clean`**  
  Cleans build artifacts, coverage reports, and cache files.  
  👉 Use this when you encounter build or cache issues.

---

## 🗄️ Database

- **`pnpm run db:migrate`**  
  Applies pending database migrations in development mode.

- **`pnpm run db:generate`**  
  Regenerates the Prisma client after schema changes.

- **`pnpm run db:seed`**  
  Seeds the database with test data.

- **`pnpm run db:reset`**  
  Resets the local database (⚠️ deletes all data).  
  👉 Use this if your DB gets corrupted or you need a clean start.

- **`pnpm run db:studio`**  
  Opens Prisma Studio for visual database management.  
  👉 Useful for inspecting and editing data during development.

---

## 🧹 Code quality

- **`pnpm run lint`**  
  Analyzes code and reports style errors or potential bugs.

- **`pnpm run lint:fix`**  
  Automatically fixes simple linting issues.

- **`pnpm run format`**  
  Applies consistent formatting with Prettier.

- **`pnpm run format:check`**  
  Checks if code is properly formatted without making changes.  
  👉 Useful in CI/CD to ensure code is formatted correctly.

- **`pnpm run typecheck`**  
  Runs TypeScript type checks without building.  
  👉 Always run this before pushing code.

---

## ✅ Testing

- **`pnpm run test`**  
  Runs the test suite once.  
  👉 Used in CI/CD pipelines.

- **`pnpm run test:watch`**  
  Runs tests in watch mode (useful during development).

- **`pnpm run test:coverage`**  
  Runs tests and generates a coverage report.

- **`pnpm run test:ui`**  
  Runs tests with Vitest UI for visualization.

---

## 🔧 Validation & Quality

- **`pnpm run validate`**  
  Runs complete validation pipeline (format, typecheck, lint, tests, coverage).

- **`pnpm run validate:coverage`**  
  Validates test coverage meets requirements.

- **`pnpm run validate:env`**  
  Validates environment variables configuration.

- **`pnpm run validate:openapi`**  
  Validates OpenAPI schema generation.

- **`pnpm run smoke:test`**  
  Runs smoke tests against the API to verify basic functionality.  
  👉 Quick health check for deployed applications.

---

## ⚙️ Build & Production

- **`pnpm run build`**  
  Compiles TypeScript to JavaScript (`dist` folder).

- **`pnpm run start`**  
  Starts the compiled API.

- **`pnpm run start:prod`**  
  Starts the API in production mode.

---

## 🐳 Docker

- **`pnpm run docker:build`**  
  Builds the Docker image for the API.

- **`pnpm run docker:run`**  
  Runs the API inside a Docker container.

- **`pnpm run docker:compose:dev`**  
  Starts the development stack (PostgreSQL, optional pgAdmin) via Docker
  Compose.

- **`pnpm run docker:compose:prod`**  
  Starts the production stack (API + PostgreSQL) via Docker Compose.

- **`pnpm run docker:compose:integration`**  
  Starts the integration testing stack via Docker Compose.

- **`pnpm run docker:compose:dev:down`**  
  Stops the development stack.

- **`pnpm run docker:compose:prod:down`**  
  Stops the production stack.

- **`pnpm run docker:compose:integration:down`**  
  Stops the integration testing stack.

- **`pnpm run docker:compose:all:down`**  
  Stops all Docker Compose stacks (dev, prod, integration).

---

## 📖 Documentation

- **`pnpm run docs:generate`**  
  Generates API documentation from code annotations.

- **`pnpm run docs:serve`**  
  Serves the generated documentation locally on port 8080.

- **`pnpm run generate:openapi`**  
  Generates OpenAPI schema from route definitions.

---

## 🔒 Security

- **`pnpm run audit`**  
  Checks dependencies for known vulnerabilities.

- **`pnpm run deps:update`**  
  Updates all dependencies to their latest versions. ⚠️ Use with caution.

---

## 🤖 CI/CD

- **`pnpm run ci`**  
  Runs typecheck + lint + test coverage + environment validation (basic CI
  pipeline).

- **`pnpm run ci:quality`**  
  Runs lint + typecheck + test coverage.

- **`pnpm run ci:full`**  
  Runs complete CI pipeline including OpenAPI validation.

---

📌 **Golden rule**: before opening a PR, always run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
```

This ensures your code meets the team’s standards.
