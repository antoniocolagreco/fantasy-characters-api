# Project Structure

## Directory Structure (Feature-Based)

This file is an example of a feature-based directory structure and the project can differ from it.
Every feature should encapsulate all related files, including controllers, services, schemas, and
tests. The folder `shared` contains code that is shared across multiple features, such as utility
functions, middleware, and common types.

```text
fantasy-character-api/
├── src/
│   ├── app.ts                # Fastify app setup
│   ├── index.ts              # Application entry point
│   │
│   ├── auth/                 # Authentication feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── auth.controller.ts
│   │   ├── auth.route.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.service.ts
│   │   ├── auth.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── auth.controller.test.ts
│   │       ├── auth.service.test.ts
│   │       └── auth.route.test.ts
│   │
│   ├── users/                # Users feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── user.controller.ts
│   │   ├── user.route.ts
│   │   ├── user.schema.ts
│   │   ├── user.service.ts
│   │   ├── user.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── user.controller.test.ts
│   │       ├── user.service.test.ts
│   │       └── user.route.test.ts
│   │
│   ├── characters/           # Characters feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── character.controller.ts
│   │   ├── character.route.ts
│   │   ├── character.schema.ts
│   │   ├── character.service.ts
│   │   ├── character.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── character.controller.test.ts
│   │       ├── character.service.test.ts
│   │       └── character.route.test.ts
│   │
│   ├── races/                # Races feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── race.controller.ts
│   │   ├── race.route.ts
│   │   ├── race.schema.ts
│   │   ├── race.service.ts
│   │   ├── race.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── race.controller.test.ts
│   │       ├── race.service.test.ts
│   │       └── race.route.test.ts
│   │
│   ├── archetypes/           # Archetypes feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── archetype.controller.ts
│   │   ├── archetype.route.ts
│   │   ├── archetype.schema.ts
│   │   ├── archetype.service.ts
│   │   ├── archetype.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── archetype.controller.test.ts
│   │       ├── archetype.service.test.ts
│   │       └── archetype.route.test.ts
│   │
│   ├── skills/               # Skills feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── skill.controller.ts
│   │   ├── skill.route.ts
│   │   ├── skill.schema.ts
│   │   ├── skill.service.ts
│   │   ├── skill.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── skill.controller.test.ts
│   │       ├── skill.service.test.ts
│   │       └── skill.route.test.ts
│   │
│   ├── perks/                # Perks feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── perk.controller.ts
│   │   ├── perk.route.ts
│   │   ├── perk.schema.ts
│   │   ├── perk.service.ts
│   │   ├── perk.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── perk.controller.test.ts
│   │       ├── perk.service.test.ts
│   │       └── perk.route.test.ts
│   │
│   ├── items/                # Items feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── item.controller.ts
│   │   ├── item.route.ts
│   │   ├── item.schema.ts
│   │   ├── item.service.ts
│   │   ├── item.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── item.controller.test.ts
│   │       ├── item.service.test.ts
│   │       └── item.route.test.ts
│   │
│   ├── images/               # Images feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── image.controller.ts
│   │   ├── image.route.ts
│   │   ├── image.schema.ts
│   │   ├── image.service.ts
│   │   ├── image.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── image.controller.test.ts
│   │       ├── image.service.test.ts
│   │       └── image.route.test.ts
│   │
│   ├── tags/                 # Tags feature
│   │   ├── *.ts              # Additional feature files
│   │   ├── tag.controller.ts
│   │   ├── tag.route.tscls
│   │   ├── tag.schema.ts
│   │   ├── tag.service.ts
│   │   ├── tag.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── tag.controller.test.ts
│   │       ├── tag.service.test.ts
│   │       └── tag.route.test.ts
│   │
│   ├── health/               # Health check feature (Kubernetes-compatible)
│   │   ├── *.ts              # Additional feature files
│   │   ├── health.controller.ts
│   │   ├── health.route.ts
│   │   ├── health.types.ts
│   │   ├── index.ts
│   │   └── tests/
│   │       ├── *.test.ts     # Additional test files
│   │       ├── health.controller.test.ts
│   │       └── health.service.test.ts
│   │
│   └── shared/               # Shared utilities and code
│       ├── *.ts              # Additional feature files
│       ├── config.ts         # Configuration and environment
│       ├── constants.ts      # Application constants and enums
│       ├── errors.ts         # Error classes and handlers
│       ├── middleware.ts     # Shared middleware
│       ├── types.ts          # Shared TypeScript definitions
│       ├── utils.ts          # Shared utility functions
│       ├── types/            # Shared utilities and code
│       │   ├── index.ts      # Barrel export for types
│       │   └── *.ts          # Additional type definitions
│       └── tests/
│           ├── *.test.ts     # Additional test files
│           ├── rbac.service.test.ts
│           └── utils.test.ts
│
├── prisma/                   # Prisma ORM files
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Database seed script
│   └── migrations/           # Migration files
│
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yaml        # Namespace definition
│   ├── deployment.yaml       # Application deployment
│   ├── service.yaml          # Service definition
│   ├── configmap.yaml        # Configuration management
│   ├── secrets.yaml          # Secrets management
│   ├── ingress.yaml          # Ingress controller
│   └── hpa.yaml              # Horizontal Pod Autoscaler
│
├── .github/                  # GitHub Actions workflows
├── docs/                     # Additional documentation
└── assets/                   # Static assets (images, fonts, etc.)
```

## Feature Organization

Each feature follows a consistent structure:

- **controller.ts**: HTTP request/response handling
- **route.ts**: Endpoint definitions and routing
- **schema.ts**: Input validation schemas with TypeBox
- **service.ts**: Business logic and data access
- **types.ts**: TypeScript type definitions and interfaces specific to the feature
- **index.ts**: Barrel export file that exposes the public API of the feature
- **tests/**: Directory containing all test files organized by type:
  - **\*.controller.test.ts**: Unit tests for HTTP request/response handling
  - **\*.service.test.ts**: Unit tests for business logic and data access
  - **\*.route.test.ts**: Integration tests for API endpoints

## Shared Resources

The `shared/` directory contains code that is used across multiple features, such as:

- **config.ts**: Environment configuration
- **constants.ts**: Application-wide constants
- **errors.ts**: Custom error classes
- **middleware.ts**: Reusable middleware functions
- **types.ts**: Common TypeScript interfaces
- **utils.ts**: Utility functions
