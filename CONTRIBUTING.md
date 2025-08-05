# 📝 Contributing to Fantasy Character API

Thank you for your interest in contributing to the Fantasy Character API! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 24.x or later
- pnpm 9.x or later
- Git
- Docker (optional, for containerized development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fantasy-character-api.git
   cd fantasy-character-api
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   pnpm run dev
   ```

5. **Run tests**
   ```bash
   pnpm run test
   ```

## 📁 Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── routes/         # Route definitions
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Application entry point

tests/              # Test files
├── setup.ts        # Test setup
├── globalSetup.ts  # Global test setup
├── globalTeardown.ts # Global test cleanup
└── *.test.ts       # Individual test files
```

## 🔧 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting and linting:

- **Format code**: `pnpm run format`
- **Check formatting**: `pnpm run format:check`
- **Lint code**: `pnpm run lint`
- **Fix linting issues**: `pnpm run lint:fix`

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add JWT authentication
fix(health): resolve memory calculation issue
docs: update API documentation
test(health): add comprehensive health check tests
```

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `docs/documentation-update` - Documentation updates

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Run tests before submitting PRs: `pnpm run test`
- Run tests with coverage: `pnpm run test:coverage`

### Type Safety

- Use TypeScript strictly
- Define proper types for all data structures
- Avoid `any` type when possible
- Use TypeBox for API schema validation

## 🔄 Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a descriptive title
   - Provide detailed description
   - Link related issues
   - Include screenshots if UI changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for features
- [ ] Coverage maintained/improved

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
```

## 🐛 Bug Reports

Use the GitHub issue template for bug reports:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected vs actual behavior**
- **Environment details** (Node.js version, OS, etc.)
- **Screenshots** if applicable

## 💡 Feature Requests

For new features:

- **Clear description** of the feature
- **Use case** and benefits
- **Acceptance criteria**
- **Implementation suggestions** (optional)

## 📚 Documentation

- Update README.md for significant changes
- Document new APIs in code comments
- Update API documentation for endpoint changes
- Include examples in documentation

## 🏗️ Architecture Guidelines

### Separation of Concerns

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Routes**: Define API endpoints and validation
- **Middleware**: Handle cross-cutting concerns

### Error Handling

- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging
- Don't expose sensitive information

### Performance

- Use async/await for asynchronous operations
- Implement proper pagination
- Add appropriate caching headers
- Monitor performance metrics

## 🛡️ Security

- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines
- Keep dependencies updated

## 📞 Getting Help

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Code Review**: Tag maintainers for review

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Fantasy Character API! 🎮⚔️
