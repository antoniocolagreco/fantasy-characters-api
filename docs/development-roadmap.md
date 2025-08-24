# API Development Workflow

## 🎯 Current Status

**Completed**: Chapters 1-16 (Foundation → Core Security Configuration) + Testing Infrastructure  
**Current**: Chapter 17 - Security Audit & Testing � (Ready to Start)

## Features Implemented

1. **🚀 Project Foundation**: Fastify server, TypeScript, testing framework, Docker
2. **🗄️ Database Foundation**: Complete Prisma schema, migrations, RBAC system
3. **🔐 Authentication**: JWT + Refresh tokens, RBAC (USER/MODERATOR/ADMIN), Argon2 hashing
4. **👥 User Management**: Complete CRUD, profile management, user statistics
5. **📁 Image System**: Upload, Sharp processing, WebP conversion, binary serving
6. **🏷️ Tags System**: Complete CRUD, search, statistics, RBAC integration
7. **⚡ Skills System**: Complete CRUD, level requirements, usage validation (97.99% coverage)
8. **🌟 Perks System**: Complete CRUD, level requirements, character advantages (97.31% coverage)
9. **🧝 Races System**: Complete CRUD, attribute modifiers, usage validation (99.19% coverage)
10. **🛡️ Archetypes System**: Complete CRUD, class definitions, race requirements (97.94%)
11. **⚔️ Items System**: Complete CRUD, equipment stats, rarity system, type validation (98.41%)
12. **🗡️ Equipment System**: Character equipment management, slot validation, statistics
13. **👤 Characters System**: Complete CRUD, stat calculation, progression, relationships (95.78%
    coverage)
14. **🧪 Testing Infrastructure**: Complete test suite (1,106 tests across 44 files), RBAC
    integration, TypeScript compatibility
15. **🚀 Response Caching System**: HTTP caching middleware, ETag support, conditional requests,
    cache invalidation, performance optimization
16. **🔒 Core Security Configuration**: Comprehensive HTTP security headers, CORS validation, audit
    logging system, enhanced OpenAPI security documentation

---

## Core Development Process per Chapter

1. **Schema Definition**: Define TypeScript types and validation schemas with TypeBox
2. **Database Layer**: Prisma models and migrations
3. **Service Layer**: Pure business logic without HTTP dependencies
4. **Controller Layer**: HTTP request/response handling
5. **Route Integration**: Register endpoints in Fastify app
6. **Testing Suite**: Complete unit and integration tests
7. **Documentation**: Swagger/OpenAPI specifications

---

## Chapter 1: Project Foundation 🚀

**Objective**: Basic project setup with complete tooling

### Tasks

- [x] **TASK-1.1**: Create feature-based directory structure in `src/` with shared utilities
- [x] **TASK-1.2**: Configure Fastify server with essential plugins  
       (@fastify/cors, @fastify/helmet, @fastify/swagger)
- [x] **TASK-1.3**: Setup TypeScript strict configuration with proper paths and compilation targets
- [x] **TASK-1.4**: Configure ESLint with TypeScript rules and Prettier integration
- [x] **TASK-1.5**: Setup Vitest configuration for unit and integration testing
- [x] **TASK-1.6**: Create Docker development environment with multi-stage builds
- [x] **TASK-1.7**: Implement health check endpoints (`/api/health`, `/api/healthz`, `/api/ready`,
      `/api/live`)
- [x] **TASK-1.8**: Configure Pino logger with structured JSON output and log levels
- [x] **TASK-1.9**: Write unit tests for health check endpoints and core utilities
- [x] **TASK-1.10**: Write integration tests for server startup and basic functionality

---

## Chapter 2: Database Foundation 🗄️

**Objective**: Persistence layer with Prisma ORM

### Tasks

