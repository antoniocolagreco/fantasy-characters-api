# Project Structure

## Directory Structure (Feature-Based)

This file is an example of a feature-based directory structure and the project can differ from it.
Every feature should encapsulate all related files, including controllers, services, schemas, and
tests. The folder `shared` contains code that is shared across multiple features, such as utility
functions, middleware, and common types.

**IMPORTANT**: DO NOT CREATE FILES OR FOLDERS BEFORE THEY ARE NEEDED.

```text
root
├── src/
│   ├── feature
│   │   ├── feature.*.ts                      # Feature-specific files
│   │   ├── feature.controller.ts             # Controller for handling requests
│   │   ├── feature.route.ts                  # Route definitions for the feature
│   │   ├── feature.helper.ts                 # Helper functions for the feature
│   │   ├── feature.type.ts                   # Type definitions for the feature
│   │   ├── index.ts                          # Barrel export for the feature
│   │   └── tests/
│   │       ├── feature.*.test.ts             # Test files for the feature
│   │       ├── feature.controller.test.ts    # Unit tests for the controller
│   │       └── feature.service.test.ts       # Unit tests for the service
│   │
│   └── shared/               # Shared utilities and code
│       ├── *.ts              # Additional feature files
│       ├── config.ts         # Configuration and environment
│       ├── constants.ts      # Application constants and enums
│       ├── errors.ts         # Error classes and handlers
│       ├── middleware.ts     # Shared middleware
│       ├── helpers.ts        # Shared helper functions
│       ├── types/            # Shared utilities and code
│       │   ├── index.ts      # Barrel export for types
│       │   └── *.ts          # Additional type definitions
│       └── tests/
│           └── *.test.ts     # Additional test files
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
├── assets/                   # Static assets (images, fonts, etc.)
├── docs/                     # Additional documentation
└── coverage/                 # Test coverage reports
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
- **helpers.ts**: Helper functions
