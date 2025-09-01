# 📘 Script List

These are the main scripts you will use when developing our API.  
They cover setup, development, testing, and deployment in a standardized way.

---

## 🚀 Setup environment

- **`pnpm run setup`**  
  Installs dependencies, prepares the database, and compiles the project.  
  👉 Use this the **first time you clone the repo** or when dependencies are updated.  

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

---

## 🗄️ Database

- **`pnpm run db:migrate`**  
  Applies pending migrations locally.  

- **`pnpm run db:generate`**  
  Regenerates the Prisma client.  

- **`pnpm run db:seed`**  
  Seeds the database with test data.  

- **`pnpm run db:reset`**  
  Resets the local database (⚠️ deletes all data).  
  👉 Use this if your DB gets corrupted or you need a clean start.  

---

## 🧹 Code quality

- **`pnpm run lint`**  
  Analyzes code and reports style errors or potential bugs.  

- **`pnpm run lint:fix`**  
  Automatically fixes simple linting issues.  

- **`pnpm run format`**  
  Applies consistent formatting with Prettier.  

- **`pnpm run typecheck`**  
  Runs TypeScript type checks without building.  
  👉 Always run this before pushing code.  

---

## ✅ Testing

- **`pnpm run test`**  
  Runs tests in watch mode (useful during development).  

- **`pnpm run test:run`**  
  Runs the test suite once.  
  👉 Used in CI/CD pipelines.  

- **`pnpm run test:coverage`**  
  Runs tests and generates a coverage report.  

- **`pnpm run test:e2e`**  
  Runs end-to-end tests simulating real API requests.  

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

- **`pnpm run docker:compose`**  
  Starts the API and related services (e.g., PostgreSQL) via `docker-compose`.  

---

## 📖 Documentation

- **`pnpm run docs:generate`**  
  Generates the API documentation (Swagger/OpenAPI).  

- **`pnpm run docs:serve`**  
  Serves the documentation locally.  

---

## 🔒 Security

- **`pnpm run audit`**  
  Checks dependencies for known vulnerabilities.  

- **`pnpm run deps:update`**  
  Updates all dependencies to their latest versions. ⚠️ Use with caution.  

---

## 🤖 CI/CD

- **`pnpm run ci`**  
  Runs typecheck + lint + tests (basic CI pipeline).  

- **`pnpm run ci:coverage`**  
  Same as `ci` but also generates a coverage report.  

---

📌 **Golden rule**: before opening a PR, always run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test:run
```

This ensures your code meets the team’s standards.