- [x] **TASK-2.1**: Setup Prisma ORM with PostgreSQL database configuration
- [x] **TASK-2.2**: Design User model with authentication fields (email, passwordHash, role, OAuth)
- [x] **TASK-2.3**: Design RefreshToken model with device tracking and revocation
- [x] **TASK-2.4**: Design Image model with blob storage and metadata fields
- [x] **TASK-2.5**: Design Tag model with name, description, and ownership
- [x] **TASK-2.6**: Design Race model with attribute modifiers and relationships
- [x] **TASK-2.7**: Design Archetype model with class definitions and requirements
- [x] **TASK-2.8**: Design Skill model with prerequisites and effects
- [x] **TASK-2.9**: Design Perk model with level requirements and bonuses
- [x] **TASK-2.10**: Design Item model with stats, rarity, and equipment slots
- [x] **TASK-2.11**: Design Equipment model with fixed character slots
- [x] **TASK-2.12**: Design Character model with stats, inventory, and relationships
- [x] **TASK-2.13**: Create database migration scripts for all models
- [x] **TASK-2.14**: Create seed script with development test data
- [x] **TASK-2.15**: Implement database connection utilities with error handling
- [x] **TASK-2.16**: Add ownership system (ownerId fields) to all content models
- [x] **TASK-2.17**: Add visibility enum (PUBLIC, PRIVATE, HIDDEN) to all content models
- [x] **TASK-2.18**: Write unit tests for database connection utilities and error handling
- [x] **TASK-2.19**: Write integration tests for database migrations and seed scripts

---

## Chapter 3: Authentication System 🔐

**Objective**: Complete JWT authentication system

### Tasks

- [x] **TASK-3.1**: Create User TypeBox schemas for registration, login, and profile
- [x] **TASK-3.2**: Implement password hashing service with Argon2
- [x] **TASK-3.3**: Create JWT token generation service with access/refresh token logic
- [x] **TASK-3.4**: Create JWT validation middleware for protected routes
- [x] **TASK-3.5**: Implement refresh token storage and rotation service
- [x] **TASK-3.6**: Create user registration endpoint with email validation
- [x] **TASK-3.7**: Create user login endpoint with credentials validation
- [x] **TASK-3.8**: Create logout endpoint with token revocation
- [x] **TASK-3.9**: Create token refresh endpoint with rotation
- [x] **TASK-3.10**: Implement RBAC service with role-based permission checking
- [x] **TASK-3.11**: Create authentication middleware with user context injection
- [x] **TASK-3.12**: Implement session management with device tracking
- [x] **TASK-3.13**: Write unit tests for authentication services and JWT utilities
- [x] **TASK-3.14**: Write integration tests for authentication endpoints and flows

---

## Chapter 4: User Management 👥

**Objective**: Complete CRUD for user management

### Tasks

- [x] **TASK-4.1**: Create User TypeBox schemas for CRUD operations (create, update, response)
- [x] **TASK-4.2**: Implement user creation service with validation and RBAC checks
- [x] **TASK-4.3**: Implement user retrieval service with filtering and RBAC checks
- [x] **TASK-4.4**: Implement user update service with partial updates and RBAC checks
- [x] **TASK-4.5**: Implement user deletion service with cascade handling and RBAC checks
- [x] **TASK-4.6**: Create user profile management service (self-service operations)
- [x] **TASK-4.7**: Implement user search service with pagination and filtering
- [x] **TASK-4.8**: Create user statistics service (count, roles, activity)
- [x] **TASK-4.9**: Create user CRUD controller with proper error handling
- [x] **TASK-4.10**: Create user routes with authentication and authorization middleware
- [x] **TASK-4.11**: Write comprehensive unit tests for user service layer
- [x] **TASK-4.12**: Write integration tests for user API endpoints

---

## Chapter 5: Image Management System 📁

**Objective**: File upload and image processing system

### Tasks

