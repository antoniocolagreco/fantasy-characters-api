# Development Principles

## Programming Paradigm: Functional Programming First

This project follows **functional programming principles** and **avoids object-oriented
programming** unless absolutely necessary. Use object-oriented programming only when it is the most
appropriate solution for a specific problem, such as when working with third-party libraries that
require it.

## Core Functional Programming Guidelines

### 1. No Classes Unless Unavoidable

Avoid creating classes and object-oriented designs. Use functions, modules, and TypeScript
types/interfaces instead.

### 2. Pure Functions

Write pure functions without side effects whenever possible:

```typescript
// ✅ Good: Pure function
const calculateUserStats = (characters: Character[]): UserStats => {
  return {
    totalCharacters: characters.length,
    averageLevel: characters.reduce((sum, char) => sum + char.level, 0) / characters.length
  }
}

// ❌ Avoid: Class-based approach
class UserStatsCalculator {
  calculate(characters: Character[]): UserStats { ... }
}
```

### 3. Immutability

Prefer immutable data structures and avoid mutating state:

```typescript
// ✅ Good: Immutable update
const updateUser = (user: User, updates: Partial<User>): User => ({
  ...user,
  ...updates,
  updatedAt: new Date(),
})

// ❌ Avoid: Mutating state
const updateUserMutable = (user: User, updates: Partial<User>): void => {
  Object.assign(user, updates)
  user.updatedAt = new Date()
}
```

### 4. Function Composition

Use function composition instead of class inheritance:

```typescript
// ✅ Good: Function composition
const validateAndCreateUser = compose(
  createUser,
  validateUserData,
  sanitizeInput
)

// ❌ Avoid: Class inheritance
class ValidatedUserCreator extends UserCreator { ... }
```

### 5. Higher-Order Functions

Use map, filter, reduce, and other functional array methods:

```typescript
// ✅ Good: Functional approach
const getActiveUsers = (users: User[]): User[] => users.filter(user => user.isActive)

const getUserEmails = (users: User[]): string[] => users.map(user => user.email)
```

## Service Layer Pattern (Functional Approach)

Services should be collections of pure functions, not classes:

```typescript
// ✅ Good: Functional service
export const userService = {
  create: (userData: CreateUserData): Promise<User> => { ... },
  findById: (id: string): Promise<User | null> => { ... },
  update: (id: string, updates: Partial<User>): Promise<User> => { ... },
  delete: (id: string): Promise<void> => { ... }
} as const

// ❌ Avoid: Class-based service
export class UserService {
  async create(userData: CreateUserData): Promise<User> { ... }
  async findById(id: string): Promise<User | null> { ... }
}
```

## Project Principles

### Core Development Principles

- **DRY (Don't Repeat Yourself)**: Avoid duplicating code or logic through function composition and
  reusable utilities
- **KISS (Keep It Simple, Stupid)**: Keep the code as simple as possible, favoring readable
  functional code
- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until it is necessary
- **Fail Fast**: Encourage early failure in development to catch issues sooner

### SOLID Principles (Functional Interpretation)

- **Single Responsibility Principle**: Each function should have a single responsibility and do it
  well
- **Open/Closed Principle**: Functions should be open for extension (through composition) but closed
  for modification
- **Liskov Substitution Principle**: Functions with the same signature should be interchangeable
- **Interface Segregation**: Prefer small, specific function interfaces over large, monolithic ones
- **Dependency Inversion**: Depend on function abstractions, not concrete implementations

### Functional Programming Specific Principles

- **Separation of Concerns**: Keep different concerns (e.g., validation, business logic, data
  access) in separate modules or functions
- **Avoid Side Effects**: Functions should not have side effects; they should return new values
  without modifying inputs
- **Use TypeScript Types**: Leverage TypeScript's type system to define clear interfaces and types
  for data structures, ensuring type safety and clarity