- [x] **TASK-5.1**: Create Image TypeBox schemas for upload, metadata, and response
- [x] **TASK-5.2**: Configure multipart file handling with size and type validation
- [x] **TASK-5.3**: Implement image validation service (file type, dimensions, size limits)
- [x] **TASK-5.4**: Create image processing service with Sharp (resize, WebP conversion)
- [x] **TASK-5.5**: Implement image storage service with database blob storage
- [x] **TASK-5.6**: Create image metadata extraction service (dimensions, size, MIME type)
- [x] **TASK-5.7**: Create image upload service with processing pipeline and RBAC
- [x] **TASK-5.8**: Create image retrieval service with metadata-only and full blob options
- [x] **TASK-5.9**: Create image update service for metadata and RBAC permissions
- [x] **TASK-5.10**: Create image deletion service with RBAC and cascade handling
- [x] **TASK-5.11**: Implement binary file serving endpoint with HTTP caching headers
- [x] **TASK-5.12**: Create profile picture management service (user-specific operations)
- [x] **TASK-5.13**: Create image statistics service (count, storage usage, formats)
- [x] **TASK-5.14**: Create image CRUD controller with multipart handling
- [x] **TASK-5.15**: Create image routes with file upload and authentication middleware
- [x] **TASK-5.16**: Write unit tests for image processing and validation services
- [x] **TASK-5.17**: Write integration tests for image upload and serving endpoints

---

## Chapter 6: Tags System 🏷️

**Objective**: Flexible tagging system for all content

### Tasks

- [x] **TASK-6.1**: Create Tag TypeBox schemas for CRUD operations (create, update, response)
- [x] **TASK-6.2**: Implement tag creation service with uniqueness validation and RBAC
- [x] **TASK-6.3**: Implement tag retrieval service with filtering capabilities
- [x] **TASK-6.4**: Implement tag update service with name uniqueness checks and RBAC
- [x] **TASK-6.5**: Implement tag deletion service with usage validation and RBAC
- [x] **TASK-6.6**: Create tag statistics service (count, usage statistics)
- [x] **TASK-6.7**: Create tag CRUD controller with proper error handling
- [x] **TASK-6.8**: Create tag routes with authentication and authorization middleware
- [x] **TASK-6.9**: Write unit tests for tag service layer with edge cases
- [x] **TASK-6.10**: Write integration tests for tag API endpoints and relationships

---

## Chapter 7: Skills System ⚡

**Objective**: Character skills management with level requirements

### Tasks

- [x] **TASK-7.1**: Create Skill TypeBox schemas (create, update, response, filters)
- [x] **TASK-7.2**: Implement skill creation service with name uniqueness and RBAC validation
- [x] **TASK-7.3**: Implement skill retrieval service with filtering
- [x] **TASK-7.4**: Implement skill update service with validation and RBAC checks
- [x] **TASK-7.5**: Implement skill deletion service with character usage validation
- [x] **TASK-7.6**: Create skill statistics service (count, usage, level distribution)
- [x] **TASK-7.7**: Create skill CRUD controller with comprehensive error handling
- [x] **TASK-7.8**: Create skill routes with authentication and role-based middleware
- [x] **TASK-7.9**: Write unit tests for skill service layer and business logic
- [x] **TASK-7.10**: Write integration tests for skill API endpoints and relationships
- [x] **TASK-7.11**: Update OpenAPI documentation with skill endpoints and schemas

---

## Chapter 8: Perks System 🌟

**Objective**: Character advantages and disadvantages system

### Tasks

- [x] **TASK-8.1**: Create Perk TypeBox schemas (create, update, response, filters)
- [x] **TASK-8.2**: Implement perk creation service with name uniqueness and RBAC validation
- [x] **TASK-8.3**: Implement perk retrieval service with filtering
- [x] **TASK-8.4**: Implement perk update service with validation and RBAC checks
- [x] **TASK-8.5**: Implement perk deletion service with character usage validation
- [x] **TASK-8.6**: Create perk statistics service (count, usage, level distribution)
- [x] **TASK-8.7**: Create perk CRUD controller with proper error handling
- [x] **TASK-8.8**: Create perk routes with authentication and role-based middleware
- [x] **TASK-8.9**: Write unit tests for perk service layer and business logic
- [x] **TASK-8.10**: Write integration tests for perk API endpoints and character integration
- [x] **TASK-8.11**: Update OpenAPI documentation with perk endpoints and schemas

---

## Chapter 9: Races System 🧝

**Objective**: Fantasy races with attribute modifiers

### Tasks

- [x] **TASK-9.1**: Create Race TypeBox schemas (create, update, response, filters)
- [x] **TASK-9.2**: Implement race creation service with name uniqueness and RBAC validation
- [x] **TASK-9.3**: Implement race retrieval service with filtering and stat comparisons
- [x] **TASK-9.4**: Implement race update service with modifier validation and RBAC checks
- [x] **TASK-9.5**: Implement race deletion service with character usage validation
- [x] **TASK-9.6**: Create race statistics service (count, usage, popular modifiers)
- [x] **TASK-9.7**: Create race CRUD controller with modifier validation
- [x] **TASK-9.8**: Create race routes with authentication and role-based middleware
- [x] **TASK-9.9**: Write unit tests for race modifier calculations and validation
- [x] **TASK-9.10**: Write integration tests for race API endpoints and character creation
- [x] **TASK-9.11**: Update OpenAPI documentation with race endpoints and modifier schemas

---

## Chapter 10: Archetypes System 🛡️

**Objective**: Character classes with race requirements

### Tasks

- [x] **TASK-10.1**: Create Archetype TypeBox schemas (create, update, response, filters)
- [x] **TASK-10.2**: Implement archetype creation service with uniqueness and RBAC validation
- [x] **TASK-10.3**: Implement archetype retrieval service with filtering and requirements
- [x] **TASK-10.4**: Implement archetype update service with validation and RBAC checks
- [x] **TASK-10.5**: Implement archetype deletion service with character usage validation
- [x] **TASK-10.6**: Create archetype statistics service (count, usage, race combinations)
- [x] **TASK-10.7**: Create archetype CRUD controller with relationship validation
- [x] **TASK-10.8**: Create archetype routes with authentication and role-based middleware
- [x] **TASK-10.9**: Write unit tests for archetype logic and race requirements
- [x] **TASK-10.10**: Write integration tests for archetype API and character creation flow
- [x] **TASK-10.11**: Update OpenAPI documentation with archetype endpoints and relationships

---

## Chapter 11: Items System ⚔️

**Objective**: Equipment and consumables with stats and rarity

### Tasks

- [x] **TASK-11.1**: Create Item TypeBox schemas (create, update, response, filters, by type)
- [x] **TASK-11.2**: Implement item creation service with type validation and RBAC checks
- [x] **TASK-11.3**: Implement item retrieval service with filtering by type, rarity, slot
- [x] **TASK-11.4**: Implement item update service with stat validation and RBAC checks
- [x] **TASK-11.5**: Implement item deletion service with equipment usage validation
- [x] **TASK-11.6**: Create item statistics service (count by type, rarity distribution)
- [x] **TASK-11.7**: Create item CRUD controller with type-specific validation
- [x] **TASK-11.8**: Create item routes with authentication and role-based middleware
- [x] **TASK-11.9**: Write unit tests for item service layer and validation logic
- [x] **TASK-11.10**: Write integration tests for item API endpoints and equipment system
- [x] **TASK-11.11**: Update OpenAPI documentation with item endpoints and type schemas

---

## Chapter 12: Equipment System 🗡️

**Objective**: Character equipment management as sub-resource

### Tasks

- [x] **TASK-12.1**: Create Equipment TypeBox schemas (equipment response, slot updates)
- [x] **TASK-12.2**: Implement character equipment retrieval service (GET /characters/:id/equipment)
- [x] **TASK-12.3**: Implement character equipment update service (PUT /characters/:id/equipment)
- [x] **TASK-12.4**: Create equipment slot validation service (item compatibility with slots)
- [x] **TASK-12.5**: Create equipment statistics service (GET /equipment/stats)
- [x] **TASK-12.6**: Add equipment endpoints to character controller
- [x] **TASK-12.7**: Add equipment routes with character ownership validation
- [x] **TASK-12.8**: Write unit tests for slot validation and equipment logic
- [x] **TASK-12.9**: Write integration tests for character equipment operations
- [x] **TASK-12.10**: Update OpenAPI documentation with equipment endpoints as character
      sub-resource

---

## Chapter 13: Characters System 👤

**Objective**: Complete character management with stats and progression

### Tasks

- [x] **TASK-13.1**: Create Character TypeBox schemas (create, update, response, filters, stats)
- [x] **TASK-13.2**: Implement character creation service with race/archetype validation
- [x] **TASK-13.3**: Implement character retrieval service with filtering and relationship loading
- [x] **TASK-13.4**: Implement character update service with stat recalculation
- [x] **TASK-13.5**: Implement character deletion service with ownership validation
- [x] **TASK-13.6**: Create character statistics service (count, level distribution, popular builds)
- [x] **TASK-13.7**: Create character CRUD controller with comprehensive validation
- [x] **TASK-13.8**: Create character routes with authentication and ownership/visibility checks
- [x] **TASK-13.9**: Write unit tests for stat calculation engine and validation logic
- [x] **TASK-13.10**: Write integration tests for character lifecycle and relationships
- [x] **TASK-13.11**: Update OpenAPI documentation with character endpoints and stat schemas

---

## Chapter 14: Response Caching System 🚀

**Objective**: Complete HTTP caching implementation with performance optimization

### Tasks

- [x] **TASK-14.1**: Implement cache service with TTL, LRU eviction, and pattern invalidation
- [x] **TASK-14.2**: Create cache middleware factory with presets and conditional requests
- [x] **TASK-14.3**: Add ETag generation and validation for cache management
- [x] **TASK-14.4**: Implement HTTP cache headers (Cache-Control, ETag, Last-Modified, Age)
- [x] **TASK-14.5**: Add conditional request support (If-None-Match, If-Modified-Since)
- [x] **TASK-14.6**: Integrate cache middleware with all Skills GET endpoints
- [x] **TASK-14.7**: Integrate cache middleware with all Races GET endpoints
- [x] **TASK-14.8**: Integrate cache middleware with all Perks GET endpoints
- [x] **TASK-14.9**: Integrate cache middleware with all Archetypes GET endpoints
- [x] **TASK-14.10**: Integrate cache middleware with all Items GET endpoints
- [x] **TASK-14.11**: Integrate cache middleware with all Tags GET endpoints
- [x] **TASK-14.12**: Integrate cache middleware with all Equipment GET endpoints
- [x] **TASK-14.13**: Integrate cache middleware with all Images GET endpoints
- [x] **TASK-14.14**: Integrate cache middleware with all Users GET endpoints
- [x] **TASK-14.15**: Integrate cache middleware with all Characters GET endpoints
- [x] **TASK-14.16**: Implement RBAC-aware cache keys for user-specific data
- [x] **TASK-14.17**: Add cache invalidation on data mutations (create/update/delete)
- [x] **TASK-14.18**: Write comprehensive cache middleware tests
- [x] **TASK-14.19**: Add cache performance monitoring and metrics
- [x] **TASK-14.20**: Update OpenAPI documentation with cache-related headers for all cached
      endpoints

---

## Chapter 16: Core Security Configuration 🔒

**Objective**: Essential security hardening

### Tasks

- [x] **TASK-16.1**: Implement comprehensive HTTP security headers in app.ts
- [x] **TASK-16.2**: Configure CORS policies with proper validation in app.ts
- [x] **TASK-16.3**: Implement comprehensive audit logging for security events
- [x] **TASK-16.4**: Update OpenAPI documentation with security implementation details

---

## Chapter 17: Security Audit & Testing 🔍

**Objective**: Comprehensive security audit including input validation, health endpoint hardening,
and security testing suite

### Tasks

- [x] **TASK-17.1**: Audit input sanitization in Authentication endpoints
- [x] **TASK-17.2**: Audit input sanitization in Users endpoints
- [x] **TASK-17.3**: Audit input sanitization in Images endpoints
- [x] **TASK-17.4**: Audit input sanitization in Tags endpoints
- [x] **TASK-17.5**: Audit input sanitization in Skills endpoints
- [x] **TASK-17.6**: Audit input sanitization in Perks endpoints
- [x] **TASK-17.7**: Audit input sanitization in Races endpoints
- [x] **TASK-17.8**: Audit input sanitization in Archetypes endpoints
- [x] **TASK-17.9**: Audit input sanitization in Items endpoints
- [x] **TASK-17.10**: Audit input sanitization in Equipment endpoints
- [x] **TASK-17.11**: Audit input sanitization in Characters endpoints
- [x] **TASK-17.12**: Audit health endpoint information disclosure and implement security
      improvements
- [x] **TASK-17.13**: Implement tiered health endpoints (public basic vs internal detailed)
- [x] **TASK-17.14**: Add health endpoint rate limiting and access control
- [x] **TASK-17.15**: Add health endpoint security headers and audit logging
- [x] **TASK-17.16**: Create security testing suite for authentication flows
- [x] **TASK-17.17**: Write security unit tests for authentication flows
- [x] **TASK-17.18**: Write security integration tests for Users authorization
- [x] **TASK-17.19**: Write security integration tests for Images authorization
- [x] **TASK-17.20**: Write security integration tests for Tags authorization
- [x] **TASK-17.21**: Write security integration tests for Skills authorization
- [x] **TASK-17.22**: Write security integration tests for Perks authorization
- [x] **TASK-17.23**: Write security integration tests for Races authorization
- [x] **TASK-17.24**: Write security integration tests for Archetypes authorization
- [x] **TASK-17.25**: Write security integration tests for Items authorization
- [x] **TASK-17.26**: Write security integration tests for Equipment authorization
- [x] **TASK-17.27**: Write security integration tests for Characters authorization
- [x] **TASK-17.28**: Write security integration tests for Health endpoints authorization

---

## Chapter 18: Project Finalization 🎯

**Objective**: Essential tasks to make the API production-ready

### Tasks

- [ ] **TASK-18.1**: Audit and fix all TODO/FIXME comments in codebase
- [ ] **TASK-18.2**: Review and optimize database indexes for performance
- [ ] **TASK-18.3**: Validate all environment variables have proper defaults/validation
- [ ] **TASK-18.4**: Ensure proper error messages (no stack traces in production)
- [ ] **TASK-18.5**: Add request/response logging for debugging
- [ ] **TASK-18.6**: Set up proper CORS configuration for production domains
- [ ] **TASK-18.7**: Validate Kubernetes manifests work with real deployments
- [ ] **TASK-18.8**: Create simple backup/restore scripts for PostgreSQL database
- [ ] **TASK-18.9**: Performance test critical endpoints under load
- [ ] **TASK-18.10**: Check the tests coverage.
- [ ] **TASK-18.11**: Security audit: check for exposed secrets, weak passwords, etc.

## Development Guidelines

### For each Chapter

1. **Schema First**: Always start with TypeBox schemas
2. **Test Driven**: Write tests before implementation
3. **Error Handling**: Appropriate error handling for each layer
4. **Validation**: Rigorous input validation with Ajv
5. **Logging**: Structured logging with Pino for troubleshooting
6. **Documentation**: Updated Swagger docs for each endpoint

### Quality Standards

- **Test Coverage**: Respect Test Completion Criteria / Test Required Coverage
- **Type Safety**: Strict TypeScript without any
- **Performance**: Response time <200ms for CRUD operations
- **Security**: Input sanitization and auth on all endpoints
- **Documentation**: Every endpoint documented with examples

### Test Completion Criteria

- Every test passed
- No skipped tests
- Authentication/Security : Stmts>90% | Branch>90% | % Funcs>90% | % Lines>90%
- Everything else : Stmts>80% | Branch>80% | % Funcs>80% | % Lines>80%
